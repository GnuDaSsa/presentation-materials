import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';

const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
function harness(slide,language='en',autoAdvance=true) {
  const slides=[],texts=[];let clears=0;
  const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance,
    onText:(language,text)=>texts.push({language,text}),onSlide:n=>slides.push(n),onClear:()=>clears++,onState(){},onError:e=>{throw e;},
    connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
  });
  const say=(id,text)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript:text});
  return {c,say,slides,texts,get clears(){return clears;}};
}
const cases=[
  [3,4,'Our goal is a strong network for the system semiconductor industry in Seongnam.',0],
  [4,5,'We have a major program, the System Semiconductor Development Support Center.',0],
  [6,7,'For talent development, we have a three step semiconductor training program.',1],
  [7,8,'For industrial space, we plan to build the Pangyo system semiconductor research centre in the Third Pangyo Techno Valley.',1],
  [8,9,'What makes this project special is that the first three floors will house the System Semiconductor Development Support Center I mentioned earlier.',0],
  [8,9,'It is special because the development support center will be on the first three floors.',0],
  [8,9,'The System Semiconductor Development Support Center I mentioned earlier will be on the first three floors.',0],
];
for(const language of ['en','auto'])for(const [from,to,spoken,position] of cases) {
  test(`${language}: familiar wording can advance ${from} to ${to}: ${spoken}`,()=>{
    const h=harness(from,language),closing=script.cues.filter(c=>c.slide===from).at(-1);
    h.say('closing',closing.en);h.say('paraphrase',spoken);
    assert.deepEqual(h.slides,[to]);
    assert.equal(h.texts.at(-1)?.text,script.cues.filter(c=>c.slide===to)[position].ko);
  });
}
test('a local cue follows a reformulation without clearing the last caption on a pause',()=>{
  const h=harness(7),target=script.cues.find(c=>c.en.startsWith('For local companies,'));
  h.c.seek(script.cues.indexOf(target));
  h.say('rephrased','We train people with the skills local companies need, here in Seongnam.');
  assert.equal(h.texts.at(-1)?.text,target.ko);
  h.say('pause','');assert.equal(h.clears,0);assert.equal(h.texts.at(-1)?.text,target.ko);
});
test('word order and a small substitution are tolerated within the current What makes cue',()=>{
  const h=harness(9),target=script.cues.find(c=>c.slide===9);
  h.say('rephrased','What makes this project special is that the first three floors will house the System Semiconductor Development Support Center I mentioned earlier.');
  assert.equal(h.texts.at(-1)?.text,target.ko);
});
test('flexible movement still rejects questions, wrong numbers, negation and the wrong center',()=>{
  for(const text of [
    'Can the system semiconductor development support center be on the first three floors?',
    'What makes this project special?',
    'The development support center will be on the first four floors.',
    'The system semiconductor development support center will not be on the first three floors.',
    'The system semiconductor research center will be on the first three floors.',
    'Semiconductor companies and support centers.',
    script.cues.find(c=>c.slide===11).en,
  ]) {
    const h=harness(8);h.say('closing',script.cues.filter(c=>c.slide===8).at(-1).en);
    h.say('other',text);assert.deepEqual(h.slides,[],text);
  }
});
test('voice navigation OFF keeps a paraphrased next-slide opening queued',()=>{
  const h=harness(8,'auto',false),closing=script.cues.filter(c=>c.slide===8).at(-1);
  h.say('closing',closing.en);h.say('off',cases.at(-1)[2]);
  assert.deepEqual(h.slides,[]);assert.equal(h.texts.at(-1)?.text,closing.ko);
  h.c.setAutoAdvance(true);h.say('on',cases.at(-1)[2]);assert.deepEqual(h.slides,[9]);
});
test('a flexible opening split over a pause needs fresh matching speech',()=>{
  const h=harness(8);h.say('closing',script.cues.filter(c=>c.slide===8).at(-1).en);
  h.say('prefix','The system semiconductor development support center');assert.deepEqual(h.slides,[]);
  h.say('rest','I mentioned earlier will be on the first three floors.');assert.deepEqual(h.slides,[9]);
  h.say('late','I mentioned earlier will be on the first three floors.');assert.deepEqual(h.slides,[9]);
});
for(const language of ['en','auto'])test(`${language}: incremental paraphrases move once and continue to the following cue`,()=>{
  for(const [from,to,spoken,position] of cases){
    const h=harness(from,language);h.say('closing',script.cues.filter(c=>c.slide===from).at(-1).en);
    for(const word of spoken.split(' '))h.c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:'stream',delta:word+' '});
    h.say('stream',spoken);
    assert.deepEqual(h.slides,[to],spoken);
    const following=script.cues.filter(c=>c.slide===to)[position+1];
    h.say('following',following.en);
    assert.equal(h.texts.at(-1)?.text,following.ko,spoken);
  }
});
