import {migrateLegacyScript,SLIDE_COUNT} from './deck-structure.js';
import { loadScript, saveScript, validateScript, scriptSignature, SCRIPT_CHANNEL } from './script-store.js';
import { ScriptMatcher } from './script-matcher.js';
import { watchPresentation } from './live-updates.js';
const $ = id => document.getElementById(id);
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(SCRIPT_CHANNEL) : null;
let script, selected = 0, dirty = false, preparation, sourceDirty = false;
$('korean-input').addEventListener('input',()=>{sourceDirty=Boolean($('korean-input').value.trim());});
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
function current() {
  selected = Math.max(0, Math.min(selected, script.cues.length-1));
  $('cue-select').value = selected;
  for (const lang of ['en','ko','vi']) $('current-'+lang).textContent = script.cues[selected][lang];
  $('previous-cue').disabled = selected === 0; $('next-cue').disabled = selected === script.cues.length-1;
  for (const row of $('editor').children) row.classList.toggle('active', Number(row.dataset.index) === selected);
}
function refresh() {
  $('count').textContent = `${new Set(script.cues.map(c=>c.slide)).size}개 장표 · ${script.cues.length}개 자막 구간`;
  $('cue-select').replaceChildren(...script.cues.map((c,i)=>new Option(`${c.slide}장 · ${String(i+1).padStart(2,'0')} · ${c.ko.slice(0,50)}`, i)));
  const nodes = script.cues.map((cue,i) => {
    const section = document.createElement('article'); section.className = 'edit-cue'; section.dataset.index = i;
    const h = document.createElement('h3'); h.textContent = `${cue.slide}장 · ${String(i+1).padStart(2,'0')} / ${script.cues.length}`;
    const fields = document.createElement('div'); fields.className = 'edit-grid';
    for (const [lang,label] of [['en','EN · 영어 발표'],['ko','KO · 한국어 원고'],['vi','VI · 베트남어 자막']]) {
      const field = document.createElement('label'); field.textContent = label;
      const input = document.createElement('textarea'); input.lang = lang; input.value = cue[lang]; input.maxLength = 600; input.rows = 4;
      input.addEventListener('input', () => { cue[lang] = input.value; dirty = true; message('수정 중입니다. 발표에 반영하려면 원고를 저장해 주세요.'); if (i === selected) current(); });
      field.append(input); fields.append(field);
    }
    section.append(h,fields); return section;
  });
  $('editor').replaceChildren(...nodes); filter(); current();
}
function filter() { for (const row of $('editor').children) row.hidden = $('filter-slide').value !== 'all' && script.cues[+row.dataset.index].slide !== +$('filter-slide').value; }
function send(type) {
  if (dirty) { message('먼저 수정 원고를 저장해 주세요.', true); return; }
  if (!channel) { message('이 브라우저에서는 창 사이 연결을 지원하지 않습니다. Chrome 또는 Edge를 사용해 주세요.', true); return; }
  channel.postMessage({ type, index: selected, speechLanguage: $('speech-language').value, signature: scriptSignature(script) });
  message('발표 화면에 요청했습니다. 아래 발표 상태에서 적용 여부를 확인해 주세요.');
}
for (let n=1;n<=SLIDE_COUNT;n++) $('filter-slide').add(new Option(`${n}장`, n));
$('filter-slide').onchange = filter;
$('cue-select').onchange = () => { selected = +$('cue-select').value; current(); };
$('previous-cue').onclick = () => { selected--; current(); };
$('next-cue').onclick = () => { selected++; current(); };
$('seek').onclick = () => send('seek'); $('manual').onclick = () => send('manual'); $('hide').onclick = () => send('hide');
$('save').onclick = () => {
  try { script = saveScript(script); dirty = false; refresh(); channel?.postMessage({type:'saved'}); message('이 브라우저에 저장했습니다. 실행 중인 자막은 중지 후 다시 시작하면 새 원고가 적용됩니다.'); }
  catch (e) { message(e.message, true); }
};
function download(data, type, name) {
  const url = URL.createObjectURL(new Blob([data], {type})); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
$('export').onclick = () => { try { download(JSON.stringify(validateScript(script),null,2), 'application/json', '성남-사전자막.json'); } catch(e) {message(e.message,true);} };
$('export-text').onclick = () => { try { const checked = validateScript(script); download([checked.title, '한국어·베트남어 검토용 초안', '', ...checked.cues.flatMap(c=>[`${c.slide}장 · ${c.id}`, 'EN  '+c.en, 'KO  '+c.ko, 'VI  '+c.vi, ''])].join('\n'), 'text/plain;charset=utf-8', '성남-3개언어-원고.txt'); } catch(e) {message(e.message,true);} };
$('import-file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try { if (file.size > 500000) throw new Error('500KB 이하 JSON 파일을 선택해 주세요.'); const next = validateScript(migrateLegacyScript(JSON.parse(await file.text()))); script = next; selected = 0; dirty = true; for (const button of document.querySelectorAll('button')) button.disabled = false; refresh(); message('파일을 불러왔습니다. 내용을 확인하고 저장해 주세요.'); }
  catch(e) { message(e.message, true); } finally { event.target.value = ''; }
};
$('replay-fill').onclick = () => { $('replay-text').value = script.cues[selected][$('speech-language').value === 'ko' ? 'ko' : 'en']; };
$('replay').onclick = () => {
  const language = $('speech-language').value === 'auto' ? (/[가-힣]/.test($('replay-text').value) ? 'ko' : 'en') : $('speech-language').value;
  const matcher = new ScriptMatcher(script.cues, { language, slide: script.cues[selected].slide });
  matcher.seek(selected);
  const result = matcher.feed($('replay-text').value, {final:true});
  $('replay-result').textContent = result.state === 'matched' ? `${result.index+1}번 구간 인식 · ${result.cue.vi}` : result.reason || '일치하는 구간이 없습니다. 선택한 구간의 앞부분부터 입력해 주세요.';
};
function parseKorean(text) {
  let slide = 1; const cues = [];
  for (const line of text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)) {
    const header = line.match(/^\[(\d{1,2})\]$/); if (header) { slide = +header[1]; if(slide<1||slide>SLIDE_COUNT)throw new Error(`장표 번호는 1~${SLIDE_COUNT}입니다.`); continue; }
    if (line.length > 300) throw new Error('한 줄이 너무 깁니다. 300자 이내의 짧은 의미 단위로 나누어 주세요.');
    if (cues.at(-1)?.slide > slide) throw new Error(`장표 번호는 1~${SLIDE_COUNT} 순서로 넣어 주세요.`);
    cues.push({slide,ko:line});
  }
  if (!cues.length || cues.length > 240) throw new Error('1~240개 구간의 한국어 원고를 넣어 주세요.');
  return cues;
}
$('prepare').onclick = async () => {
  if (preparation) return;
  try {
    const cues = parseKorean($('korean-input').value); preparation = new AbortController();
    $('prepare').disabled = true; $('cancel-prepare').hidden = false;
    const result = [];
    for (let i=0; i<cues.length; i+=8) {
      message(`영어·베트남어 초안 준비 중 · ${i} / ${cues.length}개 완료`);
      const response = await fetch('/api/prepare-script', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cues:cues.slice(i,i+8)}),signal:preparation.signal});
      const data = await response.json(); if (!response.ok) throw new Error(data.error || '초안 생성에 실패했습니다.');
      result.push(...data.cues.map((c,j)=>({...c,id:`prepared-${i+j+1}`})));
    }
    script = validateScript({version:1,title:'성남 발표 · 한국어 원고 기반 초안',draft:true,cues:result});
    selected = 0; dirty = true; sourceDirty = false; refresh(); message('초안을 만들었습니다. 아래 세 언어를 검토하고 저장해 주세요.');
  } catch(e) { message(e.name === 'AbortError' ? '생성을 취소했습니다. 기존 저장 원고는 유지됩니다.' : e.message, true); }
  finally { preparation = null; $('prepare').disabled = false; $('cancel-prepare').hidden = true; }
};
$('cancel-prepare').onclick = () => preparation?.abort();
channel?.addEventListener('message', ({data}) => {
  if (!script) return;
  if (data?.type === 'error') { message(data.message,true); return; }
  if (data?.type !== 'progress') return;
  if (data.signature && data.signature !== scriptSignature(script)) { $('follow-state').textContent = '발표 화면과 원고가 다름'; return; }
  const labels = {matched:'음성에 맞춰 표시 중',ready:'선택 구간 대기',manual:'수동 표시 · 추종 정지',hold:'확인 필요 · 추종 정지',waiting:'원고 위치 확인 필요',stopped:'중지됨',hidden:'숨김 · 추종 정지'};
  $('follow-state').textContent = labels[data.state] || (data.running ? '음성 대기' : '자막 시작 전');
  if (Number.isInteger(data.index) && data.index >= 0 && data.index < script.cues.length && !dirty) { selected = data.index; current(); }
  if (Number.isFinite(data.renderMs)) $('local-latency').textContent = `${Math.round(data.renderMs)} ms · 음성 인식 시간 제외`;
  $('heard').textContent = data.reason || (data.source ? '최근 인식: '+data.source : '');
  if (data.speechLanguage) $('speech-language').value = data.speechLanguage;
});
window.addEventListener('beforeunload', e => { if (dirty) {e.preventDefault();e.returnValue='';} });
window.addEventListener('pagehide', ()=>{preparation?.abort();channel?.close();});
try { script = await loadScript(); refresh(); message('현재 발표의 원고 초안을 불러왔습니다. 내용을 수정하거나 그대로 연습할 수 있습니다.'); channel?.postMessage({type:'hello'}); }
catch(e) { message(e.message, true); for (const button of document.querySelectorAll('button')) button.disabled = true; }
watchPresentation({isBusy:()=>dirty||Boolean(preparation)||sourceDirty,pendingText:'수정본 준비됨 · 작성 중인 원고를 저장한 뒤 반영'});
