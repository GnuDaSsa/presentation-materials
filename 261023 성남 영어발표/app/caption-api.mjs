import { readSSE } from './public/stream.js';
import { recognitionContext, translationInstructions, normalizeTerms, validSlide } from './public/glossary.js';

export const translationModel = 'gpt-6-sol';
export const translationReasoning = 'none';
const requests = [], sessions = [];
let translating = 0;
const transcription = (slide, speechLanguage, scriptHint) => ({
  type: 'transcription',
  audio: { input: {
    noise_reduction: { type: 'near_field' },
    transcription: recognitionContext(slide, speechLanguage, scriptHint),
    turn_detection: null,
  } },
});
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
function allow(times, limit) { while (times.length && times[0] < Date.now() - 60_000) times.shift(); if (times.length >= limit) return false; times.push(Date.now()); return true; }
export function transcriptionFailure(status, error = {}) {
  const safeField = value => typeof value === 'string' && /^[a-zA-Z0-9_.\[\]-]{1,140}$/.test(value) ? value : undefined;
  const code = safeField(error?.code), parameter = safeField(error?.param);
  let message;
  if (status === 400) message = code === 'string_above_max_length' && parameter?.endsWith('.prompt')
    ? '음성 인식 참고 문구가 서버의 길이 제한을 초과했습니다 (400). 앱 설정 수정이 필요합니다.'
    : '음성 인식 요청 설정을 서버가 거절했습니다 (400). 앱 설정을 확인해야 합니다.';
  else if (status === 401) message = 'OpenAI API 키 인증에 실패했습니다 (401). 서버의 API 키 설정을 확인해 주세요.';
  else if (status === 403) message = '이 API 키의 음성 인식 서비스 이용 권한을 확인해 주세요 (403).';
  else if (status === 429 && ['credit_balance_exhausted','insufficient_quota','organization_spend_limit_exceeded','project_spend_limit_exceeded','organization_usage_limit_exceeded'].includes(code)) message = 'OpenAI API 잔액 또는 사용 한도에 도달했습니다 (429). API 계정의 결제·한도 설정을 확인해 주세요.';
  else if (status === 429 && ['rate_limit_exceeded','rate_limit_error','slow_down'].includes(code)) message = 'OpenAI 요청이 일시적으로 제한됐습니다 (429). 잠시 후 다시 시작해 주세요.';
  else if (status === 429) message = 'OpenAI가 요청을 제한했습니다 (429). 요청 속도 제한인지 API 사용 한도인지 확인이 필요합니다.';
  else if (status >= 500) message = `OpenAI 음성 인식 서버가 일시적으로 응답하지 못했습니다 (${status}). 잠시 후 다시 시작해 주세요.`;
  else message = `음성 인식 연결을 준비하지 못했습니다 (OpenAI ${status}).`;
  return {error:message,upstreamStatus:status,code,parameter};
}

export async function captionApi(req, res, url, { key, safetyId }) {
  if (!['/api/transcription-session', '/api/caption-translation'].includes(url.pathname)) return false;
  if (req.method !== 'POST' || req.headers.origin !== `http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) { json(res, 403, { error: '발표 화면에서 연결해 주세요.' }); return true; }
  if (!key) { json(res, 503, { error: 'OpenAI API 키가 설정되지 않았습니다.' }); return true; }
  let input;
  try { let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 4096) throw new Error(); } input = JSON.parse(body); }
  catch { json(res, 400, { error: '요청을 읽지 못했습니다.' }); return true; }
  const auth = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'OpenAI-Safety-Identifier': safetyId };
  if (url.pathname === '/api/transcription-session') {
    if (!allow(sessions, 8)) { json(res, 429, { error: '연결 요청이 많습니다. 잠시 후 다시 시작해 주세요.' }); return true; }
    try {
      const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', { method: 'POST', headers: auth, body: JSON.stringify({ session: transcription(validSlide(input?.slide), input?.speechLanguage, input?.scriptHint) }), signal: AbortSignal.timeout(20_000) });
      const data = await response.json();
      if (!response.ok || !data.value) json(res, response.status === 429 ? 429 : 502, transcriptionFailure(response.status,data.error));
      else json(res, 200, { value: data.value, expires_at: data.expires_at });
    } catch { json(res, 504, { error: '음성 인식 연결 시간이 초과됐습니다.' }); }
    return true;
  }
  const { language, text } = input || {};
  if (!['vi', 'ko'].includes(language) || typeof text !== 'string' || !text.trim() || text.length > 500) { json(res, 400, { error: '자막 요청이 올바르지 않습니다.' }); return true; }
  if (translating >= 8 || !allow(requests, 360)) { json(res, 429, { error: '자막 요청이 많습니다. 잠시 후 다시 시작해 주세요.' }); return true; }
  translating++;
  const abort = new AbortController();
  const cancel = () => { if (!res.writableEnded) abort.abort(); };
  res.on('close', cancel);
  const label = language === 'vi' ? '베트남어' : '한국어';
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: auth,
      body: JSON.stringify({ model: translationModel, reasoning: { effort: translationReasoning }, store: false, stream: true, temperature: 0,
        max_output_tokens: 180,
        instructions: translationInstructions(language, text),
        input: normalizeTerms(text),
      }), signal: AbortSignal.any([abort.signal, AbortSignal.timeout(8000)]),
    });
    if (!response.ok) { json(res, response.status === 429 ? 429 : 502, { error: `${label} 자막 번역에 실패했습니다 (${response.status}).` }); return true; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    let received = false;
    for await (const event of readSSE(response.body)) {
      if (event.type === 'response.output_text.delta' && event.delta) { received = true; res.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`); }
      if (['error', 'response.failed', 'response.incomplete'].includes(event.type)) throw new Error('translation_failed');
    }
    if (!received) throw new Error('empty_translation');
    res.write('data: {"done":true}\n\n'); res.end();
  } catch {
    if (!res.destroyed) {
      const error = `${label} 자막 응답이 지연되거나 중단됐습니다. 다시 시작해 주세요.`;
      if (res.headersSent) { res.write(`data: ${JSON.stringify({ error })}\n\n`); res.end(); }
      else json(res, 504, { error });
    }
  } finally { translating--; res.off('close', cancel); }
  return true;
}
