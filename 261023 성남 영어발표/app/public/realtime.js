import { recognitionContext, validSlide } from './glossary.js';

export class TranscriptionConnection {
  constructor(stream, { onTranscript, onState, onError, slide = 1, speechLanguage, scriptHint = '' }) {
    this.slide = validSlide(slide);
    this.speechLanguage = ['en', 'ko'].includes(speechLanguage) ? speechLanguage : undefined;
    this.scriptHint = typeof scriptHint === 'string' ? scriptHint.slice(0,900) : '';
    this.stream = stream;
    this.onTranscript = onTranscript;
    this.onState = onState;
    this.onError = onError;
    this.abort = new AbortController();
    this.closed = false;
    this.connected = false;
    this.timers = new Set();
  }
  timer(fn, delay) { const timer = setTimeout(() => { this.timers.delete(timer); fn(); }, delay); this.timers.add(timer); return timer; }
  async start() {
    const label = '음성 인식';
    this.onState('connecting');
    const peer = this.peer = new RTCPeerConnection();
    // One continuous audio stream drives both subtitle languages.
    for (const track of this.stream.getAudioTracks()) peer.addTrack(track, this.stream);
    // Receive the remote audio track, but never attach it to a player or speakers.
    peer.ontrack = () => {};
    const channel = this.channel = peer.createDataChannel('oai-events');
    const ready = new Promise((resolve, reject) => {
      this.rejectReady = reject;
      const deadline = this.timer(() => reject(new Error(`${label} 번역 연결 시간이 초과됐습니다.`)), 35_000);
      channel.onopen = () => { clearTimeout(deadline); this.timers.delete(deadline); this.connected = true; this.setSlide(this.slide); this.onState('live'); resolve(); };
      channel.onmessage = ({ data }) => {
        if (this.closed) return;
        let event;
        try { event = JSON.parse(data); } catch { return; }
        if (['conversation.item.input_audio_transcription.delta', 'conversation.item.input_audio_transcription.completed'].includes(event.type)) this.onTranscript(event);
        if (event.type === 'error') {
          if (event.error?.code === 'input_audio_buffer_commit_empty') return;
          const message = `${label} 오류가 발생했습니다. 중지 후 다시 시작해 주세요.`;
          if (!this.connected) reject(new Error(message)); else this.onError(new Error(message));
        }
        if (event.type === 'session.closed') this.onError(new Error(`${label} 번역 세션이 끝났습니다. 다시 시작해 주세요.`));
      };
      channel.onclose = () => { if (!this.closed) { if (!this.connected) reject(new Error(`${label} 번역 연결이 닫혔습니다.`)); else this.onError(new Error(`${label} 번역 연결이 끊어졌습니다.`)); } };
      peer.onconnectionstatechange = () => {
        if (this.closed) return;
        if (peer.connectionState === 'failed') {
          if (!this.connected) reject(new Error(`${label} 음성 전송에 실패했습니다.`));
          else this.onError(new Error(`${label} 음성 연결이 끊어졌습니다. 인터넷 연결을 확인해 주세요.`));
        }
        if (peer.connectionState === 'disconnected') {
          this.onState('reconnecting');
          this.timer(() => { if (!this.closed && peer.connectionState === 'disconnected') this.onError(new Error(`${label} 연결이 복구되지 않았습니다. 다시 시작해 주세요.`)); }, 8000);
        }
        if (peer.connectionState === 'connected' && this.connected) this.onState('live');
      };
    });
    // Register rejection immediately while the HTTP handshake is still pending.
    ready.catch(() => {});
    try {
      const offerPromise = peer.createOffer().then(async offer => { await peer.setLocalDescription(offer); return offer; });
      offerPromise.catch(() => {});
      const tokenResponse = await fetch('/api/transcription-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: this.slide, speechLanguage: this.speechLanguage, scriptHint: this.scriptHint }), signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(25_000)]),
      });
      const token = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(token.error || `${label} 연결 준비에 실패했습니다.`);
      if (this.closed) return;
      const offer = await offerPromise;
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST', headers: { Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp, signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(25_000)]),
      });
      if (!sdpResponse.ok) throw new Error(`${label} 번역 서버에 연결하지 못했습니다 (${sdpResponse.status}).`);
      await peer.setRemoteDescription({ type: 'answer', sdp: await sdpResponse.text() });
      await ready;
    } catch (e) { this.close(); throw e; }
  }
  setSlide(slide, scriptHint = this.scriptHint) {
    this.slide = validSlide(slide);
    this.scriptHint = typeof scriptHint === 'string' ? scriptHint.slice(0,900) : '';
    if (this.channel?.readyState === 'open' && !this.closed) this.channel.send(JSON.stringify({ type: 'session.update', session: { type: 'transcription', audio: { input: { transcription: recognitionContext(this.slide, this.speechLanguage, this.scriptHint), turn_detection: null } } } }));
  }
  commit() { if (!this.closed && this.channel?.readyState === 'open') this.channel.send(JSON.stringify({ type: 'input_audio_buffer.commit' })); }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.rejectReady?.(new DOMException('Session stopped', 'AbortError'));
    this.abort.abort();
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    if (this.channel) { this.channel.onmessage = null; this.channel.onclose = null; this.channel.onopen = null; this.channel.close(); }
    if (this.peer) { this.peer.onconnectionstatechange = null; this.peer.close(); }
    this.onState('stopped');
  }
}
