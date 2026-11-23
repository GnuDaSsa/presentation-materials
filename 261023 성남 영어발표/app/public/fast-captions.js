import { TranscriptionConnection } from './realtime.js';
import { SubtitleSource, isKoreanSpeech } from './subtitle-source.js';
import { LatestCaptionLane } from './latest-caption.js';
import { normalizeTerms } from './glossary.js';
import { CaptionTurnover } from './caption-turnover.js';

export class FastCaptions {
  constructor(stream, { onText, onState, onError, slide = 1 }) {
    this.onText = onText; this.onState = onState; this.onError = onError;
    this.source = new SubtitleSource(); this.text = ''; this.closed = false;
    this.turnover = new CaptionTurnover(onText);
    this.lanes = Object.fromEntries(['vi', 'ko'].map(language => [language, new LatestCaptionLane(language, { onText: (...args) => this.turnover.push(...args), onState, onError })]));
    this.connection = new TranscriptionConnection(stream, {
      onTranscript: event => this.accept(event),
      onState: state => { for (const language of ['vi', 'ko']) onState(language, state); },
      onError, slide,
    });
  }
  async start() { await this.connection.start(); }
  setSlide(slide) { this.connection.setSlide(slide); }
  accept(event) {
    if (this.closed) return;
    const text = normalizeTerms(this.source.accept(event) || '');
    const cue = this.source.cue;
    if (!text || (text === this.text && cue === this.cue)) return;
    this.turnover.begin(cue, this.text);
    this.text = text; this.cue = cue;
    if (isKoreanSpeech(text)) {
      // Same-language speech is captioned directly instead of waiting for a translator.
      this.lanes.ko.bypass(text, cue);
    } else {
      this.lanes.ko.submit(text, cue);
    }
    this.lanes.vi.submit(text, cue);
  }
  speechLevel(rms, now) {
    if (!this.connection.connected || this.closed) return;
    if (rms > 0.012) { this.lastVoice = now; this.voiceSince ||= now; }
    if (this.voiceSince && (now - this.lastVoice > 550 || now - this.voiceSince > 12_000)) {
      this.connection.commit(); this.voiceSince = 0;
    }
  }
  close() {
    this.closed = true; this.connection.close(); this.turnover.close();
    for (const lane of Object.values(this.lanes)) lane.close();
  }
}
