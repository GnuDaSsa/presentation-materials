import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';

const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
function harness(slide,language='en',source=script){
  const texts=[],slides=[];let clears=0;
  const c=new ScriptCaptions(null,{script:source,slide,speechLanguage:language,autoRecover:true,autoAdvance:true,
    onText:(language,text)=>texts.push({language,text}),onSlide:n=>slides.push(n),onClear:()=>clears++,onState(){},onError:e=>{throw e;},
    connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
  });
  const say=(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript});
  const delta=(id,text)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta:text});
  return {c,texts,slides,say,delta,get clears(){return clears;}};
}
for(const language of ['en','ko','auto']){
  test(`${language}: every prepared cue can be the first sentence spoken on its slide`,()=>{
    for(const cue of script.cues){
      const h=harness(cue.slide,language);
      h.say('first',cue[language==='auto'?(cue.spokenLanguage||'en'):language]);
      // The translated English greeting overlaps the Korean opening: at initial
      // startup, “여러분, 안녕하십니까” deliberately belongs to the presenter intro.
      const expected=language==='ko' && cue.id==='v16-004' ? script.cues[0].ko : cue.ko;
      assert.equal(h.texts.at(-1)?.text,expected,cue.id);assert.deepEqual(h.slides,[]);
    }
  });
  test(`${language}: the training slide follows a later sentence, an earlier one, and repeats`,()=>{
    const h=harness(7,language),cues=script.cues.filter(c=>c.slide===7),lang=language==='auto'?'en':language;
    for(const [turn,index] of [10,5,1,9,0,3,7,9,2].entries()){
      h.say('turn-'+turn,cues[index][lang]);assert.equal(h.texts.at(-1)?.text,cues[index].ko,String(index));
      assert.equal(h.c.matcher.slide,7);assert.deepEqual(h.slides,[]);
    }
    h.say('silence','');assert.equal(h.clears,0);
  });
  test(`${language}: streaming speech follows shuffled training cues without a pause`,()=>{
    const h=harness(7,language),cues=script.cues.filter(c=>c.slide===7),lang=language==='auto'?'en':language;
    for(const index of [10,5,1,9,0,3,7,9,2]){
      for(const word of cues[index][lang].split(' '))h.delta('continuous',word+' ');
      assert.equal(h.texts.at(-1)?.text,cues[index].ko,String(index));
      assert.deepEqual(h.slides,[]);
    }
  });
}
for(const language of ['en','auto']){
  test(`${language}: a distinctive short opening selects a later cue without waiting for seven words`,()=>{
    const h=harness(7,language),cue=script.cues.find(c=>c.en.startsWith('For local companies,'));
    h.delta('later','For local companies');assert.equal(h.texts.at(-1)?.text,cue.ko);
    assert.deepEqual(h.slides,[]);
  });
  test(`${language}: a paraphrased later sentence has the same tolerance without an explicit seek`,()=>{
    const h=harness(7,language),cue=script.cues.find(c=>c.en.startsWith('For local companies,'));
    h.say('later','We train people with the skills local companies need, here in Seongnam.');
    assert.equal(h.texts.at(-1)?.text,cue.ko);
  });
  test(`${language}: a paraphrased return to an earlier sentence works without an ASR pause`,()=>{
    const h=harness(7,language),cues=script.cues.filter(c=>c.slide===7);
    h.delta('continuous',cues.at(-1).en+' ');
    h.delta('continuous','We train people with the skills local companies need, here in Seongnam.');
    assert.equal(h.texts.at(-1)?.text,cues[9].ko);assert.deepEqual(h.slides,[]);
  });
  test(`${language}: one batch with all eleven cues in reverse order ends on the last spoken cue`,()=>{
    const h=harness(7,language),cues=script.cues.filter(c=>c.slide===7);
    h.say('batch',[...cues].reverse().map(c=>c.en).join(' '));
    assert.equal(h.texts.at(-1)?.text,cues[0].ko);assert.deepEqual(h.slides,[]);
  });
}
test('Korean can start at a distinctive university phrase later on the page',()=>{
  const h=harness(7,'auto'),cue=script.cues.find(c=>c.ko.startsWith('가천대학교는'));
  h.delta('later','가천대학교는 디지털');assert.equal(h.texts.at(-1)?.text,cue.ko);
});
test('a shared opening waits for the word that identifies a cue anywhere on the slide',()=>{
  const cues=[
    {id:'1',slide:1,en:'Welcome to the presentation',ko:'1',vi:'1'},
    {id:'2',slide:1,en:'Our policy has three strategies',ko:'2',vi:'2'},
    {id:'3',slide:1,en:'Our research center provides equipment for companies',ko:'3',vi:'3'},
    {id:'4',slide:1,en:'Students learn digital chip design',ko:'4',vi:'4'},
    {id:'5',slide:1,en:'Our research center provides training for students',ko:'5',vi:'5'},
  ];
  const h=harness(1,'en',{cues});h.delta('shared','Our research center provides');assert.equal(h.texts.length,0);
  h.delta('shared',' training');assert.equal(h.texts.at(-1)?.text,'5');
});
test('free cue order preserves wrong-number, question, and other-slide exclusions',()=>{
  for(const [slide,text] of [[8,'The center will be completed in 2031.'],[3,'About 50 percent of South Korea\'s fabless semiconductor companies are located here in Seongnam.'],[7,'Can you explain how we train skilled workers for local companies?'],[7,'We do not train skilled workers here in Seongnam.'],[7,script.cues.find(c=>c.slide===9).en]]){
    const h=harness(slide);h.say('wrong',text);assert.equal(h.texts.length,0,text);assert.deepEqual(h.slides,[]);
  }
});
