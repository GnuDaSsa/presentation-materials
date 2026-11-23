import { readSSE } from './stream.js';
import { normalizeTerms } from './glossary.js';

export async function requestCaption(language, text, signal, emit) {
  const response = await fetch('/api/caption-translation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language }), signal: AbortSignal.any([signal, AbortSignal.timeout(9000)]) });
  if (!response.ok) { const data = await response.json(); throw new Error(data.error || `${language} 번역 연결 오류`); }
  let translated = '';
  for await (const event of readSSE(response.body)) {
    if (signal.aborted) return;
    if (event.error) throw new Error(event.error);
    if (event.delta) { translated += event.delta; emit(normalizeTerms(translated, language), false); }
  }
  if (translated) emit(normalizeTerms(translated, language), true);
}

export class LatestCaptionLane {
  constructor(language, { onText, onState, onError, request = requestCaption, interval = 400 }) {
    Object.assign(this, { language, onText, onState, onError, request, interval });
    this.active = new Map(); this.version = 0; this.displayed = new Map();
    this.latest = ''; this.sent = ''; this.started = -Infinity; this.closed = false; this.cue = 0;
  }
  setCue(cue) {
    if (cue === this.cue) return;
    // Finish the latest wording of the outgoing phrase while the next phrase
    // starts. Cancelling it at the source boundary can drop its final nouns.
    const finishPending = this.latest && this.latest !== this.sent;
    for (const [version, controller] of this.active) {
      if (finishPending || version !== this.version) { controller.abort(); this.active.delete(version); }
    }
    if (finishPending) void this.run();
    this.cue = cue; this.latest = this.sent = ''; this.started = -Infinity;
    for (const key of this.displayed.keys()) if (key < cue - 1) this.displayed.delete(key);
    clearTimeout(this.timer); this.timer = null;
  }
  submit(text, cue = 0) { if (this.closed) return; this.setCue(cue); this.latest = text; this.schedule(); }
  bypass(text, cue = 0) {
    if (this.closed) return;
    this.setCue(cue);
    this.latest = this.sent = text; this.displayed.set(cue, ++this.version);
    clearTimeout(this.timer); this.timer = null;
    for (const controller of this.active.values()) controller.abort();
    this.onText(this.language, text, true, { cue, revision: this.version, sourceText: text }); this.onState(this.language, 'live');
  }
  schedule() {
    if (this.closed || this.timer || !this.latest || this.latest === this.sent || this.active.size >= 2) return;
    const delay = Math.max(0, this.interval - (performance.now() - this.started));
    if (delay === 0) { void this.run(); return; }
    this.timer = setTimeout(() => { this.timer = null; void this.run(); }, delay);
  }
  async run() {
    if (this.closed || this.latest === this.sent || this.active.size >= 2) return;
    const version = ++this.version, text = this.sent = this.latest, cue = this.cue;
    const abort = new AbortController(); abort.cue = cue; this.active.set(version, abort); this.started = performance.now();
    try {
      await this.request(this.language, text, abort.signal, (translated, complete) => {
        if (this.closed || abort.signal.aborted || version < (this.displayed.get(cue) || 0)) return;
        this.displayed.set(cue, version);
        // Supersede partial revisions, while allowing the outgoing phrase to finish.
        for (const [older, controller] of this.active) if (older < version && controller.cue === cue) controller.abort();
        this.onText(this.language, translated, complete, { cue, revision: version, sourceText: text }); this.onState(this.language, 'live');
      });
    } catch (error) {
      if (!this.closed && !abort.signal.aborted && version === this.version) this.onError(error);
    } finally {
      this.active.delete(version);
      this.schedule();
    }
  }
  close() { this.closed = true; clearTimeout(this.timer); for (const controller of this.active.values()) controller.abort(); }
}
