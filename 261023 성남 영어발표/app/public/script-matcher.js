import { normalizeTerms } from './glossary.js';
import { EnglishScriptAlignment } from './script-alignment.js';
import { findEnglishHandoff } from './opening-sequence.js';
import {isProjectReferenceNumber,projectClauseEnd,projectProfile} from './program-keywords.js';
import {isWelcomeCue} from './welcome-keywords.js';

const small = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
const tens = ['twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
export function canonical(text, language = 'source') {
  text = normalizeTerms(text, language).normalize('NFKC').toLowerCase().replace(/\binsfrasturcture\b/g, 'infrastructure').replace(/[’']/g, '').replace(/(?<=\d),(?=\d)/g, '');
  text = text.replace(/\btwenty[ -]+(twenty|thirty|forty)(?:[ -]+(one|two|three|four|five|six|seven|eight|nine))?\b/g, (_, t, n) => String(2020 + ['twenty','thirty','forty'].indexOf(t) * 10 + (n ? small.indexOf(n) : 0)));
  text = text.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[ -]+(one|two|three|four|five|six|seven|eight|nine))?\b/g, (_, t, n) => String((tens.indexOf(t) + 2) * 10 + (n ? small.indexOf(n) : 0)));
  text = text.replace(/\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g, n => String(small.indexOf(n)));
  text = text.replace(/\b(\d+)\s+thousand(?:\s+(\d+)\s+hundred)?\b/g, (_, a, b) => String(+a * 1000 + +(b || 0) * 100));
  text = text.replace(/\b(\d+)\s+hundred\b/g, (_, a) => String(+a * 100));
  return text.replace(/\bper\s+cent\b/g, 'percent').replace(/%/g, ' percent ').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
export function units(text, language) {
  let normalized = canonical(text, language === 'en' ? 'en' : 'source');
  if (language === 'en') {
    // "The first one is ..." refers to an item in a list, not a quantity.
    // Keep actual quantities such as "first one of 40" and "first one floor".
    normalized = normalized.replace(/\b(first|second|third|1st|2nd|3rd|thrid)\s+1(?=\s+(?:is|are|was|were|will|would|the|a|an)\b|$)/g, '$1');
  }
  if (language === 'ko') {
    // Equivalent greetings and a common Hangul transcription of "AI" are
    // matching forms only; the prepared captions and raw transcript stay intact.
    normalized = normalized.replace(/안\s*녕\s*하\s*(?:십\s*니\s*까|셔\s*요)/g, '안녕하세요')
      .replace(/에이\s*아이(?=\s*반도체)/g, 'ai');
  }
  return language === 'ko' ? (normalized.match(/\d+|[^\d\s]/gu) || []) : normalized.split(' ').filter(Boolean);
}
const numbers = text => canonical(text).match(/\d+/g) || [];
const negation = text => /\b(?:not|never|no|cannot|cant|dont|doesnt|isnt|arent|wont)\b|아니|않|없|불가/.test(canonical(text));
const koreanVisitTrigger = [...'성남'];
const koreanFullVisitTrigger = [...'성남시에방문'];
const koreanHandoffIntro = [...'국제적인자리'];
const generic = new Set(['the','a','an','of','to','in','is','are','and','our','we','it','this','these','for','with','would','could','as','at','by','on','that']);
const advanceFillers = new Set([...generic,'your','their','uh','um','er','ah']);
// Presenter-approved script openings that uniquely identify the cue on their
// own slide. Named projects and page turns still use their existing guards.
const fastCueOpenings = new Map([
  ['v16-012',2], // Our vision
  ['v16-015',2], // We aim
  ['v16-016',2], // Our goal
  ['v16-038',4], // This is how we
  ['v16-040',2], // We plan
  ['v16-045',3], // We aim to
]);
function englishQuestion(text) {
  if (/\?/.test(text)) return true;
  // "What makes ... is ..." introduces a prepared statement, not a question.
  if (/^\s*what makes\b[^?]*\bis\b/i.test(text)) return false;
  return /^\s*(?:why|what|how|where|who|can you|could you|do you)\b/i.test(text);
}
function advanceWord(word) {
  if (word === 'centre') return 'center';
  if (['companies','company','firms','firm'].includes(word)) return 'company';
  return word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0,-1) : word;
}
function advancePrefix(target, heard, start) {
  const words = target.filter(w=>!advanceFillers.has(w)).map(advanceWord);
  const required = Math.min(words.length,6);
  if (required < 3) return 0;
  let count=0, matched=0;
  while (start+count<heard.length && matched<required) {
    const raw=heard[start+count++], word=advanceWord(raw);
    if (advanceFillers.has(raw)) continue;
    if (word===words[matched]) matched++;
    else if (matched && word===words[matched-1]) continue;
    else return 0;
  }
  return matched===required ? count : 0;
}
function prefixLength(target, language, openingGreeting = false) {
  if (language === 'ko') {
    // Only the first prepared Korean greeting may start before its job title.
    if(openingGreeting && target.slice(0,5).join('')==='안녕하세요')return 5;
    return Math.min(target.length,7);
  }
  // A distinctive opening can identify any cue on the current slide.
  // Function-word openings wait for enough content.
  for (let n=1;n<=Math.min(target.length,7);n++) {
    const content=target.slice(0,n).filter(t=>!generic.has(t));
    if (content.join('').length >= 8 && (n >= 2 || content[0]?.length >= 10)) return n;
  }
  return target.length;
}

// Match a heard prefix, never use elapsed time to advance the prepared script.
// Recovery considers every cue on this slide equally, except for a supported
// opening of the immediately following slide after the current closing cue.
export class ScriptMatcher {
  constructor(cues, { language = 'en', slide = 1, autoRecover = false, autoAdvance = false } = {}) {
    this.cues = cues; this.language = language;
    this.autoRecover = autoRecover; this.autoAdvance = autoAdvance;
    this.tokens = cues.map(c => units(c[language], language));
    this.visitOffsets = this.tokens.map((target,i)=>language==='ko' && cues[i].slide===1 && cues[i].spokenLanguage==='ko' && target.join('').includes('감사')
      ? target.findIndex((_,at)=>koreanVisitTrigger.every((word,n)=>target[at+n]===word)) : -1);
    this.handoffOffsets = this.tokens.map((target,i)=>language==='ko' && cues[i].slide===1 && cues[i].spokenLanguage==='ko'
      ? (findEnglishHandoff(target.join(''))?.start ?? -1) : -1);
    this.alignment = language === 'en' && autoRecover ? new EnglishScriptAlignment(cues,this.tokens) : null;
    this.setSlide(slide);
  }
  setSlide(slide) {
    this.advanceReady = false;
    this.slide = slide; this.next = this.cues.findIndex(c => c.slide === slide);
    if (this.next < 0) this.next = this.cues.length;
    this.active = -1; this.offset = 0; this.item = null; this.activeStart = 0; this.activeItem = null; this.activeKeyword = null; this.activeTokenOffset = 0;
    this.heard = []; this.carry = [];
  }
  seek(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.cues.length) return false;
    this.setSlide(this.cues[index].slide); this.next = index; return true;
  }
  setAutoAdvance(enabled) { this.autoAdvance = Boolean(enabled); }
  feed(text, { item = 'replay', final = false, allowAdvance = true } = {}) {
    if (item !== this.item) {
      this.carry = this.heard.slice(this.offset).slice(-90);
      this.item = item; this.offset = 0;
    }
    const heard = [...this.carry, ...units(text, this.language)]; this.heard = heard;
    // ASR may commit between "What makes this project" and "special?".
    // Include the unread carried words when recognizing that prepared opening.
    const floorOpeningText=this.carry.length?this.carry.join(' ')+' '+text:text;
    const question = this.language==='en' && englishQuestion(text) && !this.alignment?.allowsFloorOpening(floorOpeningText,this.slide);
    // A corrected final may be shorter than the interim transcript.
    this.offset = Math.min(this.offset, heard.length);
    if (final && this.active >= 0 && this.activeItem === item) {
      const active = this.cues[this.active][this.language];
      const projectKeyword=this.activeKeyword?.startsWith('program-');
      const segment = heard.slice(this.activeStart, projectKeyword?projectClauseEnd(heard,this.activeStart):this.activeStart + this.tokens[this.active].length - this.activeTokenOffset);
      const spoken = segment.join(this.language === 'ko' ? '' : ' ');
      // In this shortcut, "the third one" is an ordinal reference, not a
      // quantity of one. Other numerical corrections still block the caption.
      const expectedNumbers = numbers(active), actualNumbers = segment.filter((t,i)=>/^\d+$/.test(t) && !(projectKeyword&&isProjectReferenceNumber(segment,i)) && !(this.activeKeyword==='equipment-sharing' && t==='1' && ['third','thrid','3rd'].includes(segment[i-1])));
      if (actualNumbers.some(n => !expectedNumbers.includes(n)) || (negation(spoken) && !negation(active))) {
        this.active = -1; this.advanceReady = false;
        return { state: 'hold', reason: '원고와 다른 수치·부정 표현이 들렸습니다. 위치를 다시 지정해 주세요.', locked: true };
      }
    }
    // Consume the continuing exact text of the caption already on screen. A phrase
    // inside that sentence (e.g. "before fabrication") must not start the next cue.
    if(this.active >= 0 && this.activeItem === item) {
      const target=this.tokens[this.active].slice(this.activeTokenOffset);let count=0;
      while(count<target.length && heard[this.activeStart+count]===target[count])count++;
      if(count)this.offset=Math.max(this.offset,this.activeStart+count);
    }
    // Explicit section title: allow a slightly skipped training close, but never
    // move on "third" alone or when voice navigation is disabled.
    if(this.language==='en' && this.autoRecover && !question && (this.slide===8 || this.slide===9)) {
      const from=Math.max(this.offset,heard.length-30), raw=heard.slice(from);
      const ordinal=new Set(['third','thrid','thirdly','3rd']);
      const negatives=new Set(['not','never','no','cannot','cant','dont','doesnt','isnt','arent','wont']);
      const position=raw.findIndex((w,i)=>['industrial','industry'].includes(w) && ['space','spaces'].includes(raw[i+1]));
      if(position>=0){
        const begin=Math.max(0,position-8), prefix=raw.slice(begin,position), segment=raw.slice(begin,position+2);
        const hasOrdinal=prefix.some(w=>ordinal.has(w));
        const fresh=from+position+2>this.carry.length;
        const cueIndex=this.cues.findIndex(c=>c.id==='v16-039' && c.slide===9);
        if(cueIndex>=0 && cueIndex!==this.active && fresh && !segment.some(w=>negatives.has(w)) && (this.slide===9 || hasOrdinal)) {
          if(this.slide===8 && (!allowAdvance || !this.autoAdvance))return {state:final?'waiting':'listening',index:this.active};
          const start=from+begin, end=from+position+2;
          this.active=cueIndex;this.activeStart=start;this.activeItem=item;this.activeKeyword='industrial-space';this.activeTokenOffset=0;
          this.slide=9;this.next=cueIndex+1;this.offset=end;this.advanceReady=false;
          return {state:'matched',index:cueIndex,cue:this.cues[cueIndex],matchedUnits:end-start,recovered:true};
        }
      }
    }
    // Keep a still-growing next-slide opening intact. A short phrase inside it
    // must not pull the matcher back to an earlier caption on the current slide.
    let pendingOpening = null;
    if (this.autoRecover && this.advanceReady && this.cues[this.next]?.slide===this.slide+1) {
      const target=this.tokens[this.next], required=prefixLength(target,this.language);
      for(let start=Math.max(this.offset,heard.length-90);start<=heard.length-required;start++) {
        let count=0;while(count<target.length && heard[start+count]===target[count])count++;
        if(count>=required && start+count===heard.length){pendingOpening={start,end:start+count};break;}
      }
    }
    const candidates = [];
    const candidateIndices = this.autoRecover
      ? this.cues.flatMap((cue,i)=>cue.slide===this.slide || i===this.next ? [i] : [])
      : [this.next,this.next+1].filter(i=>i<this.cues.length);
    // English text on a Korean-spoken cue is a translation, not an alternate
    // English trigger. Otherwise "visit Seongnam" rewinds the Korean welcome.
    const indices=candidateIndices.filter(i=>this.language!=='en'||this.cues[i].spokenLanguage!=='ko');
    for (const i of indices) {
      const crossing = this.cues[i].slide !== this.slide;
      // Slide changes need the current closing cue and a long opening of the
      // immediately following slide. Approximate openings are checked below.
      if (crossing && !(allowAdvance && this.autoAdvance && this.advanceReady && i === this.next && this.cues[i].slide === this.slide + 1)) continue;
      if ((crossing || this.autoRecover) && (this.language==='en'?question:crossing && /\?/.test(text))) continue;
      const target = this.tokens[i];
      // Known project introductions must wait for their name. Otherwise an
      // exact partial opening such as "The first is the System" bypasses the
      // name matcher and collides with the strategy slide's "First".
      if(this.autoRecover && !crossing && this.language==='en' && projectProfile(target)>=0)continue;
      if(this.autoRecover && !crossing && this.language==='en' && isWelcomeCue(target))continue;
      const handoffOffset=this.handoffOffsets[i];
      if(this.autoRecover && !crossing && handoffOffset>=0){
        if(/[?？]/.test(text) && !findEnglishHandoff(text))continue;
        for(let start=Math.max(this.offset,heard.length-90);start<heard.length;start++){
          const remainder=heard.slice(start).join('');
          const intro=koreanHandoffIntro.every((word,n)=>heard[start+n]===word);
          const handoff=findEnglishHandoff(remainder);
          const count=intro?koreanHandoffIntro.length:handoff?.start===0?handoff.end:0;
          if(!count || start+count<=this.carry.length)continue;
          const segment=heard.slice(start,start+target.length).join('');
          if(negation(segment) || /(?:할까요|하나요|합니까|하겠습니까|해볼까요)/.test(segment))continue;
          if(this.active===i && this.activeItem===item){this.offset=Math.max(this.offset,start+count);continue;}
          candidates.push({i,start,count,targetOffset:intro?0:handoffOffset,keyword:'korean-handoff'});break;
        }
        continue;
      }
      // In the Korean opening, the city name alone identifies the thanks cue.
      // Keep its position so optional particles and the remaining speech can vary.
      const visitOffset=this.visitOffsets[i];
      if(this.autoRecover && !crossing && visitOffset>=0){
        const suffix=target.slice(visitOffset);
        for(let start=Math.max(this.offset,heard.length-90);start<=heard.length-koreanVisitTrigger.length;start++){
          let count=0;while(count<suffix.length && heard[start+count]===suffix[count])count++;
          if(count<koreanVisitTrigger.length || start+count<=this.carry.length)continue;
          const afterCity=heard.slice(start+2,start+18).join('');
          if(/^(?:시)?(?:청|민|의회|장|이야기|정책|산업진흥원)/.test(afterCity))continue;
          // Don't rewind later English welcome/intro sentences on the shared
          // city name; the previous full visit phrase still works out of order.
          if(this.next>i+1 && !koreanFullVisitTrigger.every((word,n)=>heard[start+n]===word))continue;
          // A streaming "성남" may still grow into "성남시청". A word boundary,
          // particle, or finalized utterance confirms the short city reference.
          const unfinishedCity=start+2===heard.length || (heard[start+2]==='시' && start+3===heard.length);
          if(unfinishedCity && !final && !/[\s.,!?，。！？]$/.test(text))continue;
          const segment=heard.slice(start,start+suffix.length);
          if(segment.some(word=>/^\d+$/.test(word) && !numbers(this.cues[i].ko).includes(word)))continue;
          if(negation(segment.join('')) && !negation(this.cues[i].ko))continue;
          candidates.push({i,start,count,targetOffset:visitOffset,keyword:'korean-visit'});break;
        }
        continue;
      }
      // Check negation within the candidate below, not earlier sentences in an
      // uninterrupted ASR item (which can legitimately contain a contrast).
      if (crossing && target.includes('planned') && /\b(?:operating|opened|completed)\b/.test(canonical(text))) continue;
      const openingGreeting = i===0 && this.next===0 && this.active<0 && this.cues[i].spokenLanguage==='ko';
      // In the latter half, three exact opening words may identify a cue early.
      // Require two substantive words, and wait whenever another cue on the
      // current or adjacent slide shares the same opening.
      const earlyPrefix=this.language==='en' && this.autoRecover && this.cues[i].slide>=2 && target.length>=3 &&
        target.slice(0,3).filter(t=>!generic.has(t)).length>=2 &&
        !target.slice(0,3).some(t=>['first','second','third','1st','2nd','3rd'].includes(t)) &&
        !this.cues.some((cue,j)=>j!==i && Math.abs(cue.slide-this.cues[i].slide)<=1 && cue.spokenLanguage!=='ko' && this.tokens[j].slice(0,3).join(' ')===target.slice(0,3).join(' '));
      const fastLength=this.language==='en' && this.autoRecover && !crossing ? fastCueOpenings.get(this.cues[i].id) : undefined;
      // Do not use a formerly unique shortcut if a changed/custom script adds
      // a nearby cue with the same opening.
      const fastUnique=fastLength && !this.cues.some((cue,j)=>j!==i && Math.abs(cue.slide-this.cues[i].slide)<=1 && cue.spokenLanguage!=='ko' && this.tokens[j].slice(0,fastLength).join(' ')===target.slice(0,fastLength).join(' '));
      const required = fastUnique ? Math.min(fastLength,prefixLength(target,this.language,openingGreeting)) : earlyPrefix ? 3 : crossing ? Math.min(target.length,this.language === 'ko' ? 24 : 3) : prefixLength(target,this.language,openingGreeting);
      const maxStart = heard.length - required;
      for (let start = Math.max(this.offset, heard.length - 90); start <= maxStart; start++) {
        let count = 0;
        if (crossing && this.language === 'en' && !earlyPrefix) count = advancePrefix(target,heard,start);
        else while (count < target.length && heard[start + count] === target[count]) count++;
        // Carry may complete a split phrase, but every match needs a fresh unit.
        // Silence must not replay an unanswered question from an earlier item.
        if (start + count <= this.carry.length) continue;
        // Whole tokens for English, spacing-independent character prefixes for Korean.
        const meaningful = this.language === 'ko' ? count : target.slice(0, count).filter(t => !generic.has(t)).length;
        if (count < required || meaningful < (this.language === 'ko' ? required : 1)) continue;
        if (!this.autoRecover && i > this.next && count < Math.min(target.length, this.language === 'ko' ? 16 : 7)) continue;
        // Once an actual next word contradicts this prefix, use the similarity
        // matcher instead of accepting a generic opening such as a center name.
        if (this.autoRecover && !crossing && !openingGreeting && count<target.length && start+count<heard.length) continue;
        if (!crossing && pendingOpening && start>=pendingOpening.start && start+count<=pendingOpening.end) continue;
        // An already-heard contradictory value cannot trigger a prepared cue.
        const segmentUnits = heard.slice(start, start + target.length);
        const segment = segmentUnits.join(this.language === 'ko' ? '' : ' ');
        // A shortened floor opening can occur after a contradictory subject or
        // negation. Do not select "the first three floors" from that sentence.
        if(this.language==='en' && this.alignment?.contradictsFloorPrefix(i,heard.slice(Math.max(this.offset,start-10),start+target.length)))continue;
        if (segmentUnits.filter(t=>/^\d+$/.test(t)).some(n => !numbers(this.cues[i][this.language]).includes(n))) continue;
        if (negation(segment) && !negation(this.cues[i][this.language])) continue;
        candidates.push({ i, start, count, openingGreeting: openingGreeting && this.language==='ko' });
        break;
      }
    }
    // Follow the order of spoken phrases, not the cue numbers. At the start of
    // the Korean welcome, the greeting still identifies the presenter intro.
    candidates.sort((a,b) => Number(b.openingGreeting)-Number(a.openingGreeting) || a.start-b.start || b.count-a.count);
    if (candidates.length) {
      const best = candidates[0];
      // A shared opening must wait for its distinguishing word, even when the
      // other candidate is several cues away from the expected position.
      if (!best.keyword && !best.openingGreeting && indices.some(other=>other!==best.i && this.tokens[other].length>=best.count && this.tokens[other].slice(0,best.count).every((token,i)=>token===this.tokens[best.i][i]))) return {state:'listening',index:this.active};
      this.active = best.i; this.activeStart = best.start; this.activeItem = item;
      this.activeKeyword = best.keyword || null; this.activeTokenOffset = best.targetOffset || 0;
      this.slide = this.cues[best.i].slide;
      this.next = best.i + 1; this.offset = best.start + best.count;
      this.advanceReady = this.cues[this.next]?.slide === this.slide + 1;
      return { state: 'matched', index: best.i, cue: this.cues[best.i], matchedUnits: best.count };
    }
    // Allow natural rephrasing at a slide boundary, not only a literal prefix.
    // A short section label may be omitted when its first substantive cue is clear.
    if(this.alignment && this.advanceReady && this.cues[this.next]?.slide===this.slide+1 && !question) {
      const indices=[this.next];
      if(this.alignment.targets[this.next].length<4 && this.cues[this.next+1]?.slide===this.slide+1)indices.push(this.next+1);
      const best=this.alignment.find(heard,{offset:this.offset,slide:this.slide+1,next:this.next,active:-1,indices,crossing:true,freshFrom:this.carry.length});
      if(best) {
        if(!allowAdvance || !this.autoAdvance)return {state:final?'waiting':'listening',index:this.active};
        this.active=best.i;this.activeStart=best.start;this.activeItem=item;
        this.activeKeyword=null;this.activeTokenOffset=0;
        this.slide=this.cues[best.i].slide;this.next=best.i+1;this.offset=best.end;
        this.advanceReady=this.cues[this.next]?.slide===this.slide+1;
        return {state:'matched',index:best.i,cue:this.cues[best.i],matchedUnits:best.count,recovered:true,approximate:true};
      }
    }
    // A complete paraphrase may end with a partial literal prefix ("support
    // facilities on the first three floors"). Try next-slide alignment first;
    // keep an actually incomplete opening queued before any current-slide recovery.
    if (pendingOpening) return {state:final?'waiting':'listening',index:this.active};
    // With voice navigation off, the following slide's opening must stay queued.
    // Its shared technical terms must not recover an earlier cue on this slide.
    if (this.advanceReady && this.language === 'en' && this.cues[this.next]?.slide === this.slide + 1) {
      const opening = this.tokens[this.next];
      for (let start = Math.max(this.offset, heard.length - 90); start < heard.length; start++) {
        if (advancePrefix(opening, heard, start)) return { state: final ? 'waiting' : 'listening', index: this.active };
      }
    }
    if(this.alignment && !question) {
      const best=this.alignment.find(heard,{offset:this.offset,slide:this.slide,next:this.next,active:this.active,freshFrom:this.carry.length});
      // Do not repeatedly publish the unread tail of the same already displayed cue.
      const freshItem = best && this.activeItem!==item && best.start>=this.carry.length;
      // Unread speech can return to an earlier cue in the same ASR item.
      if(best && (best.i!==this.active || freshItem)) {
        this.active=best.i;this.activeStart=best.start;this.activeItem=item;
        this.activeKeyword=best.keyword || null;this.activeTokenOffset=0;
        this.next=best.i+1;this.offset=best.end;
        this.advanceReady = this.cues[this.next]?.slide === this.slide + 1;
        return {state:'matched',index:best.i,cue:this.cues[best.i],matchedUnits:best.count,recovered:true,approximate:true};
      }
    }
    const tail = this.activeItem === item ? heard.slice(this.activeStart + (this.tokens[this.active]?.length || 0) - this.activeTokenOffset) : heard;
    return { state: final ? 'waiting' : 'listening', index: this.active, clear: final && tail.length >= (this.language === 'ko' ? 15 : 6) };
  }
}


