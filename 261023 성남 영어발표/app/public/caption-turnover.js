const wording = text => text.replace(/[.!?。！？\s]+$/u, '');

/** Give the outgoing phrase's last words a short reading window, without a queue. */
export class CaptionTurnover {
  constructor(onText, { readMs = 600, maxWaitMs = 1400 } = {}) {
    Object.assign(this, { onText, readMs, maxWaitMs });
    this.visible = null; this.target = null; this.pending = new Map(); this.finals = new Map();
  }
  begin(cue, previousText) {
    if (this.target === cue) return;
    if (this.visible === this.target) this.closingText = wording(previousText);
    this.target = cue;
    this.pending.clear();
  }
  push(language, text, complete, meta) {
    if (!text.trim()) return;
    if (this.visible === null) this.visible = meta.cue;
    if (meta.cue === this.visible) {
      if (complete) this.finals.set(language, { text: wording(meta.sourceText), at: performance.now() });
      this.onText(language, text, complete, meta);
      this.schedule();
    } else if (meta.cue === this.target) {
      this.pending.set(language, { language, text, complete, meta });
      this.deadline ??= performance.now() + this.maxWaitMs;
      this.schedule();
    }
  }
  schedule() {
    clearTimeout(this.timer);
    if (!this.pending.size) return;
    const final = ['vi', 'ko'].map(language => this.finals.get(language));
    const finished = final.every(result => result && result.text === this.closingText);
    const readyAt = finished ? Math.min(this.deadline, Math.max(...final.map(result => result.at)) + this.readMs) : this.deadline;
    const wait = readyAt - performance.now();
    if (wait > 0) { this.timer = setTimeout(() => this.schedule(), wait); return; }
    const next = [...this.pending.values()];
    this.visible = this.target; this.pending.clear(); this.finals.clear(); this.deadline = null;
    for (const result of next) this.push(result.language, result.text, result.complete, result.meta);
  }
  close() { clearTimeout(this.timer); this.pending.clear(); }
}
