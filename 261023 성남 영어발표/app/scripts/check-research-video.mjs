import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/sajw1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright'),sharp=require('sharp');
const base=process.env.TEST_URL||'http://127.0.0.1:3236/';
const child=process.env.TEST_URL?null:spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),windowsHide:true,stdio:'ignore',env:{...process.env,PORT:'3236',OPENAI_API_KEY:'',AZURE_SPEECH_KEY:'',CAPTION_ENV_FILE:path.resolve('.build/.no-video-test-key')}});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[];let paid=0;
await fs.mkdir('.build/research-video/qa',{recursive:true});
async function makeContext(reducedMotion='no-preference'){
 const context=await browser.newContext({viewport:{width:1600,height:1200},reducedMotion});
 context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
 await context.addInitScript(()=>{try{sessionStorage.setItem('workshop-slide-korean-opening-v1','7');}catch{}});
 await context.route('**/api/updates',r=>r.abort());
 await context.route(/\/api\/(transcription-session|session|caption-translation|azure-token)$/,r=>{paid++;return r.abort();});
 return context;
}
try{
 for(let i=0;i<50;i++){if(await fetch(base+'api/health').then(r=>r.ok,()=>false))break;await new Promise(r=>setTimeout(r,100));}
 const file=await fs.readFile('public/assets/research-video/research-center-orbit.mp4'),url=base+'assets/research-video/research-center-orbit.mp4';
 for(const [range,status,start,end] of [['bytes=0-99',206,0,99],['bytes=-100',206,file.length-100,file.length-1],['bytes=100-',206,100,file.length-1],['bytes=999999999-',416],['bytes=20-10',416],['bytes=-',416]]){
  const res=await fetch(url,{headers:{Range:range}});assert.equal(res.status,status,range);
  if(status===206){assert.equal(res.headers.get('content-type'),'video/mp4');assert.equal(res.headers.get('content-range'),`bytes ${start}-${end}/${file.length}`);assert.deepEqual(Buffer.from(await res.arrayBuffer()),file.subarray(start,end+1));}
 }
 const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(Number(head.headers.get('content-length')),file.length);assert.equal((await head.arrayBuffer()).byteLength,0);
 const context=await makeContext(),page=await context.newPage();
 await page.goto(base+'?lang=en');
 try{await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.35,{},{timeout:8000});}catch(e){console.log(JSON.stringify(await page.evaluate(()=>({text:document.body.innerText,video:document.querySelector('video')&&{src:document.querySelector('video').currentSrc,ready:document.querySelector('video').readyState,error:document.querySelector('video').error?.message,paused:document.querySelector('video').paused,hidden:document.querySelector('video').hidden},errors:window.errors}))));console.log(JSON.stringify(errors));throw e;}
 assert.equal(await page.locator('video').evaluate(v=>v.muted&&!v.loop),true);
 assert.ok(await page.locator('.research-year').innerText().then(t=>t.includes('2030')));
 await page.evaluate(()=>window.oldVideo=document.querySelector('video'));
 await page.keyboard.press('p');const paused=await page.locator('video').evaluate(v=>v.currentTime);
 await page.waitForTimeout(250);assert.equal(await page.locator('video').evaluate(v=>v.currentTime),paused);
 await page.keyboard.press('p');await page.waitForFunction(t=>document.querySelector('video').currentTime>t+.1,paused);
 await page.keyboard.press('o');assert.equal(await page.locator('video').evaluate(v=>v.paused),true);await page.keyboard.press('o');
 await page.waitForFunction(()=>!document.querySelector('video').paused);
 await page.locator('[data-video-toggle]').click();assert.equal(await page.locator('video').evaluate(v=>v.paused),true);
 await page.locator('[data-video-toggle]').click();await page.waitForFunction(()=>!document.querySelector('video').paused);
 await page.keyboard.press('ArrowRight');await page.waitForSelector('.scene[data-scene="9"]');assert.equal(await page.evaluate(()=>oldVideo.paused&&!oldVideo.isConnected),true);
 await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.1);
 assert.ok(await page.locator('video').evaluate(v=>v.currentTime<2));
 await page.locator('video').evaluate(v=>{v.currentTime=v.duration-.1;});await page.waitForFunction(()=>document.querySelector('video')?.ended);
 const last=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(350);assert.equal(await page.locator('video').evaluate(v=>v.currentTime),last);
 assert.match(await page.locator('[data-video-toggle]').innerText(),/Replay/);await page.locator('[data-video-toggle]').click();await page.waitForFunction(()=>document.querySelector('video').currentTime<1&&!document.querySelector('video').paused);
 const before=await page.locator('.scene').boundingBox();
 await page.keyboard.press('s');assert.ok((await page.locator('#speaker-panel-text').innerText()).includes('The center is scheduled for completion in 2030.'));await page.keyboard.press('s');
 await page.locator('#settings-button').click();await page.locator('#demo-button').click();await page.waitForFunction(()=>document.getElementById('caption-vi').textContent.length>0);
 assert.deepEqual(await page.locator('.scene').boundingBox(),before);
 await page.screenshot({path:'.build/research-video/qa/video-with-captions.png'});
 await context.close();
 const reduced=await makeContext('reduce'),still=await reduced.newPage();
 await still.goto(base+'?lang=en');await still.waitForSelector('.scene[data-scene="8"]');await still.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
 assert.equal(await still.locator('video').evaluate(v=>v.paused&&v.currentTime===0),true);
 await still.evaluate(()=>document.fonts.ready);
 for(const lang of ['en','ko']){
  if(await still.locator('.scene').getAttribute('lang')!==lang)await still.keyboard.press('e');
  await still.waitForSelector(`.scene[lang="${lang}"]`);await still.locator('.scene img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  const clip=await still.locator('.scene').screenshot();await fs.writeFile(`.build/research-video/qa/${lang}-08.png`,clip);
  await sharp(clip).resize(640,360).png().toFile(`public/motion-previews/${lang}-08.png`);
  assert.ok(await still.locator('.research-video .image-credit').evaluate(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight+1));
 }
 await still.locator('[data-video-toggle]').click();await still.waitForFunction(()=>document.querySelector('video').currentTime>.1);await reduced.close();
 const failed=await makeContext();await failed.route('**/research-center-orbit.mp4',r=>r.abort());
 const fallback=await failed.newPage();await fallback.goto(base);await fallback.waitForFunction(()=>document.querySelector('video')?.hidden===true);
 assert.equal(await fallback.locator('.research-video img').evaluate(i=>i.complete&&i.naturalWidth>0),true);await failed.close();
 assert.deepEqual(errors,[]);assert.equal(paid,0);
 const result={passed:true,automaticSilentPlayback:true,playsOnceAndHolds:true,localPlayPauseReplay:true,globalPauseAndSourceModePause:true,leavingSlideStopsVideo:true,returningRestartsVideo:true,reducedMotionRespected:true,failedVideoKeepsPoster:true,captionsKeepSlideSize:true,rangeRequestsVerified:true,scriptUnchanged:true,paid,errors};
 await fs.writeFile('.build/research-video/qa/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();child?.kill();}
