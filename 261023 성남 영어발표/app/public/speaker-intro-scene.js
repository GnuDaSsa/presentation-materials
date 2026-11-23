export function renderSpeakerIntro(lang,total){
 const en=lang==='en',L=(ko,english)=>en?english:ko;
 return `<article class="scene speaker-intro dark" lang="${lang}" data-scene="2">
  <header class="scene-heading"><p class="eyebrow">${L('발표자 소개',"Today's speaker")}</p><h2 class="intro-name">${L('사진우','Jinwoo Sa')}</h2></header>
  <div class="intro-portrait"><img src="/assets/speaker-intro/lecturer-profile.png" alt="${L('사진우 강의 프로필 사진','Jinwoo Sa — lecturer profile photograph')}" draggable="false"></div>
  <div class="intro-organization"><strong>${L('성남시청','Seongnam City Hall')}</strong><p>${L('AI혁신국','AI Division')}<br>${L('AI반도체과','AI Semiconductor Department')}<br>${L('반도체팀','Semiconductor Team')}</p></div>
  <section class="champion-program" aria-label="${L('AI 챔피언 블랙 과정','AI Champion Black course')}">
   <p class="champion-label">AI CHAMPION</p><h3 class="champion-title">BLACK</h3>
   <p class="champion-completion">${L('고급과정 수료','Advanced course completed')}</p>
   <p class="champion-description">${L('행정안전부 AI 챔피언 프로그램의 최고 등급','The highest level of the AI Champion program')}<br><span>${L('공공부문 AI 전문인재 교육·인증','Government AI certification program · Republic of Korea')}</span></p>
   <div class="champion-track" aria-label="Green, Blue, Black">
    <div class="champion-level green"><i></i><strong>GREEN</strong><span>${L('초급','Basic')}</span></div><span class="champion-connector">→</span>
    <div class="champion-level blue"><i></i><strong>BLUE</strong><span>${L('중급','Intermediate')}</span></div><span class="champion-connector">→</span>
    <div class="champion-level black"><i></i><strong>BLACK</strong><span>${L('고급 · 최고 등급','Advanced · Highest level')}</span></div>
   </div>
   <div class="intro-ai"><p>${L('오늘 발표자료 + 실시간 자막',"Today's slides + Live captions")}</p><strong>${L('AI로 직접 제작','Created by me using AI')}</strong></div>
  </section>
  <a class="intro-source" href="https://www.mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&amp;nttId=125796" target="_blank" rel="noopener noreferrer">${L('과정 안내 · 행정안전부, 2026. 5. 7.','Program source · Ministry of the Interior and Safety, 7 May 2026')} ↗</a>
  <footer class="scene-footer">02 / ${total}</footer>
 </article>`;
}
