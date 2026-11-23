export function azureSettings(env = process.env) {
  const key = env.AZURE_SPEECH_KEY?.trim() || '';
  const region = env.AZURE_SPEECH_REGION?.trim().toLowerCase() || '';
  const validRegion = /^[a-z][a-z0-9]{1,35}$/.test(region);
  return { key, region: validRegion ? region : '', available: Boolean(key && validRegion) };
}

export function createAzureTokenService({ key, region, fetchImpl = fetch, now = Date.now }) {
  let cached, pending;
  return async function token() {
    if (!key || !/^[a-z][a-z0-9]{1,35}$/.test(region)) throw Object.assign(new Error('Azure 설정이 필요합니다. Azure 설정 안내를 확인해 주세요.'), { status: 503 });
    if (cached && now() < cached.expiresAt - 90_000) return cached;
    if (pending) return pending;
    pending = (async () => {
      const response = await fetchImpl(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: '', signal: AbortSignal.timeout(10_000), redirect: 'error',
      });
      if (!response.ok) throw Object.assign(new Error([401, 403].includes(response.status)
        ? 'Azure 인증에 실패했습니다. Speech 리소스의 키와 지역이 서로 맞는지 확인해 주세요.'
        : response.status === 429 ? 'Azure 이용 한도에 도달했습니다. 리소스의 사용량과 요금제를 확인해 주세요.'
        : `Azure 연결을 준비하지 못했습니다 (HTTP ${response.status}).`), { status: response.status === 429 ? 429 : 502 });
      const value = (await response.text()).trim();
      if (!value || value.length > 16384) throw new Error('invalid_token');
      // Azure tokens last ten minutes. Advertise nine and renew one minute early.
      return cached = { token: value, region, expiresAt: now() + 9 * 60_000 };
    })();
    try { return await pending; } finally { pending = null; }
  };
}

export function createAzureApi(settings) {
  const getToken = createAzureTokenService(settings), times = [];
  const json = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  return async (req, res, url) => {
    if (url.pathname !== '/api/azure-token') return false;
    if (req.method !== 'POST' || req.headers.origin !== `http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) {
      json(res, 403, { error: '발표 화면에서 연결해 주세요.' }); return true;
    }
    try {
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 1024) throw new Error(); }
      const input = JSON.parse(body);
      if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).length) throw new Error();
    } catch { json(res, 400, { error: '요청을 읽지 못했습니다.' }); return true; }
    while (times.length && times[0] < Date.now() - 60_000) times.shift();
    if (times.length >= 12) { json(res, 429, { error: '연결 요청이 많습니다. 잠시 후 다시 시작해 주세요.' }); return true; }
    times.push(Date.now());
    try { json(res, 200, await getToken()); }
    catch (error) { json(res, error.status || 504, { error: error.status ? error.message : 'Azure 연결 시간이 초과되거나 응답이 올바르지 않습니다. 인터넷 연결을 확인해 주세요.' }); }
    return true;
  };
}
