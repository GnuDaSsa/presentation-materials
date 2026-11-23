// A single playback gate between speaker introduction and slide 3.
export function createVideoInterlude({video,overlay,status,getStream,getPeer,onStart=()=>{},onFinish=()=>{}}){
 let active=false,played=false,previous=[],peerWasLocked=false;
 function start(){
  if(active||played)return false;
  active=true;played=true;overlay.hidden=false;status.textContent='';
  previous=(getStream()?.getAudioTracks()||[]).map(track=>({track,enabled:track.enabled}));
  for(const {track} of previous)track.enabled=false;
  const peer=getPeer();peerWasLocked=Boolean(peer?.locked);if(peer)peer.locked=true;
  onStart();
  if(!video.src)video.src=video.dataset.src;
  try{video.currentTime=0;Promise.resolve(video.play()).catch(()=>{if(active)status.textContent='재생 버튼을 눌러 영상을 시작해 주세요.';});}
  catch{status.textContent='재생 버튼을 눌러 영상을 시작해 주세요.';}
  return true;
 }
 function finish(advance=true){
  if(!active)return false;active=false;video.pause();overlay.hidden=true;
  for(const {track,enabled} of previous)if(track.readyState!=='ended')track.enabled=enabled;
  previous=[];const peer=getPeer();if(peer){peer.resetInput?.();peer.locked=peerWasLocked;}
  onFinish(advance);return true;
 }
 video.addEventListener('ended',()=>finish(true));
 video.addEventListener('error',()=>{if(active)status.textContent='영상을 불러오지 못했습니다. 다음 장으로 넘어갈 수 있습니다.';});
 return {start,finish,reset(){if(active)finish(false);played=false;},get active(){return active},get played(){return played}};
}
