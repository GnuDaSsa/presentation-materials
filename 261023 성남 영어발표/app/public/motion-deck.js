import {script,sources} from './presentation-content.js';
import {renderScene,titles} from './v16-scenes.js';
import {SceneMedia} from './scene-media.js';
export const sceneTitles=titles;
export class MotionDeck {
 constructor(viewport){this.viewport=viewport;this.canvas=document.createElement('div');this.canvas.className='motion-canvas';viewport.append(this.canvas);this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(viewport);this.index=null;this.language='en';this.revision=0;this.images=new Map();this.media=new SceneMedia();}
 resize(){const {width,height}=this.viewport.getBoundingClientRect();if(width>0&&height>0)this.canvas.style.setProperty('--deck-scale',Math.min(width/1440,height/810));}
 prepare(index,language){
  const template=document.createElement('template');template.innerHTML=renderScene(index+1,language);
  // Template contents belong to an inert document. Adopt first so image decoding
  // uses the live document and is not invalidated when the slide is displayed.
  const active=document.adoptNode(template.content.firstElementChild);
  // Reveal supporting content in place; headings, backgrounds and photos stay visible.
  const content='.champion-title,.champion-level,.intro-ai,.cover-city,.cover-thanks,.presenter-ai,.industry-item,.strategy-item,.program-row,.flow-stage,.alliance-node,.exchange-label,.alliance-activity,.alliance-counts,.education-column,.research-metrics,.floor-industry,.floor-support,.outcome-input,.outcome-row h3';
  active.querySelectorAll(content).forEach((element,i)=>{
   element.classList.add('motion-reveal');
   element.style.setProperty('--reveal-delay',`${Math.min(i*100,300)}ms`);
  });
  return active;
 }
 warm(active){
  return Promise.all([...active.querySelectorAll('img')].map(img=>{
   const src=img.src;
   if(!this.images.has(src)){const image=new Image();image.src=src;this.images.set(src,image.decode().catch(()=>{}));}
   return this.images.get(src).then(()=>img.decode().catch(()=>{}));
  }));
 }
 show(index,language,animate=true){
  this.cancelDissolve?.();
  // A repeated navigation is not a replay. Keep the scene and its animation clock.
  if(this.index===index && this.language===language){
   if(!animate)this.canvas.firstElementChild?.classList.remove('animate');
   return this.ready;
  }
  this.index=index;this.language=language;
  const revision=++this.revision,active=this.prepare(index,language);
  // Keep the current slide visible while the next slide's images and font decode.
  this.ready=Promise.all([this.warm(active),document.fonts.load('400 25px Pretendard'),document.fonts.ready]).then(()=>{
   if(revision!==this.revision)return;
   // Install the animation class before display, so there is no complete frame
   // followed by a reset. The old slide stays painted until this single replacement.
   if(animate)active.classList.add('animate');
   this.media.video?.pause();
   this.canvas.replaceChildren(active);
   this.media.attach(active);
   this.resize();this.viewport.setAttribute('aria-label',`${index+1} / ${script.length}. ${sceneTitles[language][index]}`);
   if(revision===this.revision&&index+1<script.length)void this.warm(this.prepare(index+1,language));
  });
  return this.ready;
 }
 dissolve(index,language,duration=1200){
  this.cancelDissolve?.();
  const revision=++this.revision,active=this.prepare(index,language);
  this.index=index;this.language=language;
  this.ready=Promise.all([this.warm(active),document.fonts.load('400 25px Pretendard'),document.fonts.ready]).then(async()=>{
   if(revision!==this.revision)return;
   const old=this.canvas.firstElementChild;
   this.media.video?.pause();
   // Keep a fully opaque Korean cover underneath. Only the English cover fades in.
   // This avoids the dark midpoint and empty frames of fading both layers out.
   active.style.position='absolute';active.style.inset='0';
   this.canvas.append(active);this.resize();
   let animation;
   const settle=()=>{
    animation?.cancel();old?.remove();
    active.style.removeProperty('position');active.style.removeProperty('inset');
    if(this.cancelDissolve===settle)this.cancelDissolve=null;
   };
   this.cancelDissolve=settle;
   if(old && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    animation=active.animate([{opacity:0},{opacity:1}],{duration,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});
    await animation.finished.catch(()=>{});
   }
   if(revision!==this.revision)return;
   settle();this.media.attach(active);
   this.viewport.setAttribute('aria-label',`${index+1} / ${script.length}. ${sceneTitles[language][index]}`);
   if(index+1<script.length)void this.warm(this.prepare(index+1,language));
  });
  return this.ready;
 }
 replay(){
  const active=this.canvas.firstElementChild;if(!active)return;
  active.classList.add('animate');
  for(const animation of active.getAnimations({subtree:true}))animation.currentTime=0;
  this.media.replay();
 }
 notes(deck){const s=script[this.index];return {title:sceneTitles[this.language][this.index],text:s.paragraphs.join('\n\n'),cue:s.cue,ko:s.ko,sources:s.sources.map(id=>sources[id]),source:deck.slides[this.index][this.language==='en'?'textEn':'text']};}
}

