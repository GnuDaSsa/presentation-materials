import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
const ids=['v16-022','v16-023','v16-024'];
const cues=ids.map(id=>script.cues.find(c=>c.id===id));
function harness(language='en',slide=5,autoAdvance=true){
 const shown=[],slides=[];
 const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance,
  onText:(language,text)=>shown.push({language,text}),onSlide:n=>slides.push(n),onState(){},onError:e=>{throw e;},
  connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
 });
 return {c,shown,slides,say:(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript}),
  delta:(id,delta)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta})};
}
const cases=[
 [0,'first one is, you know, about IC verification'],
 [0,'verification'],[0,'validation'],[0,'IC verification'],[0,'system I C'],[0,'system the I C'],
 [0,'this is a verification facility'],[0,'the system I see verification centre'],
 [0,'first project system IC verificaton center'],[0,'number one, the verification center'],
 [1,'the second one is, you know, for defense'],
 [1,'defense'],[1,'defence'],[1,'defense testing'],[1,'testing project'],
 [1,'semiconductor testing'],[1,'we test chips for the defence industry'],
 [1,'second semiconductor test for defence'],[1,'number two, semiconductor testing for defense'],
 [2,'third one is, you know, sharing the equipment'],
 [2,'sharing'],[2,'equipment sharing'],[2,'shared equipment'],[2,'fabless equipment'],
 [2,'advanced equipment'],[2,'advancer equipment'],[2,'third project advanced equipments for fabless'],
 [2,'number three, sharing equipment for companies'],
];
for(const language of ['en','auto']){
 test(`${language}: rough project descriptions use distinctive name keywords`,()=>{
  const failures=[];
  for(const [n,text] of cases){const h=harness(language);h.say('rough',text);if(h.shown.at(-1)?.text!==cues[n].ko)failures.push(text);assert.deepEqual(h.slides,[]);}
  assert.deepEqual(failures,[]);
 });
 test(`${language}: all three rough names in one chunk end on the third caption`,()=>{
  const h=harness(language);
  h.say('all','First project, system IC verification. Second project, semiconductor test for defense. Third project, advanced equipment sharing for fabless.');
  assert.equal(h.shown.at(-1)?.text,cues[2].ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: every project order works without pauses`,()=>{
  const phrases=['first project, system I C verification centre','second project, test chips for defence','third project, advancer equipment sharing'];
  for(const order of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){
   const h=harness(language);
   for(const n of order){
    for(const word of phrases[n].split(' '))h.delta('continuous',word+' ');
    assert.equal(h.shown.at(-1)?.text,cues[n].ko,order.join(',')+' at '+n);
   }
   assert.deepEqual(h.slides,[]);
  }
 });
 test(`${language}: short keywords work after filler and earlier unfinished words`,()=>{
  const h=harness(language);
  for(const [n,text] of [[0,'well you know this verification'],[1,'and the other project is defense'],[2,'and then we have sharing'],[0,'back to verification']]){
   h.say('p'+n+text,text);assert.equal(h.shown.at(-1)?.text,cues[n].ko,text);
  }
  h.say('silence','');assert.equal(h.shown.at(-1)?.text,cues[0].ko);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: title keywords split across ASR pauses still match`,()=>{
  for(const [n,parts] of [[0,['system I','C']],[1,['semiconductor','test']],[2,['shared','equipment']]]){
   const h=harness(language);parts.forEach((text,i)=>h.say('part'+i,text));assert.equal(h.shown.at(-1)?.text,cues[n].ko,parts.join(' '));
  }
 });
 test(`${language}: rough speech completes the slide and advances only on the next opening`,()=>{
  const h=harness(language);
  h.say('projects','number one verification, number two defense, number three sharing equipment');
  assert.equal(h.shown.at(-1)?.text,cues[2].ko);assert.deepEqual(h.slides,[]);
  const next=script.cues.find(c=>c.slide===6);h.say('next',next.en);
  assert.equal(h.shown.at(-1)?.text,next.ko);assert.deepEqual(h.slides,[6]);
 });
}
test('loose project matching still excludes unrelated speech, conflicting facts and other slides',()=>{
 for(const text of ['one','two','three','equipment','advanced','semiconductor','program',
  'first floor','first time','second floor','second time','third party','not verification',
  'no defense project','not sharing equipment','verification for 40 companies','third equipment for 40 companies',
  'Can we share advanced equipment?','Is this a verification center?']){
  const h=harness();h.say('other',text);assert.equal(h.shown.length,0,text);assert.deepEqual(h.slides,[]);
 }
 for(const slide of [1,2,3,4,6,7,8,9,10,11]){
  const h=harness('en',slide);h.say('wrong-slide','verification');h.say('wrong-slide-2','defense');h.say('wrong-slide-3','sharing');
  assert.ok(h.shown.every(c=>!cues.some(target=>target.ko===c.text)),String(slide));assert.deepEqual(h.slides,[]);
 }
});
