import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/sajw1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
const errors=[],layouts=[];let paid=0;
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/updates',r=>r.abort());
await page.route(/\/api\/(transcription-session|session|caption-translation|azure-token)$/,r=>{paid++;return r.abort();});
const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function geometry(){
 await frame();
 const result=await page.evaluate(()=>{
  const scene=document.querySelector('.scene').getBoundingClientRect(),stage=document.querySelector('.slide-stack').getBoundingClientRect(),canvas=document.querySelector('.motion-canvas').getBoundingClientRect();
  const scale=Math.min(stage.width/1440,stage.height/810);
  return {scene:scene.toJSON(),canvas:canvas.toJSON(),stage:stage.toJSON(),expected:{width:1440*scale,height:810*scale,x:stage.x+(stage.width-1440*scale)/2,y:stage.y+(stage.height-810*scale)/2},fullscreen:!!document.fullscreenElement};
 });
 for(const key of ['width','height','x','y']){
  assert.ok(Math.abs(result.scene[key]-result.expected[key])<.2,`Native slide ${key}: ${JSON.stringify(result)}`);
  assert.ok(Math.abs(result.canvas[key]-result.scene[key])<.2,'Canvas must have no subtitle reserve');
 }
 return result;
}
async function caption(slide){
 const text=await page.evaluate(async slide=>{
  const {loadScript,scriptSignature,SCRIPT_CHANNEL}=await import('/script-store.js');
  const script=await loadScript(),cue=script.cues.filter(c=>c.slide===slide).sort((a,b)=>b.vi.length-a.vi.length)[0];
  const channel=new BroadcastChannel(SCRIPT_CHANNEL);channel.postMessage({type:'manual',index:script.cues.indexOf(cue),signature:scriptSignature(script),speechLanguage:'en'});setTimeout(()=>channel.close(),100);
  return cue.vi;
 },slide);
 await page.waitForFunction(t=>document.getElementById('caption-vi').textContent===t,text);await frame();
 const s=await page.locator('.scene').boundingBox(),c=await page.locator('#captions').boundingBox();
 assert.ok(c.y>=s.y&&c.y+c.height<=s.y+s.height+.2&&c.x>=s.x&&c.x+c.width<=s.x+s.width+.2,'Captions must overlay the slide itself');
 const style=await page.locator('#captions').evaluate(e=>({position:getComputedStyle(e).position,background:getComputedStyle(e).backgroundColor,clipped:e.scrollHeight>e.clientHeight+1}));
 assert.equal(style.position,'absolute');assert.equal(style.background,'rgba(0, 0, 0, 0.72)');assert.equal(style.clipped,false);
 return c;
}
try{
 await fs.mkdir('.build/full-slide-qa',{recursive:true});
 await page.goto('http://127.0.0.1:3230/?lang=en');await page.waitForFunction(()=>document.getElementById('script-note').textContent.includes('50'));
 const normal=await geometry();await caption(1);assert.deepEqual((await geometry()).scene,normal.scene);
 await page.keyboard.press('b');await page.keyboard.press('f');await page.waitForFunction(()=>!!document.fullscreenElement);
 for(const n of [1,2,7,8,9,11]){
  await page.evaluate(n=>{const c=new BroadcastChannel('seongnam-presenter-v16-intro');c.postMessage({type:'navigate',index:n-1});setTimeout(()=>c.close(),100);},n);
  await page.waitForSelector(`.scene[data-scene="${n}"]`);const before=await geometry();
  assert.equal(before.scene.width,1920);assert.equal(before.scene.height,1080);assert.equal(before.scene.x,0);assert.equal(before.scene.y,0);
  const overlay=await caption(n);assert.deepEqual((await geometry()).scene,before.scene);
  assert.equal(await page.locator('#toolbar').isVisible(),false);assert.equal(await page.locator('#navigation').isVisible(),false);
  if(n===8){await page.locator('.scene img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:'.build/full-slide-qa/research-fullscreen-overlay.png'});}
  layouts.push({slide:n,...before,overlay});await page.keyboard.press('b');
 }
 const beforePanel=(await geometry()).scene;await page.keyboard.press('s');assert.deepEqual((await geometry()).scene,beforePanel);await page.keyboard.press('s');
 for(const [width,height] of [[1600,900],[1366,768],[1280,1024]]){
  await page.setViewportSize({width,height});const before=await geometry();await caption(10);assert.deepEqual((await geometry()).scene,before.scene);
  await page.keyboard.press('o');await frame();const image=await page.locator('#slide-image-en').boundingBox();
  for(const key of ['width','height','x','y'])assert.ok(Math.abs(image[key]-before.scene[key])<.2,'Source view must match native slide bounds');
  await page.keyboard.press('o');await page.keyboard.press('b');layouts.push({width,height,...before});
 }
 await page.keyboard.press('f');await page.waitForFunction(()=>!document.fullscreenElement);const windowed=(await geometry()).scene;
 await page.keyboard.press('s');assert.deepEqual((await geometry()).scene,windowed);await page.keyboard.press('s');
 assert.equal(paid,0);assert.deepEqual(errors,[]);
 const result={native16by9:true,fullHD1920by1080:true,noSubtitleReserve:true,captionOverlay:true,captionAlpha:.72,unchangedWithCaptionsOrScriptPanel:true,sourceViewSameSize:true,layouts,paid,errors};
 await fs.writeFile('.build/full-slide-qa/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,layouts:layouts.length}));
}finally{await browser.close();}
