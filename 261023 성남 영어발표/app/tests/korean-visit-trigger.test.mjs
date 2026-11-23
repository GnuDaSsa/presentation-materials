import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
import {OpeningSequence} from '../public/opening-sequence.js';
const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
const target=script.cues.find(c=>c.id==='v16-002');
function harness(language='auto',slide=1){
 const texts=[],slides=[],opening=new OpeningSequence();let handoffs=0;
 const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance:true,
  onText:(language,text)=>texts.push({language,text}),onSlide:n=>slides.push(n),onState(){},onError:e=>{throw e;},
  onTranscript:(text,meta)=>{if(opening.feed(text,meta)){handoffs++;opening.finish(opening.begin());}},
  connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
 });
 return {c,texts,slides,opening,get handoffs(){return handoffs;},
  say:(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript}),
  delta:(id,delta)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta})};
}
const phrases=['성남','성남에','성남 방문','성남에 방문','오늘 이렇게 성남','오늘 이렇게 성남 방문해 주셔서 감사합니다.','바쁘신데 성남을 찾아 주셔서 감사합니다.',
 '성남시에 방문','바쁘신 가운데 성남시에 방문해 주셔서 감사합니다.','먼 길 오셔서 성남시에 방문해 주심에 감사드립니다.',
 '이렇게 성남시에 방문해 주셔서 감사합니다.','오늘 성남시에 방문해 주셔서 감사합니다.','성 남 시 에 방 문','2026년 11월에 성남시에 방문해 주셔서 감사합니다.',target.ko];
for(const language of ['ko','auto']){
 test(`${language}: the Korean thanks cue starts at the visit phrase with any introduction`,()=>{
  for(const phrase of phrases){const h=harness(language);h.say('visit',phrase);assert.deepEqual(h.texts,[{language:'vi',text:target.vi},{language:'ko',text:target.ko}],phrase);assert.equal(h.handoffs,0);assert.deepEqual(h.slides,[]);}
 });
 test(`${language}: the city word starts the thanks before the visit word`,()=>{
  const h=harness(language);h.delta('stream','오늘 이렇게 성');assert.equal(h.texts.length,0);
  h.delta('stream','남에 ');assert.equal(h.texts.at(-1)?.text,target.ko);
  h.delta('stream','방');h.delta('stream','문');assert.equal(h.texts.at(-1)?.text,target.ko);
  h.delta('stream','해 주셔서 감사합니다.');assert.equal(h.texts.length,2);assert.equal(h.handoffs,0);
 });
 test(`${language}: a speech pause can split the city and visit words`,()=>{
  const h=harness(language);h.say('city','바쁘신데 성남시에');assert.equal(h.texts.at(-1)?.text,target.ko);
  h.say('visit','방문해 주셔서 감사합니다.');assert.equal(h.texts.at(-1)?.text,target.ko);
  h.say('silence','');assert.equal(h.texts.length,2);assert.equal(h.handoffs,0);
 });
 test(`${language}: introduction, revised thanks, and language handoff remain continuous`,()=>{
  const h=harness(language);
  h.delta('one','안녕하십니까. AI반도체과 사진우 주무관입니다. ');
  for(const word of '바쁘신 가운데 성남시에 방문해 주셔서 감사합니다. '.split(' '))h.delta('one',word+' ');
  assert.equal(h.texts.at(-1)?.text,target.ko);assert.equal(h.handoffs,0);
  h.delta('one',script.cues[2].ko);assert.equal(h.texts.at(-1)?.text,script.cues[2].ko);assert.equal(h.handoffs,1);assert.deepEqual(h.slides,[]);
 });
 test(`${language}: a bare city word after the greeting starts both prepared subtitles`,()=>{
  const h=harness(language);h.say('hello','안녕하십니까. AI반도체과 사진우 주무관입니다.');
  h.say('city','성남');assert.deepEqual(h.texts.slice(-2),[{language:'vi',text:target.vi},{language:'ko',text:target.ko}]);
  h.say('visit','에 방문해 주셔서 감사합니다.');assert.equal(h.texts.at(-1)?.text,target.ko);assert.equal(h.handoffs,0);
 });
 test(`${language}: a split city name waits for a word boundary instead of matching city hall`,()=>{
  const h=harness(language);h.delta('intro','안녕하십니까. 저는 성');h.delta('intro','남');
  assert.equal(h.texts.at(-1)?.text,script.cues[0].ko);
  h.delta('intro','시청 AI반도체과 사진우 주무관입니다. ');
  assert.equal(h.texts.at(-1)?.text,script.cues[0].ko);
  h.delta('intro','오늘 이렇게 성남 ');assert.equal(h.texts.at(-1)?.text,target.ko);
 });
 test(`${language}: a bare city name does not rewind the welcome after the English handoff`,()=>{
  const h=harness(language);h.say('handoff','영어로 진행해보도록 하겠습니다.');
  h.say('city','성남');assert.equal(h.texts.at(-1)?.text,script.cues[2].ko);assert.equal(h.handoffs,1);
 });
}
test('the Korean visit shortcut excludes other cities, negation, incomplete words and other slides',()=>{
 for(const text of ['서울시에 방문해 주셔서 감사합니다.','성','성남시 이야기입니다.','성남시에 방문하지 않았습니다.','성남시청 AI반도체과입니다.','성남시민입니다.','성남산업진흥원입니다.']){
  const h=harness();h.say('other',text);assert.equal(h.texts.length,0,text);assert.equal(h.handoffs,0);
 }
 const h=harness('auto',2);h.say('elsewhere','성남시에 방문');assert.equal(h.texts.length,0);assert.equal(h.handoffs,0);
});
