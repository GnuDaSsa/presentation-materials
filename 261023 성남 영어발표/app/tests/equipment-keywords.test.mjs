import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
const target=script.cues.find(c=>c.id==='v16-024');
function harness(language='en',slide=5){
 const texts=[],slides=[];
 const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance:true,
  onText:(language,text)=>texts.push({language,text}),onSlide:n=>slides.push(n),onState(){},onError:e=>{throw e;},
  connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
 });
 return {c,texts,slides,say:(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript}),
  delta:(id,delta)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta})};
}
const phrases=[
 'advanced equipment','Advancer Equipment','advance equipment','equipment sharing','sharing equipment',
 'thrid advancer equipment',
 'The next thing is advanced equipment for these companies.',
 'Now let me talk about equipment sharing for fabless companies.'];
for(const language of ['en','auto']){
 test(`${language}: equipment sharing accepts the speaker's short keywords`,()=>{
  for(const phrase of phrases){const h=harness(language);h.say('short',phrase);assert.equal(h.texts.at(-1)?.text,target.ko,phrase);assert.deepEqual(h.slides,[]);}
 });
 test(`${language}: keywords work before their turn and after an earlier sentence`,()=>{
  const h=harness(language),earlier=script.cues.find(c=>c.id==='v16-022');
  h.say('out-of-order','Advancer Equipment');assert.equal(h.texts.at(-1)?.text,target.ko);
  h.say('back',earlier.en);assert.equal(h.texts.at(-1)?.text,earlier.ko);
  h.say('again','equipment sharing');assert.equal(h.texts.at(-1)?.text,target.ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: split keyword chunks keep listening without requiring a full sentence`,()=>{
  const h=harness(language);h.delta('stream','Advancer ');assert.equal(h.texts.length,0);
  h.delta('stream','Equip');assert.equal(h.texts.length,0);
  h.delta('stream','ment');assert.equal(h.texts.at(-1)?.text,target.ko);assert.deepEqual(h.slides,[]);
  h.say('stream','Advancer Equipment');assert.equal(h.texts.at(-1)?.text,target.ko);
 });
 test(`${language}: a speech pause can separate the two keywords`,()=>{
  const h=harness(language);h.say('first','Advancer');assert.equal(h.texts.length,0);
  h.say('second','Equipment');assert.equal(h.texts.at(-1)?.text,target.ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: keyword capture still permits the remaining script and next slide`,()=>{
  const h=harness(language),next=script.cues.find(c=>c.slide===6),earlier=script.cues.find(c=>c.id==='v16-022');
  for(const word of 'And the thrid is the Advancer Equipment Sharing Program for Fabless Companies.'.split(' '))h.delta('stream',word+' ');
  assert.equal(h.texts.at(-1)?.text,target.ko);assert.deepEqual(h.slides,[]);
  h.delta('stream',earlier.en+' ');assert.equal(h.texts.at(-1)?.text,earlier.ko);
  h.delta('stream','Advancer Equipment ');assert.equal(h.texts.at(-1)?.text,target.ko);
  h.delta('stream',next.en);assert.equal(h.texts.at(-1)?.text,next.ko);assert.deepEqual(h.slides,[6]);
 });
}
test('equipment shortcuts are scoped to their current slide and do not trigger on contradictions',()=>{
 for(const text of ['advanced','equipment','third','thrid','3rd','And the third','Now, the third one','third equipment','third advanced','third floor','third party software','not advanced equipment','Can we share advanced equipment?','third equipment for 40 companies']){
  const h=harness();h.say('other',text);assert.notEqual(h.texts.at(-1)?.text,target.ko,text);assert.deepEqual(h.slides,[]);
 }
 for(const slide of [1,2,3,4,6,7,8,9,10,11]){
  const h=harness('auto',slide);h.say('wrong-slide','thrid');h.say('other','Advancer Equipment');
  assert.ok(h.texts.every(c=>c.text!==target.ko));assert.deepEqual(h.slides,[]);
 }
});
test('a shortcut never jumps into the equipment slide from the previous one',()=>{
 const h=harness('en',4);h.say('last',script.cues.filter(c=>c.slide===4).at(-1).en);h.say('short','thrid advancer equipment');assert.deepEqual(h.slides,[]);
});
