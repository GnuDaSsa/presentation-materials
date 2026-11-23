import { recognitionContext, normalizeTerms, validSlide } from './glossary.js';

let sdkPromise;
export function loadSpeechSdk() {
  if (window.SpeechSDK) return Promise.resolve(window.SpeechSDK);
  return sdkPromise ||= new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = '/vendor/speech-sdk.js';
    script.onload = () => { if (window.SpeechSDK) resolve(window.SpeechSDK); else { sdkPromise = null; script.remove(); reject(new Error('Azure SDK를 불러오지 못했습니다.')); } };
    script.onerror = () => { sdkPromise = null; script.remove(); reject(new Error('Azure SDK 파일이 없습니다. npm run vendor:speech를 실행해 주세요.')); };
    document.head.append(script);
  });
}

export async function fetchAzureToken(signal) {
  const response = await fetch('/api/azure-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Azure 연결 준비에 실패했습니다.');
  if (!data.token || !data.region || !Number.isFinite(data.expiresAt)) throw new Error('Azure 연결 정보가 올바르지 않습니다.');
  return data;
}

/** Hypotheses are cumulative. Final alignment may revise the starting offset. */
export class AzureCaptionResults {
  constructor(onText) { this.onText = onText; this.start = -1; this.end = -1; this.retiredEnd = -1; this.cue = 0; this.revision = 0; this.final = false; }
  accept(result, complete) {
    const offset = result.offset, end = offset + result.duration;
    if (!Number.isFinite(end) || offset < 0 || result.duration < 0 || end <= this.retiredEnd) return;
    const translations = ['vi', 'ko'].map(language => [language, result.translations?.get(language)]).filter(([, text]) => typeof text === 'string' && text.trim());
    if (!translations.length) return;
    if (!this.cue || this.final || (offset >= this.end && offset > this.start)) {
      this.retiredEnd = Math.max(this.retiredEnd, this.end);
      this.start = offset; this.end = end; this.cue++; this.final = false;
    } else { this.start = Math.min(this.start, offset); this.end = Math.max(this.end, end); }
    this.final = complete; this.revision++;
    if (complete) this.retiredEnd = Math.max(this.retiredEnd, end);
    for (const [language, text] of translations) this.onText(language, normalizeTerms(text, language), complete, { cue: this.cue, revision: this.revision });
  }
}

export class AzureCaptions {
  constructor(stream, { onText, onState, onError, slide = 1, loadSdk = loadSpeechSdk, getToken = fetchAzureToken }) {
    Object.assign(this, { stream, onState, onError, loadSdk, getToken });
    this.slide = validSlide(slide); this.results = new AzureCaptionResults(onText);
    this.abort = new AbortController(); this.closed = false; this.connected = false;
  }
  state(state) { for (const language of ['vi', 'ko']) this.onState(language, state); }
  async start() {
    this.state('connecting');
    try {
      const [sdk, token] = await Promise.all([this.loadSdk(), this.getToken(this.abort.signal)]);
      if (this.closed) return;
      this.sdk = sdk; sdk.Recognizer.enableTelemetry(false);
      const config = sdk.SpeechTranslationConfig.fromAuthorizationToken(token.token, token.region);
      config.speechRecognitionLanguage = 'en-US';
      config.addTargetLanguage('vi'); config.addTargetLanguage('ko');
      this.audio = sdk.AudioConfig.fromStreamInput(this.stream);
      this.audio.setProperty('MICROPHONE-WorkletSourceUrl', '/vendor/speech-processor.js');
      const recognizer = this.recognizer = new sdk.TranslationRecognizer(config, this.audio);
      this.phrases = sdk.PhraseListGrammar.fromRecognizer(recognizer); this.setSlide(this.slide);
      recognizer.recognizing = (_, event) => { if (!this.closed) this.results.accept(event.result, false); };
      recognizer.recognized = (_, event) => { if (!this.closed && event.result.reason === sdk.ResultReason.TranslatedSpeech) this.results.accept(event.result, true); };
      await new Promise((resolve, reject) => {
        this.rejectReady = reject;
        this.readyTimer = setTimeout(() => reject(new Error('Azure 음성 연결 시간이 초과됐습니다. 인터넷 연결과 리소스 지역을 확인해 주세요.')), 25_000);
        recognizer.sessionStarted = () => {
          if (this.closed) return;
          clearTimeout(this.readyTimer); this.connected = true; this.state('live'); resolve();
        };
        const fail = error => { if (this.closed) return; if (this.connected) this.onError(error); else reject(error); };
        recognizer.canceled = (_, event) => {
          const auth = event.errorCode === sdk.CancellationErrorCode.AuthenticationFailure;
          fail(new Error(auth ? 'Azure 인증이 만료되거나 거부됐습니다. Speech 키와 지역을 확인해 주세요.' : 'Azure 음성 번역이 중단됐습니다. 인터넷 연결과 Azure 사용량을 확인한 뒤 다시 시작해 주세요.'));
        };
        recognizer.sessionStopped = () => fail(new Error('Azure 음성 번역 세션이 종료됐습니다. 다시 시작해 주세요.'));
        recognizer.startContinuousRecognitionAsync(() => {}, () => fail(new Error('Azure 음성 번역을 시작하지 못했습니다. 키·지역·마이크를 확인해 주세요.')));
      });
      if (!this.closed) this.scheduleRefresh(token.expiresAt);
    } catch (error) { this.close(); throw error; }
  }
  scheduleRefresh(expiresAt) {
    clearTimeout(this.refreshTimer);
    const delay = Math.max(1000, Math.min(8 * 60_000, expiresAt - Date.now() - 60_000));
    this.refreshTimer = setTimeout(() => { void this.refresh(); }, delay);
  }
  async refresh() {
    try {
      const token = await this.getToken(this.abort.signal);
      if (this.closed) return;
      this.recognizer.authorizationToken = token.token;
      this.scheduleRefresh(token.expiresAt);
    } catch (error) { if (!this.closed) this.onError(error); }
  }
  setSlide(slide) {
    this.slide = validSlide(slide);
    if (!this.phrases || this.closed) return;
    this.phrases.clear();
    for (const phrase of recognitionContext(this.slide).keywords.filter(term => !/[가-힣]/.test(term))) this.phrases.addPhrase(phrase);
  }
  speechLevel() {} // Azure segments the continuous audio stream itself.
  close() {
    if (this.closed) return;
    this.closed = true; this.connected = false; this.abort.abort();
    clearTimeout(this.readyTimer); clearTimeout(this.refreshTimer);
    this.rejectReady?.(new DOMException('Session stopped', 'AbortError'));
    if (this.recognizer) {
      const recognizer = this.recognizer;
      recognizer.recognizing = recognizer.recognized = recognizer.canceled = recognizer.sessionStarted = recognizer.sessionStopped = undefined;
      // close() disposes the SDK connection and microphone audio source.
      recognizer.close(() => {}, () => {});
    }
    this.audio?.close(); this.state('stopped');
  }
}
