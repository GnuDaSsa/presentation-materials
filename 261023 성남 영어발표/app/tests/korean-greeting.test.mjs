import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
import {OpeningSequence} from '../public/opening-sequence.js';

const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
function harness(language,slide=1){
  const shown=[],slides=[];const opening=new OpeningSequence();let handoffs=0;
  const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance:true,
    onText:(language,text)=>shown.push({language,text}),onState(){},onError:e=>{throw e;},onSlide:n=>slides.push(n),
    onTranscript:(text,meta)=>{if(opening.feed(text,meta)){handoffs++;opening.finish(opening.begin());}},
    connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
  });
  const say=(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript});
  const delta=(id,text)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta:text});
  return {c,shown,slides,opening,say,delta,get handoffs(){return handoffs;}};
}
for(const language of ['ko','auto']){
  test(`${language}: opening captions accept natural greetings without waiting for the job title`,()=>{
    for(const greeting of ['안녕하세요.','안녕하십니까.','여러분, 안녕하십니까?','네, 안녕하세요.','안녕하셔요.','안녕하십니까. AI반도체과 사진우 주무관입니다.','안녕하십니까. 저는 에이아이 반도체과 사진우 주무관입니다.']){
      const h=harness(language);h.say('greeting',greeting);
      assert.deepEqual(h.shown,[{language:'vi',text:script.cues[0].vi},{language:'ko',text:script.cues[0].ko}],greeting);
      assert.equal(h.handoffs,0);assert.deepEqual(h.slides,[]);
    }
  });
  test(`${language}: a greeting split into streaming chunks only needs the completed greeting`,()=>{
    const h=harness(language);h.delta('intro','안녕하');assert.equal(h.shown.length,0);
    h.delta('intro','십니까');assert.equal(h.shown.at(-1)?.text,script.cues[0].ko);
    h.delta('intro','. AI 반도체과 사진우 주무관입니다.');
    h.say('intro','안녕하십니까. AI 반도체과 사진우 주무관입니다.');
    assert.equal(h.shown.length,2);assert.equal(h.handoffs,0);
  });
  test(`${language}: an informal spelling and pause still lead to the thanks and language handoff`,()=>{
    const h=harness(language);h.say('hello','안녕하십니까.');
    h.say('identity','에이아이 반도체과 사진우 주무관입니다.');
    h.say('thanks',script.cues[1].ko);assert.equal(h.shown.at(-1)?.text,script.cues[1].ko);
    h.say('handoff',script.cues[2].ko);assert.equal(h.shown.at(-1)?.text,script.cues[2].ko);
    assert.equal(h.handoffs,1);assert.equal(h.opening.phase,'en');
    h.say('later-hello','안녕하십니까.');assert.equal(h.shown.at(-1)?.text,script.cues[2].ko);
    assert.equal(h.handoffs,1);assert.deepEqual(h.slides,[]);
  });
  test(`${language}: unrelated speech and greetings on a different slide do not restart the introduction`,()=>{
    for(const text of ['안녕히 가세요.','마이크 테스트 중입니다.','반도체과에서 자료를 준비했습니다.','안녕하']){
      const h=harness(language);h.say('other',text);assert.equal(h.shown.length,0,text);
    }
    const h=harness(language,2);h.say('elsewhere','안녕하십니까.');assert.equal(h.shown.length,0);
  });
}
test('the revised Korean greeting continues into English in the same speech item',()=>{
  const h=harness('auto');
  for(const word of '안녕하십니까. AI반도체과 사진우 주무관입니다.'.split(' '))h.delta('one-item',word+' ');
  for(const cue of script.cues.slice(1,7)){
    for(const word of cue[cue.spokenLanguage||'en'].split(' '))h.delta('one-item',word+' ');
    assert.equal(h.shown.at(-1)?.text,cue.ko,cue.id);
  }
  assert.equal(h.handoffs,1);
});
