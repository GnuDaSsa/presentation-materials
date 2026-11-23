import http from 'node:http';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { captionApi, translationModel, translationReasoning } from './caption-api.mjs';
import { azureSettings, createAzureApi } from './azure-api.mjs';
import { createScriptApi } from './script-api.mjs';
import { createLiveUpdates } from './live-updates.mjs';
import { createIpadRelay } from './ipad-relay.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(process.env.CAPTION_ENV_FILE || path.join(root, '.env.local')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const publicRoot = path.join(root, 'public');
const updates = createLiveUpdates(publicRoot);
const port = Number(process.env.PORT || 3230);
const ipad = createIpadRelay({publicRoot,port:Number(process.env.IPAD_PORT || 3231)});
ipad.listen();
const key = process.env.OPENAI_API_KEY?.trim();
const azure = azureSettings(), azureApi = createAzureApi(azure);
const scriptApi = createScriptApi();
const defaultProvider = ['azure', 'openai'].includes(process.env.CAPTION_PROVIDER) ? process.env.CAPTION_PROVIDER : azure.available ? 'azure' : 'openai';
const safetyId = createHash('sha256').update('workshop-live-captions-local').digest('hex');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const azureConnections = azure.region ? ` wss://${azure.region}.s2s.speech.microsoft.com wss://${azure.region}.stt.speech.microsoft.com` : '';
const csp = `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.openai.com${azureConnections}; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'`;
const tokenTimes = [];
let inFlight = 0;
function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); }
async function readJson(req) {
  let body = '';
  for await (const chunk of req) { body += chunk; if (body.length > 1024) throw new Error('body_size'); }
  return JSON.parse(body);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), display-capture=()');
  const host = req.headers.host;
  if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(host)) return json(res, 403, { error: '허용되지 않은 주소입니다.' });
  let url;
  try { url = new URL(req.url, `http://${host}`); } catch { return json(res, 400, { error: '잘못된 요청입니다.' }); }
  if (url.pathname === '/api/ipad-commands' && req.method === 'GET') { ipad.connectCommands(req,res,url.searchParams.get('source')); return; }
  if (url.pathname === '/api/ipad-link' && req.method === 'GET') return json(res,200,ipad.info());
  if (url.pathname === '/api/ipad-state' && req.method === 'POST') {
    if(req.headers.origin !== `http://${host}` || !req.headers['content-type']?.startsWith('application/json')) return json(res,403,{error:'허용되지 않은 요청'});
    try { ipad.update(await readJson(req)); return json(res,200,{ok:true}); } catch { return json(res,400,{error:'잘못된 상태'}); }
  }
  if (url.pathname === '/api/updates' && req.method === 'GET') { updates.connect(req,res); return; }
  if (url.pathname === '/api/health' && req.method === 'GET') return json(res, 200, {
    app: 'workshop-live-captions', ipadStreaming: true, ipadControl: true, videoStreaming: true, available: Boolean(key) || azure.available, model: 'gpt-live-transcribe', translationModel, translationReasoning, languages: ['vi', 'ko'], defaultProvider,
    providers: { openai: { available: Boolean(key) }, azure: { available: azure.available, region: azure.region, sourceLanguage: 'en-US' } },
  });
  if (await azureApi(req, res, url)) return;
  if (await scriptApi(req, res, url, { key, safetyId })) return;
  if (await captionApi(req, res, url, { key, safetyId })) return;
  if (url.pathname === '/api/session' && req.method === 'POST') {
    if (req.headers.origin !== `http://${host}` || !req.headers['content-type']?.startsWith('application/json')) return json(res, 403, { error: '발표 화면에서 연결해 주세요.' });
    if (!key) return json(res, 503, { error: '서버의 .env.local에 OpenAI API 키를 설정해 주세요.' });
    while (tokenTimes.length && tokenTimes[0] < Date.now() - 60_000) tokenTimes.shift();
    if (inFlight >= 2 || tokenTimes.length >= 8) return json(res, 429, { error: '연결 요청이 많습니다. 잠시 후 다시 시작해 주세요.' });
    let language;
    try { ({ language } = await readJson(req)); } catch { return json(res, 400, { error: '요청을 읽지 못했습니다.' }); }
    if (!['vi', 'ko'].includes(language)) return json(res, 400, { error: '지원하지 않는 자막 언어입니다.' });
    tokenTimes.push(Date.now());
    inFlight++;
    try {
      const response = await fetch('https://api.openai.com/v1/realtime/translations/client_secrets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'OpenAI-Safety-Identifier': safetyId },
        body: JSON.stringify({ session: { model: 'gpt-realtime-translate', audio: { input: { noise_reduction: { type: 'near_field' } }, output: { language } } } }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) {
        console.error(`Translation session ${language}: HTTP ${response.status}`);
        return json(res, response.status === 429 ? 429 : 502, { error: response.status === 429 ? 'OpenAI 이용 한도에 도달했습니다. API 잔액과 한도를 확인해 주세요.' : `번역 연결을 준비하지 못했습니다 (OpenAI ${response.status}). API 키와 모델 이용 권한을 확인해 주세요.` });
      }
      const data = await response.json();
      if (!data.value) return json(res, 502, { error: '번역 연결 정보가 올바르지 않습니다.' });
      return json(res, 200, { value: data.value, expires_at: data.expires_at });
    } catch { return json(res, 504, { error: '번역 서버 연결 시간이 초과됐습니다. 인터넷 연결을 확인해 주세요.' }); }
    finally { inFlight--; }
  }
  if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: '허용되지 않은 요청입니다.' });
  try {
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const fullPath = path.resolve(publicRoot, '.' + relative);
    if (!fullPath.startsWith(publicRoot + path.sep) || relative.includes('\0') || relative.split(/[\\/]/).some(p => p.startsWith('.'))) return json(res, 404, { error: '파일이 없습니다.' });
    if(path.extname(fullPath)==='.mp4'){
      const size=(await fs.stat(fullPath)).size;
      const headers={'Content-Type':'video/mp4','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
      let start=0,end=size-1,status=200;
      if(req.headers.range){
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        start=match?.[1]?Number(match[1]):Math.max(0,size-Number(match?.[2]));
        end=match?.[1]&&match[2]?Math.min(Number(match[2]),size-1):size-1;
        if(!match||(!match[1]&&!match[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});res.end();return;}
        status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
      }
      res.writeHead(status,{...headers,'Content-Length':end-start+1});
      if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(fullPath,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);return;
    }
    const file = await fs.readFile(fullPath);
    const data = path.extname(fullPath) === '.html' ? updates.stamp(file.toString('utf8')) : file;
    res.writeHead(200, { 'Content-Type': mime[path.extname(fullPath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { json(res, 404, { error: '파일이 없습니다.' }); }
});
server.requestTimeout = 30_000;
server.on('close',()=>{updates.close();ipad.close();});
server.headersTimeout = 10_000;
server.listen(port, '127.0.0.1', () => console.log(`Workshop: http://127.0.0.1:${port} | API key: ${key ? 'configured' : 'missing'}`));
