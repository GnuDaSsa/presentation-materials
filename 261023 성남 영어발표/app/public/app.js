import {createVideoInterlude} from './video-interlude.js';
import {applyIpadCue} from './ipad-control.js';
import qrcode from './vendor/qr-code-generator.js';
import { CaptionBuffer, renderCaption } from './captions.js';
import { FastCaptions } from './fast-captions.js';
import { AzureCaptions } from './azure-captions.js';
import { MotionDeck, sceneTitles } from './motion-deck.js';
import { ScriptCaptions } from './script-captions.js';
import { loadScript, scriptSignature, SCRIPT_CHANNEL } from './script-store.js';
import { script } from './presentation-content.js';
import { watchPresentation } from './live-updates.js';
import { OpeningSequence, OPENING_FADE_MS, OPENING_KEY, OPENING_SLIDE_KEY } from './opening-sequence.js';

const $ = id => document.getElementById(id);
const previewUrl = (language,i) => '/motion-previews/'+language+'-'+String(i+1).padStart(2,'0')+'.png'+'?v=20261103-slide-cued-script';
const motionDeck = new MotionDeck($('motion-viewport'));
const opening = new OpeningSequence();
let sourceOpeningAnimation;
let sourceMode = false, motionPaused = false;
const buffers = { vi: new CaptionBuffer(), ko: new CaptionBuffer() };
const elements = { vi: $('caption-vi'), ko: $('caption-ko') };
let deck, index = 0, running = false, starting = false, generation = 0, microphone, peers = [], audioContext, meterFrame;
let slideLanguage = 'en', slideLoad = 0;
const presenterChannel = 'BroadcastChannel' in window ? new BroadcastChannel('seongnam-presenter-v16-intro') : null;
const publishSlide = () => { presenterChannel?.postMessage({type:'state',index,language:slideLanguage,openingPhase:opening.phase}); publishIpad({slide:index+1,index:preparedScript?.cues.findIndex(c=>c.slide===index+1)??0}); };
presenterChannel?.addEventListener('message', ({data}) => {
  if (!deck) return;
  if (data?.type === 'hello') publishSlide();
  if (data?.type === 'navigate' && Number.isInteger(data.index) && data.index >= 0 && data.index < deck.slides.length) setSlide(data.index);
  if (data?.type === 'next') nextSlide();
  if (data?.type === 'replay') replayMotion();
});
function renderSpeakerPanel() {
  const entry = script[index];
  if (!entry) return;
  const format = seconds => Math.floor(seconds / 60).toString().padStart(2,'0') + ':' + (seconds % 60).toString().padStart(2,'0');
  const start = script.slice(0,index).reduce((sum,s) => sum+s.seconds,0);
  $('speaker-panel-heading').textContent = entry.title;
  $('speaker-panel-time').textContent = `${index+1} / ${script.length} · ${format(start)}–${format(start+entry.seconds)} · ${entry.seconds}초`;
  $('speaker-panel-text').replaceChildren(...entry.paragraphs.map((text,i) => {
    const paragraph = document.createElement('p'); paragraph.textContent = text; paragraph.lang=entry.spokenLanguages?.[i]||'en'; return paragraph;
  }));
  $('speaker-panel-summary').textContent = entry.ko;
  $('speaker-panel-cue').textContent = entry.cue;
  $('speaker-panel-position').textContent = `${index+1} / ${script.length}`;
  const nextCue = preparedScript?.cues.find(c => c.slide === index+2);
  $('speaker-slide-trigger').hidden = !nextCue || !autoAdvance || captionMode !== 'script';
  $('speaker-slide-trigger-text').textContent = nextCue?.en || '';
  $('speaker-panel-prev').disabled = index === 0;
  $('speaker-panel-next').disabled = index === script.length-1;
  $('speaker-panel-content').scrollTop = 0;
  $('speaker-window').disabled = !deck;
}
function setSpeakerPanel(open) {
  try { sessionStorage.setItem('workshop-speaker-open-v1',String(open)); } catch {}
  $('speaker-panel').hidden = !open;
  $('app').classList.toggle('speaker-open',open);
  $('speaker-button').setAttribute('aria-expanded',String(open));
  if (open) { renderSpeakerPanel(); $('speaker-panel-content').focus({preventScroll:true}); }
  else if (!document.fullscreenElement) $('speaker-button').focus({preventScroll:true});
  queueDraw();
}
function openSpeaker() { setSpeakerPanel($('speaker-panel').hidden); }
function openSpeakerWindow() { window.open('/speaker.html?slide='+(index+1),'seongnam-speaker','popup,width=1200,height=900'); }
const warmedImages = new Map();
let startedAt = 0, elapsedTimer, renderFrame, demoTimers = [], isDemo = false;
const states = { vi: 'stopped', ko: 'stopped' };
let captionExpiryTimer, captionCue = -1;
let provider = 'openai', providerHealth;
let captionMode = 'script', speechLanguage = 'auto', preparedScript, manualCaption = false;
let autoAdvance = true;
try { autoAdvance = localStorage.getItem('workshop-auto-slide-v1') !== 'false'; } catch {}
let scriptProgress = { state: 'ready', index: 0 };
const promo=createVideoInterlude({video:$('promo-video'),overlay:$('promo-overlay'),status:$('promo-status'),getStream:()=>microphone,getPeer:()=>peers[0],onStart:()=>clearCaptions(),onFinish:advance=>{if(advance)setSlide(2)}});
$('promo-skip').addEventListener('click',()=>promo.finish(true));
function isVideoIntro(progress){return index===1 && preparedScript?.cues[progress?.index]?.id==='v16-video-001';}
const scriptChannel = 'BroadcastChannel' in window ? new BroadcastChannel(SCRIPT_CHANNEL) : null;
const ipadSource=crypto.randomUUID();
let lastIpadIndex=0, ipadSending=false, ipadPending=null;
function publishIpad(progress={}) {
  const cueIndex=Number.isInteger(progress.index)&&progress.index>=0?progress.index:lastIpadIndex; lastIpadIndex=cueIndex;
  ipadPending={slide:progress.slide||index+1,index:cueIndex,running,source:ipadSource,...(progress.ack?{ack:progress.ack}:{})};
  if(ipadSending)return;
  const send=async()=>{ipadSending=true;while(ipadPending){const state=ipadPending;ipadPending=null;try{await fetch('/api/ipad-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});}catch{}}ipadSending=false;};
  void send();
}
setInterval(()=>publishIpad({slide:index+1,index:lastIpadIndex}),5000);
const ipadCommands=new EventSource('/api/ipad-commands?source='+encodeURIComponent(ipadSource));
ipadCommands.onmessage=event=>{try{
  const selection=JSON.parse(event.data);
  if(promo.active)return;
  const applied=applyIpadCue({selection,script:preparedScript,signature:preparedScript&&scriptSignature(preparedScript),running,captionMode,peer:peers[0],currentSlide:index+1,setSlide,clearCaptions,replaceCaption,publishScript});
  if(applied){manualCaption=false;setStatus('아이패드에서 자막 선택 · 음성 인식 계속','live');}
}catch{}};
window.addEventListener('pagehide',()=>ipadCommands.close(),{once:true});
function publishScript(progress = scriptProgress) {
  scriptProgress = progress;
  if(['matched','ready','manual','stopped'].includes(progress.state))publishIpad(progress);
  scriptChannel?.postMessage({ type: 'progress', ...progress, running, speechLanguage, signature: preparedScript && scriptSignature(preparedScript) });
}
function progressScript(progress) {
  if (progress.source) $('recognized-speech').textContent = progress.source;
  if (progress.state === 'hearing') { scriptChannel?.postMessage({type:'progress',...scriptProgress,source:progress.source,running,speechLanguage,signature:preparedScript && scriptSignature(preparedScript)}); return; }
  if (progress.state === 'waiting') setStatus('원고 위치 찾는 중', 'live');
  if (progress.state === 'matched') {
    setStatus('듣고 있습니다', 'live');
    if (running || starting) { publishScript(progress); if(progress.final && isVideoIntro(progress) && !promo.played)promo.start(); }
  } else publishScript(progress);
}
function pauseScript() { if (peers[0] instanceof ScriptCaptions) peers[0].locked = true; clearCaptions(); manualCaption = false; publishScript({state:'hidden',index:scriptProgress.index}); }
async function scriptCommand(data) {
  if (data?.type === 'hello') { publishScript(); return; }
  if (data?.type === 'saved') {
    if (!running && !starting) { try { preparedScript = await loadScript(); showProvider(); } catch(e) { notify(e.message); } }
    return;
  }
  if (!['seek','manual','hide'].includes(data?.type)) return;
  if (captionMode !== 'script' || starting) { scriptChannel?.postMessage({type:'error',message:'발표 화면에서 원고 따라가기를 선택하고 연결 준비가 끝난 뒤 조정해 주세요.'}); return; }
  if (!preparedScript || data.signature !== scriptSignature(preparedScript)) { scriptChannel?.postMessage({type:'error',message:'원고가 다릅니다. 수정 내용을 저장하고 발표 화면의 자막을 중지 후 다시 시작해 주세요.'}); return; }
  if (data.type === 'hide') { pauseScript(); return; }
  if (!Number.isInteger(data.index) || !preparedScript.cues[data.index]) return;
  if (running && data.speechLanguage !== speechLanguage) { scriptChannel?.postMessage({type:'error',message:'발표 언어 변경은 자막을 중지한 뒤 발표 설정에서 선택해 주세요.'}); return; }
  if (!running) { speechLanguage = ['en','ko'].includes(data.speechLanguage) ? data.speechLanguage : 'auto'; $('speech-language').value = speechLanguage; showProvider(); }
  const cue = preparedScript.cues[data.index];
  if (index !== cue.slide-1) setSlide(cue.slide-1);
  peers[0]?.seek?.(data.index); clearCaptions(); manualCaption = false;
  if (data.type === 'manual') {
    if (peers[0]) peers[0].locked = true;
    manualCaption = true;
    for (const language of ['vi','ko']) replaceCaption(language,cue[language],true,{cue:0,revision:0});
    publishScript({state:'manual',index:data.index,slide:cue.slide});
  } else publishScript({state:'ready',index:data.index,slide:cue.slide});
}
scriptChannel?.addEventListener('message', ({data}) => { void scriptCommand(data); });

function showProvider() {
  const prepared = captionMode === 'script';
  $('caption-mode').value = captionMode; $('speech-language').value = speechLanguage;
  $('script-settings').hidden = !prepared; $('translation-settings').hidden = prepared;
  showAutoAdvance();
  $('script-note').textContent = preparedScript ? `${preparedScript.cues.length}개 구간 · 한국어·베트남어 초안 · OpenAI 음성 인식` : '원고 준비 화면에서 원고를 확인해 주세요.';
  if (prepared) {
    $('source-language').textContent = speechLanguage === 'auto' ? 'EN / KO' : speechLanguage.toUpperCase();
    $('caption-help').textContent = '발표 시작 → 한국어 인사 → 영어 전환. 자막이 자동으로 따라옵니다.';
    $('privacy-note').textContent = '음성과 현재 장표의 원고 일부가 음성 인식을 위해 OpenAI로 전송되며 API 사용료가 발생합니다. 발표 중 번역은 요청하지 않습니다. 원고는 이 브라우저에 저장하고, 앱은 녹음과 인식 내용을 저장하지 않습니다.';
    return;
  }
  const azure = provider === 'azure';
  $('caption-provider').value = provider;
  $('source-language').textContent = azure ? 'EN' : 'EN / KO';
  $('caption-help').textContent = azure ? '영어로 말하면 베트남어·한국어 자막이 표시됩니다.' : '영어나 한국어로 말하면 두 언어 자막이 표시됩니다.';
  $('provider-note').textContent = azure
    ? providerHealth?.providers?.azure?.available ? 'Azure 설정됨 · 영어 → 베트남어 / 한국어' : 'Azure 키 설정이 필요합니다. 아래 안내를 따라 한 번만 설정해 주세요.'
    : 'OpenAI · 음성 인식 후 두 언어로 번역합니다.';
  $('privacy-note').textContent = azure
    ? '음성이 Microsoft Azure로 전송됩니다. Azure 음성 번역 사용료가 발생할 수 있습니다. 음성과 자막은 이 앱에 저장하지 않습니다.'
    : '음성과 인식된 문장이 OpenAI로 전송됩니다. 음성 인식과 자막 번역에 API 사용료가 발생합니다. 음성과 자막은 이 앱에 저장하지 않습니다.';
}

function showAutoAdvance() {
  const prepared = captionMode === 'script';
  $('auto-slide').checked = autoAdvance;
  $('auto-slide').disabled = !prepared;
  $('auto-slide-button').disabled = !prepared;
  $('auto-slide-button').setAttribute('aria-pressed',String(autoAdvance && prepared));
  $('auto-slide-button').textContent = `자동 넘김 ${autoAdvance && prepared ? 'ON' : 'OFF'}`;
  if (!$('speaker-panel').hidden) renderSpeakerPanel();
}
function setAutoAdvance(enabled) {
  if (captionMode !== 'script') return;
  autoAdvance = Boolean(enabled);
  peers[0]?.setAutoAdvance?.(autoAdvance);
  try { localStorage.setItem('workshop-auto-slide-v1',String(autoAdvance)); } catch {}
  showAutoAdvance();
}

function notify(message) { $('notification').textContent = message; $('notification').hidden = false; }
function hideNotice() { $('notification').hidden = true; }
function setStatus(label, kind = '') { $('status-text').textContent = label; $('live-status').className = `live-status ${kind}`; }
function updateState() {
  if (!running && !starting) return;
  if (states.vi === 'live' && states.ko === 'live') setStatus('듣고 있습니다', 'live');
  else if (Object.values(states).includes('reconnecting')) setStatus('연결 확인 중', 'error');
  else setStatus('연결 중');
}
function drawCaptions() {
  renderFrame = null;
  $('captions').classList.toggle('caption-session', running || starting || isDemo || manualCaption);
  for (const language of ['vi', 'ko']) {
    if (captionMode === 'script' && !isDemo) {
      elements[language].textContent = buffers[language].text;
      elements[language].style.removeProperty('font-size');
      // A prepared cue must never lose its beginning to the live-caption tail crop.
      const base = parseFloat(getComputedStyle(elements[language]).fontSize);
      for (let size = base; elements[language].scrollHeight > parseFloat(getComputedStyle(elements[language]).lineHeight)*2+2 && size > 11; size -= 1) elements[language].style.fontSize = `${size-1}px`;
    } else { elements[language].style.removeProperty('font-size'); renderCaption(elements[language], buffers[language].text); }
    elements[language].parentElement.classList.toggle('caption-fading', buffers[language].fading);
  }
  $('caption-placeholder').hidden = Boolean(running || starting || isDemo || buffers.vi.text || buffers.ko.text);
}
function queueDraw() { if (!renderFrame) renderFrame = requestAnimationFrame(drawCaptions); }
function scheduleCaptionExpiry() {
  clearTimeout(captionExpiryTimer);
  // During a presentation, keep the last caption until the next cue replaces it.
  if (!isDemo) return;
  const at = Math.min(...Object.values(buffers).map(buffer => buffer.nextExpiry));
  if (!Number.isFinite(at)) return;
  captionExpiryTimer = setTimeout(() => {
    for (const buffer of Object.values(buffers)) buffer.expire();
    queueDraw(); scheduleCaptionExpiry();
  }, Math.max(0, at - Date.now()));
}
function clearCaptions() {
  clearTimeout(captionExpiryTimer); captionCue = -1;
  for (const buffer of Object.values(buffers)) buffer.clear();
  queueDraw();
}
function addDelta(language, delta, id) {
  if (buffers[language].append(delta, id)) { queueDraw(); scheduleCaptionExpiry(); }
}
function replaceCaption(language, text, complete = false, { cue, revision }) {
  if (!text.trim() || cue < captionCue) return;
  if (cue !== captionCue) {
    // Retire both old-language lines together when the next cue first arrives.
    // The slower language stays empty until its matching translation is ready.
    clearCaptions(); captionCue = cue;
  }
  if (buffers[language].replace(text, { complete, revision })) {
    queueDraw();
    scheduleCaptionExpiry();
  }
}
function showSlideLanguage(animate = false, dissolve = false) {
  const english = slideLanguage === 'en';
  const fadeDuration=motionPaused?0:OPENING_FADE_MS;
  const sceneReady = dissolve ? motionDeck.dissolve(index,slideLanguage,fadeDuration) : motionDeck.show(index, slideLanguage, animate && !motionPaused);
  $('slide-image').hidden = english;
  $('slide-image-en').hidden = !english;
  let sourceReady=Promise.resolve();
  if(dissolve && sourceMode && fadeDuration && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const load=slideLoad;
    $('slide-image').hidden=false;
    sourceOpeningAnimation=$('slide-image-en').animate([{opacity:0},{opacity:1}],{duration:fadeDuration,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});
    const animation=sourceOpeningAnimation;
    sourceReady=animation.finished.catch(()=>{}).then(()=>{
      animation.cancel();if(sourceOpeningAnimation===animation)sourceOpeningAnimation=null;
      if(load===slideLoad && slideLanguage==='en')$('slide-image').hidden=true;
    });
  }
  $('language-button').setAttribute('aria-pressed', String(english));
  $('language-button').setAttribute('aria-label', english ? '현재 슬라이드를 한국어로 보기' : '현재 슬라이드를 영어로 보기');
  $('language-button').title = `${english ? '한국어' : '영어'}로 전환 · E`;
  $('language-button').textContent = english ? '한국어' : 'English';
  // Only the slide layer changes. Caption nodes, streams and translation sessions stay intact.
  for (const [i, button] of [...$('slide-grid').children].entries()) {
    const slide = deck.slides[i];
    button.querySelector('img').src = sourceMode ? (english ? slide.imageEn : slide.image) : previewUrl(slideLanguage,i);
    button.querySelector('span').textContent = String(i + 1).padStart(2, '0') + '  ' + sceneTitles[slideLanguage][i];
  }
  try { sessionStorage.setItem('workshop-language-english-v16', slideLanguage); } catch {}
  publishSlide();
  return Promise.all([sceneReady,sourceReady]);
}
function rememberOpening(){try{sessionStorage.setItem(OPENING_KEY,opening.phase==='ko'?'ko':'en');}catch{}}
async function transitionOpening(){
  if(!deck||index!==0)return;
  const token=opening.begin();if(token===null)return;
  slideLanguage='en';rememberOpening();
  try{await showSlideLanguage(false,true);}
  finally{if(opening.finish(token)){rememberOpening();publishSlide();}}
}
function nextSlide(){
  if(index===0 && opening.phase!=='en'){
    if(opening.phase==='ko')void transitionOpening();
    return;
  }
  setSlide(index+1);
}
function restartOpening(){
  if(!deck)return;
  promo.reset();
  sourceOpeningAnimation?.cancel();sourceOpeningAnimation=null;
  opening.reset();slideLanguage='ko';rememberOpening();
  if(index===0)showSlideLanguage();else setSlide(0);
  peers[0]?.resetInput?.();
  if(!$('speaker-panel').hidden)renderSpeakerPanel();
}
function toggleSlideLanguage() {
  if (!deck || $('language-button').disabled) return;
  if(index===0 && opening.phase!=='en'){if(opening.phase==='ko')void transitionOpening();return;}
  slideLanguage = slideLanguage === 'ko' ? 'en' : 'ko';
  showSlideLanguage();
}
function toggleSourceMode() {
  sourceMode = !sourceMode;
  motionDeck.media.setState({visible:!sourceMode&&!document.hidden});
  document.querySelector('.slide-stack').classList.toggle('source-mode', sourceMode);
  $('source-mode-button').setAttribute('aria-pressed', String(sourceMode));
  $('source-mode-button').textContent = sourceMode ? '모션' : '원본';
  $('source-mode-button').title = sourceMode ? '모션 장표 보기 · O' : '원본 장표 보기 · O';
  $('motion-viewport').inert = sourceMode;
  $('image-error').hidden = true;
  showSlideLanguage();
  try { sessionStorage.setItem('workshop-source-mode-english-v16', String(sourceMode)); } catch {}
}
function showNotes() {
  if (!deck) return;
  const note = motionDeck.notes(deck);
  $('notes-heading').textContent = note.title;
  $('notes-text').textContent = note.text;
  $('notes-cue').textContent = note.ko + '\n진행: ' + note.cue;
  $('notes-sources').replaceChildren(...note.sources.map(source => {
    const link = document.createElement('a');
    link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = source.title + ' · ' + source.date;
    return link;
  }));
  $('source-text').textContent = note.source;
  $('notes-dialog').querySelector('details').open = false;
  $('notes-dialog').showModal();
}
function replayMotion() {
  if (sourceMode || motionPaused || opening.phase==='changing') return;
  motionDeck.replay();
}
function pauseMotion() {
  motionPaused = !motionPaused;
  motionDeck.media.setState({paused:motionPaused});
  // Never leave content half-clipped when pausing an entrance.
  motionDeck.show(index, slideLanguage, false);
  document.body.classList.toggle('motion-paused', motionPaused);
  $('pause-motion-button').setAttribute('aria-pressed', String(motionPaused));
  $('pause-motion-button').textContent = motionPaused ? '▶' : 'Ⅱ';
  $('pause-motion-button').title = motionPaused ? '움직임 켜기 · P' : '움직임 멈추기 · P';
  $('pause-motion-button').setAttribute('aria-label', motionPaused ? '움직임 켜기' : '움직임 멈추기');
}
function warmNextSlide() {
  const next = deck.slides[index + 1];
  const sources = next ? [next.image, next.imageEn] : [];
  for (const [src] of warmedImages) if (!sources.includes(src)) warmedImages.delete(src);
  for (const src of sources) if (src && !warmedImages.has(src)) { const img = new Image(); img.src = src; warmedImages.set(src,img); void img.decode().catch(() => {}); }
}
function setSlide(next) {
  if (!deck) return;
  const target = Math.max(0, Math.min(deck.slides.length - 1, next));
  if(promo.active)return;
  if(index===1 && target===2 && !promo.played){promo.start();return;}
  if (slideLoad && target === index) return;
  sourceOpeningAnimation?.cancel();sourceOpeningAnimation=null;
  if(target>0 && opening.phase!=='en'){opening.skip();slideLanguage='en';rememberOpening();}
  index = target;
  if (!$('speaker-panel').hidden) renderSpeakerPanel();
  peers[0]?.setSlide(index + 1);
  const slide = deck.slides[index];
  const load = ++slideLoad;
  $('slide-image').src = slide.image;
  $('slide-image').alt = `${index + 1}장. ${slide.text}`;
  $('slide-image-en').src = slide.imageEn;
  $('slide-image-en').alt = `Slide ${index + 1}. ${slide.textEn}`;
  $('language-button').disabled = false;
  showSlideLanguage(true);
  // Decode the current pair in advance so the language switch is one visibility change.
  void Promise.all([$('slide-image').decode(), $('slide-image-en').decode()]).then(() => {
    if (load !== slideLoad) return;
    $('language-button').disabled = false;
    $('image-error').hidden = true;
    warmNextSlide();
  }).catch(() => { if (load === slideLoad && sourceMode) $('image-error').hidden = false; });
  $('page-number').textContent = index + 1;
  $('previous-slide').disabled = $('footer-previous').disabled = index === 0;
  $('next-slide').disabled = $('footer-next').disabled = index === deck.slides.length - 1;
  for (const [i, node] of [...$('slide-grid').children].entries()) node.classList.toggle('current', i === index);
  try { sessionStorage.setItem(OPENING_SLIDE_KEY, index); } catch {}
  // Slide changes never reset the microphone, sessions, or current captions.
}
function stopDemo() {
  for (const timer of demoTimers) clearTimeout(timer);
  demoTimers = [];
  isDemo = false;
  $('demo-badge').hidden = true;
  $('demo-button').textContent = '자막 모양 미리보기';
}
function stopLive(message = '중지됨') {
  generation++;
  starting = false;
  running = false;
  for (const peer of peers) peer.close();
  peers = [];
  microphone?.getTracks().forEach(track => track.stop());
  microphone = null;
  if (meterFrame) cancelAnimationFrame(meterFrame);
  meterFrame = null;
  if (audioContext) void audioContext.close().catch(() => {});
  audioContext = null;
  clearInterval(elapsedTimer);
  $('mic-level').style.width = '0%';
  $('microphone-status').textContent = '발표를 시작하면 마이크 입력 상태가 표시됩니다.';
  $('microphone').disabled = false;
  $('caption-provider').disabled = false;
  $('caption-mode').disabled = $('speech-language').disabled = false;
  $('start-label').textContent = '발표 시작';
  $('start-button').classList.remove('active');
  setStatus(message);
  manualCaption = false; clearCaptions();
  if (captionMode === 'script') publishScript({state:'stopped',index:scriptProgress.index});
  queueDraw();
}
function failLive(error, run) {
  if (run !== generation) return;
  stopLive('연결 중단');
  setStatus('연결 중단', 'error');
  notify(error.message || '번역 연결에 실패했습니다. 다시 시작해 주세요.');
}
async function listMicrophones() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    const selected = $('microphone').value;
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput');
    $('microphone').replaceChildren(new Option('시스템 기본 마이크', ''));
    for (const [i, device] of devices.entries()) { if (device.deviceId) $('microphone').add(new Option(device.label || `마이크 ${i + 1}`, device.deviceId)); }
    if ([...$('microphone').options].some(o => o.value === selected)) $('microphone').value = selected;
  } catch {}
}
function startMeter(stream) {
  try {
    audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const values = new Uint8Array(analyser.fftSize);
    let last = 0;
    const tick = now => {
      if (!audioContext) return;
      if (now - last > 100) {
        analyser.getByteTimeDomainData(values);
        const rms = Math.sqrt(values.reduce((s, x) => s + ((x - 128) / 128) ** 2, 0) / values.length);
        $('mic-level').style.width = `${Math.min(100, rms * 550)}%`;
        if (rms > .012) analyser.lastVoiceAt = now;
        $('microphone-status').textContent = now - (analyser.lastVoiceAt || 0) < 1200 ? '음성 입력이 들어오고 있습니다.' : '마이크 연결됨 · 입력 대기';
        peers[0]?.speechLevel(rms, now);
        last = now;
      }
      meterFrame = requestAnimationFrame(tick);
    };
    meterFrame = requestAnimationFrame(tick);
  } catch {}
}
async function startLive() {
  if (running || starting) { stopLive(); return; }
  stopDemo(); hideNotice(); clearCaptions(); manualCaption = false;
  if(index===0 && opening.phase!=='en' && captionMode==='script')speechLanguage='auto';
  $('recognized-speech').textContent = '한국어 인사 후 영어로 이어서 말씀하세요. 여기에 인식된 문장이 표시됩니다.';
  const run = ++generation;
  starting = true;
  $('caption-provider').disabled = true;
  $('caption-mode').disabled = $('speech-language').disabled = true;
  $('start-label').textContent = '연결 취소';
  $('start-button').classList.add('active');
  setStatus('마이크 준비');
  try {
    const health = await fetch('/api/health').then(r => r.json());
    if (run !== generation) return;
    providerHealth = health; showProvider();
    const activeProvider = captionMode === 'script' ? 'openai' : provider;
    if (!(health.providers?.[activeProvider]?.available ?? (activeProvider === 'openai' && health.available))) throw new Error(activeProvider === 'azure' ? 'Azure 설정이 필요합니다. 설정의 Azure 생성·설정 안내를 확인해 주세요.' : 'OpenAI API 키가 설정되지 않았습니다. 실행 안내를 확인해 주세요.');
    if (captionMode === 'script') { preparedScript = await loadScript(); if (run !== generation) return; showProvider(); }
    if (!navigator.mediaDevices?.getUserMedia || (activeProvider === 'openai' && typeof RTCPeerConnection !== 'function')) throw new Error('Chrome 또는 Edge에서 localhost 주소로 열어 주세요.');
    const deviceId = $('microphone').value;
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { ...(deviceId ? { deviceId: { exact: deviceId } } : {}), echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    if (run !== generation) { stream.getTracks().forEach(t => t.stop()); return; }
    microphone = stream;
    for (const track of stream.getAudioTracks()) track.onended = () => failLive(new Error('마이크 연결이 끊어졌습니다. 마이크를 확인하고 다시 시작해 주세요.'), run);
    $('microphone').disabled = true;
    await listMicrophones();
    startMeter(stream);
    states.vi = states.ko = 'connecting';
    const Captions = captionMode === 'script' ? ScriptCaptions : provider === 'azure' ? AzureCaptions : FastCaptions;
    peers = [new Captions(stream, {
      slide: index + 1,
      script: preparedScript, speechLanguage, autoRecover: true, autoAdvance,
      onSlide: slide => { if (run === generation && autoAdvance && slide === index+2) setSlide(slide-1); },
      onClear: () => { if (run === generation) clearCaptions(); },
      onProgress: progress => { if (run === generation) progressScript(progress); },
      onTranscript: (text,meta) => { if(run!==generation)return; if(index===0 && opening.feed(text,meta))void transitionOpening(); if(meta.final && scriptProgress.state==='matched' && isVideoIntro(scriptProgress) && !promo.played)promo.start(); },
      onText: (language, text, complete, cue) => { if (run === generation && !promo.active) replaceCaption(language, text, complete, cue); },
      onState: (language, state) => { if (run === generation) { states[language] = state; updateState(); } },
      onError: error => failLive(error, run),
    })];
    if (captionMode === 'script' && preparedScript.cues[scriptProgress.index]?.slide === index+1 && scriptProgress.state === 'ready') peers[0].seek(scriptProgress.index);
    await Promise.all(peers.map(peer => peer.start()));
    if (run !== generation) return;
    starting = false; running = true; startedAt = Date.now();
    $('start-label').textContent = '발표 종료';
    updateState();
    if (captionMode === 'script') publishScript({state:'ready',index:peers[0].matcher.next,slide:index+1});
    elapsedTimer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      $('elapsed').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }, 1000);
  } catch (error) {
    if (run !== generation) return;
    const message = error.name === 'NotAllowedError' ? '마이크 권한을 허용한 뒤 다시 시작해 주세요.' : error.name === 'NotFoundError' ? '마이크를 찾지 못했습니다. 마이크 연결을 확인해 주세요.' : error.message;
    failLive(new Error(message), run);
  }
}
function demo() {
  if (running || starting) { notify('자막 미리보기를 보려면 실시간 자막을 먼저 중지해 주세요.'); return; }
  if (isDemo) { stopDemo(); clearCaptions(); setStatus('준비'); return; }
  hideNotice(); clearCaptions(); isDemo = true; $('demo-badge').hidden = false;
  $('demo-button').textContent = '미리보기 중지';
  $('settings-dialog').close();
  setStatus('미리보기');
  const samples = [
    { vi: 'Thành phố Seongnam đang phát triển một hệ sinh thái bán dẫn hệ thống.', ko: '성남시는 시스템반도체 생태계를 조성하고 있습니다.' },
    { vi: 'Chúng tôi tập trung vào ba yếu tố: cơ sở hạ tầng, nhân tài và không gian.', ko: '우리는 인프라, 인재, 공간이라는 세 가지 요소에 집중합니다.' },
    { vi: 'Xin cảm ơn quý vị đã lắng nghe.', ko: '경청해 주셔서 감사합니다.' },
  ];
  for (const [i, sample] of samples.entries()) {
    demoTimers.push(setTimeout(() => {
      if (!isDemo) return;
      clearCaptions();
      for (const language of ['vi', 'ko']) {
        const words = sample[language].split(' ');
        for (const [j, word] of words.entries()) demoTimers.push(setTimeout(() => { if (isDemo) addDelta(language, (j ? ' ' : '') + word); }, j * (language === 'vi' ? 120 : 210)));
      }
    }, i * 6500));
  }
}
async function fullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { notify('브라우저 메뉴에서 전체 화면을 선택해 주세요.'); } }
$('start-button').addEventListener('click', startLive);
$('auto-slide').addEventListener('change', () => setAutoAdvance($('auto-slide').checked));
$('auto-slide-button').addEventListener('click', () => setAutoAdvance(!autoAdvance));
$('settings-button').addEventListener('click', () => { void listMicrophones(); $('settings-dialog').showModal(); });
$('overview-button').addEventListener('click', () => $('overview-dialog').showModal());
$('demo-button').addEventListener('click', demo);
$('fullscreen-button').addEventListener('click', fullscreen);
$('language-button').addEventListener('click', toggleSlideLanguage);
$('source-mode-button').addEventListener('click', toggleSourceMode);
$('notes-button').addEventListener('click', showNotes);
$('speaker-button').addEventListener('click', openSpeaker);
$('speaker-close').addEventListener('click', () => setSpeakerPanel(false));
$('speaker-window').addEventListener('click', openSpeakerWindow);
$('ipad-link').addEventListener('click',async()=>{
  const container=$('ipad-links');container.replaceChildren();$('ipad-dialog').showModal();
  try {
    const r=await fetch('/api/ipad-link');if(!r.ok)throw Error();const {urls}=await r.json();
    if(!urls.length){container.textContent='Wi-Fi 주소를 찾지 못했습니다. PC와 아이패드를 같은 Wi-Fi에 연결해 주세요.';return;}
    for(const url of urls){
      const card=document.createElement('div');card.className='ipad-qr-card';
      const qr=qrcode(0,'M');qr.addData(url);qr.make();const n=qr.getModuleCount(),quiet=4,scale=8;
      const canvas=document.createElement('canvas');canvas.width=canvas.height=(n+quiet*2)*scale;canvas.className='ipad-qr';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','아이패드 프롬프터 연결 QR 코드');
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';
      for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))ctx.fillRect((x+quiet)*scale,(y+quiet)*scale,scale,scale);
      const address=document.createElement('p');address.className='ipad-address';address.textContent=url;
      card.append(canvas,address);container.append(card);
    }
  }catch{container.textContent='아이패드 연결을 준비하지 못했습니다. 앱을 다시 시작해 주세요.';}
});
$('speaker-panel-prev').addEventListener('click', () => setSlide(index-1));
$('speaker-panel-next').addEventListener('click', nextSlide);
$('replay-button').addEventListener('click', replayMotion);
$('pause-motion-button').addEventListener('click', pauseMotion);
$('caption-mode').addEventListener('change', () => {
  if (running || starting) return;
  stopDemo(); manualCaption = false; clearCaptions();
  captionMode = $('caption-mode').value === 'live' ? 'live' : 'script';
  try { localStorage.setItem('workshop-caption-mode',captionMode); } catch {}
  showProvider();
});
$('speech-language').addEventListener('change', () => {
  if (running || starting) return;
  speechLanguage = ['en','ko'].includes($('speech-language').value) ? $('speech-language').value : 'auto';
  try { localStorage.setItem('workshop-speech-language',speechLanguage); } catch {}
  showProvider(); publishScript();
});
$('caption-provider').addEventListener('change', event => {
  if (running || starting) return;
  provider = event.target.value === 'azure' ? 'azure' : 'openai';
  try { localStorage.setItem('workshop-provider', provider); } catch {}
  hideNotice(); showProvider();
});
for (const id of ['previous-slide', 'footer-previous']) $(id).addEventListener('click', () => setSlide(index - 1));
for (const id of ['next-slide', 'footer-next']) $(id).addEventListener('click', nextSlide);
$('slide-image').addEventListener('error', () => { if (sourceMode) $('image-error').hidden = false; });
$('slide-image').addEventListener('load', () => $('image-error').hidden = true);
$('slide-image-en').addEventListener('error', () => { if (sourceMode) $('image-error').hidden = false; });
$('caption-size').addEventListener('input', event => { const value = Number(event.target.value); document.documentElement.style.setProperty('--caption-scale', value / 100); $('caption-size-output').textContent = `${value}%`; queueDraw(); });
$('show-labels').addEventListener('change', event => { $('captions').classList.toggle('no-labels', !event.target.checked); queueDraw(); });
document.addEventListener('fullscreenchange', () => {
  const presenting = Boolean(document.fullscreenElement);
  document.body.classList.toggle('presenting', presenting);
  $('fullscreen-button').setAttribute('aria-label', presenting ? '전체 화면 나가기' : '전체 화면');
  $('toolbar').inert = presenting;
  $('navigation').inert = presenting;
  if (presenting && document.activeElement instanceof HTMLElement) document.activeElement.blur();
  queueDraw();
});
document.addEventListener('keydown', event => {
  if(promo.active){if(['Escape','ArrowRight','PageDown'].includes(event.key)){event.preventDefault();promo.finish(true);}else if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();promo.finish(false);}return;}
  if (document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'Escape' && !$('speaker-panel').hidden) setSpeakerPanel(false);
  if (event.target.tagName === 'BUTTON' && [' ', 'Enter'].includes(event.key)) return;
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); if(!event.repeat)nextSlide(); }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); setSlide(index - 1); }
  if (event.key === 'Home') restartOpening();
  if (event.key === 'End') setSlide(deck.slides.length - 1);
  if (event.key.toLowerCase() === 'f') void fullscreen();
  if (event.key.toLowerCase() === 'e') toggleSlideLanguage();
  if (event.key.toLowerCase() === 'g') $('overview-dialog').showModal();
  if (event.key.toLowerCase() === 'm') void startLive();
  if (event.key.toLowerCase() === 'n') showNotes();
  if (event.key.toLowerCase() === 's') openSpeaker();
  if (event.key.toLowerCase() === 'r') replayMotion();
  if (event.key.toLowerCase() === 'o') toggleSourceMode();
  if (event.key.toLowerCase() === 'p') pauseMotion();
  if (event.key.toLowerCase() === 'a') setAutoAdvance(!autoAdvance);
  if (captionMode === 'script' && preparedScript && ['[',']'].includes(event.key)) {
    const target = Math.max(0,Math.min(preparedScript.cues.length-1,(scriptProgress.index || 0)+(event.key === ']' ? 1 : -1)));
    void scriptCommand({type:'seek',index:target,signature:scriptSignature(preparedScript),speechLanguage});
  }
  if (captionMode === 'script' && event.key.toLowerCase() === 'b') pauseScript();
});
window.addEventListener('resize', queueDraw);
document.addEventListener('visibilitychange',()=>motionDeck.media.setState({visible:!sourceMode&&!document.hidden}));
window.addEventListener('pagehide', () => { stopDemo(); stopLive(); });
try {
  const response = await fetch('/deck.json');
  if (!response.ok) throw new Error();
  deck = await response.json();
  $('page-total').textContent = deck.slides.length;
  for (const [i, slide] of deck.slides.entries()) {
    const button = document.createElement('button'); button.className = 'thumbnail';
    button.setAttribute('aria-label', `${i + 1}장으로 이동`);
    const image = new Image(); image.src = previewUrl('ko',i); image.alt = ''; image.loading = 'lazy';
    const label = document.createElement('span'); label.textContent = String(i + 1).padStart(2, '0');
    button.append(image, label); button.addEventListener('click', () => { setSlide(i); $('overview-dialog').close(); });
    $('slide-grid').append(button);
  }
  let saved = 0; try { saved = Number(sessionStorage.getItem(OPENING_SLIDE_KEY) || 0); slideLanguage = sessionStorage.getItem('workshop-language-english-v16') === 'ko' ? 'ko' : 'en'; if(sessionStorage.getItem(OPENING_KEY)==='en')opening.skip(); } catch {}
  const requestedLanguage = new URLSearchParams(location.search).get('lang');
  if (['en','ko'].includes(requestedLanguage)) slideLanguage = requestedLanguage;
  if(!saved && opening.phase==='ko')slideLanguage='ko';
  setSlide(Number.isFinite(saved) ? saved : 0);
  try { if (sessionStorage.getItem('workshop-source-mode-english-v16') === 'true') toggleSourceMode(); } catch {}
  const health = await fetch('/api/health').then(r => r.json());
  providerHealth = health;
  let savedProvider; try { savedProvider = localStorage.getItem('workshop-provider'); } catch {}
  provider = ['azure', 'openai'].includes(savedProvider) ? savedProvider : health.defaultProvider || 'openai';
  // A fresh presentation always starts ready for its prepared captions in either language.
  // Old operator preferences must not make the main Start button require setup.
  captionMode = 'script'; speechLanguage = 'auto';
  try { preparedScript = await loadScript(); } catch(e) { notify(e.message); }
  showProvider();
  try { if(sessionStorage.getItem('workshop-speaker-open-v1')==='true')setSpeakerPanel(true); } catch {}
  if (!health.available) notify('API 키를 설정하면 실시간 자막을 사용할 수 있습니다. 슬라이드와 자막 미리보기는 지금 사용할 수 있습니다.');
} catch { notify('발표 자료를 불러오지 못했습니다. 실행 파일로 서버를 시작한 뒤 다시 열어 주세요.'); }
watchPresentation({isBusy:()=>running||starting||isDemo||promo.active||Boolean(document.fullscreenElement)||Boolean(document.querySelector('dialog[open]')),pendingText:'수정본 준비됨 · 발표 종료 후 자동 반영'});
