// A pending revision can only replace the page when its owner says it is idle.
export function updateGate({revision,isBusy,reload,onPending=()=>{}}) {
  let pending=null,closed=false,applying=false;
  const flush=()=>{
    if(closed || applying || !pending || isBusy())return;
    applying=true;reload();
  };
  return {
    receive(next){
      if(closed || typeof next!=='string' || next===revision)return;
      pending=next;onPending();flush();
    },
    flush,
    close(){closed=true;},
  };
}

export function watchPresentation({isBusy=()=>false,beforeReload=()=>{},pendingText='수정본 준비됨 · 사용을 마치면 자동 반영'}={}) {
  const revision=document.querySelector('meta[name="presentation-revision"]')?.content;
  if(!revision || typeof EventSource!=='function')return {close(){}};
  const status=document.createElement('div');status.className='update-notice';status.hidden=true;status.setAttribute('role','status');status.textContent=pendingText;document.body.append(status);
  const gate=updateGate({revision,isBusy,reload:()=>{beforeReload();location.reload();},onPending:()=>{status.hidden=false;}});
  const events=new EventSource('/api/updates');
  events.addEventListener('revision',event=>{try{gate.receive(JSON.parse(event.data).revision);}catch{}});
  const timer=setInterval(gate.flush,500);
  const close=()=>{gate.close();events.close();clearInterval(timer);};
  window.addEventListener('pagehide',close,{once:true});
  return {close};
}
