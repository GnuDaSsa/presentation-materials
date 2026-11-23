import {watch} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';

// Only public presentation files are watched. No configuration or key values
// are sent to the browser; the event contains an opaque revision identifier.
export function createLiveUpdates(publicRoot,{settleMs=1200,heartbeatMs=15000}={}) {
  let revision=randomUUID(),timer;
  const clients=new Set();
  const write=res=>res.write(`event: revision\ndata: ${JSON.stringify({revision})}\n\n`);
  const watcher=watch(publicRoot,{recursive:true},(_event,name)=>{
    const relative=String(name||'');
    if(relative.split(/[\\/]/).some(p=>p.startsWith('.')) || !/\.(html|css|js|json|png|jpg|jpeg|svg|woff2|txt|ico|mp4)$/i.test(path.extname(relative))) return;
    clearTimeout(timer);
    timer=setTimeout(()=>{revision=randomUUID();for(const res of clients)write(res);},settleMs);
  });
  watcher.on('error',()=>console.error('Presentation file watcher unavailable. Restart the presentation service.'));
  const heartbeat=setInterval(()=>{for(const res of clients)res.write(': keepalive\n\n');},heartbeatMs);
  heartbeat.unref();
  return {
    get revision(){return revision;},
    connect(req,res){
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});
      res.write('retry: 1500\n\n');clients.add(res);write(res);
      res.on('close',()=>clients.delete(res));
    },
    stamp(html){return html.replace(/<head>/i,`<head><meta name="presentation-revision" content="${revision}">`);},
    close(){clearTimeout(timer);clearInterval(heartbeat);watcher.close();for(const res of clients)res.end();clients.clear();},
  };
}
