// Local video follows the slide lifecycle; it never starts or stops the microphone.
export class SceneMedia {
 constructor(){this.paused=false;this.visible=true;this.userPaused=false;this.video=null;this.button=null;}
 attach(scene){
  this.video?.pause();
  this.video=scene.querySelector('video');this.button=scene.querySelector('[data-video-toggle]');
  this.userPaused=false;
  if(!this.video)return;
  const video=this.video,button=this.button,en=scene.lang==='en';
  video.muted=true;
  const update=()=>{
   if(this.video!==video)return;
   button.textContent=video.paused?(video.ended?(en?'↻ Replay':'↻ 다시 보기'):(en?'▶ Play':'▶ 재생')):(en?'Ⅱ Pause':'Ⅱ 멈춤');
   button.setAttribute('aria-label',video.paused?(en?'Play the 3D model video':'3D 모델 영상 재생'):(en?'Pause the 3D model video':'3D 모델 영상 일시정지'));
   button.disabled=this.paused||!this.visible;
  };
  this.update=update;
  for(const event of ['play','pause','ended'])video.addEventListener(event,update);
  video.addEventListener('error',()=>{video.hidden=true;button.hidden=true;});
  const showFrame=()=>{if(this.video===video&&!video.error)video.dataset.frameReady='true';};
  // Keep the decoded poster visible until an actual video frame can replace it.
  if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(showFrame);
  else video.addEventListener('loadeddata',showFrame,{once:true});
  // The scene was prepared inside an inert template. Resolve/load its media
  // only after adoption into the live presentation document.
  video.src=video.dataset.src;
  video.load();
  button.addEventListener('click',()=>{
   if(this.paused||!this.visible)return;
   if(video.paused){this.userPaused=false;if(video.ended)video.currentTime=0;void video.play().catch(update);}
   else{this.userPaused=true;video.pause();}
  });
  // Reduced-motion viewers get a still and an explicit Play button.
  this.userPaused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.sync();update();
 }
 setState({paused=this.paused,visible=this.visible}={}){this.paused=paused;this.visible=visible;this.sync();}
 replay(){if(!this.video)return;this.video.currentTime=0;this.userPaused=false;this.sync();}
 sync(){
  const video=this.video;if(!video)return;
  if(this.paused||!this.visible||this.userPaused)video.pause();
  else if(!video.ended)void video.play().catch(()=>{});
  this.update?.();
 }
}
