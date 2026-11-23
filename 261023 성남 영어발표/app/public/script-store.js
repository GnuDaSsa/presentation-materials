import {DECK_VERSION,SLIDE_COUNT,migrateLegacyScript} from './deck-structure.js';
export const SCRIPT_KEY = 'seongnam-prepared-captions-'+DECK_VERSION;
const DEFAULT_SIGNATURE_KEY = SCRIPT_KEY+'-default-signature';
export const SCRIPT_CHANNEL = SCRIPT_KEY;
export function validateScript(value) {
  migrateLegacyScript(value);
  if (value?.version !== 1 || !Array.isArray(value.cues) || !value.cues.length || value.cues.length > 240) throw new Error('원고는 1~240개 구간으로 준비해 주세요.');
  const ids = new Set(); let previous = 1;
  const cues = value.cues.map((cue, i) => {
    if (!Number.isInteger(cue.slide) || cue.slide < previous || cue.slide > SLIDE_COUNT) throw new Error(`${i + 1}번 구간의 장표 번호를 확인해 주세요. (1~${SLIDE_COUNT}, 순서대로)`);
    previous = cue.slide;
    const id = String(cue.id || `cue-${i + 1}`);
    if (id.length > 80 || ids.has(id)) throw new Error('구간 ID는 서로 달라야 합니다.');
    ids.add(id);
    const row = { id, slide: cue.slide };
    if(cue.spokenLanguage!==undefined){
      if(!['ko','en'].includes(cue.spokenLanguage))throw new Error('실제 발화 언어는 한국어 또는 영어로 지정해 주세요.');
      row.spokenLanguage=cue.spokenLanguage;
    }
    for (const lang of ['en', 'ko', 'vi']) {
      if (typeof cue[lang] !== 'string' || !cue[lang].trim() || cue[lang].length > 600) throw new Error(`${i + 1}번 ${lang.toUpperCase()} 원고를 확인해 주세요. (1~600자)`);
      row[lang] = cue[lang].replace(/\s+/g, ' ').trim();
    }
    return row;
  });
  return { version: 1, deckVersion:DECK_VERSION, title: String(value.title || '발표 원고').slice(0, 120), draft: value.draft !== false, cues };
}
export async function loadScript() {
  const saved = localStorage.getItem(SCRIPT_KEY);
  // Refresh unchanged former bundled drafts; preserve individually edited scripts.
  if (saved) {
    const value=JSON.parse(saved);
    const signature=scriptSignature(value);
    if (!['4a1a7a20', 'e7f0c5f9', '75ce51e1', '98e615a9',localStorage.getItem(DEFAULT_SIGNATURE_KEY)].includes(signature)) {
      const migrated=migrateLegacyScript(value);
      if(migrated!==value)localStorage.setItem(SCRIPT_KEY+'-before-alliance-removal',saved);
      if(migrated.cues.length){
        const checked=validateScript(migrated);
        localStorage.setItem(SCRIPT_KEY,JSON.stringify(checked));
        return checked;
      }
    }
  }
  const response = await fetch('/prepared-script.json');
  if (!response.ok) throw new Error('준비된 원고를 불러오지 못했습니다.');
  const checked=validateScript(await response.json());
  localStorage.setItem(DEFAULT_SIGNATURE_KEY,scriptSignature(checked));
  // The source deck remains authoritative for an untouched bundled draft.
  if(saved)localStorage.removeItem(SCRIPT_KEY);
  return checked;
}
export function saveScript(script) {
  const checked = validateScript(script);
  if(scriptSignature(checked)===localStorage.getItem(DEFAULT_SIGNATURE_KEY))localStorage.removeItem(SCRIPT_KEY);
  else localStorage.setItem(SCRIPT_KEY, JSON.stringify(checked));
  return checked;
}
export function scriptSignature(script) {
  let hash = 2166136261;
  for (const ch of JSON.stringify(script.cues)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16);
}
