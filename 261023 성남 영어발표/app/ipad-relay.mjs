import http from 'node:http';
import os from 'node:os';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {scriptSignature} from './public/script-store.js';

// Token-protected companion: remote clients may select prepared cues only.
// The LAN listener cannot access API keys, audio, or OpenAI endpoints.
export function createIpadRelay({publicRoot,port=3231}={}) {
 const token=randomBytes(4).toString('hex'); let state={slide:1,index:0,running:false,updatedAt:0}, owner='';
 const valid=t=>{const a=Buffer.from(t||''),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b)};
 const failures=new Map(), subscribers=new Set(), controllers=new Map();
 const sendState=()=>{const message='data: '+JSON.stringify(state)+'\n\n';for(const res of subscribers)res.write(message);};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  const u=new URL(req.url,'http://ipad.local');
  if(req.method!=='GET' && !(req.method==='POST' && u.pathname==='/cue')) {res.writeHead(405);return res.end();}
  const client=req.socket.remoteAddress||''; const now=Date.now(),attempt=failures.get(client);
  if(!valid(u.searchParams.get('key'))) {
   if(attempt && attempt.count>=10 && now-attempt.since<60000){res.writeHead(429);return res.end('Try again later');}
   const x=attempt&&now-attempt.since<60000?attempt:{count:0,since:now};x.count++;failures.set(client,x);res.writeHead(403);return res.end('Invalid link');
  }
  failures.delete(client);
  if(u.pathname==='/cue' && req.method==='POST') {
   if(req.headers.origin!==`http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')){res.writeHead(403);return res.end('Forbidden');}
   let body='';try{for await(const chunk of req){body+=chunk;if(body.length>1024)throw Error('large');}const selection=JSON.parse(body);
    const script=JSON.parse(await fs.readFile(path.join(publicRoot,'prepared-script.json'),'utf8'));
    const cue=script.cues.find(c=>c.id===selection.id && c.slide===selection.slide);
    if(typeof selection.requestId!=='string'||!/^[-a-z0-9]{1,80}$/.test(selection.requestId)){res.writeHead(400);return res.end('Invalid request id');}
    if(!cue){res.writeHead(400);return res.end('Unknown cue');}
    const listeners=controllers.get(owner);
    if(!state.running || Date.now()-state.updatedAt>15000 || !listeners?.size){res.writeHead(409);return res.end('Presentation not connected');}
    const message='data: '+JSON.stringify({id:cue.id,slide:cue.slide,signature:scriptSignature(script),requestId:selection.requestId})+'\n\n';
    for(const listener of listeners)listener.write(message);
    res.writeHead(202,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true}));
   }catch{res.writeHead(400);return res.end('Invalid request');}
  }
  if(u.pathname==='/events') {res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Connection':'keep-alive','Cache-Control':'no-store'});res.write('retry: 1000\n\n');subscribers.add(res);res.write('data: '+JSON.stringify(state)+'\n\n');req.on('close',()=>subscribers.delete(res));return;}
  if(u.pathname==='/state') {res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(state));}
  if(u.pathname==='/') {
   try{const [html,cues]=await Promise.all([fs.readFile(path.join(publicRoot,'ipad.html'),'utf8'),fs.readFile(path.join(publicRoot,'prepared-script.json'),'utf8')]);
    res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
    return res.end(html.replace('/* SCRIPT_DATA */','const prepared='+JSON.stringify(JSON.parse(cues)).replace(/</g,'\\u003c')+';'));
   }catch{res.writeHead(500);return res.end('Unable to load script');}
  }
  res.writeHead(404);res.end();
 });
 server.on('error',e=>console.error('iPad relay unavailable:',e.code));
 return {listen(){server.listen(port,'0.0.0.0')},close(){for(const res of subscribers)res.end();for(const group of controllers.values())for(const res of group)res.end();subscribers.clear();controllers.clear();server.close()}, update(x){const source=typeof x.source==='string'?x.source.slice(0,80):'';if(state.running && Date.now()-state.updatedAt<15000 && source!==owner)return;if(Number.isInteger(x.slide)&&x.slide>=1&&x.slide<=12&&Number.isInteger(x.index)&&x.index>=0&&x.index<500){owner=source;state={slide:x.slide,index:x.index,running:!!x.running,updatedAt:Date.now(),...(typeof x.ack==='string'&&/^[-a-z0-9]{1,80}$/.test(x.ack)?{ack:x.ack}:{})};sendState()}},connectCommands(req,res,source){
  if(typeof source!=='string'||!source||source.length>80){res.writeHead(400);return res.end();}
  res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Connection':'keep-alive','Cache-Control':'no-store'});res.write('retry: 1000\n\n');
  if(!controllers.has(source))controllers.set(source,new Set());const group=controllers.get(source);group.add(res);req.on('close',()=>{group.delete(res);if(!group.size)controllers.delete(source)});
 },info(){const addresses=Object.values(os.networkInterfaces()).flat().filter(x=>x?.family==='IPv4'&&!x.internal).map(x=>x.address);return {urls:[...new Set(addresses)].map(ip=>`http://${ip}:${port}/?key=${token}`)}},server};
}
