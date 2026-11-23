import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {OpeningSequence,isEnglishHandoff} from '../public/opening-sequence.js';
import {ScriptCaptions} from '../public/script-captions.js';
const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
const cue=script.cues.find(c=>c.id==='v16-003');
function harness(language='auto',slide=1,autoAdvance=true){
 const shown=[],slides=[],opening=new OpeningSequence();let handoffs=0,clears=0;
 const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance,
  onText:(language,text)=>shown.push({language,text}),onSlide:n=>slides.push(n),onState(){},onClear:()=>clears++,onError:e=>{throw e;},
  onTranscript:(text,meta)=>{if(opening.feed(text,meta)){handoffs++;opening.finish(opening.begin());}},
  connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
 });
 return {c,shown,slides,opening,get handoffs(){return handoffs;},get clears(){return clears;},
  say:(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript}),
  delta:(id,delta)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta})};
}
const phrases=[cue.ko,'국제적인 자리인 만큼, 지금부터 영어로 진행해보도록 하겠습니다.',
 '국제적인 자리니까 영어로 진행해 보겠습니다.','이제 영어로 진행해보도록 하겠습니다.',
 '영어로 진행','영어로 진행하도록','영어로 진행하겠습니다','영어로 발표하겠습니다',
 '영어로 말씀드리겠습니다','영어로 발표를 진행하겠습니다','영 어 로 진 행 해 보 도 록 하 겠 습 니 다'];
for(const language of ['ko','auto']){
 test(`${language}: flexible handoff shows both subtitles and changes the cover once`,()=>{
  for(const text of phrases){
   const h=harness(language);h.say('spoken',text);
   assert.deepEqual(h.shown,[{language:'vi',text:cue.vi},{language:'ko',text:cue.ko}],text);
   assert.equal(h.handoffs,1,text);assert.equal(h.opening.phase,'en');assert.deepEqual(h.slides,[]);
   h.say('silence','');assert.equal(h.handoffs,1);assert.equal(h.clears,0);assert.equal(h.shown.at(-1).text,cue.ko);
  }
 });
 test(`${language}: international introduction shows the cue before the short voice trigger`,()=>{
  const h=harness(language);
  h.delta('stream','국제적인 자리');assert.equal(h.shown.at(-1)?.text,cue.ko);assert.equal(h.handoffs,0);
  h.delta('stream','인 만큼 이제 영어로 ');assert.equal(h.handoffs,0);
  h.delta('stream','진');assert.equal(h.handoffs,0);
  h.delta('stream','행');assert.equal(h.handoffs,1);assert.equal(h.shown.at(-1)?.text,cue.ko);
  h.delta('stream','해보도록 하겠습니다.');assert.equal(h.handoffs,1);assert.equal(h.shown.length,2);
  h.say('stream','국제적인 자리인 만큼 이제 영어로 진행해보도록 하겠습니다.');
  assert.equal(h.shown.at(-1)?.text,cue.ko);assert.equal(h.handoffs,1);assert.equal(h.clears,0);
 });
 test(`${language}: pausing after English-language words still matches the handoff`,()=>{
  const h=harness(language);h.say('first','이제 영어로');assert.equal(h.handoffs,0);assert.equal(h.shown.length,0);
  h.say('rest','진행해보도록 하겠습니다.');assert.equal(h.handoffs,1);assert.equal(h.shown.at(-1)?.text,cue.ko);
 });
}
for(const autoAdvance of [false,true])test(`revised opening continues into English without losing captions; voice navigation ${autoAdvance}`,()=>{
 const h=harness('auto',1,autoAdvance);
 for(const text of ['안녕하십니까. AI반도체과 사진우 주무관입니다.','바쁘신데 성남시에 방문해 주셔서 감사합니다.','국제적인 자리인 만큼 지금부터 영어로 진행해보도록 하겠습니다.']){
  for(const word of text.split(' '))h.delta('continuous',word+' ');
 }
 assert.equal(h.handoffs,1);assert.equal(h.shown.at(-1)?.text,cue.ko);
 for(const english of script.cues.filter(c=>c.slide===1 && !c.spokenLanguage)){
  for(const word of english.en.split(' '))h.delta('continuous',word+' ');
  assert.equal(h.shown.at(-1)?.text,english.ko,english.id);
 }
 assert.equal(h.handoffs,1);assert.deepEqual(h.slides,[]);
});
test('short handoff excludes unrelated mentions, negation, questions and other slides',()=>{
 for(const text of ['영어','지금부터 영어로','진행해보도록 하겠습니다.','국제적인 행사입니다.',
  '영어로 진행하지 않겠습니다.','영어로는 진행하지 못합니다.','영어로 발표 안 하겠습니다.',
  '영어로 진행할까요?','영어로 진행해볼까요?','영어로 진행?',
  '국제적인 자리이지만 영어로 진행하지 않겠습니다.']){
  assert.equal(isEnglishHandoff(text),false,text);
  const h=harness();h.say('other',text);assert.equal(h.handoffs,0,text);assert.equal(h.shown.length,0,text);
  h.say('silence','');assert.equal(h.handoffs,0,text);assert.equal(h.shown.length,0,text);
 }
 const h=harness('auto',2);h.say('wrong-slide','영어로 진행해보도록 하겠습니다.');assert.equal(h.handoffs,0);assert.equal(h.shown.length,0);
});
