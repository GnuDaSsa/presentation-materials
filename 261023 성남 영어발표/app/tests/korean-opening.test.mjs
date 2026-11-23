import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {OpeningSequence,isEnglishHandoff} from '../public/opening-sequence.js';
import {ScriptCaptions} from '../public/script-captions.js';
import {validateScript} from '../public/script-store.js';
import {script} from '../public/presentation-content.js';

const prepared=validateScript(JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8')));
test('handoff accepts the short announcement while excluding English mentions and negation',()=>{
 for(const text of ['국제적인 자리이니만큼, 지금부터 영어로 진행하도록 하겠습니다.','지금부터 영어로 진행하겠습니다','지금부터는 영어로 발표하겠습니다','영어로 진행','지금부터 영어로 진행하도록','영어로 진행해보도록 하겠습니다'])assert.ok(isEnglishHandoff(text),text);
 for(const text of ['영어','지금부터 영어로','영어로 진행하지 않겠습니다.','지금부터 영어로 진행할까요?'])assert.equal(isEnglishHandoff(text),false,text);
});
test('split ASR items finish the announcement; opening is one-shot and only slide one',()=>{
 const o=new OpeningSequence();
 assert.equal(o.feed('지금부터 영어로',{slide:1,item:'a'}),false);
 assert.equal(o.feed('진행하도록 하겠습니다.',{slide:1,item:'b'}),true);
 const token=o.begin();assert.equal(o.phase,'changing');assert.equal(o.begin(),null);
 assert.equal(o.feed('지금부터 영어로 진행하도록 하겠습니다.',{slide:1,item:'c'}),false);
 assert.equal(o.finish(token),true);assert.equal(o.phase,'en');
 o.reset();assert.equal(o.feed('지금부터 영어로 진행하도록 하겠습니다.',{slide:2,item:'d'}),false);
});
test('Home reset invalidates a pending fade completion and clears old speech',()=>{
 const o=new OpeningSequence();const token=o.begin();o.reset();
 assert.equal(o.finish(token),false);assert.equal(o.phase,'ko');
 assert.equal(o.feed('진행하도록 하겠습니다.',{slide:1,item:'new'}),false);
});
test('actual spoken languages survive saved-caption validation and align with the speaker script',()=>{
 assert.deepEqual(prepared.cues.slice(0,3).map(c=>c.spokenLanguage),['ko','ko','ko']);
 for(let n=1;n<=11;n++)assert.equal(prepared.cues.filter(c=>c.slide===n).map(c=>c[c.spokenLanguage||'en']).join(' '),script[n-1].paragraphs.join(' '));
 assert.throws(()=>validateScript({...prepared,cues:[{...prepared.cues[0],spokenLanguage:'vi'}]}));
});
for(const autoAdvance of [false,true])test(`Korean opening then English works in one unbroken ASR item; auto advance ${autoAdvance}`,()=>{
 const opening=new OpeningSequence(),captions=[],slides=[],handoffs=[],hints=[];
 const c=new ScriptCaptions(null,{script:prepared,speechLanguage:'auto',autoRecover:true,autoAdvance,
  onText:(...x)=>captions.push(x),onState(){},onError:e=>{throw e;},onSlide:n=>slides.push(n),
  onTranscript:(text,meta)=>{if(opening.feed(text,meta)){handoffs.push(opening.begin());}},
  connectionFactory:(_stream,options)=>{hints.push(options.scriptHint);return{setSlide(){},commit(){},close(){}};},
 });
 try{
  assert.ok(hints[0].includes('지금부터 영어로 진행하도록 하겠습니다'));
  const cues=prepared.cues.filter(c=>c.slide===1 || (autoAdvance && c.slide===2));
  for(const cue of cues){
   for(const word of cue[cue.spokenLanguage||'en'].split(' '))c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:'one-continuous-stream',delta:word+' '});
   assert.equal(captions.at(-2)?.[1],cue.vi,cue.id);
   assert.equal(captions.at(-1)?.[1],cue.ko,cue.id);
  }
  assert.equal(handoffs.length,1);assert.equal(opening.phase,'changing');
  assert.deepEqual(slides,autoAdvance?[2]:[]);
 }finally{c.close();}
});
