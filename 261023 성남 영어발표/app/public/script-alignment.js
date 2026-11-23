// Local recovery for imperfect English ASR. No generated text or translation calls.
import {projectProfile,findProjectKeywords} from './program-keywords.js';
import {isWelcomeCue,findWelcomeKeywords} from './welcome-keywords.js';
import {findInfrastructureKeywords} from './infrastructure-keywords.js';
const stop = new Set('a an the and or but of to in on at by for with from as is are was were be been being this that these those it its our we they their them i you your he she have has had will would can could may might must do does did which who whose when where how what according there here so then also very particularly particular approximately about around uh um er ah well actually basically like just'.split(' '));
stop.add('should');
const equivalent = { centre:'center',firms:'company',firm:'company',companies:'company',company:'company',enterprises:'company',enterprise:'company',businesses:'company',business:'company',koreas:'korea',korean:'korea',verification:'verify',validation:'verify',verified:'verify',verifying:'verify',validate:'verify',validated:'verify',fabrication:'fabricate',manufacturing:'manufacture',specialists:'specialist',participants:'participant' };
// Matching-only vocabulary: the displayed script and translations stay unchanged.
Object.assign(equivalent,{
 help:'support',offer:'provide',give:'provide',gave:'provide',
 teach:'train',teaches:'train',taught:'train',educate:'train',staff:'worker',workforce:'worker',
 finish:'complete',finished:'complete',complet:'complete',passed:'complete',
 quick:'fast',quickly:'fast',quicker:'fast',faster:'fast',growth:'grow',
 special:'unique',advantage:'strength',begin:'start',began:'start',
 made:'create',creat:'create',build:'create',built:'create',
 subtitle:'caption',slide:'material',document:'material',
 advice:'consult',consultation:'consult',cut:'lower',reduce:'lower',reduc:'lower',
 listen:'attention',
});
const commonTopic = new Set('system semiconductor center research development company support provide program project industry city need'.split(' '));
function stem(word) {
  if(equivalent[word])return equivalent[word];
  if(word.length>5 && word.endsWith('ies'))return word.slice(0,-3)+'y';
  if(word.length>4 && word.endsWith('s') && !/(ss|us|is)$/.test(word))word=word.slice(0,-1);
  if(word.length>6 && word.endsWith('ing')){word=word.slice(0,-3);if(/([b-df-hj-np-tv-z])\1$/.test(word))word=word.slice(0,-1);}
  else if(word.length>5 && word.endsWith('ed'))word=word.slice(0,-2);
  return equivalent[word] || word;
}
function similarity(a,b) {
  if(a===b)return 1;
  // Never approximate numbers, or short words that easily collide.
  if(/\d/.test(a+b)||Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>2)return 0;
  let row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}
  const distance=row[b.length];return distance<=1?.88:distance===2&&Math.min(a.length,b.length)>=9?.78:0;
}
function content(tokens, base=0) {
  const result=[];
  for(let i=0;i<tokens.length;i++){
    const word=stem(tokens[i]);
    if(stop.has(tokens[i])||word.length<2||word===result.at(-1)?.word)continue;
    result.push({word,at:base+i});
  }
  return result;
}
function isFloorSupportCue(target) {
  return ['development','support','center','first','3'].every(word=>target.includes(word)) && target.some(word=>['floor','floors'].includes(word));
}
function floorSupportTrigger(raw,target,base,freshFrom) {
  if(!isFloorSupportCue(target))return null;
  if(raw.some(word=>(/^\d+$/.test(word) && !target.includes(word)) || ['not','never','no','cannot','cant','dont','doesnt','isnt','arent','wont','research'].includes(word)))return null;
  const aliases={centre:'center',developement:'development',floor:'floors',flow:'floors',flows:'floors'};
  const words=raw.map(word=>aliases[word]||word),hits=[];
  for(let start=0;start<words.length;start++){
    if(words[start]==='what' && ['make','makes'].includes(words[start+1])){
      const project=words.indexOf('project',start+2),special=words.indexOf('special',project+1);
      if(project>=start+2 && project<=start+6 && special>project && special<=project+3)hits.push({start:base+start,end:base+special+1,count:4});
    }
    if(words[start]==='development'){
      const support=words.indexOf('support',start+1),center=words.indexOf('center',support+1);
      if(support>start && support<=start+4 && center>support && center<=start+8)hits.push({start:base+start,end:base+center+1,count:3});
    }
    if(words[start]==='3'){
      const floor=words.indexOf('floors',start+1);
      if(floor>start && floor<=start+3)hits.push({start:base+start,end:base+floor+1,count:2});
    }
  }
  return hits.filter(hit=>hit.end>freshFrom).sort((a,b)=>a.start-b.start)[0] || null;
}
export class EnglishScriptAlignment {
  constructor(cues,tokens) {
    this.cues=cues;this.tokens=tokens;this.targets=tokens.map(t=>content(t));
    this.welcomeProfiles=tokens.map((target,i)=>({i,slide:cues[i].slide,target})).filter(p=>cues[p.i].spokenLanguage!=='ko'&&isWelcomeCue(p.target));
    this.projectProfiles=tokens.map((target,i)=>({i,slide:cues[i].slide,profile:projectProfile(target)})).filter(p=>p.profile>=0);
    this.frequency=new Map();
    for(const words of this.targets)for(const word of new Set(words.map(t=>t.word)))this.frequency.set(word,(this.frequency.get(word)||0)+1);
    this.slideFrequency=new Map();
    for(let i=0;i<cues.length;i++){
      if(!this.slideFrequency.has(cues[i].slide))this.slideFrequency.set(cues[i].slide,new Map());
      const counts=this.slideFrequency.get(cues[i].slide);
      for(const word of new Set(this.targets[i].map(t=>t.word)))counts.set(word,(counts.get(word)||0)+1);
    }
  }
  allowsFloorOpening(text,slide) {
    if(!this.cues.some((cue,i)=>cue.slide===slide && isFloorSupportCue(this.tokens[i])))return false;
    const opening=text.match(/^\s*(?:(?:well|so|now|um|uh)[,\s]+)*what\s+makes?\s+(?:(?:this|the|our)\s+)?project\s+(?:so\s+)?special\b/i);
    if(!opening)return false;
    // This prepared rhetorical opening identifies the floor-support cue on
    // its own slide. ASR punctuation must not delay it until the full sentence.
    if(/^[\s.,!?;:，。！？]*$/.test(text.slice(opening[0].length)))return true;
    if(!text.includes('?'))return true;
    // With more speech present, keep actual follow-up questions distinct from
    // an affirmative continuation about the center and its floors.
    const hasLocation=/\b(?:support\s+cent(?:er|re)|(?:three|3)\s+floors?)\b/i.test(text);
    const answer=text.slice(text.indexOf('?')+1);
    return hasLocation && (/\bis\s+that\b[^?]*\bwill\s+(?:be|house)\b/i.test(text) || /^\s*(?:the|this|it)\b[^?]*\bwill\s+(?:be|house)\b/i.test(answer));
  }
  contradictsFloorPrefix(index,words) {
    if(!isFloorSupportCue(this.tokens[index]))return false;
    return words.some(word=>['research','not','never','no','cannot','cant','dont','doesnt','isnt','arent','wont'].includes(word));
  }
  find(heard,{offset,slide,next,active,indices=null,crossing=false,freshFrom=0}) {
    const base=Math.max(offset,heard.length-45), raw=heard.slice(base);
    if(crossing){
      const topic=findInfrastructureKeywords(heard,{cues:this.cues,slide,offset,freshFrom,active,indices,crossing:true});
      if(topic)return topic;
    }
    if(!crossing){
      const welcome=findWelcomeKeywords(heard,{offset,freshFrom,active,profiles:this.welcomeProfiles.filter(p=>p.slide===slide&&(!indices||indices.includes(p.i)))});
      if(welcome)return welcome;
      const project=findProjectKeywords(heard,{offset,freshFrom,active,profiles:this.projectProfiles.filter(p=>p.slide===slide&&(!indices||indices.includes(p.i)))});
      if(project)return project;
      const topic=findInfrastructureKeywords(heard,{cues:this.cues,slide,offset,freshFrom,active,indices});
      if(topic)return topic;
      const shortcuts=[];
      // Distinct slide-specific phrases remain usable even when the speaker varies the wording.
      const fresh=heard.slice(Math.max(base,freshFrom));
      const closing=this.cues.findIndex(c=>c.slide===slide&&c.id==='v16-050');
      if(closing>=0 && closing!==active && raw.includes('thank') && raw.includes('you') && fresh.length && !raw.some(w=>['not','never','no'].includes(w)))return {i:closing,start:base,end:heard.length,count:2,score:1,keyword:'closing-thanks'};
      const alliance=this.cues.findIndex(c=>c.slide===slide&&c.id==='v16-alliance-001');
      if(alliance>=0 && alliance!==active && (raw.includes('seongnam') || (raw.includes('system') && raw.includes('semiconductor'))) && raw.includes('alliance') && fresh.includes('alliance'))return {i:alliance,start:base,end:heard.length,count:2,score:1,keyword:'alliance-name'};
      for(let i=0;i<this.cues.length;i++){
        if(this.cues[i].spokenLanguage==='ko')continue;
        if(this.cues[i].slide!==slide || i===active || (indices && !indices.includes(i)))continue;
        const floor=floorSupportTrigger(raw,this.tokens[i],base,freshFrom);
        if(floor)shortcuts.push({i,...floor,score:1,keyword:'floor-support'});
      }
      if(shortcuts.length===1)return shortcuts[0];
      if(shortcuts.length>1)return null;
    }
    const source=content(raw,base).slice(-24);
    if(source.length<2)return null;
    const ranked=[];
    const weight=word=>1+Math.log((this.cues.length+1)/(1+(this.frequency.get(word)||0)));
    for(let i=0;i<this.cues.length;i++){
      if(this.cues[i].spokenLanguage==='ko')continue;
      if(this.cues[i].slide!==slide || (indices && !indices.includes(i)))continue;
      // All three named project cues use the name matcher above. Generic
      // overlap must not reintroduce ordinal-only or shared-prefix triggers.
      if(!crossing && projectProfile(this.tokens[i])>=0)continue;
      if(!crossing && isWelcomeCue(this.tokens[i]))continue;
      const target=this.targets[i];let best=null;
      if(!target.length)continue;
      if(this.tokens[i].some(t=>['planned','proposed'].includes(t)) && raw.some(t=>['operating','opened','completed','open'].includes(t)) && !raw.some(t=>['planned','proposed','would'].includes(t)))continue;
      if(raw.includes('center')||raw.includes('centre')){
        if(raw.includes('research')&&this.tokens[i].includes('development')&&!this.tokens[i].includes('research'))continue;
        if(raw.includes('development')&&this.tokens[i].includes('research')&&!this.tokens[i].includes('development'))continue;
      }
      for(let start=0;start<=source.length-2;start++){
        const window=source.slice(start);if(window.length>22)continue;
        const rawWindow=raw;
        // A question, conflicting number or negation must not borrow an affirmative caption.
        if(rawWindow.some(t=>/^\d+$/.test(t)&&!this.tokens[i].includes(t)))continue;
        if(rawWindow.some(t=>['not','never','no','cannot','cant','dont','doesnt','isnt','arent','wont'].includes(t))&&!this.tokens[i].some(t=>['not','never','no','cannot','cant','dont','doesnt','isnt','arent','wont'].includes(t)))continue;
        const used=new Set();let matched=0, matchedWeight=0, heardWeight=0, freshMatched=0;
        for(const s of window){
          const w=weight(s.word);heardWeight+=w;let score=0,at=-1;
          for(let j=0;j<target.length;j++){if(used.has(j))continue;const sim=similarity(s.word,target[j].word);if(sim>score){score=sim;at=j;}}
          if(score){used.add(at);matched++;matchedWeight+=w*score;if(s.at>=freshFrom)freshMatched++;}
        }
        // An unmatched phrase carried from an earlier item cannot fire on
        // silence or on unrelated new speech.
        if(!freshMatched)continue;
        // Next-slide recovery needs more evidence than a current-slide caption. A few
        // shared semiconductor terms alone must not move the presentation.
        const distinct=[...used].some(j=>!commonTopic.has(target[j].word) && this.slideFrequency.get(slide).get(target[j].word)===1);
        // Two words suffice only when the whole unread phrase is a distinctive
        // pair. Do not drop a conflicting subject (e.g. another city) to get it.
        const shortPair=!crossing && matched===2 && start===0 && source.length===2 && distinct && matchedWeight/heardWeight>=.88;
        const minimum=Math.min(crossing?4:shortPair?2:3,target.length);
        if(matched<minimum || matched<window.length*(crossing?.65:.50))continue;
        // An institution name shared by several slides needs a distinguishing
        // word as well (for example, "floors" in the occupancy slide).
        if(crossing && target.some(t=>this.frequency.get(t.word)<=2) && ![...used].some(j=>this.frequency.get(target[j].word)<=2))continue;
        if(!crossing && !distinct && matched<4 && used.size<target.length)continue;
        const precision=matchedWeight/heardWeight;
        const coverage=used.size/target.length;
        if(crossing ? precision<.78 || coverage<.4 || !freshMatched : precision<.55 || (!shortPair && coverage<.12 && matched<4))continue;
        const score=.66*precision+.24*Math.min(1,coverage)+.1*Math.min(1,matched/6);
        if(score<(crossing?.76:.55))continue;
        const candidate={i,start:window[0].at,end:heard.length,count:matched,score};
        if(!best||candidate.score>best.score)best=candidate;
      }
      if(best)ranked.push(best);
    }
    ranked.sort((a,b)=>b.score-a.score);
    if(!ranked.length || (ranked[1]&&ranked[0].score-ranked[1].score<(crossing?.085:.04)))return null;
    return ranked[0];
  }
}

