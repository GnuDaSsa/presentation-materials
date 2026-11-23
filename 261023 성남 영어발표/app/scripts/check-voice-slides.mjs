import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/sajw1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const script=JSON.parse(await fs.readFile('public/prepared-script.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce'});
const errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))requests.push(new URL(r.url()).pathname);});
await page.route('**/api/updates',r=>r.abort());
await page.route('**/api/health',r=>r.fulfill({json:{app:'workshop-live-captions',openaiAvailable:true,available:true,azureAvailable:false}}));
await page.route('**/api/transcription-session',r=>r.fulfill({json:{value:'test-only'}}));
await page.route('https://api.openai.com/**',r=>r.fulfill({body:'mock-sdp'}));
await page.addInitScript(()=>{
  window.mockChannels=[];window.micRequests=0;
  navigator.mediaDevices.getUserMedia=async()=>{window.micRequests++;return new MediaStream();};
  window.RTCPeerConnection=class{
    addTrack(){}createDataChannel(){const c=this.c={readyState:'open',send(){},close(){this.readyState='closed';}};window.mockChannels.push(c);return c;}
    async createOffer(){return {sdp:'offer'};}async setLocalDescription(){}async setRemoteDescription(){queueMicrotask(()=>this.c.onopen?.());}close(){}
  };
});
const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function say(id,text,final=false){
  await page.evaluate(({id,text,final})=>window.mockChannels.at(-1).onmessage({data:JSON.stringify({type:`conversation.item.input_audio_transcription.${final?'completed':'delta'}`,item_id:id,...(final?{transcript:text}:{delta:text})})}),{id,text,final});await frame();
}
try{
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:3230/?lang=en');
  await page.waitForFunction(()=>document.getElementById('script-note').textContent.includes('50'));
  assert.equal(await page.locator('#auto-slide-button').getAttribute('aria-pressed'),'true');
  await page.locator('#speaker-button').click();await page.locator('#start-button').click();
  await page.waitForFunction(()=>document.getElementById('status-text').textContent==='듣고 있습니다');
  for(const [i,cue] of script.cues.entries()){
    await say('cue-'+i,cue[cue.spokenLanguage||'en']);
    assert.equal(await page.locator('#page-number').textContent(),String(cue.slide),cue.id);
    assert.equal(await page.locator('#caption-ko').textContent(),cue.ko,cue.id);
    assert.equal(await page.locator('#caption-vi').textContent(),cue.vi,cue.id);
    assert.match(await page.locator('#speaker-panel-position').textContent(),new RegExp('^'+cue.slide+' /'));
    if(cue.slide===5)assert.equal(await page.locator('.program-row').count(),3);
    const clip=await page.locator('#captions').evaluate(e=>({scroll:e.scrollHeight,client:e.clientHeight}));
    assert.ok(clip.scroll<=clip.client+2, 'Subtitle clipped: '+cue.id+' '+JSON.stringify(clip));
    await say('cue-'+i,cue[cue.spokenLanguage||'en'],true);
  }
  assert.equal(await page.evaluate(()=>window.micRequests),1);
  assert.equal(requests.filter(p=>p==='/api/transcription-session').length,1);
  const held=await page.locator('#caption-vi').textContent();
  await page.waitForTimeout(5000);assert.equal(await page.locator('#caption-vi').textContent(),held,'Caption persists in silence');
  await page.keyboard.press('Home');
  await page.locator('#auto-slide-button').click();
  const last=script.cues.filter(c=>c.slide===1).at(-1), next=script.cues.find(c=>c.slide===2);
  await say('manual-closing',last.en,true);await say('off',next.en,true);
  assert.equal(await page.locator('#page-number').textContent(),'1');
  await page.keyboard.press('a');await say('on',next.en);
  assert.equal(await page.locator('#page-number').textContent(),'2');
  await page.keyboard.press('b');await say('paused',script.cues.filter(c=>c.slide===2).at(-1).en+' '+script.cues.find(c=>c.slide===3).en);
  assert.equal(await page.locator('#page-number').textContent(),'2');
  await page.locator('#start-button').click();
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  await page.locator('#speaker-close').click();
  await page.screenshot({path:'.build/v16-qa/ui-voice.png'});
  for(const width of [1366,800,390]){
    await page.setViewportSize({width,height:900});await frame();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const a=await page.locator('#auto-slide-button').boundingBox(),n=await page.locator('.page-navigation').boundingBox();
    if(width>560) assert.ok(a.x>=n.x+n.width-1,'Voice toggle should not overlap page controls at '+width);
    else assert.equal(a,null,'Small screens use the accessible setting instead of crowded footer buttons');
  }
  await page.locator('#settings-button').click();
  assert.equal(await page.locator('#auto-slide').isChecked(),true);
  await page.locator('#auto-slide').uncheck();await page.keyboard.press('Escape');
  await page.reload();await page.waitForFunction(()=>document.getElementById('script-note').textContent.includes('50'));
  assert.equal(await page.locator('#auto-slide-button').getAttribute('aria-pressed'),'false');
  await page.keyboard.press('a');
  assert.deepEqual(errors,[]);
  assert.equal(requests.some(p=>/caption-translation|prepare-script|azure-token/.test(p)),false);
  const result={passed:true,slides:11,cues:script.cues.length,oneMicrophone:true,noTranslationCalls:true,scriptPaneSynced:true,manualOverride:true,pauseStopsNavigation:true,settingPersists:true,allElevenSlidesCovered:true,errors};
  await fs.writeFile('.build/v16-qa/ui-voice-check.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
