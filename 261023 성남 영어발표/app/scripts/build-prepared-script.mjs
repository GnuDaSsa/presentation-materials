import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { script } from '../public/presentation-content.js';
import { validateScript } from '../public/script-store.js';
const rows = (await fs.readFile(new URL('./prepared-draft.tsv', import.meta.url), 'utf8')).trim().split(/\r?\n/);
const data = validateScript({ version: 1, title: 'Seongnam - English Presentation V1.6', draft: true,
  cues: rows.map((row, i) => { const [slide, en, ko, vi, spokenLanguage, id] = row.split('\t'); return { id: id || `v16-${String(i+1).padStart(3,'0')}`, slide: +slide, en, ko, vi, ...(spokenLanguage?{spokenLanguage}:{}) }; }),
});
const normalize = s => s.replace(/\s+/g, ' ').trim();
for (let n=1; n<=script.length; n++) assert.equal(normalize(data.cues.filter(c=>c.slide===n).map(c=>c[c.spokenLanguage||'en']).join(' ')), normalize(script[n-1].paragraphs.join(' ')), `English address slide ${n} must stay intact`);
await fs.writeFile(new URL('../public/prepared-script.json', import.meta.url), JSON.stringify(data, null, 2)+'\n');
const document = ['성남 시스템반도체 · 사전 원고 자막 초안', '한국어 오프닝 후 영어 발표 · 영어 / 한국어 / 베트남어 자막', 'V1.6 정책 내용을 바탕으로 발표자 소개를 추가하고, 발음하기 쉽도록 영어 어휘와 문장을 다듬었습니다. 임의로 늘린 설명 14개는 되돌리고, 기존 영어 대사 앞에 요청한 한국어 오프닝 3개 구간을 추가했습니다. 최종 PDF의 성남 시스템반도체 얼라이언스와 발표 구간 5개를 복원했습니다. 한국어·베트남어는 이에 대응하는 번역 초안입니다.', '연구센터 규모와 일정은 원자료의 기준 또는 계획입니다.', '',
  ...script.flatMap((s,i)=>[`${i+1}장 · ${s.title}`, ...data.cues.filter(c=>c.slide===i+1).flatMap(c=>[`[${c.id}${c.spokenLanguage==='ko'?' · 실제 발화: 한국어':''}]`, `EN  ${c.en}`, `KO  ${c.ko}`, `VI  ${c.vi}`, ''])]),
].join('\n');
await fs.writeFile(new URL('../public/Seongnam-Prepared-Captions.txt', import.meta.url), document);
console.log(`Prepared ${data.cues.length} trilingual cues. English cues match the current spoken script exactly.`);
