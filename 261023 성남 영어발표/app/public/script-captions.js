import { TranscriptionConnection } from './realtime.js';
import { ScriptMatcher } from './script-matcher.js';
import { BilingualScriptMatcher } from './bilingual-script-matcher.js';

export class ScriptCaptions {
  constructor(stream, { script, speechLanguage = 'en', autoRecover = false, autoAdvance = false, slide = 1, onText, onState, onError, onClear = () => {}, onProgress = () => {}, onSlide = () => {}, onTranscript = () => {}, connectionFactory } = {}) {
    this.matcher = speechLanguage === 'auto' ? new BilingualScriptMatcher(script.cues,{slide,autoRecover,autoAdvance}) : new ScriptMatcher(script.cues, { language: speechLanguage, slide, autoRecover,autoAdvance });
    this.autoRecover = autoRecover; this.script = script; this.speechLanguage = speechLanguage;
    this.onText = onText; this.onClear = onClear; this.onProgress = onProgress; this.onSlide = onSlide;
    this.onTranscript = onTranscript;
    this.closed = false; this.retired = new Set(); this.sequence = 0; this.locked = false;
    const options = { slide, speechLanguage, scriptHint: this.hint(slide),
      onTranscript: e => this.accept(e), onError,
      onState: state => { for (const language of ['vi', 'ko']) onState(language, state); },
    };
    this.connection = connectionFactory ? connectionFactory(stream, options) : new TranscriptionConnection(stream, options);
  }
  start() { return this.connection.start(); }
  setAutoAdvance(enabled) { this.matcher.setAutoAdvance(enabled); }
  hint(slide) { return this.script.cues.filter(c=>c.slide===slide && !(this.speechLanguage==='en'&&c.spokenLanguage==='ko')).map(c=>c[this.speechLanguage==='auto'?(c.spokenLanguage||'en'):this.speechLanguage==='ko'?'ko':'en']).join(' ').slice(0,900); }
  retire(id) {
    if (id) this.retired.add(id);
    if (this.retired.size > 300) this.retired.delete(this.retired.values().next().value);
  }
  resetInput() {
    this.retire(this.item); this.item = null; this.text = ''; this.locked = false;
    this.connection.commit();
  }
  setSlide(slide) {
    if (slide === this.matcher.slide) return;
    this.matcher.setSlide(slide); this.resetInput(); this.connection.setSlide(slide,this.hint(slide));
    this.onProgress({ state: 'ready', slide, index: this.matcher.next });
  }
  seek(index) {
    if (!this.matcher.seek(index)) return;
    this.resetInput(); this.connection.setSlide(this.matcher.slide,this.hint(this.matcher.slide));
    this.onProgress({ state: 'ready', index, slide: this.matcher.slide });
  }
  accept(event) {
    if (this.closed || this.locked || !event.item_id || this.retired.has(event.item_id)) return;
    const receivedAt = performance.now();
    const final = event.type.endsWith('.completed');
    if (!final && !event.type.endsWith('.delta')) return;
    if (this.item !== event.item_id) { this.retire(this.item); this.item = event.item_id; this.text = ''; }
    this.text = (final ? event.transcript || '' : this.text + (event.delta || '')).slice(-6000);
    this.onTranscript(this.text,{slide:this.matcher.slide,item:this.item,final,receivedAt});
    if(this.closed || this.locked)return;
    if(this.text.trim() && (final || !this.lastFeedback || receivedAt-this.lastFeedback>250)) {
      this.lastFeedback=receivedAt;
      this.onProgress({state:'hearing',index:this.matcher.active>=0?this.matcher.active:this.matcher.next,slide:this.matcher.slide,source:this.text.slice(-300),receivedAt});
    }
    const previousSlide = this.matcher.slide;
    let result = this.matcher.feed(this.text, { item: this.item, final });
    // One ASR delta can contain more than one cue. Display the latest identified cue once.
    if (result.state === 'matched') {
      for (let n=0;n<this.script.cues.length;n++) {
        const next = this.matcher.feed(this.text,{item:this.item,final,allowAdvance:this.matcher.slide===previousSlide});
        if (next.state !== 'matched') { if (next.state === 'hold') result = next; break; }
        result = next;
      }
    }
    if (result.state === 'matched') {
      if (this.matcher.slide !== previousSlide) {
        // Preserve this ASR item: its next delta can contain the rest of the new slide.
        this.connection.setSlide(this.matcher.slide,this.hint(this.matcher.slide));
        this.onSlide(this.matcher.slide);
      }
      const cue = ++this.sequence;
      // Both prepared languages enter the same rendering frame. No translation request.
      for (const language of ['vi', 'ko']) this.onText(language, result.cue[language], true, { cue, revision: cue });
      this.onProgress({ state: 'matched', index: result.index, slide: result.cue.slide, final, receivedAt, matchMs: performance.now() - receivedAt, source: this.text.slice(-300) });
    } else if (result.state === 'hold') {
      this.locked = !this.autoRecover && Boolean(result.locked);
      this.onProgress({ state: this.autoRecover ? 'waiting' : 'hold', reason: this.autoRecover ? '원고와 다른 표현이 들렸습니다. 다음 발화에서 위치를 다시 찾습니다.' : result.reason, index: this.matcher.next, receivedAt });
    } else if (final) {
      // Retire final items so delayed deltas cannot duplicate or advance a cue.
      this.retire(this.item);
      if (result.clear || this.matcher.activeItem !== this.item) { this.onProgress({ state: 'waiting', index: this.matcher.next, source: this.text.slice(-300) }); }
    }
  }
  speechLevel(rms, now) {
    if (!this.connection.connected || this.closed) return;
    if (rms > .012) { this.lastVoice = now; this.voiceSince ||= now; }
    // Commits only bound ASR items; streaming deltas drive captions before this silence.
    if (this.voiceSince && (now - this.lastVoice > 400 || now - this.voiceSince > 10_000)) {
      this.connection.commit(); this.voiceSince = 0;
    }
  }
  close() { this.closed = true; this.connection.close(); this.onClear(); }
}
