export class SubtitleSource {
  constructor() { this.retired = new Set(); this.cue = 0; this.key = ''; }
  accept(event) {
    const id = event.item_id;
    if (!id || this.retired.has(id)) return null;
    const incoming = event.type.endsWith('.completed') ? event.transcript : event.delta;
    if (typeof incoming !== 'string' || !incoming) return null;
    if (id !== this.id && !incoming.trim()) return null;
    if (id !== this.id) {
      if (this.id) this.retired.add(this.id);
      if (this.retired.size > 200) this.retired.delete(this.retired.values().next().value);
      this.id = id; this.text = ''; this.offset = 0;
    }
    // A committed speech segment starts a new cue. Late finals from the previous
    // segment must not bring already-read sentences back onto the screen.
    if (event.type.endsWith('.completed')) {
      this.offset = Math.max(0, incoming.length - 2000);
      this.text = incoming.slice(-2000);
    } else {
      this.text += incoming;
      this.offset += Math.max(0, this.text.length - 2000);
      this.text = this.text.slice(-2000);
    }
    let start = 0;
    for (const boundary of this.text.matchAll(/[.!?。！？]+[”"’')\]]*\s+/gu)) {
      const end = boundary.index + boundary[0].length;
      // Keep decimals, titles and initials together; punctuation alone never
      // clears a readable caption before the next sentence has actual words.
      const before = this.text.slice(0, end).trim();
      if (/(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|e\.g|i\.e)|\b(?:[A-Za-z]\.)*[A-Za-z])\.$/iu.test(before)) continue;
      if (/[\p{L}\p{N}]/u.test(this.text.slice(end))) start = end;
    }
    const key = `${id}:${this.offset + start}`;
    if (key !== this.key) { this.key = key; this.cue++; }
    let current = this.text.slice(start).replace(/\s+/g, ' ').trim();
    if (current.length > 180) { current = current.slice(-180); const space = current.indexOf(' '); if (space >= 0 && space < 40) current = current.slice(space + 1); }
    return current;
  }
}

export function isKoreanSpeech(text) {
  const hangul = text.match(/[가-힣]/g) || [];
  return hangul.length >= 2 && !/[a-zA-Z]/.test(text);
}
