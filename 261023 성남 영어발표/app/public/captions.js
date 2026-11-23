export const CAPTION_HOLD_MS = 4000;
export const CAPTION_FADE_MS = 220;

/** Caption text and its lifetime, independent of slide changes and microphone state. */
export class CaptionBuffer {
  constructor(limit = 1600) { this.limit = limit; this.seen = new Set(); this.clear(); }
  replace(text, { complete = false, revision = 0 } = {}, now = Date.now()) {
    if (!text?.trim() || revision <= this.expiredRevision || revision < this.revision) return false;
    this.revision = revision;
    // Retranslation of the SAME cue should catch up without flashing its prefix.
    // New cues clear this buffer first, even if they begin with the same words.
    if (text === this.text || (!complete && this.text.startsWith(text))) return false;
    this.text = text; this.lastAt = now; this.fading = false;
    return true;
  }
  get nextExpiry() { return this.text ? this.lastAt + CAPTION_HOLD_MS + (this.fading ? CAPTION_FADE_MS : 0) : Infinity; }
  expire(now = Date.now()) {
    if (!this.text || now < this.nextExpiry) return false;
    if (now >= this.lastAt + CAPTION_HOLD_MS + CAPTION_FADE_MS) {
      this.text = ''; this.fading = false; this.expiredRevision = this.revision;
    } else this.fading = true;
    return true;
  }
  /** Append demo fragments exactly; whitespace belongs to the sample. */
  append(delta, eventId, now = Date.now()) {
    if (typeof delta !== 'string' || !delta) return false;
    if (eventId && this.seen.has(eventId)) return false;
    if (eventId) { this.seen.add(eventId); if (this.seen.size > 1500) this.seen.delete(this.seen.values().next().value); }
    const pause = this.lastAt && now - this.lastAt > 6500;
    const nextSentence = /[.!?。！？][”"')\]]?\s*$/u.test(this.text) && delta.trim() && now - this.cueAt >= 1600;
    if (pause || nextSentence) this.text = '';
    if (!this.text) this.cueAt = now;
    this.text += delta;
    if (this.text.length > this.limit) {
      const cut = this.text.length - this.limit;
      const boundary = this.text.indexOf(' ', cut);
      this.text = this.text.slice(boundary >= 0 ? boundary + 1 : cut);
    }
    this.lastAt = now; this.fading = false;
    return true;
  }
  clear() { this.text = ''; this.lastAt = 0; this.cueAt = 0; this.seen.clear(); this.fading = false; this.revision = -1; this.expiredRevision = -1; }
}

/** Show the most recent two lines; never inject HTML from a transcript. */
export function renderCaption(element, text) {
  const content = text.replace(/\s+/g, ' ').trim();
  element.textContent = content;
  if (!content) return;
  const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
  const words = content.split(' ');
  let lo = 0, hi = Math.max(0, words.length - 1);
  if (element.scrollHeight <= lineHeight * 2 + 2) return;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    element.textContent = words.slice(mid).join(' ');
    if (element.scrollHeight > lineHeight * 2 + 2) lo = mid + 1;
    else hi = mid;
  }
  element.textContent = words.slice(lo).join(' ');
  // A single very long token must also fit (URLs and unspaced Korean).
  if (element.scrollHeight > lineHeight * 2 + 2) {
    const chars = Array.from(element.textContent);
    lo = 0; hi = chars.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      element.textContent = chars.slice(mid).join('');
      if (element.scrollHeight > lineHeight * 2 + 2) lo = mid + 1;
      else hi = mid;
    }
    element.textContent = chars.slice(lo).join('');
  }
}
