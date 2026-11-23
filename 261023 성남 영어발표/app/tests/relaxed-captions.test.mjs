import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
const script=JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8'));
function harness(slide,language='en'){
 const shown=[],slides=[];
 const c=new ScriptCaptions(null,{script,slide,speechLanguage:language,autoRecover:true,autoAdvance:true,
  onText:(language,text)=>shown.push({language,text}),onSlide:n=>slides.push(n),onState(){},onError:e=>{throw e;},
  connectionFactory:()=>({setSlide(){},commit(){},close(){}}),
 });
 return {c,shown,slides,say:(id,transcript)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript}),
  delta:(id,delta)=>c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:id,delta})};
}
const cases=[
 ['v16-015','We want to help these firms grow quicker.'],
 ['v16-015','Help companies grow faster.'],
 ['v16-015','Grow faster.'],
 ['v16-037','We teach local staff here in Seongnam.'],
 ['v16-037','Training workers for local businesses.'],
 ['v16-037','Skilled workers.'],
 ['v16-041','It should be finished by twenty thirty.'],
 ['v16-033','Gachon teaches digital chip design.'],
 ['v16-033','Digital design.'],
 ['v16-034','Sogang provides advanced chip design training.'],
 ['v16-036','We give young people skills to begin their careers.'],
 ['v16-010','I made these slides and live subtitles with AI.'],
 ['v16-009','I passed the AI Champion Black program.'],
 ['v16-008',"I'm Jinwoo Sa from the AI semiconductor team."],
 ['v16-013','Seongnam has a special advantage.'],
 ['v16-040','We will build a research centre at Third Pangyo Techno Valley.'],
 ['v16-043','The support centre will be on the first three floors.'],
 ['v16-042','Companies will get office and research space.'],
 ['v16-026','We give technical training and advice.'],
 ['v16-027','This helps local firms cut their development costs.'],
 ['v16-050','Thanks for listening.'],
];
for(const language of ['en','auto'])test(`${language}: shorter phrases and familiar synonyms select their prepared cue`,()=>{
 const failures=[];
 for(const [id,spoken] of cases){
  const cue=script.cues.find(c=>c.id===id),h=harness(cue.slide,language);h.say('phrase',spoken);
  if(h.shown.at(-1)?.text!==cue.ko)failures.push({spoken,expected:id,actual:script.cues.find(c=>c.ko===h.shown.at(-1)?.text)?.id||'unmatched'});
  assert.deepEqual(h.slides,[],spoken);
 }
 assert.deepEqual(failures,[]);
});
for(const language of ['en','auto'])test(`${language}: shortened phrases can be reordered in one continuous utterance`,()=>{
 const h=harness(7,language);
 for(const [id,text] of cases.filter(([id])=>['v16-034','v16-037','v16-033','v16-036'].includes(id))){
  for(const word of text.split(' '))h.delta('continuous',word+' ');
  assert.equal(h.shown.at(-1)?.text,script.cues.find(c=>c.id===id).ko,text);assert.deepEqual(h.slides,[]);
 }
});
test('relaxed matching waits on generic words, conflicting entities, values and negation',()=>{
 for(const [slide,spoken] of [
  [3,'Seoul has a unique strength.'],[3,'Seoul has a special advantage.'],[3,'서울 has a special advantage.'],
  [3,'Semiconductor companies.'],[3,'Help companies.'],[3,'We do not help companies grow faster.'],
  [7,'University training.'],[7,'Workers.'],[7,'Semiconductor design.'],
  [7,'Gachon offers an advanced semiconductor design course.'],
  [8,'It should be finished in 2031.'],[8,'It will not be finished in 2030.'],
  [9,'The research center is on the first three floors.'],[9,'The support center is on the first four floors.'],
  [3,'Can we help these firms grow quicker?'],
 ]){
  const h=harness(slide);h.say('wrong',spoken);assert.equal(h.shown.length,0,spoken);assert.deepEqual(h.slides,[]);
 }
});
test('a brief keyword pair never skips to another slide',()=>{
 const h=harness(7),last=script.cues.filter(c=>c.slide===7).at(-1);
 h.say('closing',last.en);h.say('short','Research center.');assert.deepEqual(h.slides,[]);assert.equal(h.shown.at(-1)?.text,last.ko);
});
