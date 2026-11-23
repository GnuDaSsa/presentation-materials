import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/sajw1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'no-preference'});
const base=process.env.TEST_URL||'http://127.0.0.1:3230/';
const errors=[];let paid=0;
context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
await context.addInitScript(()=>sessionStorage.setItem('seongnam-korean-opening-v1','en'));
await context.route('**/api/updates',r=>r.abort());
await context.route(/\/api\/(transcription-session|session|caption-translation|azure-token)$/,r=>{paid++;return r.abort();});
const page=await context.newPage();
const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
try{
 await page.goto(base+'?lang=en');await page.waitForSelector('.scene[data-scene="1"]');
 await page.evaluate(()=>{
  window.turns=[];window.animationStarts=[];window.opacityDrops=[];window.entranceMotion=[];window.unreadyImages=[];
  new MutationObserver(records=>{for(const r of records)for(const e of r.addedNodes)if(e.nodeType===1&&e.matches('.scene')){turns.push(e.dataset.scene);for(const img of e.querySelectorAll('img'))if(!img.complete||!img.naturalWidth)unreadyImages.push({slide:e.dataset.scene,src:img.src});}}).observe(document.querySelector('.motion-canvas'),{childList:true});
  document.addEventListener('animationstart',e=>animationStarts.push(e.animationName));
  const check=()=>{const scene=document.querySelector('.scene');if(scene)for(const e of scene.querySelectorAll('.reveal,.floor,.cover-photo')){const style=getComputedStyle(e);if(Number(style.opacity)<.999)opacityDrops.push(scene.dataset.scene);if(style.transform!=='none')entranceMotion.push({slide:scene.dataset.scene,element:e.className,transform:style.transform});}requestAnimationFrame(check);};check();
 });
 for(let n=2;n<=11;n++){
  await page.locator('#footer-next').click();await page.waitForSelector(`.scene[data-scene="${n}"]`);
  await frame();
  assert.ok(await page.locator('.scene img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
  assert.ok(await page.locator('.scene').evaluate(s=>s.getAnimations({subtree:true}).some(a=>a.playState==='running')),'Every slide automatically animates its content on navigation');
 }
 assert.deepEqual(await page.evaluate(()=>turns),['2','3','4','5','6','7','8','9','10','11']);
 await page.waitForTimeout(1300);
 const before=await page.evaluate(()=>({turns:turns.length,animations:animationStarts.length}));
 await page.keyboard.press('ArrowRight');await page.keyboard.press('End');
 await page.evaluate(()=>{const c=new BroadcastChannel('seongnam-presenter-v16-intro');c.postMessage({type:'navigate',index:10});setTimeout(()=>{c.postMessage({type:'navigate',index:10});c.close();},100);});
 await page.waitForTimeout(300);
 assert.deepEqual(await page.evaluate(()=>({turns:turns.length,animations:animationStarts.length})),before,'Duplicate navigation must not restart a scene');
 await page.locator('#replay-button').click();await frame();
 assert.equal(await page.evaluate(()=>turns.length),before.turns,'Replay must not replace the slide');
 await page.evaluate(()=>{const c=new BroadcastChannel('seongnam-presenter-v16-intro');c.postMessage({type:'navigate',index:3});c.close();});
 await page.waitForSelector('.scene[data-scene="4"]');await page.waitForTimeout(100);
 const beforeReplay=await page.evaluate(()=>turns.length);
 await page.locator('#replay-button').click();await frame();
 assert.equal(await page.evaluate(()=>turns.length),beforeReplay);
 assert.ok(await page.locator('.scene').evaluate(s=>s.getAnimations({subtree:true}).some(a=>a.animationName==='draw'&&a.currentTime<300)),'Diagram motion can still replay');
 await page.locator('#pause-motion-button').click();await frame();
 assert.equal(await page.locator('.scene.animate').count(),0,'Pause reveals the final state without replacing the scene');
 assert.equal(await page.evaluate(()=>turns.length),beforeReplay);
 await page.keyboard.press('e');await page.waitForSelector('.scene[lang="ko"]');
 await page.keyboard.press('e');await page.waitForSelector('.scene[lang="en"]');
 assert.deepEqual(await page.evaluate(()=>opacityDrops),[],'Navigation must never fade slide copy');
 assert.deepEqual(await page.evaluate(()=>entranceMotion),[],'Text, photographs and floors must never rise or zoom');
 assert.deepEqual(await page.evaluate(()=>unreadyImages),[],'Images must already be decoded when a slide enters the live DOM');
 await fs.mkdir('.build/transition-qa',{recursive:true});
 await page.screenshot({path:'.build/transition-qa/controls.png'});

 // A slow image must leave the old slide visible; a later navigation wins.
 const slowContext=await browser.newContext({reducedMotion:'no-preference'});
 await slowContext.addInitScript(()=>sessionStorage.setItem('seongnam-korean-opening-v1','en'));
 await slowContext.route('**/api/updates',r=>r.abort());
 let releaseImage;
 const gate=new Promise(r=>{releaseImage=r;});
 await slowContext.route('**/assets/final-20261030/pangyo.png',async r=>{await gate;await r.continue();});
 const slow=await slowContext.newPage();slow.on('pageerror',e=>errors.push(e.message));
 await slow.goto(base+'?lang=en',{waitUntil:'domcontentloaded'});await slow.waitForSelector('.scene[data-scene="1"]');
 await slow.keyboard.press('ArrowRight');await slow.waitForSelector('.scene[data-scene="2"]');
 await slow.keyboard.press('ArrowRight');
 assert.equal(await slow.locator('#page-number').textContent(),'3');
 await slow.waitForTimeout(100);
 assert.equal(await slow.locator('.scene').getAttribute('data-scene'),'2','Keep outgoing scene until image decode finishes');
 await slow.keyboard.press('ArrowRight');await slow.waitForSelector('.scene[data-scene="4"]');
 releaseImage();await slow.waitForTimeout(400);
 assert.equal(await slow.locator('.scene').getAttribute('data-scene'),'4','A stale prepared scene must not flash back');
 await slowContext.close();
 assert.equal(paid,0);assert.deepEqual(errors,[]);
 const result={slides:11,automaticContentMotion:true,oneReplacementPerTurn:true,noCopyFade:true,noEntranceTranslationOrZoom:true,duplicateNavigationIgnored:true,replayDoesNotReplaceScene:true,diagramReplayWorks:true,pauseDoesNotReplaceScene:true,slowImagesKeepOutgoingScene:true,rapidNavigationIgnoresStaleScenes:true,paid,errors};
 await fs.writeFile('.build/transition-qa/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
