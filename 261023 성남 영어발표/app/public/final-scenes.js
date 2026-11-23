const A='/assets/final-20261030/';
export const titles={ko:['시스템반도체 클러스터의 중심 성남','대한민국 팹리스의 집적지, 성남','시스템반도체 산업 지원 전략','개발지원센터 세 가지 사업','설계·검증·상용화 지원','성남 시스템반도체 얼라이언스','대학 연계 인재양성','판교 시스템반도체 연구센터','입주·연구·기술지원의 연결','기업과 인재의 동반 성장','대한민국 시스템반도체 산업의 핵심 거점 성남'],en:['Seongnam: A hub for system semiconductors','Seongnam: A concentration of Korea’s fabless companies','Strategy for supporting the system semiconductor industry','Development Support Center: Three programs','Support for design, validation and commercialization','Seongnam System Semiconductor Alliance','Talent development with universities','Pangyo System Semiconductor Research Center','Connecting business premises, research and technical support','Growth for companies and talent','Seongnam: A key hub for Korea’s system semiconductor industry']};
const el=(tag,cls,body)=>`<${tag} class="${cls}">${body}</${tag}>`;
const div=(cls,body)=>el('div',cls,body),p=(text,cls='')=>el('p',cls,text),b=(text,cls='')=>el('strong',cls,text);
const reveal=(body,cls='')=>div('reveal '+cls,body);
const photo=(file,alt,cls='')=>`<img class="${cls}" src="${A+file}" alt="${alt}" draggable="false">`;
let svgId=0;
const svg=(body,box,cls='')=>{
 const id='scene-arrow-'+(++svgId);
 const marker='<defs><marker id="'+id+'" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" viewBox="0 0 14 14" refX="12" refY="7" orient="auto-start-reverse"><path d="M 2 2 L 12 7 L 2 12" fill="none" stroke="var(--blue)" stroke-width="2"/></marker></defs>';
 return '<svg class="'+cls+'" viewBox="'+box+'" aria-hidden="true">'+marker+body.replaceAll('__ARROW__',id)+'</svg>';
};
const path=(d,head=false)=>`<path class="trace" pathLength="1" d="${d}" ${head?'marker-end="url(#__ARROW__)"':''} ${head==='both'?'marker-start="url(#__ARROW__)"':''}/>`;
export function renderScene(n,lang){
 const L=(ko,en)=>lang==='en'?en:ko;
 const head=(k,title)=>el('header','scene-heading',reveal(p(k,'eyebrow'))+reveal(el('h2','',title)));
 let body='',theme='';
 switch(n){
 case 1: case 11:
  theme='final-cover dark';
  body=photo('cover.png','', 'cover-photo')+div('cover-shade','')+p(L('성남시 시스템반도체 정책','Seongnam City · System semiconductor policy'),'eyebrow cover-kicker reveal')+
   div('cover-copy',reveal(el('h1','',n===1?L('시스템반도체<br>클러스터의 중심','A hub for<br>system semiconductors'):L('대한민국 시스템반도체 산업의<br>핵심 거점','A key hub for Korea’s<br>system semiconductor industry')))+reveal(b(L('성남','Seongnam'),'cover-city'))+(n===11?reveal(p(L('감사합니다','Thank you'),'cover-thanks')):''))+
   p(L('성남시청 AI혁신국 AI반도체과 반도체팀'+(n===1?'<br>':' ')+'사진우','Jinwoo Sa · Semiconductor Team<br>AI Semiconductor Division · AI Innovation Bureau<br>Seongnam City'),'cover-credit reveal');break;
 case 2:
  theme='industry light';
  body=head(L('산업 기반','Industrial base'),L('대한민국 팹리스의<br>집적지, 성남','Seongnam: A concentration<br>of Korea’s fabless companies'))+
   div('industry-photo reveal',photo('pangyo.png',L('판교테크노밸리 전경','Panoramic view of Pangyo Techno Valley'))+p(L('판교테크노밸리 전경 · 공식 2025 팜플렛 수록','Pangyo Techno Valley · Official 2025 brochure'),'image-credit'))+
   div('fabless-ring',svg('<circle class="ring-base" cx="180" cy="180" r="154"/><circle class="ring-value" cx="180" cy="180" r="154" pathLength="100"/>','0 0 360 360')+div('ring-label',p(L('약','Approx.'))+b('40')+p('%')))+
   p(L('대한민국 팹리스 반도체 기업 중<br>성남 소재 비중','Share of Korea’s fabless semiconductor<br>companies located in Seongnam'),'ring-caption reveal')+
   div('industry-list',[[L('판교테크노밸리','Pangyo Techno Valley'),L('설계역량','Design capabilities')],[L('한국전자기술연구원(KETI)','Korea Electronics Technology Institute (KETI)'),L('연구기반','Research base')],[L('소부장·후공정·IT 수요기업','Materials, components, equipment,<br>back-end processing and IT customers'),L('산업 연계','Industrial connections')]].map(([title,sub],i)=>div('industry-item reveal',p('0'+(i+1),'row-number')+div('',el('h3','',title)+p(sub)))).join(''));break;
 case 3:
  theme='strategy dark';
  body=head(L('추진 전략','Strategic priorities'),L('시스템반도체 산업 지원 전략','Strategy for supporting the<br>system semiconductor industry'))+
   div('strategy-map',div('strategy-hub reveal',p(L('성남','Seongnam'))+b(L('시스템반도체<br>생태계','System semiconductor<br>ecosystem')))+svg(path('M 337 245 C 445 245 475 48 580 48')+path('M 337 245 H 580')+path('M 337 245 C 445 245 475 390 580 390'),'0 0 1272 440','strategy-links')+
    div('strategy-items',[[L('인프라 구축','Infrastructure development'),L('공동장비·설계도구 · 시험·검증','Shared equipment and design tools · Testing and validation')],[L('인재양성','Talent development'),L('대학 연계 · 반도체 전문교육','University partnerships · Specialist semiconductor education')],[L('산업공간 조성','Industrial space'),L('기업 입주·연구 · 기술지원 연계','Business premises and research · Links to technical support')]].map(([a,c],i)=>div('strategy-item reveal',p('0'+(i+1),'row-number')+div('',el('h3','',a)+p(c)))).join('')));break;
 case 4:
  theme='programs light';
  body=div('validation-photo reveal',photo('validation.png',L('반도체 검증 개념 이미지 · AI 생성','Conceptual semiconductor validation image · AI-generated'))+p(L('반도체 검증 개념 이미지 · AI 생성','Semiconductor validation concept · AI-generated'),'image-credit'))+
   div('program-copy',head(L('인프라 · 사업별 역할','Infrastructure · Program roles'),L('개발지원센터<br>세 가지 사업','Development Support Center<br>Three programs'))+
    div('program-rows',[
     [L('시스템반도체<br>검증지원센터','System Semiconductor<br>Validation Support Center'),[L('검증 공간·환경 조성','Validation spaces and facilities'),L('설계 검증·기술 컨설팅','Design validation and technical consulting'),L('검증 완료 제품의 상용화 연계','Commercialization links for validated products')]],
     [L('첨단 방위산업용<br>시스템반도체 부품 실증','Advanced Defense<br>System Semiconductor<br>Component Demonstration'),[L('국방용 반도체 검증 인프라','Defense semiconductor validation infrastructure'),L('전주기 실증 지원 체계','Demonstration support across the development cycle'),L('국방 무기체계 진입 지원','Support for integration into defense weapon systems')]],
     [L('팹리스 첨단장비<br>공동이용지원','Shared Advanced Equipment<br>for Fabless Companies'),[L('고성능 검증 장비 공동활용','Shared high-performance validation equipment'),L('고가 장비·EDA 이용 부담 완화','Reduced cost barriers to equipment and EDA tools'),L('장비 활용 전문교육','Specialist training in equipment use')]],
    ].map(([a,c],i)=>div('program-row reveal',p('0'+(i+1),'row-number')+el('h3','',a)+div('program-details',c.map(t=>p(t)).join('')))).join('')));break;
 case 5:
  theme='support-flow pale';
  body=head(L('기업 지원','Business support'),L('설계·검증·상용화 지원','Support for design, validation<br>and commercialization'))+
   div('flow-stages',svg(path('M 50 30 H 1190',true),'0 0 1240 60','flow-line')+[
    [L('설계·시제작','Design and prototyping'),L('EDA 설계도구','EDA design tools'),L('설계 지원','Design support')],
    [L('시험·검증','Testing and validation'),L('공동이용 장비','Shared equipment'),L('설계·성능 검증','Design and performance validation')],
    [L('상용화 연계','Commercialization links'),L('검증 완료 제품','Validated products'),L('사업화 지원','Commercialization support')],
   ].map(([a,c,d],i)=>div('flow-stage reveal',b('0'+(i+1),'flow-number')+el('h3','',a)+p(c)+p(d))).join(''))+
   div('support-band reveal',p(L('기술 컨설팅 · 전문교육','Technical consulting · Specialist training'))+p(L('개발비용 부담 완화 · 기업 경쟁력 강화','Lower development costs · Stronger business competitiveness')))+
   p(L('운영현황(2026)　장비 27건 · 검증 솔루션 7건 · 기업지원 131건 · 행사·교육 37회','Operations (2026)　27 equipment items · 7 validation solutions · 131 business support cases · 37 events and training sessions'),'operation-counts reveal');break;
 case 6:
  theme='alliance-current dark';
  body=head(L('인프라 · 기업 협력','Infrastructure · Business cooperation'),L('성남 시스템반도체 얼라이언스','Seongnam System Semiconductor Alliance'))+
   div('alliance-network',div('alliance-node supplier reveal',p(L('반도체','Semiconductor'))+b(L('공급기업','Suppliers')))+svg(path('M 385 110 H 570','both')+path('M 865 110 H 1050','both'),'0 0 1440 220','exchange-lines')+div('exchange-label reveal',p(L('기술교류','Technical exchange'))+p(L('협력기회','Cooperation opportunities')))+div('alliance-node customer reveal',p(L('반도체','Semiconductor'))+b(L('수요기업','Customers'))))+
   div('alliance-activities',[
    [L('테크포럼 데이','Tech Forum Day'),L('최신 기술 세미나·기업 기술발표','Seminars on new technologies · Company presentations'),L('공급·수요기업 간 기술교류','Technical exchange between suppliers and customers')],
    [L('소규모 네트워킹','Small-group networking'),L('기술 분야별 기업 연결','Connecting companies by technology field'),L('협력 수요·공동사업 기회 발굴','Identifying cooperation needs and joint projects')],
    [L('정부과제 공동기획','Joint planning of government projects'),L('분과별 정부과제 RFP 기획','Working-group planning of government project RFPs'),L('공동 R&D 협력 기회 발굴','Identifying opportunities for joint R&D')],
   ].map(([a,c,d])=>div('alliance-activity reveal',el('h3','',a)+p(c)+p(d))).join(''))+
   p(L('2026년 얼라이언스 참여 77개사 · 공급기업 55개사 / 수요기업 22개사','2026 Alliance participation: 77 companies · 55 suppliers / 22 customers'),'alliance-counts reveal')+
   div('alliance-intro',p(L('2026년 얼라이언스 참여','2026 Alliance participation'))+b('77')+p(L('개사','companies')));break;
 case 7:
  theme='education light';
  body=head(L('인재양성 · 분야별 전문 역량','Talent development · Specialist skills'),L('대학 연계 인재양성','Talent development with universities'))+photo('education.png','','education-art')+
   div('education-eligibility reveal',p(b(L('대상·규모','Eligibility and places'))+' '+L('경기도 거주 15세 이상 미취업자 / 100명','Unemployed Gyeonggi residents aged 15 or older / 100 places'))+p(b(L('사업기간','Program period'))+' '+L('연중','Year-round')))+
   div('education-columns',[
    [L('실무인력','Practical skills'),L('한국폴리텍대학<br>성남캠퍼스','Korea Polytechnics<br>Seongnam Campus'),L('AI반도체 제조·패키징·테스트<br>공정 기술아카데미','AI Semiconductor Manufacturing,<br>Packaging and Testing<br>Process Technology Academy'),L('고등학교 졸업(예정)자 이상','High school graduates<br>or expected graduates and above'),L('40명(20명 × 2회)','40 places (20 × 2 cohorts)')],
    [L('전문인력','Specialist skills'),L('가천대학교','Gachon University'),L('디지털설계 전문가 과정','Digital Design Specialist Program'),L('전문학사 이상','Associate degree or higher'),L('30명','30 places')],
    [L('고급인력','Advanced skills'),L('서강대학교<br>판교캠퍼스','Sogang University<br>Pangyo Campus'),L('글로벌 반도체설계 전문가 과정','Global Semiconductor Design<br>Specialist Program'),L('이공계열 학사 이상<br>(관련 전공자)','Bachelor’s degree or higher in<br>science or engineering<br>(relevant major)'),L('30명','30 places')],
   ].map(([a,c,d,e,f])=>div('education-column reveal',el('h3','',a)+el('h4','school',c)+div('course',p(L('교육과정','Course'),'field-label')+p(d))+div('qualification',p(L('대상','Entry qualification'),'field-label')+p(e))+div('places',p(L('모집인원','Recruitment places'),'field-label')+b(f)))).join(''));break;
 case 8:
  theme='research-current pale';
  body=head(L('산업공간 · 조성 계획','Industrial space · Development plan'),L('판교 시스템반도체 연구센터','Pangyo System Semiconductor<br>Research Center'))+
   div('research-photo reveal',photo('research-center.jpg',L('성남도시개발공사 공개 판교 시스템반도체 연구센터 조감도','Pangyo System Semiconductor Research Center rendering published by Seongnam Development Corporation'))+p(L('조감도 · 성남도시개발공사 공개 자료','Architectural rendering · Seongnam Development Corporation'),'image-credit'))+
   div('research-facts',div('research-year reveal',b('2030')+p(L('년 준공 목표','Target completion')))+div('research-metrics reveal',[[L('부지면적','Site area'),'4,627 ㎡'],[L('연면적','Gross floor area'),'29,542 ㎡'],[L('건축규모','Building scale'),L('지하 3층 ~ 지상 8층','3 basement levels · 8 above-ground floors')]].map(([a,c])=>div('',p(a)+b(c))).join('')))+
   div('research-location reveal',b(L('제3판교테크노밸리','Pangyo 3rd Techno Valley'))+p(L('성남금토 공공주택지구 자족용지 6-1','Self-sufficient facilities plot 6-1,<br>Seongnam Geumto Public Housing District')))+
   div('research-timeline reveal',p(L('사업기간 · 2025–2030년 계획','Project period · Planned for 2025–2030'))+div('timeline-line','')+div('timeline-labels',p('2025')+p(L('2026 · 조성 추진','2026 · Development underway'))+p(L('2030 · 준공 목표','2030 · Target completion'))));break;
 case 9:
  theme='research-floors dark';
  body=head(L('판교 시스템반도체 연구센터 · 공간배치 계획','Pangyo System Semiconductor Research Center · Spatial plan'),L('입주·연구·기술지원의 연결','Connecting business premises,<br>research and technical support'))+
   div('building-diagram',div('building-floors',Array.from({length:8},(_,i)=>div('floor '+(i<5?'industrial':'support'),p((8-i)+'F')+div('floor-windows',Array.from({length:8},()=>'<i></i>').join('')))).join(''))+p(L('층별 기능 개념도','Conceptual floor functions'),'building-caption'))+
   div('floor-uses',div('floor-industry reveal',p(L('4–8층','Floors 4–8'),'field-label')+el('h3','',L('산업시설','Industrial facilities'))+p(L('기업 입주·연구공간','Business premises and research space')))+div('floor-support reveal',p(L('1–3층','Floors 1–3'),'field-label')+el('h3','',L('지원시설','Support facilities'))+p(L('개발지원센터 등<br>기업지원 기능','Development Support Center and<br>other business support functions'))))+
   div('area-allocation reveal',p(L('용도별 연면적 배분','Gross floor area by use'))+div('allocation-bar',b('70%','industrial-share')+b('30%','support-share'))+div('allocation-row',b('20,737㎡')+p(L('산업시설','Industrial facilities')))+div('allocation-row',b('8,805㎡')+p(L('지원시설','Support facilities')))+p(L('용도별 계획 면적','Planned floor area by use'),'allocation-note'))+
   div('research-links reveal',p(L('기업 입주·연구','Business premises and research'))+p('↔')+p(L('공동장비·기술지원','Shared equipment and technical support'))+p('↔')+p(L('수요 연계 R&D','Demand-linked R&D')));break;
 case 10:
  theme='outcomes light';
  body=head(L('정책 목표','Policy objectives'),L('기업과 인재의 동반 성장','Growth for companies and talent'))+
   div('outcome-rows',[[L('공동 인프라<br>전주기 지원','Shared infrastructure<br>Support across the development cycle'),L('팹리스 경쟁력 강화','Stronger fabless competitiveness')],[L('대학 연계<br>전문역량 교육','University partnerships<br>Specialist skills training'),L('양질의 일자리 창출','Creation of quality jobs')],[L('산업공간<br>기업 협력','Industrial space<br>Business cooperation'),L('지속 가능한 산업 생태계','A sustainable industrial ecosystem')]].map(([a,c],i)=>div('outcome-row reveal',div('outcome-input',p('0'+(i+1),'row-number')+p(a))+svg(path('M 0 20 H 140',true),'0 0 150 40','outcome-arrow')+el('h3','',c))).join(''))+
   p(L('기술개발과 협력, 성장을 뒷받침하는 도시','A city supporting technological development, cooperation and growth'),'outcome-close reveal');break;
 }
 return `<article class="scene ${theme}" lang="${lang}" data-scene="${n}">${body}<footer class="scene-footer">${String(n).padStart(2,'0')} / 11</footer></article>`;
}
