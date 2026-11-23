import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';

const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
const index=script.cues.findIndex(c=>c.en==='Seongnam has a unique strength.');
const cue=script.cues[index], before=script.cues[index-1], after=script.cues[index+1];
assert.ok(index>0);

function harness(language,slide=cue.slide) {
  const shown=[],progress=[];let clears=0;
  const captions=new ScriptCaptions(null,{
    script,slide,speechLanguage:language,autoRecover:true,
    onText:(language,text)=>shown.push({language,text}),
    onProgress:p=>progress.push(p),onClear:()=>clears++,onState(){},onError:e=>{throw e;},
    connectionFactory:()=>({connected:true,commit(){},setSlide(){},close(){}}),
  });
  return {captions,shown,progress,get clears(){return clears;}};
}
const final=(item,transcript)=>({type:'conversation.item.input_audio_transcription.completed',item_id:item,transcript});
const delta=(item,text)=>({type:'conversation.item.input_audio_transcription.delta',item_id:item,delta:text});

for(const language of ['en','auto']) {
  for(const spoken of [cue.en,'성남 has a unique strength.','성 남 has a unique strength.','Seong Nam has a unique strength.','Sungnam has a unique strength.','Songnam has a unique strength.','성남 has unique strengths.']) {
    test(`${language}: short strength cue can start mid-slide: ${spoken}`,()=>{
      const h=harness(language);h.captions.accept(final('strength',spoken));
      assert.deepEqual(h.shown,[{language:'vi',text:cue.vi},{language:'ko',text:cue.ko}]);
    });
  }

  test(`${language}: mixed spelling follows the vision, stays visible, then advances to 40 percent`,()=>{
    const h=harness(language);
    h.captions.accept(final('vision',before.en));
    h.captions.accept(delta('strength','성남 has '));
    h.captions.accept(delta('strength','a unique strength.'));
    assert.equal(h.shown.at(-1).text,cue.ko);
    h.captions.accept(final('strength','성남 has a unique strength.'));
    h.captions.accept(final('pause',''));
    assert.equal(h.clears,0);assert.equal(h.shown.at(-1).text,cue.ko);
    h.captions.accept(final('40percent',after.en));
    assert.equal(h.shown.at(-1).text,after.ko);
  });

  test(`${language}: a city name split across ASR items still completes the cue`,()=>{
    const h=harness(language);
    h.captions.accept(final('city','성남'));
    h.captions.accept(final('rest','has a unique strength.'));
    assert.equal(h.shown.at(-1)?.text,cue.ko);
  });

  test(`${language}: an uninterrupted vision and strength statement ends on the strength caption`,()=>{
    const h=harness(language);
    h.captions.accept(final('continuous',before.en+' 성남 has a unique strength.'));
    assert.equal(h.shown.at(-1)?.text,cue.ko);
  });

  test(`${language}: other cities, negation and speech on another slide cannot borrow this caption`,()=>{
    for(const spoken of ['Seoul has a unique strength.','서울 has a unique strength.','성남 does not have a unique strength.','Does 성남 have a unique strength?']) {
      const h=harness(language);h.captions.accept(final('unrelated',spoken));
      assert.equal(h.shown.length,0,spoken);
    }
    const h=harness(language,2);h.captions.accept(final('wrong-slide','성남 has a unique strength.'));
    assert.equal(h.shown.length,0);
  });
}
