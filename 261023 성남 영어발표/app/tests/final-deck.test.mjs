import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ScriptCaptions} from '../public/script-captions.js';
import {ScriptMatcher,canonical} from '../public/script-matcher.js';
import {validateScript} from '../public/script-store.js';
import {SLIDE_COUNT} from '../public/deck-structure.js';
const prepared=validateScript(JSON.parse(await fs.readFile(new URL('../public/prepared-script.json',import.meta.url),'utf8')));
for(const language of ['en','ko','auto'])test(`speaker introduction: every caption and all 11 slides (${language}; continuous monolingual speech, separate bilingual utterances)`,()=>{
 const slides=[],captions=[];
 const c=new ScriptCaptions(null,{script:prepared,autoRecover:true,autoAdvance:true,speechLanguage:language,onText:(...x)=>captions.push(x),onState(){},onError:e=>{throw e;},onSlide:n=>{slides.push(n);c.setSlide(n);},connectionFactory:()=>({setSlide(){},commit(){},close(){}})});
 try{
  assert.equal(SLIDE_COUNT,11);assert.equal(prepared.cues.length,50);
  for(const [i,cue] of prepared.cues.entries()){
   const lang=language==='auto'?(i%2?'en':'ko'):language;
   for(const word of cue[lang].split(' '))c.accept({type:'conversation.item.input_audio_transcription.delta',item_id:language==='auto'?String(i):'continuous',delta:word+' '});
   assert.equal(c.matcher.slide,cue.slide,cue.id);assert.equal(captions.at(-2)?.[1],cue.vi,cue.id);assert.equal(captions.at(-1)?.[1],cue.ko,cue.id);
  }
  assert.deepEqual(slides,[2,3,4,5,6,7,8,9,10,11]);
 }finally{c.close();}
});
test('2030 spoken as twenty thirty matches digits; a conflicting completion year does not',()=>{
 assert.equal(canonical('twenty thirty'),'2030');assert.equal(canonical('twenty thirty-one'),'2031');
 const index=prepared.cues.findIndex(c=>c.en==='The center will be completed in 2030.');
 assert.ok(index>=0);
 for(const autoRecover of [false,true]){
  const matcher=new ScriptMatcher(prepared.cues,{slide:prepared.cues[index].slide,autoRecover});matcher.seek(index);
  assert.equal(matcher.feed('The center will be completed in twenty thirty',{final:true}).state,'matched');
  matcher.seek(index);assert.notEqual(matcher.feed('The center will be completed in 2031',{final:true}).state,'matched');
 }
});

test('next-slide speech while voice navigation is off cannot recover an earlier cue with shared terminology',()=>{
 const slides=[],texts=[];
 const c=new ScriptCaptions(null,{script:prepared,autoRecover:true,autoAdvance:false,speechLanguage:'en',onText:(...x)=>texts.push(x),onState(){},onError:e=>{throw e;},onSlide:n=>slides.push(n),connectionFactory:()=>({setSlide(){},commit(){},close(){}})});
 const closing=prepared.cues.filter(c=>c.slide===1).at(-1),opening=prepared.cues.find(c=>c.slide===2);
 const say=(id,text)=>c.accept({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript:text});
 try{
  say('closing',closing.en);say('off',opening.en);
  assert.equal(texts.at(-1)[1],closing.ko);assert.deepEqual(slides,[]);
  c.setAutoAdvance(true);say('on',opening.en);
  assert.deepEqual(slides,[2]);assert.equal(texts.at(-1)[1],opening.ko);
 }finally{c.close();}
});

test('the prepared What makes statement advances; an actual question does not',()=>{
 const closing=prepared.cues.filter(c=>c.slide===8).at(-1),opening=prepared.cues.find(c=>c.slide===9);
 const matcher=new ScriptMatcher(prepared.cues,{slide:8,autoRecover:true,autoAdvance:true});
 matcher.seek(prepared.cues.indexOf(closing));matcher.feed(closing.en,{item:'closing',final:true});
 assert.notEqual(matcher.feed('What makes this project special?',{item:'question',final:true}).state,'matched');
 assert.equal(matcher.slide,8);
 assert.equal(matcher.feed(opening.en,{item:'statement',final:true}).state,'matched');assert.equal(matcher.slide,9);
});
