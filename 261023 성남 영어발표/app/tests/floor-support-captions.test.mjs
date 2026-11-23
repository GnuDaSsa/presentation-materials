import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
const target=script.cues.find(c=>c.id==='v16-043');
function harness(language='en',slide=9,autoAdvance=true){
 const texts=[],slides=[];
 const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance,
  onText:(language,text)=>texts.push({language,text}),onSlide:n=>slides.push(n),onState(){},onError:e=>{throw e;},
  connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
 });
 return {c,texts,slides,say:(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript}),
  delta:(id,delta)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta})};
}
const phrases=[target.en,
 'What make this project special is that the System Semiconductor Development Support Center I mentioned earlier will be on the first three floors.',
 'What makes this project special', 'What make this project special',
 'What makes this project special?', 'What make this project special?',
 'What makes this project so special?', 'What makes the project special?',
 'What makes our project special?', 'So, what makes this project special?',
 'Development support center', 'System semiconductor development support centre',
 'first three floors', 'three floors', 'first 3 floor', 'three floor', 'first three flows',
 'The support centre will be on the first three floors.',
 'What makes the project special is the Development Support Center on the first three floors.',
 'This project is special because the support center will be on the first three floors.',
 'What makes this project special? The development support center will be on the first three floors.',
 target.en.replace('special is','special? Is'),
 target.en.replace(/\.$/,'?'),
];
for(const language of ['en','auto']){
 test(`${language}: floor-support cue responds to a short opening, location keywords, and ASR variants`,()=>{
  const failures=[];
  for(const text of phrases){const h=harness(language);h.say('phrase',text);if(h.texts.at(-1)?.text!==target.ko)failures.push(text);assert.deepEqual(h.slides,[],text);}
  assert.deepEqual(failures,[]);
 });
 test(`${language}: a spurious question mark allows the opening immediately, before the center and floors`,()=>{
  const h=harness(language);h.delta('stream','What makes this project special?');assert.equal(h.texts.at(-1)?.text,target.ko);
  for(const word of ' Is that the System Semiconductor Development Support Center I mentioned earlier will be on the first three floors.'.split(' '))h.delta('stream',word+' ');
  assert.equal(h.texts.at(-1)?.text,target.ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: split keywords and mid-slide return work without restarting the microphone`,()=>{
  const h=harness(language),last=script.cues.filter(c=>c.slide===9).at(-1);
  h.say('last',last.en);h.say('first-half','development support');h.say('second-half','center');
  assert.equal(h.texts.at(-1)?.text,target.ko);assert.deepEqual(h.slides,[]);
  const following=script.cues.find(c=>c.id==='v16-044');h.say('following',following.en);assert.equal(h.texts.at(-1)?.text,following.ko);
 });
 test(`${language}: the rhetorical opening stays visible across a pause without being replayed`,()=>{
  const h=harness(language);h.say('opening','What makes this project special?');
  assert.equal(h.texts.at(-1)?.text,target.ko);const count=h.texts.length;
  h.say('silence','');h.say('noise','Please turn on the lights.');
  assert.equal(h.texts.length,count);h.say('answer','The development support center will be on the first three floors.');assert.equal(h.texts.at(-1)?.text,target.ko);
 });
 test(`${language}: a punctuated opening can return from a later cue and resume after split speech`,()=>{
  const h=harness(language),following=script.cues.find(c=>c.id==='v16-044');
  h.say('later',following.en);
  h.say('start','What makes this project');
  h.say('end','special?');assert.equal(h.texts.at(-1)?.text,target.ko);
  h.say('middle','Is that the System Semiconductor Development Support Center I mentioned earlier');
  h.say('floors','will be on the first three floors.');assert.equal(h.texts.at(-1)?.text,target.ko);
  h.say('following',following.en);assert.equal(h.texts.at(-1)?.text,following.ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: manual ninth-slide navigation and voice navigation OFF still allow captions`,()=>{
  const h=harness(language,8,false);h.c.setSlide(9);h.say('here','three floors');assert.equal(h.texts.at(-1)?.text,target.ko);assert.deepEqual(h.slides,[]);
 });
}
test('floor shortcuts keep actual questions, wrong numbers and the wrong center excluded',()=>{
 for(const text of [
  'Can the development support center be on the first three floors?',
  'Does the development support center occupy the first three floors?',
  'The development support center will not be on the first three floors.',
  'The research center will be on the first three floors.',
  'first four floors','The development support center will be on the first four floors.',
  target.en.replace('three floors','four floors'),
  'What makes this project special? Will the development support center be on the first three floors?',
  'What makes this project special? Can the development support center be on the first three floors?',
 ]){const h=harness();h.say('wrong',text);assert.equal(h.texts.length,0,text);assert.deepEqual(h.slides,[]);}
});
test('short floor phrases cannot jump from the research video slide',()=>{
 const h=harness('en',8),closing=script.cues.filter(c=>c.slide===8).at(-1);
 h.say('closing',closing.en);h.say('short','three floors');assert.deepEqual(h.slides,[]);
 h.say('full',target.en);assert.deepEqual(h.slides,[9]);assert.equal(h.texts.at(-1)?.text,target.ko);
});
