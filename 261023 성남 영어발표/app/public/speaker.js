import {script,sources,researchChanges,questionPrep,scriptText} from './presentation-content.js';
import {watchPresentation} from './live-updates.js';
const $=id=>document.getElementById(id);
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=seconds=>Math.floor(seconds/60).toString().padStart(2,'0')+':'+Math.floor(seconds%60).toString().padStart(2,'0');
const channel='BroadcastChannel' in window?new BroadcastChannel('seongnam-presenter-v16-intro'):null;
let current=0,elapsed=0,started=0,timerId,fontSize=26,deckConnected=false;
let time=0;
const sourceLink=id=>'<a href="'+escape(sources[id].url)+'" target="_blank" rel="noopener noreferrer">'+escape(sources[id].title)+' · '+escape(sources[id].date)+'</a>';
script.forEach((s,i)=>{
  const nav=document.createElement('a');
  nav.href='#slide-'+(i+1);
  nav.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span>'+escape(s.title);
  nav.addEventListener('click',e=>{e.preventDefault();select(i,true);});
  $('script-nav').append(nav);
  const article=document.createElement('article');
  article.className='script-section';article.id='slide-'+(i+1);
  article.innerHTML='<header class="script-heading"><div><span class="time-tag">'+String(i+1).padStart(2,'0')+' / '+String(script.length).padStart(2,'0')+' · '+format(time)+'–'+format(time+s.seconds)+' · '+s.seconds+' sec</span><h2 lang="en">'+escape(s.title)+'</h2></div><img src="/motion-previews/en-'+String(i+1).padStart(2,'0')+'.png" alt="" loading="lazy"></header>'+
    '<div class="delivery-cue"><p><b>요점</b> '+escape(s.ko)+'</p><p><b>진행</b> '+escape(s.cue)+'</p></div>'+
    '<div class="reading" lang="en">'+s.paragraphs.map((p,j)=>'<p lang="'+(s.spokenLanguages?.[j]||'en')+'">'+escape(p)+'</p>').join('')+'</div>'+
    (s.pronunciation?'<p class="pronunciation">발음 힌트 · '+escape(s.pronunciation)+'</p>':'')+
    '<details class="script-sources"><summary>이 장의 근거 · 발표 때 읽지 않음</summary>'+s.sources.map(sourceLink).join('')+'</details>';
  $('scripts').append(article);time+=s.seconds;
});
const words=script.reduce((n,s)=>n+s.paragraphs.join(' ').split(/\s+/).length,0);
$('word-count').textContent='한국어 오프닝 + 영어 발표 · '+format(time)+' 리허설 참고 · 영상 시간 별도';
$('question-list').innerHTML=questionPrep.map(([q,a])=>'<article lang="en"><h3>'+escape(q)+'</h3><p>'+escape(a)+'</p></article>').join('');
$('changes').innerHTML='<table lang="en"><thead><tr><th>Item</th><th>Original</th><th>Presentation treatment</th></tr></thead><tbody>'+researchChanges.map(row=>'<tr>'+row.map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
$('source-list').innerHTML=Object.entries(sources).map(([id,s])=>'<article id="source-'+id+'"><h3>'+sourceLink(id)+'</h3><p>'+escape(s.detail)+'</p></article>').join('');
function select(i,send=false,scroll=true){
  current=Math.max(0,Math.min(script.length-1,i));
  [...$('script-nav').children].forEach((a,i)=>{a.classList.toggle('active',i===current);if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
  $('speaker-position').textContent=(current+1)+' / '+script.length;
  $('speaker-prev').disabled=current===0;$('speaker-next').disabled=current===script.length-1;
  if(scroll)document.getElementById('slide-'+(current+1)).scrollIntoView({block:'start',behavior:'instant'});
  if(send&&$('follow-deck').checked)channel?.postMessage({type:'navigate',index:current});
}
channel?.addEventListener('message',({data})=>{
  if(data?.type!=='state'||!Number.isInteger(data.index)||data.index<0||data.index>=script.length)return;
  deckConnected=true;
  $('connection').textContent='발표 화면 연결됨 · '+(data.index+1)+'장';
  if($('follow-deck').checked)select(data.index,false,!['#research','#questions'].includes(location.hash));
});
$('follow-deck').addEventListener('change',()=>{if($('follow-deck').checked)channel?.postMessage({type:'hello'});});
function tick(){const total=elapsed+(started?performance.now()-started:0);$('timer').textContent=format(total/1000);$('timer').classList.toggle('over-time',total>time*1000);}
$('timer-button').addEventListener('click',()=>{
  if(started){elapsed+=performance.now()-started;started=0;clearInterval(timerId);$('timer-button').textContent='리허설 계속';}
  else{started=performance.now();timerId=setInterval(tick,250);$('timer-button').textContent='잠깐 멈춤';}
  tick();
});
$('timer-reset').addEventListener('click',()=>{elapsed=0;started=0;clearInterval(timerId);$('timer-button').textContent='리허설 시작';tick();});
$('font-smaller').addEventListener('click',()=>{fontSize=Math.max(18,fontSize-2);document.documentElement.style.setProperty('--reading-size',fontSize+'px');});
$('font-larger').addEventListener('click',()=>{fontSize=Math.min(40,fontSize+2);document.documentElement.style.setProperty('--reading-size',fontSize+'px');});
$('print-script').addEventListener('click',()=>window.print());
$('download-script').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob(['\uFEFF'+scriptText()],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='Seongnam-English-Script.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('speaker-prev').addEventListener('click',()=>select(current-1,true));
function next(){if(channel && deckConnected && $('follow-deck').checked)channel.postMessage({type:'next'});else select(current+1,true);}
$('speaker-next').addEventListener('click',next);
$('speaker-replay').addEventListener('click',()=>channel?.postMessage({type:'replay'}));
document.addEventListener('keydown',e=>{
  if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
  if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();if(!e.repeat)next();}
  if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();select(current-1,true);}
  if(e.key.toLowerCase()==='r')channel?.postMessage({type:'replay'});
});
const requested=Number(new URLSearchParams(location.search).get('slide')||1)-1;
select(Number.isFinite(requested)?requested:0,false,false);
if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
channel?.postMessage({type:'hello'});
window.addEventListener('pagehide',()=>{clearInterval(timerId);channel?.close();});
watchPresentation({isBusy:()=>Boolean(started),beforeReload:()=>history.replaceState(null,'','#slide-'+(current+1)),pendingText:'수정본 준비됨 · 리허설을 멈추면 자동 반영'});
