import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
const cues=['v16-022','v16-023','v16-024'].map(id=>script.cues.find(c=>c.id===id));
function harness(language,slide=5){
 const shown=[],slides=[];
 const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance:true,
  onText:(language,text)=>shown.push({language,text}),onSlide:n=>slides.push(n),onState(){},onError:e=>{throw e;},
  connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
 });
 return {c,shown,slides,say:(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript}),
  delta:(id,delta)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta})};
}
for(const language of ['en','auto']){
 test(`${language}: ordinals and strategy labels never select a project caption, including interim speech`,()=>{
  for(const text of ['first','second','third','thrid','1st','2nd','3rd','first project','number one','number two','number three',
   'The first one is the','The second is a','And the third is the',
   'Second talent development','Third industrial space','The first is the system','The second is a semiconductor','And the third is the advanced']){
   const h=harness(language);
   for(const word of text.split(' '))h.delta('stream',word+' ');
   h.say('stream',text);
   assert.equal(h.shown.length,0,text);assert.deepEqual(h.slides,[]);
  }
 });
 test(`${language}: project names trigger without the ordinal and tolerate title variants`,()=>{
  for(const [n,text] of [[0,'System IC Verification Center'],[0,'system I C verification centre'],[0,'IC verificaton center'],[0,'Verification center'],
   [1,'Semiconductor Testing Project for the Advanced Defense Industry'],[1,'semiconductor testing'],[1,'defence testing'],
   [2,'Advanced Equipment Sharing Program for Fabless Companies'],[2,'advancer equipment'],[2,'equipment sharing'],
   [0,'second System IC Verification Center'],[2,'First advanced equipment sharing']]){
   const h=harness(language);h.say('name',text);assert.equal(h.shown.at(-1)?.text,cues[n].ko,text);assert.deepEqual(h.slides,[]);
  }
 });
 test(`${language}: first infrastructure selects its own introduction, never the verification center`,()=>{
  const h=harness(language);h.say('name',cues[1].en);const count=h.shown.length;
  for(const word of 'First infrastructure'.split(' '))h.delta('strategy',word+' ');
  h.say('strategy','First infrastructure');assert.ok(h.shown.slice(count).every(c=>c.text!==cues[0].ko));
  assert.equal(h.shown.at(-1)?.text,script.cues.find(c=>c.id==='v16-020').ko);
  h.say('name-again','System IC Verification Center');assert.equal(h.shown.at(-1)?.text,cues[0].ko);
 });
 test(`${language}: the first infrastructure introduction waits past first and stays correct through its full name`,()=>{
  const h=harness(language),intro=script.cues.find(c=>c.id==='v16-020');
  h.delta('strategy','First, ');assert.equal(h.shown.length,0);
  h.delta('strategy','infrastructure. ');assert.equal(h.shown.at(-1)?.text,intro.ko);
  for(const word of intro.en.split(' ').slice(2))h.delta('strategy',word+' ');
  h.say('strategy',intro.en);assert.equal(h.shown.at(-1)?.text,intro.ko);
  assert.ok(h.shown.every(c=>!cues.some(p=>p.ko===c.text)));assert.deepEqual(h.slides,[]);
 });
}
