import { ScriptMatcher } from './script-matcher.js';
import { normalizeTerms } from './glossary.js';

// Both prepared languages share one position. A Korean technical phrase may contain English.
export class BilingualScriptMatcher {
  constructor(cues, options = {}) {
    this.matchers = Object.fromEntries(['en','ko'].map(language => [language,new ScriptMatcher(cues,{...options,language})]));
    this.language = 'en';
  }
  get current() { return this.matchers[this.language]; }
  get next() { return this.current.next; }
  get slide() { return this.current.slide; }
  get activeItem() { return this.current.activeItem; }
  get active() { return this.current.active; }
  setAutoAdvance(enabled) { for (const m of Object.values(this.matchers)) m.setAutoAdvance(enabled); }
  setSlide(slide) { for (const m of Object.values(this.matchers)) m.setSlide(slide); }
  seek(index) { return Object.values(this.matchers).map(m=>m.seek(index)).every(Boolean); }
  feed(text, options) {
    // A single ASR item may start in Korean and continue in English.
    // Inspect the current tail, not the presence of any earlier Korean character.
    // A standalone city name is not a language switch. Keeping it with the
    // English matcher also preserves it across an ASR pause before "has a ...".
    const languageText=normalizeTerms(text,'en');
    const lastKorean=Math.max(...[...languageText.matchAll(/[가-힣]/g)].map(m=>m.index),-1);
    const englishTail=(languageText.slice(lastKorean+1).match(/[A-Za-z]+/g)||[]).length;
    // A standalone Korean city name used to become English after terminology
    // normalization. Keep it Korean while the prepared Korean opening is due.
    const koreanOpeningName=this.slide===1 && this.current.cues[this.next]?.spokenLanguage==='ko'
      && /[가-힣][\s.,!?，。！？]*$/.test(text) && (text.match(/[A-Za-z]+/g)||[]).length<3;
    this.language = koreanOpeningName || (lastKorean>=0 && englishTail<3) ? 'ko' : 'en';
    const result = this.current.feed(text,options);
    if (result.state === 'matched') {
      const other = this.matchers[this.language === 'en' ? 'ko' : 'en'];
      other.setSlide(result.cue.slide); other.next = result.index+1;
      other.advanceReady = this.current.advanceReady;
    }
    return result;
  }
}
