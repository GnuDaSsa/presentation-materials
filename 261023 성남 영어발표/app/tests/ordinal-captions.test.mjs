import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
const cue=id=>script.cues.find(c=>c.id===id);
function harness(language='en',slide=5){
 const texts=[],slides=[];
 const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance:true,
  onText:(language,text)=>texts.push({language,text}),onSlide:n=>slides.push(n),onState(){},onError:e=>{throw e;},
  connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
 });
 return {c,texts,slides,say:(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript}),
  delta:(id,delta)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta})};
}
const cases=[
 ['v16-022','The first one is the System IC Verification Center.'],
 ['v16-022','First is System IC Verification Center.'],
 ['v16-022','The first one, the System IC Verification Center.'],
 ['v16-022','The first one is, uh, a System IC Verification Center.'],
 ['v16-022','System IC verification center'],
 ['v16-022','The System IC Verification Center'],
 ['v16-022','Verification center'],
 ['v16-023','And a second one is a Semiconductor Testing Project for Advanced Defense Industry.'],
 ['v16-023','The second is a Semiconductor Testing Project for the Defense Industry.'],
 ['v16-023','The second one is a semiconductor testing project for defense industry.'],
 ['v16-023','Semiconductor Testing'],
 ['v16-023','Testing Project'],
 ['v16-023','Defense Industry'],
 ['v16-024','The third one is the Advanced Equipment Sharing Program for Fabless Companies.'],
];
for(const language of ['en','auto']){
 test(`${language}: defense project can omit Advanced in streaming speech and across pauses`,()=>{
  const text='The second is a Semiconductor Testing Project for the Defense Industry.';
  for(const previous of ['v16-022','v16-024']){
   const h=harness(language);h.say('before',cue(previous).en);
   for(const word of text.split(' '))h.delta('stream',word+' ');
   assert.equal(h.texts.at(-1)?.text,cue('v16-023').ko);
   h.say('stream',text);assert.equal(h.texts.at(-1)?.text,cue('v16-023').ko);assert.deepEqual(h.slides,[]);
  }
  const h=harness(language);
  h.say('start','The second is a');assert.equal(h.texts.length,0);
  h.say('middle','Semiconductor Testing Project');h.say('end','for the Defense Industry.');
  assert.equal(h.texts.at(-1)?.text,cue('v16-023').ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: article variations and ordinal pronouns identify the same project`,()=>{
  for(const [id,text] of cases){const h=harness(language);h.say('spoken',text);assert.equal(h.texts.at(-1)?.text,cue(id).ko,text);assert.deepEqual(h.slides,[],text);}
 });
 test(`${language}: the first one waits for the center name during speech`,()=>{
  const h=harness(language);
  for(const word of 'the first one is the'.split(' '))h.delta('stream',word+' ');
  assert.equal(h.texts.length,0);
  h.delta('stream','System IC Verification Center.');
  h.say('stream','The first one is the System IC Verification Center.');
  assert.equal(h.texts.at(-1)?.text,cue('v16-022').ko);
  h.say('next','The second one is the');
  assert.equal(h.texts.at(-1)?.text,cue('v16-022').ko);
  h.say('next-name','Semiconductor Testing');
  assert.equal(h.texts.at(-1)?.text,cue('v16-023').ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: articles and pauses do not constrain project order`,()=>{
  const h=harness(language);
  h.say('third','advanced equipment');assert.equal(h.texts.at(-1)?.text,cue('v16-024').ko);
  h.say('first','the first one is the');assert.equal(h.texts.at(-1)?.text,cue('v16-024').ko);
  h.say('title','System IC Verification Center.');assert.equal(h.texts.at(-1)?.text,cue('v16-022').ko);
  h.say('second','second one');assert.equal(h.texts.at(-1)?.text,cue('v16-022').ko);
  h.say('second-name','defense testing');assert.equal(h.texts.at(-1)?.text,cue('v16-023').ko);
  h.say('pause','');assert.equal(h.texts.at(-1)?.text,cue('v16-023').ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: ordinal phrasing works in continuous speech through the next slide`,()=>{
  const h=harness(language);
  for(const [id,text] of [
   ['v16-021',cue('v16-021').en],
   ['v16-022','The first one is a System IC Verification Center.'],
   ['v16-023','Second one is the Semiconductor Testing Project for Advanced Defense Industry.'],
   ['v16-024','And the third one is an Advanced Equipment Sharing Program for Fabless Companies.'],
  ]){
   for(const word of text.split(' '))h.delta('continuous',word+' ');
   assert.equal(h.texts.at(-1)?.text,cue(id).ko,text);
  }
  h.delta('continuous',script.cues.find(c=>c.slide===6).en);
  assert.deepEqual(h.slides,[6]);
 });
}
test('ordinal shortcuts ignore unrelated phrases, contradictions and wrong slides',()=>{
 for(const text of ['the is a','one','the first floor','first time','not the first one','the first one is not the verification center','first one of 40 companies','the first one is 2 centers','Is the first one a verification center?']){
  const h=harness();h.say('unrelated',text);assert.equal(h.texts.length,0,text);assert.deepEqual(h.slides,[],text);
 }
 for(const slide of [1,2,3,4,6,7,8,9,10,11]){
  const h=harness('en',slide);h.say('short','the first one is the');assert.ok(h.texts.every(c=>c.text!==cue('v16-022').ko));assert.deepEqual(h.slides,[]);
 }
 const h=harness('en',4);h.say('closing',script.cues.filter(c=>c.slide===4).at(-1).en);h.say('short','the first one is the');assert.deepEqual(h.slides,[]);
});
