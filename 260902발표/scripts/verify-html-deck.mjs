import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const htmlPath = path.join(root, 'DLC_AI동호회_1시간_브리핑.html');
const cssPath = path.join(root, 'html-deck/deck.css');
const deckFactoryCssPath = path.join(root, 'html-deck/deck-factory.css');
const designInteriorCssPath = path.join(root, 'html-deck/design-interior.css');
const designInteriorLayoutsCssPath = path.join(root, 'html-deck/design-interior-layouts.css');
const jsPath = path.join(root, 'html-deck/deck.js');
const fail = msg => { console.error(`FAIL: ${msg}`); process.exitCode = 1; };
const ok = msg => console.log(`PASS: ${msg}`);
for (const p of [htmlPath, cssPath, deckFactoryCssPath, designInteriorCssPath, designInteriorLayoutsCssPath, jsPath]) fs.existsSync(p) ? ok(path.relative(root,p)) : fail(`missing ${p}`);
if (!fs.existsSync(htmlPath)) process.exit(1);
const html = fs.readFileSync(htmlPath,'utf8');
const css = fs.readFileSync(cssPath,'utf8');
const deckFactoryCss = fs.readFileSync(deckFactoryCssPath,'utf8');
const designInteriorCss = fs.readFileSync(designInteriorCssPath,'utf8');
const designInteriorLayoutsCss = fs.readFileSync(designInteriorLayoutsCssPath,'utf8');
const js = fs.readFileSync(jsPath,'utf8');
const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const count = re => (html.match(re) || []).length;
const slides = count(/<section class="slide\b/g);
const notes = count(/<template class="notes"/g);
slides === 63 ? ok('63 slides') : fail(`${slides} slides, expected 63`);
notes === 63 ? ok('63 speaker note blocks') : fail(`${notes} notes, expected 63`);
const explicitLayouts = count(/data-di-layout="[^"]+" data-di-source="\d{2}"/g);
explicitLayouts === slides ? ok('all slides have stable explicit layouts') : fail(`${explicitLayouts}/${slides} slides have explicit layouts`);
html.includes('data-title="Gemini 지원금 운영 구상" data-di-layout="plan"') ? ok('Gemini plan layout locked') : fail('Gemini plan layout missing');
html.includes('data-title="발표자료 제작 프로세스" data-di-layout="process"') ? ok('presentation process layout locked') : fail('presentation process layout missing');
html.includes('data-title="레퍼런스에서 시각 문법 추출" data-di-layout="data"') ? ok('visual grammar flow layout locked') : fail('visual grammar flow layout missing');
html.includes('data-di-layout="feature" data-di-source="14" data-title="CLI란?"') ? ok('CLI explainer layout locked') : fail('CLI explainer layout missing');
html.includes('data-di-layout="data" data-di-source="09" data-title="Claude Code와 Antigravity"') ? ok('agent tools comparison layout locked') : fail('agent tools comparison layout missing');
const timeLabels = [...html.matchAll(/<span class="time">(.*?)<\/span>/g)].map(m => m[1]);
const totalMinutes = timeLabels.reduce((sum, label) => sum + (Number(label.match(/(\d+)분/)?.[1] || 0)) + (label.includes('30초') ? 0.5 : 0), 0);
totalMinutes === 60 ? ok('60-minute run of show') : fail(`${totalMinutes}-minute run of show, expected 60`);
for (const term of [
  '최근 AI 소식',
  'Claude Fable 5',
  'GPT-5.6',
  'Kimi K3',
  'Fable 5, 출시 3일 뒤 전면 중단',
  '근거 확인 불가',
  '소버린 AI',
  '개인 사용 기록',
  '성남 AI 플랫폼은 입문용으로 의미',
  '4.7대 1을 뚫고',
  'AI 챔피언 블랙 과정',
  '225명 지원, 48명 선발',
  '프로젝트 발표 2회 연속 TOP 3',
  '유저의 니즈 발견',
  '해커톤 계획',
  '상반기 AI 도입 사례',
  '상반기 AI 도입 사례 · 6건',
  '국장님 일반현황 리더기',
  '국장님 첫 번째 요청',
  '하루 만에 한글판 완성',
  '“폰에 넣었는데 잘 안 된다”',
  '한글→책갈피→하이라이트 과정은 전부 삭제',
  '한글 책갈피-하이라이트 작업',
  '“이거 PDF로는 안 되나?”',
  '그제야 파일이 아니라 사용 장면을 봄',
  '“왜 저건 제목에 없음?”',
  '“왜 이게 제목임?”',
  'PDF 내장 북마크',
  '킨스타워',
  'AI 없는 변환기',
  '5개 부서·타 시군까지 7회 테스트',
  '약 10회 더 돌린 뒤 EXE 배포',
  '내가 생각한 이상적인 구조',
  '아이디어 → 개발 → 실무 피드백',
  '페이스북 게시물을 하나씩 보고',
  '복사보다 어려운 건',
  '“생산과 공유만 나누면 끝 아닌가?”',
  '동영상·기사·한두 글자·태그·생일',
  '흐릿한 회색 테두리가 생겼음',
  '권혁 주사',
  '김나래 주사',
  '최왕 청년인턴의 아이디어',
  '테두리 네 면에 특정 값',
  '생일·프로필 변경·타인 태그',
  '2026.07.30',
  'M열',
  'V14 · 기타사항 실제 구조',
  '레미콘 품질보증·시험성적서 조건',
  '1,650건 × 37열',
  '1,558건',
  '754건',
  '248,400원',
  'Korean Law MCP',
  '42개 API',
  '10개 도구',
  '신규회원들이 받은 문자는',
  'Mac과 iPhone이 같은 연락처를 보고',
  '최근 7일',
  '만드는 데 5시간',
  '분기당 10명씩, 연간 40명',
  '분기당 10명씩 네 번',
  '58만원',
  '가족그룹 12개월 제한',
  '공동구독 운영',
  'CLI와 에이전트 도구',
  'COMMAND LINE INTERFACE',
  'Claude Code',
  'Antigravity',
  '폴더 읽기 → 파일 수정 → 명령 실행 → 결과 검증',
  'Dribbble · Pinterest',
  'Dribbble과 Pinterest에서',
  'DESIGN.md',
  '레퍼런스를 Claude에 넣고',
  'Genspark 초안',
  '디자인 마크다운만 넣는 것도 아니고',
  'Genspark로 디자인 장표를 뽑고',
  '발표 내용을 넣어 채움',
  'HTML은 애니메이션 연출까지 가능',
  '더 욕심내고 싶으면',
  '판교 시스템반도체 연구센터',
  '류승인 주임의 Kordoc',
  'HWP · HWPX · PDF · Office',
  '2026. 9. 15.',
  '경기도청 AI 영상강의',
  '협상에 의한 계약 AI 매뉴얼',
  '신규자 가상 운전연수',
  '인사·출장비 샤샤샥',
  '과거 예산자료 RAG + MCP',
  '성남시 AI 발표자료 템플릿'
]) plainText.includes(term) ? ok(`content: ${term}`) : fail(`missing content: ${term}`);
for (const removed of ['플랫폼 API로 실제 운영','월 10,000 credits','그룹 풀이 소진돼 402','품질은 마지막 20%','SKT·KT의 중국 자본','중국 자본이 많아','끝까지 구현','2027 구상']) {
  plainText.includes(removed) ? fail(`removed content still present: ${removed}`) : ok(`removed content absent: ${removed}`);
}
const imageCount = count(/<img\b/g);
const videoCount = count(/<video\b/g);
imageCount >= 45 ? ok(`${imageCount} image placements`) : fail(`${imageCount} image placements, expected at least 45`);
videoCount === 0 ? ok('0 embedded videos; demo evidence is fixed as stills') : fail(`${videoCount} embedded videos, expected 0`);
html.includes('data-title="국장님이 원한 것은 모바일 탐색"') ? fail('spoiler slide still present') : ok('case-01 spoiler slide removed');
html.includes('data-title="국장님 인사"') ? fail('director greeting slide still present') : ok('director greeting slide removed');
html.includes('data-title="오늘의 흐름"') ? fail('agenda preview slide still present') : ok('agenda preview slide removed');
html.includes('data-title="영상 강의의 모션 원칙"') ? fail('motion principles slide still present') : ok('motion principles slide removed');
html.includes('data-title="상반기 공통 공식"') ? fail('common formula slide still present') : ok('common formula slide removed');
html.includes('data-title="Codex로 이 발표본을 만든 방식"') ? fail('Codex proof slide still present') : ok('Codex proof slide removed');
const mobileFirst = html.indexOf('data-title="목차 버튼과 HTML 바로가기"');
const aiAfter = html.indexOf('data-title="배포하려면 AI를 빼야 했다"');
mobileFirst >= 0 && aiAfter > mobileFirst ? ok('slide order: mobile convenience before AI-free converter decision') : fail('slide order mismatch for mobile and AI-free converter');
const codexSection = html.indexOf('data-title="CLI와 에이전트 도구"');
const sharedSection = html.indexOf('data-title="공동구독 운영"');
codexSection >= 0 && sharedSection > codexSection ? ok('section order: CLI tools → shared subscription') : fail('section order mismatch for CLI tools/shared');
const kordocSlide = html.indexOf('data-title="다음 시간 — 류승인 주임의 Kordoc"');
const kordocDashboard = html.indexOf('data-title="Kordoc로 업무 폴더 모니터링"');
const presentationProcess = html.indexOf('data-title="발표자료 제작 프로세스"');
kordocSlide >= 0 && kordocDashboard > kordocSlide && presentationProcess > kordocDashboard ? ok('slide order: Kordoc → monitored-folder dashboard → presentation workflow') : fail('slide order mismatch for Kordoc/dashboard/presentation workflow');
for (const key of ['ArrowRight','PageDown','Home','End','toggleNotes','toggleOverview','toggleFullscreen','restartAnimations']) js.includes(key) ? ok(`control: ${key}`) : fail(`missing control: ${key}`);
for (const key of ['prefers-reduced-motion','a-mask','a-up','a-ken','data-deck-active','@media print']) css.includes(key) ? ok(`motion/print: ${key}`) : fail(`missing CSS: ${key}`);
for (const key of ['--df-paper','#f7f4ec','no_box','.deck-brand','.deck-meta','.deck-author','.hero::after','.title::after']) deckFactoryCss.includes(key) ? ok(`deck-factory: ${key}`) : fail(`missing Deck Factory CSS: ${key}`);
for (const key of ['--di-paper','#fbfbf8','--di-paper-warm','--di-rust','.slide.part .a-num','.slide:first-child::before']) designInteriorCss.includes(key) ? ok(`design-interior: ${key}`) : fail(`missing Design Interior CSS: ${key}`);
for (const key of ['di-layout-cover','di-layout-agenda','di-layout-chapter','di-layout-rust','di-layout-fullbleed','di-layout-plan']) designInteriorLayoutsCss.includes(key) ? ok(`design-interior-layout: ${key}`) : fail(`missing Design Interior recomposition layout: ${key}`);
for (const key of ['DLC AI동호회 브리핑 2026','DLC SERIES','SEONGNAM · SAJINWOO']) js.includes(key) ? ok(`master chrome: ${key}`) : fail(`missing master chrome: ${key}`);
const refs = [...html.matchAll(/(?:src|href)="(html-deck\/[^"#?]+)"/g)].map(m=>m[1]);
for (const ref of new Set(refs)) {
  const p = path.join(root, ref);
  fs.existsSync(p) && fs.statSync(p).size > 0 ? ok(`asset ${ref}`) : fail(`missing/empty asset ${ref}`);
}
for (const bad of ['TODO','TBD','PLACEHOLDER','lorem ipsum']) html.toLowerCase().includes(bad.toLowerCase()) && fail(`unresolved marker: ${bad}`);
const endingLintText = html.replaceAll('아이디어는 언제나 환영합니다','');
for (const bad of ['입니다','합니다','했습니다','됩니다','있습니다','없습니다','부탁드립니다','등장시킵니다']) endingLintText.includes(bad) && fail(`non-report ending: ${bad}`);
for (const required of [
  'html-deck/assets/generated/gpt56-official-release.svg',
  'html-deck/assets/generated/frontier-model-routing.svg',
  'html-deck/assets/generated/gyeonggi-hackathon-concept.svg',
  'html-deck/assets/generated/sns-border-logic-v1.png',
  'html-deck/assets/generated/member-automation-v1.png',
  'html-deck/assets/generated/hwpx-layer-concept.png',
  'html-deck/assets/generated/general-test-roadmap.svg',
  'html-deck/assets/evidence/environment-actual/source-map.svg',
  'html-deck/assets/evidence/environment-actual/masked-memo-parser.svg',
  'html-deck/assets/generated/korean-law-query-path.svg',
  'html-deck/assets/generated/member-five-hour-build.svg',
  'html-deck/assets/generated/gemini-quarter-plan.svg',
  'html-deck/assets/evidence/general-toc-search.png',
  'html-deck/assets/evidence/sns-public-memo-author-highlight.png',
  'html-deck/assets/evidence/rungreen-desktop.png',
  'html-deck/assets/evidence/detail/pangyo-dashboard-wide.png',
  'html-deck/assets/generated/html-motion-focus.gif',
  'html-deck/assets/generated/html-motion-data.gif',
  'html-deck/assets/generated/html-motion-transition.gif'
]) html.includes(required) ? ok(`generated visual: ${required}`) : fail(`missing generated visual reference: ${required}`);
for (const required of [
  'html-deck/assets/evidence/detail/fable5-official-crop.png',
  'html-deck/assets/evidence/detail/kimi-k3-official-crop.png',
  'html-deck/assets/evidence/detail/ai-champion-professional-47-crop.png',
  'html-deck/assets/evidence/demo-stills/sns-02-facebook-share-crop.jpg',
  'html-deck/assets/evidence/demo-stills/sns-02-gray-frame-detail.jpg',
  'html-deck/assets/evidence/demo-stills/sns-03-collector-result.jpg',
  'html-deck/assets/evidence/demo-stills/sns-04-excel-output.jpg',
  'html-deck/assets/evidence/demo-stills/green-01-app-ready.jpg',
  'html-deck/assets/evidence/demo-stills/green-02-processing.jpg',
  'html-deck/assets/evidence/demo-stills/green-03-summary.jpg',
  'html-deck/assets/evidence/demo-stills/green-04-files.jpg',
  'html-deck/assets/evidence/detail/claude-designmd-live-focus.png',
  'html-deck/assets/evidence/detail/pinterest-selected-reference-full.png',
  'html-deck/assets/evidence/detail/pinterest-selected-reference-detail.png',
  'html-deck/assets/evidence/detail/browser-qa-evidence.png'
  ,'html-deck/assets/evidence/detail/exe-run-flow.png'
  ,'html-deck/assets/evidence/detail/general-reader-html-normal.png'
  ,'html-deck/assets/evidence/detail/general-hwpx-bookmarks-actual.jpg'
  ,'html-deck/assets/evidence/detail/general-pdf-bookmarks-actual.jpg'
  ,'html-deck/assets/evidence/environment-actual/other-notes-live-user.png'
  ,'html-deck/assets/evidence/environment-actual/quarter-output-board.jpg'
  ,'html-deck/assets/evidence/detail/sns-facebook-post-actual-crop.jpg'
  ,'html-deck/assets/evidence/detail/genspark-live-plan.png'
  ,'html-deck/assets/evidence/detail/genspark-live-builder.png'
  ,'html-deck/assets/evidence/detail/genspark-output-progress.png'
  ,'html-deck/assets/evidence/detail/genspark-output-deck.png'
  ,'html-deck/assets/evidence/detail/korean-law-gpt-guide.jpg'
  ,'html-deck/assets/evidence/detail/kordoc-repository-actual.png'
  ,'html-deck/assets/evidence/detail/cli-tools/claude-code-official-demo-still.png'
  ,'html-deck/assets/evidence/detail/cli-tools/antigravity-ide-layout-official.png'
  ,'html-deck/assets/evidence/testimonials/sns-review-01-redacted.png'
  ,'html-deck/assets/evidence/testimonials/sns-review-02-redacted.png'
  ,'html-deck/assets/evidence/testimonials/sns-review-03-redacted.png'
  ,'html-deck/assets/evidence/testimonials/sns-review-04-redacted.png'
]) html.includes(required) ? ok(`curated evidence: ${required}`) : fail(`missing curated evidence reference: ${required}`);
for (const prohibited of [
  'html-deck/assets/evidence/web/pinterest.png',
  'html-deck/assets/evidence/web/claude.png',
  'html-deck/assets/evidence/detail/general-demo.mp4',
  'html-deck/assets/evidence/detail/sns-demo.mp4',
  'html-deck/assets/evidence/detail/green-demo.mp4',
  'html-deck/assets/evidence/detail/pptx-output-montage.jpg',
  'html-deck/assets/evidence/detail/design-contract-real.png',
  'html-deck/assets/evidence/general-toc-desktop.png',
  'html-deck/assets/evidence/demo-stills/general-01-pdf-open.jpg',
  'html-deck/assets/evidence/demo-stills/general-02-menu-open.jpg',
  'html-deck/assets/evidence/demo-stills/general-03-target-page.jpg'
]) html.includes(prohibited) && fail(`prohibited weak/autoplay asset still referenced: ${prohibited}`);
if (!process.exitCode) console.log('HTML_DECK_VERIFY_OK');
