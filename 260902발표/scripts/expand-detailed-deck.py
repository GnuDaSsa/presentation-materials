from bs4 import BeautifulSoup
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'DLC_AI동호회_1시간_브리핑.html'
soup=BeautifulSoup(path.read_text(encoding='utf-8'),'html.parser')

if soup.find('section',attrs={'data-title':'첫 답은 한글파일 안에 직접 넣는 것'}):
    raise SystemExit('detail expansion already applied')

def sec(title):
    return next((x for x in soup.select('section.slide') if x.get('data-title')==title),None)

def fragment(markup):
    return BeautifulSoup(markup,'html.parser').find('section')

def after(title,*blocks):
    anchor=sec(title)
    if not anchor: raise KeyError(title)
    for block in blocks:
        node=fragment(block); anchor.insert_after(node); anchor=node

def before(title,*blocks):
    anchor=sec(title)
    if not anchor: raise KeyError(title)
    for block in blocks:
        node=fragment(block); anchor.insert_before(node)

def note(time,body,sources):
    return f'<template class="notes"><span class="time">{time}</span>{body}<div class="sources">Sources<br/>{sources}</div></template>'

def set_note(title,time,body,sources):
    slide=sec(title)
    old=slide.select_one('template.notes')
    old.replace_with(BeautifulSoup(note(time,body,sources),'html.parser').find('template'))

GENERAL_FIRST='''
<section class="slide" data-title="첫 답은 한글파일 안에 직접 넣는 것">
<p class="eyebrow a-fade">CASE 01 · 최초 요청을 그대로 구현</p>
<h2 class="title sm a-mask">첫 답은 한글파일 안에<br/>책갈피와 하이라이트를 직접 넣는 것</h2>
<div class="grid" style="grid-template-columns:.72fr 1.28fr;gap:30px;margin-top:34px">
<figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/detail/general-report-cover.jpg" alt="AI혁신국 일반현황 실제 표지"><figcaption>입력: 실제 AI혁신국 일반현황</figcaption></figure>
<div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
<figure class="evidence-shot a-up d3"><img src="html-deck/assets/evidence/detail/general-report-toc-1.jpg" alt="일반현황 실제 목차 첫 부분"><figcaption>한글 목차의 제목·쪽번호</figcaption></figure>
<figure class="evidence-shot a-up d4"><img src="html-deck/assets/evidence/detail/general-report-toc-2.jpg" alt="일반현황 실제 목차 다음 부분"><figcaption>부서별로 반복되는 긴 목차</figcaption></figure>
</div></div>
<div class="process a-up d5" style="grid-template-columns:repeat(3,1fr);margin-top:22px"><div class="step"><span class="kicker">01</span><h3>목차 제목 찾기</h3></div><div class="step"><span class="kicker">02</span><h3>본문 제목과 연결</h3></div><div class="step accent-card"><span class="kicker">03</span><h3>책갈피·하이라이트 삽입</h3></div></div>
<template class="notes"><span class="time">1분</span><p>최초 요청은 명확해 보였다. 한글 목차에서 원하는 항목을 누르면 해당 본문으로 이동하고, 찾은 제목은 눈에 띄게 하이라이트하는 기능이었다. 그래서 첫 답은 요청받은 기능을 그대로 구현하는 방향이었다.</p><p>실제 일반현황은 184쪽이고 부서마다 비슷한 소목차가 반복됐다. 제목 문자열만 맞추면 다른 부서의 같은 제목으로 이동할 수 있어 목차의 제목·쪽번호·순서를 함께 읽는 구조까지 만들었다. 이 단계만 보면 기술적으로는 성공이었다.</p><div class="sources">Sources<br/>AI혁신국 일반현황 실제 PDF pp.1–6<br/>한글파일_하이라이트_책갈피_진행기록.md</div></template>
</section>'''
GENERAL_PDF='''
<section class="slide paper" data-title="PDF로 안 되냐고 해서 2시간 더">
<p class="eyebrow a-fade">CASE 01 · 첫 번째 방향 전환</p>
<h2 class="title sm a-mask">하루 만에 한글 버전을 보여드리자<br/>“이거 PDF로는 안 되나?”</h2>
<div class="grid" style="grid-template-columns:1.22fr .78fr;gap:30px;margin-top:28px;align-items:center">
<div class="demo-sequence demo-sequence--3 a-up d2"><figure class="demo-frame"><img src="html-deck/assets/evidence/demo-stills/general-01-pdf-open.jpg" alt="PDF 시작 화면"></figure><figure class="demo-frame"><img src="html-deck/assets/evidence/demo-stills/general-02-menu-open.jpg" alt="목차 메뉴"></figure><figure class="demo-frame"><img src="html-deck/assets/evidence/demo-stills/general-03-target-page.jpg" alt="목표 페이지"></figure></div>
<div class="a-up d3"><div class="stat"><strong>+2시간</strong><span>PDF 버전 추가 제작</span></div><div class="list" style="margin-top:24px"><div class="list-row"><span class="n">1</span><strong>PDF 페이지를 웹에서 표시</strong></div><div class="list-row"><span class="n">2</span><strong>목차 버튼과 이동 기능 추가</strong></div><div class="list-row"><span class="n">3</span><strong>폰으로 옮겨 실제 사용 확인</strong></div></div></div>
</div>
<template class="notes"><span class="time">1분</span><p>한글 버전은 하루 만에 만들었다. 그런데 결과를 보여드리자 바로 “이거 PDF로는 안 되나?”라는 요청이 나왔다. 한글 안에서 책갈피가 동작하는 것보다 PDF 형태로 들고 다니는 편이 훨씬 익숙했기 때문이다.</p><p>그래서 두 시간 정도 더 써서 PDF를 브라우저에서 보는 형태로 바꿨다. PDF 페이지를 이미지처럼 표시하고, 목차 버튼을 누르면 해당 페이지로 이동하게 했다. 여기까지도 나는 ‘요청받은 파일 형식을 바꿔준 것’이라고 생각했다.</p><div class="sources">Sources<br/>User-provided briefing structure, 2026-08-30<br/>260602 국장님 미션/시연영상.mp4</div></template>
</section>'''
GENERAL_PHONE='''
<section class="slide" data-title="폰에서 안 된다는 말이 방향을 바꿈">
<p class="eyebrow a-fade">CASE 01 · 진짜 요구를 발견한 순간</p>
<h2 class="title sm a-mask">“폰에 넣었는데 잘 안 된다”<br/>그제야 파일이 아니라 사용 장면을 봄</h2>
<div class="evidence-strip" style="margin-top:28px">
<figure class="evidence-shot a-up d1"><img src="html-deck/assets/evidence/general-toc-search.png" alt="모바일 목차 검색 화면"><figcaption>검색: 제목을 직접 입력</figcaption></figure>
<figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/detail/general-toc-open.jpg" alt="모바일 목차를 연 실제 장면"><figcaption>목차: 한 손으로 펼침</figcaption></figure>
<figure class="evidence-shot a-up d3"><img src="html-deck/assets/evidence/general-after-jump.png" alt="모바일에서 대상 페이지로 이동한 장면"><figcaption>이동: 원하는 현황으로 즉시 점프</figcaption></figure>
</div>
<p class="quote a-up d5" style="font-size:23px;margin-top:28px">아, 국장님이 원한 건 ‘책갈피가 있는 파일’이 아니라<br/>‘폰에서 국 현황자료를 빨리 찾는 구조’였구나</p>
<template class="notes"><span class="time">1분 30초</span><p>PDF까지 만들고 휴대전화에 넣었는데 “잘 안 된다”는 피드백이 다시 왔다. 이때서야 처음 두 번의 답이 모두 기능 중심이었다는 걸 알았다. 한글 책갈피도 만들었고 PDF도 만들었지만, 국장님이 실제로 하려는 행동을 보지 못했다.</p><p>진짜 요구는 회의나 이동 중 휴대전화로 긴 현황자료를 열고, 목차에서 항목을 찾고, 바로 그 페이지로 가는 것이었다. 이 판단 이후 한글→책갈피→하이라이트 과정은 전부 삭제하고 PDF를 바로 입력으로 받는 구조로 바꿨다.</p><div class="sources">Sources<br/>User-provided briefing structure, 2026-08-30<br/>모바일 390px 실제 캡처</div></template>
</section>'''
SNS_INITIAL='''
<section class="slide" data-title="처음에는 생산과 공유만 생각">
<p class="eyebrow a-fade">CASE 02 · 내가 처음 생각한 범위</p>
<h2 class="title sm a-mask">나는 처음에<br/>‘직접 생산’과 ‘단순 공유’만 나누면 끝인 줄 알았음</h2>
<div class="grid" style="grid-template-columns:1.2fr .8fr;gap:32px;margin-top:30px">
<figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/detail/sns-collector-start.jpg" alt="성남 SNS 취합기 실제 실행 화면"><figcaption>실제 SeongNam SNS Solution 수집 시작 화면</figcaption></figure>
<div class="process a-up d3" style="grid-template-columns:1fr;gap:10px"><div class="step"><span class="kicker">생산</span><h3>내가 직접 쓴 홍보 게시물</h3></div><div class="step"><span class="kicker">공유</span><h3>다른 게시물을 그대로 공유</h3></div><div class="step accent-card"><span class="kicker">현실</span><h3>둘 사이의 애매한 사례가 계속 등장</h3></div></div>
</div>
<template class="notes"><span class="time">1분</span><p>개발을 시작할 때 내가 생각한 분류는 단순했다. 직접 만든 게시물이면 생산, 남이 만든 게시물을 옮기면 공유라고 보면 된다고 생각했다.</p><p>하지만 실무 담당자가 실제 게시물을 하나씩 확인해주면서 상황이 달라졌다. 동영상 공유, 기사 공유, 공유하면서 한두 글자만 적은 글, 남이 나를 태그한 글, 생일 글처럼 사람이 봐도 잠깐 고민해야 하는 사례가 계속 나왔다. 여기서부터 분류 규칙을 실무와 함께 만들기 시작했다.</p><div class="sources">Sources<br/>User-provided briefing structure, 2026-08-30<br/>활용영상.mp4</div></template>
</section>'''
SNS_REALITY='''
<section class="slide" data-title="실제 게시물은 예외가 먼저 등장">
<p class="eyebrow a-fade">CASE 02 · 실무 피드백으로 늘어난 예외</p>
<h2 class="title sm a-mask">동영상·기사·한두 글자·태그·생일<br/>사람이 보는 기준을 규칙으로 옮김</h2>
<div class="grid" style="grid-template-columns:1.18fr .82fr;gap:28px;margin-top:28px">
<figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/detail/sns-cases-manual.jpg" alt="SNS 취합기 공유 생산 구분 특이 사례 매뉴얼"><figcaption>운영 매뉴얼 7쪽: 특이 Case 공유/생산 구분</figcaption></figure>
<div class="list a-up d3" style="gap:12px"><div class="list-row"><span class="n">01</span><strong>URL + 설명 작성 → 생산</strong></div><div class="list-row"><span class="n">02</span><strong>URL만 붙여넣기 → 공유</strong></div><div class="list-row"><span class="n">03</span><strong>바로 공유 + 한두 글자 → 생산</strong></div><div class="list-row"><span class="n">04</span><strong>남이 나를 태그 → 제외</strong></div><div class="list-row"><span class="n">05</span><strong>생일 축하 게시물 → 제외</strong></div></div>
</div>
<template class="notes"><span class="time">1분</span><p>김나래 주사가 준 피드백은 ‘정답을 알려주는 문서’가 아니라 실제 Facebook 게시물이었다. 나는 그 사례를 다시 수집기에 넣고, 왜 잘못 잡히는지 확인하고, 다음 번에는 같은 형태가 자동으로 분류되도록 규칙을 추가했다.</p><p>그래서 매뉴얼 마지막 쪽에는 글을 쓰고 URL을 붙인 경우, URL만 붙인 경우, 외부 공유버튼을 누른 경우, 릴스, 태그, 생일 글까지 일곱 가지가 실제 화면으로 고정됐다. 이 표가 코드보다 먼저 실무 기준이 됐다.</p><div class="sources">Sources<br/>자동취합기매뉴얼260823.pdf p.7<br/>User-provided briefing structure</div></template>
</section>'''
SNS_CLUE='''
<section class="slide paper" data-title="회색 테두리를 첫 단서로 잡음">
<p class="eyebrow a-fade">CASE 02 · 가장 핵심적인 단서</p>
<h2 class="title sm a-mask">Facebook 공유 게시물에는<br/>흐릿한 회색 테두리가 생겼음</h2>
<div class="grid" style="grid-template-columns:1.25fr .75fr;gap:28px;margin-top:26px">
<div class="demo-sequence demo-sequence--sns a-up d2"><figure class="demo-frame portrait"><img src="html-deck/assets/evidence/demo-stills/sns-02-facebook-share-crop.jpg" alt="실제 공유 게시물"></figure><figure class="demo-frame portrait"><img src="html-deck/assets/evidence/demo-stills/sns-02-gray-frame-detail.jpg" alt="회색 프레임 확대"></figure><figure class="demo-frame wide"><img src="html-deck/assets/evidence/demo-stills/sns-03-collector-result.jpg" alt="수집기 판정"></figure></div>
<div class="grid" style="grid-template-columns:1fr;gap:12px"><figure class="evidence-shot a-up d3"><img src="html-deck/assets/evidence/detail/sns-facebook-post-1.jpg" alt="공유 게시물 프레임 실제 화면"><figcaption>공유 프레임 후보</figcaption></figure><figure class="evidence-shot a-up d4"><img src="html-deck/assets/evidence/detail/sns-facebook-post-2.jpg" alt="동영상 공유 게시물 실제 화면"><figcaption>동영상 공유의 다른 형태</figcaption></figure></div>
</div>
<p class="quote a-up d5" style="font-size:20px;margin-top:18px">이 테두리를 단서로 대분류를 시작했지만, 대충 잡자 엥간한 테두리를 전부 공유로 오인</p>
<template class="notes"><span class="time">1분</span><p>여러 게시물을 보다가 공유된 콘텐츠 주변에 흐릿한 회색 테두리가 생기는 것을 발견했다. 처음에는 이 테두리만 찾으면 공유 게시물을 크게 나눌 수 있다고 생각했다.</p><p>문제는 회색 선을 너무 넓게 잡으면 카드, 댓글, 일반 UI의 경계선까지 전부 공유 프레임으로 잡힌다는 점이었다. 여기서 최왕 청년인턴이 브라우저가 실제로 쓰는 네 면의 값을 확인해보자는 아이디어를 냈고, 다음 단계에서 그 값으로 오인을 줄였다.</p><div class="sources">Sources<br/>활용영상.mp4<br/>User-provided briefing structure</div></template>
</section>'''
GREEN_SOURCE='''
<section class="slide" data-title="원본 하나를 부서별 파일로 나눔">
<p class="eyebrow a-fade">CASE 03 · 요청을 한 문장으로 바꾸면</p>
<h2 class="title sm a-mask">여러 부서가 섞인 원본 하나를 넣으면<br/>부서별 제출 파일 여러 개가 나오는 구조</h2>
<div class="evidence-strip" style="margin-top:30px">
<figure class="evidence-shot a-up d1"><img src="html-deck/assets/evidence/detail/green-start.jpg" alt="RunGreen 초기 화면"><figcaption>① 원본 엑셀 선택</figcaption></figure>
<figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/detail/green-result-counts.jpg" alt="RunGreen 결과 건수 화면"><figcaption>② 추출·부서·파일 수 확인</figcaption></figure>
<figure class="evidence-shot a-up d3"><img src="html-deck/assets/evidence/detail/green-folder-result.jpg" alt="생성된 부서별 엑셀 폴더"><figcaption>③ 부서별 엑셀과 요약 파일</figcaption></figure>
</div>
<div class="process a-up d5" style="grid-template-columns:repeat(3,1fr);margin-top:28px"><div class="step"><span class="kicker">INPUT</span><h3>친환경 물품 원본</h3></div><div class="step"><span class="kicker">RULE</span><h3>031 번호·부서명·분기</h3></div><div class="step accent-card"><span class="kicker">OUTPUT</span><h3>부서별 제출용 Excel</h3></div></div>
<template class="notes"><span class="time">1분</span><p>장혜린 주사의 요청은 여러 부서의 녹색제품 구매내역이 섞인 원본을 각 부서가 확인할 수 있는 결과 서식으로 나누는 일이었다. 엑셀 기능만 보면 필터와 복사에 가깝지만, 사람이 매번 반복하면 빠뜨리기 쉽고 서식까지 다시 맞춰야 했다.</p><p>그래서 사용자는 원본 하나만 올리고, 도구는 031 직장번호와 부서명, 분기, 구매금액을 읽어 여러 개의 부서별 파일과 summary.xlsx를 만들도록 했다. 해결책은 머리에 있었고 AI가 부족한 구현 기술을 메운 사례다.</p><div class="sources">Sources<br/>업무_히스토리_보고서.md<br/>2026-07-07 09 13 10.mp4</div></template>
</section>'''
GREEN_DEMO='''
<section class="slide paper" data-title="47초 시연으로 확인한 최종 흐름">
<p class="eyebrow a-fade">CASE 03 · 실제 시연</p>
<h2 class="title sm a-mask">파일 선택부터 ZIP 다운로드까지<br/>47초 안에 전체 흐름 확인</h2>
<div class="grid" style="grid-template-columns:1.26fr .74fr;gap:28px;margin-top:26px">
<div class="demo-sequence demo-sequence--2x2 a-up d2"><figure class="demo-frame"><img src="html-deck/assets/evidence/demo-stills/green-01-app-ready.jpg" alt="앱 시작"></figure><figure class="demo-frame"><img src="html-deck/assets/evidence/demo-stills/green-02-processing.jpg" alt="처리 로그"></figure><figure class="demo-frame"><img src="html-deck/assets/evidence/demo-stills/green-03-summary.jpg" alt="결과 집계"></figure><figure class="demo-frame"><img src="html-deck/assets/evidence/demo-stills/green-04-files.jpg" alt="부서별 파일"></figure></div>
<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><figure class="evidence-shot a-up d3"><img src="html-deck/assets/evidence/detail/green-file-loaded.jpg" alt="원본 파일을 올린 RunGreen 화면"><figcaption>원본 인식</figcaption></figure><figure class="evidence-shot a-up d4"><img src="html-deck/assets/evidence/detail/green-download.jpg" alt="RunGreen ZIP 다운로드 화면"><figcaption>ZIP 생성</figcaption></figure><figure class="evidence-shot a-up d5" style="grid-column:1/3"><img src="html-deck/assets/evidence/detail/green-qa-desktop.png" alt="RunGreen 데스크톱 QA 화면"><figcaption>데스크톱 실제 QA 화면</figcaption></figure></div>
</div>
<template class="notes"><span class="time">1분</span><p>시연에서는 원본 엑셀을 선택하고 ‘부서별 ZIP 생성’을 누른다. 브라우저 안에서 행을 읽고 분기와 부서를 판정한 뒤 정상 추출과 확인 필요 건수를 보여주고 ZIP을 내려준다.</p><p>화면이 단순한 이유는 결과 서식을 따로 올리는 단계까지 없앴기 때문이다. 결과 템플릿은 앱 안에 내장했고, 원본 파일은 127.0.0.1 로컬 브라우저에서만 처리해 외부 서버로 보내지 않는다.</p><div class="sources">Sources<br/>2026-07-07 09 13 10.mp4<br/>자료/qa_desktop.png</div></template>
</section>'''
MEMBER_APPLE='''
<section class="slide" data-title="아이디어는 Apple 연동에서 출발">
<p class="eyebrow a-fade">CASE 06 · 자동화 아이디어가 생긴 순서</p>
<h2 class="title sm a-mask">Mac과 iPhone이 같은 연락처를 보고,<br/>Mac에는 에이전트가 상주</h2>
<div class="grid" style="grid-template-columns:1.15fr .85fr;gap:32px;margin-top:30px">
<div class="media-frame a-up d2" style="height:380px;background:#f1eee8"><img src="html-deck/assets/evidence/detail/member-apple-devices.jpg" alt="Mac과 iPhone 연락처 연동을 표현한 장면"></div>
<div class="process a-up d3" style="grid-template-columns:1fr;gap:10px"><div class="step"><span class="kicker">발견 01</span><h3>iPhone 주소록이 Mac에도 동기화</h3></div><div class="step"><span class="kicker">발견 02</span><h3>Mac의 에이전트가 파일과 앱을 처리</h3></div><div class="step accent-card"><span class="kicker">연결</span><h3>설문 명단 → 연락처 → 문자까지 한 흐름</h3></div></div>
</div>
<template class="notes"><span class="time">1분</span><p>이 자동화는 거대한 시스템을 만들겠다는 계획에서 시작하지 않았다. 내 컴퓨터와 휴대전화가 모두 Apple 환경으로 맞춰지면서 iPhone 연락처가 Mac에서도 바로 보인다는 사실에서 시작했다.</p><p>그리고 Mac에는 파일을 읽고 앱을 다룰 수 있는 에이전트가 상주한다. 그렇다면 네이버폼 결과가 Google 표에 쌓인 뒤 최근 가입자만 골라 연락처에 넣고 같은 사람에게 문자를 보내는 과정까지 이어볼 수 있다고 생각했다.</p><div class="sources">Sources<br/>User-provided briefing structure, 2026-08-30<br/>프로젝트 전용 자동화 시각자료</div></template>
</section>'''
GEMINI_QUARTER='''
<section class="slide" data-title="분기당 10명씩 네 번 운영 구상">
<p class="eyebrow a-fade">CASE 07 · 사용자를 어떻게 나눌 것인가</p>
<h2 class="title sm a-mask">계정 2개 × 각 5명<br/>분기당 10명씩 네 번 경험시키는 구상</h2>
<div class="quarter-wheel a-up d2" style="margin-top:38px"><div><span>1분기</span><strong>10명</strong></div><i>→</i><div><span>2분기</span><strong>10명</strong></div><i>→</i><div><span>3분기</span><strong>10명</strong></div><i>→</i><div><span>4분기</span><strong>10명</strong></div></div>
<div class="grid" style="grid-template-columns:1fr 1fr;gap:28px;margin-top:34px"><div class="stat a-num"><strong>40명</strong><span>1년 동안 유료 기능을 경험시키는 목표</span></div><div class="mini-table a-up d4"><div><b>계정 A</b><span>가족 구성원</span><strong>5명</strong></div><div><b>계정 B</b><span>가족 구성원</span><strong>5명</strong></div><div><b>주의</b><span>분기 교체 가능성</span><strong>구매 전 검증</strong></div></div></div>
<template class="notes"><span class="time">1분</span><p>운영 아이디어는 단순하다. 계정 하나에 다섯 명을 추가할 수 있다고 보고 두 계정을 준비하면 한 번에 열 명이 유료 기능을 쓸 수 있다. 이 열 명을 분기마다 바꾸면 네 번, 계산상 마흔 명이 1년 안에 경험할 수 있다.</p><p>다만 이것은 지원금 운용 아이디어이지 확정된 서비스 조건이 아니다. 가족그룹 변경 제한 때문에 분기 순환이 실제로 가능한지는 다음 장의 공식 조건을 보고, 구매 전 시험 그룹으로 검증해야 한다.</p><div class="sources">Sources<br/>User-provided briefing structure, 2026-08-30<br/>Google 가족그룹 공식 조건 확인 필요</div></template>
</section>'''
CODEX_ACTUAL='''
<section class="slide paper" data-title="Codex로 이 발표본을 만든 방식">
<p class="eyebrow a-fade">CODEX 101 · 지금 보고 있는 파일 자체가 사례</p>
<h2 class="title sm a-mask">자료 폴더를 읽고 → 화면을 뽑고 → HTML을 만들고<br/>브라우저에서 57장을 다시 검사</h2>
<div class="grid" style="grid-template-columns:1.15fr .85fr;gap:30px;margin-top:28px">
<figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/detail/codex-current-deck.jpg" alt="Codex로 제작한 현재 HTML 발표본의 브라우저 검증 연락시트"><figcaption>현재 발표본의 실제 브라우저 검증 화면</figcaption></figure>
<div class="list a-up d3" style="gap:15px"><div class="list-row"><span class="n">READ</span><strong>네 개 자료 폴더·PDF·영상·저장소 확인</strong></div><div class="list-row"><span class="n">MAKE</span><strong>이미지 추출·HTML·CSS·발표자 노트 생성</strong></div><div class="list-row"><span class="n">RUN</span><strong>로컬 서버와 브라우저에서 실제 실행</strong></div><div class="list-row"><span class="n">CHECK</span><strong>잘림·이미지·콘솔·조작을 전수 검사</strong></div></div>
</div>
<template class="notes"><span class="time">1분</span><p>Codex 설명을 가장 쉽게 하는 방법은 지금 보고 있는 발표본을 예로 드는 것이다. 자료 폴더 네 개를 열어 PDF와 업무기록을 읽고, 영상에서 장면을 추출하고, HTML과 CSS를 직접 수정했다.</p><p>그다음 로컬 서버를 켜고 실제 브라우저로 모든 슬라이드를 순회하며 화면 밖으로 나간 요소, 깨진 이미지, 콘솔 오류, 키보드 조작을 검사했다. 즉 답변만 받은 것이 아니라 결과 파일과 검증 기록까지 만든 과정이다.</p><div class="sources">Sources<br/>현재 저장소의 HTML·CSS·검증 스크립트<br/>output/browser-evidence-qa/</div></template>
</section>'''
REF_SCREENS='''
<section class="slide" data-title="레퍼런스를 실제로 고르는 화면">
<p class="eyebrow a-fade">PRESENTATION FACTORY · STEP 01</p>
<h2 class="title sm a-mask">Dribbble과 Pinterest에서<br/>‘예쁜 한 장’보다 반복 가능한 콘셉트를 고름</h2>
<div class="grid" style="grid-template-columns:1fr 1fr;gap:22px;margin-top:30px"><figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/web/dribbble-clean.png" alt="Dribbble presentation design 공식 검색 화면"><figcaption>Dribbble · presentation design 검색</figcaption></figure><figure class="evidence-shot a-up d3"><img src="html-deck/assets/evidence/web/pinterest-clean.png" alt="Pinterest presentation design 공식 검색 화면"><figcaption>Pinterest · presentation design 검색</figcaption></figure></div>
<div class="grid a-up d5" style="grid-template-columns:auto 1fr;gap:22px;align-items:center;margin-top:20px"><span class="badge">고르는 기준</span><p style="margin:0;font-size:18px;font-weight:720">제목 크기 · 여백 · 이미지 비율 · 색 역할 · 슬라이드 간 리듬이 여러 장에 반복 가능한가</p></div>
<template class="notes"><span class="time">1분</span><p>처음부터 AI에게 ‘예쁘게 만들어줘’라고 하지 않는다. Dribbble과 Pinterest에서 발표의 분위기와 가까운 자료를 여러 개 찾아보고, 한 장만 멋진 예시보다 여러 장에 반복할 수 있는 콘셉트를 고른다.</p><p>여기서 보는 것은 제목 크기, 여백, 이미지가 차지하는 비율, 색의 역할, 슬라이드 사이의 밀도 변화다. 이 선택이 끝나야 다음 단계에서 Claude에게 디자인 규칙을 문서로 뽑아달라고 요청한다.</p><div class="sources">Sources<br/>Dribbble official search, 2026-08-30<br/>Pinterest official search, 2026-08-30</div></template>
</section>'''
CLAUDE_DESIGN='''
<section class="slide paper" data-title="Claude가 디자인을 문서로 바꿈">
<p class="eyebrow a-fade">PRESENTATION FACTORY · STEP 02</p>
<h2 class="title sm a-mask">레퍼런스를 Claude에 넣고<br/>디자인을 DESIGN.md 규칙으로 바꿈</h2>
<div class="grid" style="grid-template-columns:.9fr 1.1fr;gap:28px;margin-top:28px"><figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/detail/design-contract-real.png" alt="Claude 공식 소개 화면"><figcaption>Claude 공식 화면 · 디자인 분석 단계</figcaption></figure><div class="codebox a-up d3" style="font-size:13px;line-height:1.62"><b># DESIGN.md</b><br/>tone: public workshop + editorial<br/>canvas: paper-light / 16:9<br/>title: 48–64px / conclusion first<br/>layout: one dominant visual per slide<br/>image: real evidence before decoration<br/>motion: title → proof → implication<br/>avoid: generic cards / tiny text / random effects</div></div>
<p class="quote a-up d5" style="font-size:20px;margin-top:20px">말로만 “이 느낌”이라고 하지 않고, 다음 도구가 읽을 수 있는 디자인 계약서로 저장</p>
<template class="notes"><span class="time">1분</span><p>선택한 레퍼런스를 Claude에 보여주고 공통된 시각 규칙을 분석해달라고 한다. 결과를 DESIGN.md라는 Markdown 파일로 저장하면 색·타이포·여백·이미지 사용법·피해야 할 표현이 문장으로 고정된다.</p><p>이 단계의 장점은 도구가 바뀌어도 디자인 의도가 남는다는 점이다. Genspark, PowerPoint, Codex가 모두 같은 DESIGN.md를 기준으로 작업하므로 ‘처음 봤던 레퍼런스와 전혀 다른 결과’가 나오는 것을 줄일 수 있다.</p><div class="sources">Sources<br/>Anthropic Claude official page<br/>현재 프로젝트 디자인 계약</div></template>
</section>'''
GENSPARK_VISUAL='''
<section class="slide" data-title="Genspark에 디자인과 내용을 함께 넣음">
<p class="eyebrow a-fade">PRESENTATION FACTORY · STEP 03</p>
<h2 class="title sm a-mask">DESIGN.md만 넣는 것도 아니고<br/>내용만 넣는 것도 아님</h2>
<div class="grid" style="grid-template-columns:.9fr 1.1fr;gap:30px;margin-top:30px"><div class="process a-up d2" style="grid-template-columns:1fr;gap:10px"><div class="step"><span class="kicker">입력 A</span><h3>DESIGN.md</h3><p>색·서체·여백·이미지 규칙</p></div><div class="step"><span class="kicker">입력 B</span><h3>발표할 내용</h3><p>대본·텍스트·PDF·근거자료</p></div><div class="step accent-card"><span class="kicker">요청</span><h3>“이 디자인에 이 내용을 적용”</h3></div></div><figure class="evidence-shot a-up d3"><img src="html-deck/assets/evidence/detail/pptx-output-montage.jpg" alt="Genspark와 PowerPoint 공정을 거친 발표자료 출력 예시"><figcaption>초안 이후 전체 장표 흐름을 한 번에 확인한 실제 렌더</figcaption></figure></div>
<template class="notes"><span class="time">1분</span><p>Genspark에는 DESIGN.md와 실제 발표 내용을 같이 넣는다. 발표 내용은 대본일 수도 있고 텍스트 문서나 PDF일 수도 있다. 요청 문장은 ‘이 디자인 규칙에 이 내용을 적용해 발표자료를 만들어달라’는 구조다.</p><p>초안이 나오면 곧바로 한 장씩 고치기보다 전체를 먼저 훑어본다. 원래 말하려던 사건 순서가 살아 있는지, 중요한 사례가 한 장으로 뭉개지지 않았는지, 근거 화면이 들어갈 자리가 있는지 확인한다.</p><div class="sources">Sources<br/>Genspark AI Slides official description<br/>User-provided briefing structure</div></template>
</section>'''
HTML_VERIFY='''
<section class="slide paper" data-title="HTML로 가면 검증까지 자동화">
<p class="eyebrow a-fade">PRESENTATION FACTORY · STEP 05</p>
<h2 class="title sm a-mask">더 욕심내고 싶으면<br/>Codex·Claude로 HTML 발표본까지 확장</h2>
<div class="grid" style="grid-template-columns:1.05fr .95fr;gap:28px;margin-top:28px"><figure class="evidence-shot a-up d2"><img src="html-deck/assets/evidence/detail/codex-current-deck.jpg" alt="HTML 발표본의 여러 슬라이드 브라우저 캡처"><figcaption>실제 HTML 발표본: 텍스트·이미지·애니메이션을 브라우저에서 렌더</figcaption></figure><div class="list a-up d3" style="gap:14px"><div class="list-row"><span class="n">01</span><strong>제목·근거 순차 애니메이션</strong></div><div class="list-row"><span class="n">02</span><strong>MP4 실제 시연 자동 재생</strong></div><div class="list-row"><span class="n">03</span><strong>키보드·모바일·발표자 노트</strong></div><div class="list-row"><span class="n">04</span><strong>잘림·이미지·콘솔 오류 자동 검사</strong></div></div></div>
<template class="notes"><span class="time">1분</span><p>PowerPoint에서 끝내도 되지만 더 높은 완성도가 필요하면 같은 내용과 DESIGN.md를 Codex나 Claude에 넣어 HTML 발표본을 만든다. HTML에서는 제목과 근거가 들어오는 순서, 실제 시연영상 재생, 발표자 노트, 키보드 이동을 직접 설계할 수 있다.</p><p>또한 브라우저가 결과를 실제로 그리기 때문에 모든 장을 자동으로 열어 잘림, 깨진 이미지, 콘솔 오류를 검사할 수 있다. 지금 발표본도 이 방식으로 제작하고 검증한 결과다.</p><div class="sources">Sources<br/>현재 HTML 발표본<br/>output/browser-evidence-qa/</div></template>
</section>'''

after('국장님이 원한 것은 모바일 탐색',GENERAL_FIRST)
after('한글 작업을 버리기까지',GENERAL_PDF,GENERAL_PHONE)
after('내가 생각한 이상적인 협업 구조',SNS_INITIAL)
after('매뉴얼에 고정된 7가지 판정 사례',SNS_REALITY)
before('회색 테두리 규칙을 찾은 과정',SNS_CLUE)
after('엑셀을 몰라도 해결책은 만들 수 있다',GREEN_SOURCE)
after('원본 하나만 넣는 RunGreen 화면',GREEN_DEMO)
after('신규회원 문자는 AI가 보냈다',MEMBER_APPLE)
after('Gemini 지원금 운영 구상',GEMINI_QUARTER)
after('왜 Codex인가',CODEX_ACTUAL)
after('발표자료 제작 프로세스',REF_SCREENS)
after('DESIGN.md 만들기',CLAUDE_DESIGN)
after('Genspark 초안',GENSPARK_VISUAL)
after('PowerPoint와 에이전트 마감',HTML_VERIFY)

# 핵심 기존 장표의 발표자 노트를 구술 원문 중심으로 보강
set_note('국장님 인사','1분 30초','<h3>말할 순서</h3><p>먼저 국장님께 참석과 관심에 대한 감사 인사. 오늘은 거창한 AI 기술 소개보다 상반기에 실제로 요청받고, 만들고, 실패하고, 다시 고친 사례를 순서대로 공유.</p><p>특히 완성된 화면만 보여주지 않고 처음에는 무엇을 잘못 이해했는지, 담당자의 한마디가 어떤 규칙으로 바뀌었는지를 중심으로 설명. 후반에는 이 발표자료까지 만든 Codex와 실제 제작 공정을 공개.</p>','User-provided briefing structure, 2026-08-30')
set_note('국장님이 원한 것은 모바일 탐색','1분 30초','<h3>구술 원문 그대로</h3><p>최초 요청은 한글 책갈피와 하이라이트 기능. 목차에서 원하는 현황으로 빠르게 이동하려는 요청으로 이해. 하루 만에 완성했더니 PDF 요청이 이어졌고 두 시간 만에 PDF 버전까지 추가.</p><p>그런데 휴대전화에 넣고 나니 잘 안 된다는 피드백. 이때 세 번째 파일을 바로 만드는 대신 왜 계속 안 맞는지 생각. 결론은 국장님이 원한 것이 특정 파일 형식이 아니라 모바일에서 국 현황자료를 빠르게 찾는 경험이라는 점.</p>','User-provided briefing structure; 진행기록.md')
set_note('한글 작업을 버리기까지','1분','<h3>버린 작업도 설명</h3><p>처음에는 HWPX 압축을 풀어 section0.xml 안의 제목 run을 찾고 책갈피 control을 삽입. 기존 1개였던 책갈피를 6개로 늘리고 하이라이트 문자속성까지 분석.</p><p>기술적으로 어려운 작업을 해결했지만 사용자는 그 과정을 매번 반복할 수 없고, 모바일 탐색이라는 목적에도 필요하지 않음. 그래서 공들인 한글 단계를 과감히 삭제.</p>','한글파일_하이라이트_책갈피_진행기록.md')
set_note('제목 규칙은 지적받으며 만들었다','1분 30초','<h3>규칙을 만든 대화</h3><p>처음부터 완성된 제목 판정 규칙이 있었던 것이 아님. 일단 문서를 넣어 목차를 만들고 보여드린 뒤 “왜 저건 제목에 안 들어가?”, “왜 이게 제목으로 들어가?”라는 지적을 받음.</p><p>누락된 제목은 공통 형태를 찾아 허용 규칙으로 추가하고, 본문·표·머리말을 잘못 잡은 경우는 제외 규칙으로 추가. 다음 부서 문서에 다시 돌리며 엥간한 현황자료라면 목차를 만드는 수준까지 규칙을 누적.</p>','User-provided briefing structure; PDF목차HTML제작기 README')
set_note('AI로 만들고 AI 없이 쓴다','1분','<h3>최종목표</h3><p>AI로 매번 문서를 읽히면 보기 좋은 결과는 만들 수 있지만 국장님이 CLI나 프롬프트를 직접 쓰는 순간 시간이 더 듦. 성남시 현황문서를 외부 AI가 읽는 보안 문제도 있고, 그렇게 만든 결과는 공식적으로 내 업무성과라고 설명하기도 애매.</p><p>따라서 AI는 규칙을 발견하고 프로그램을 만드는 데만 사용. 실제 운영은 PDF를 고르고 EXE를 더블클릭하면 로컬 룰베이스가 HTML을 만드는 방식으로 분리.</p>','User-provided briefing structure; README.ko.md')
set_note('7회 테스트, 약 10회 추가 예정','1분','<h3>현재 상태를 과장하지 않고 설명</h3><p>현재 5개 부서 자료와 타 시군 자료까지 포함해 일곱 차례 테스트. AI반도체과처럼 긴 문서, 시민봉사과처럼 다른 구조, 광양시청처럼 타 시군 양식을 함께 확인.</p><p>아직 전면 배포 단계는 아님. 약 열 차례를 더 돌려 제목 누락과 과탐을 확인한 뒤, 바탕화면에 옮겨 더블클릭하는 EXE로 배포할 계획.</p>','User-provided briefing structure; 배포용 test 폴더')
set_note('내가 생각한 이상적인 협업 구조','1분 30초','<h3>사람별 역할을 분명히 설명</h3><p>이 사례가 내가 생각하는 이상적인 동호회 구조. 권혁 주사가 현장에서 반복되는 SNS 취합 문제를 아이디어로 제안. 내가 브라우저 확장과 분류 규칙을 개발. 실제 담당자인 김나래 주사가 계속 예외 게시물을 보내며 피드백.</p><p>기획자·개발자·실무자가 따로 끝나는 것이 아니라 결과가 맞을 때까지 왕복. 결국 자동취합기가 매뉴얼과 함께 전 부서 공문에 반영. 큰 정보화사업이 아니라 작은 협업으로 만든 행정혁신.</p>','User-provided briefing structure; 공보관-11407')
set_note('회색 테두리 규칙을 찾은 과정','1분 30초','<h3>최왕 청년인턴의 기여</h3><p>회색 테두리를 단서로 잡았지만 색이나 선 하나만 보면 엥간한 카드 경계를 전부 공유로 오인. 여기서 반도체과 청년인턴 최왕 씨가 화면 코드를 뜯어보자는 아이디어를 냄.</p><p>실제 DOM과 계산된 스타일을 보니 위·오른쪽·아래·왼쪽 네 면에 특정 width·color·radius 조합이 존재. 네 면 값이 맞는 프레임만 공유 후보로 보고, 이후 동영상·짧은 문구·태그·생일 같은 예외는 별도 규칙으로 누적.</p>','User-provided briefing structure; collector.js; facebook-backend.js')
set_note('엑셀을 몰라도 해결책은 만들 수 있다','1분 30초','<h3>이 사례에서 말할 메시지</h3><p>환경정책과 취합기는 기술적으로 가장 화려한 사례는 아님. 엑셀을 잘 아는 사람이라면 필터와 서식 복사로 생각할 수 있는 일. 그러나 실무자는 어떤 결과가 필요한지 알고 있어도 그것을 자동화할 기술이 없을 수 있음.</p><p>AI와 대화할 때 원본에서 무엇을 보고, 어떤 기준으로 나누고, 어떤 결과 서식으로 끝내야 하는지를 설명하면 구현 기술이 없어도 도구를 만들 수 있음. AI가 어려운 문제만 푸는 것이 아니라 머릿속 해결책을 실행 가능한 형태로 옮겨주는 사례.</p>','User-provided briefing structure; 업무_히스토리_보고서.md')
set_note('신규회원 문자는 AI가 보냈다','1분','<h3>첫 문장부터 사실을 공개</h3><p>최근 신규회원들이 받은 안내문자는 내가 한 명씩 주소록에 넣고 복사해 보낸 것이 아니라 AI 에이전트가 명단을 읽고 만든 자동화 흐름으로 발송.</p><p>다만 AI가 사람을 마음대로 판단하거나 아무 문자나 보낸다는 뜻은 아님. 네이버폼의 정해진 필드, 최근 7일 조건, 연락처 등록 형식, 고정된 안내문구를 순서대로 실행하도록 구조화.</p>','User-provided briefing structure')
set_note('이 한 문장을 만드는 데 5시간','1분 30초','<h3>짧은 명령 뒤의 구조</h3><p>겉으로는 “최근 일주일 동안 등록된 사람들을 내 연락처에 넣고 문자 보내줘” 한 문장. 실제로는 Google 표의 어느 열이 이름과 번호인지, 날짜를 어떻게 비교할지, 기존 연락처와 중복되면 어떻게 할지, 문자 대상과 문구를 언제 확인할지 정해야 했음.</p><p>이 과정을 만드는 데 약 다섯 시간. AI와 계속 대화하며 한 단계씩 오류를 고침. 여기서 얻은 결론은 멋진 프롬프트보다 입력 위치·선택 조건·행동 순서·사람 확인 지점을 구조화하는 것이 중요하다는 점.</p>','User-provided briefing structure')
set_note('Gemini 지원금 운영 구상','1분','<h3>예산 계산부터 설명</h3><p>동호회 지원금은 실제 지출의 70%. Gemini 1년권 두 개를 58만원에 구입한다고 보면 약 41만원을 지원받는 계산. 남는 지원비 약 9만원은 동호회 과자값, 이후 서비스 실험용 API 충전, 서버비 후보.</p><p>계정 자격증명이나 세션을 돌려쓰는 방식이 아니라 가족 구성원 초대를 이용해 각자 자기 계정으로 유료 기능을 쓰게 하는 구상. 다음 장에서 분기 운영 계산과 공식 제한을 분리해 설명.</p>','User-provided briefing structure')
set_note('Codex란?','1분','<h3>기술 용어보다 행동으로 설명</h3><p>Codex는 질문에 답만 하는 채팅창으로 설명하지 않음. 내 컴퓨터의 폴더와 파일을 읽고, 필요한 HTML·PPT·스크립트를 만들고, 명령을 실행하고, 결과가 틀리면 다시 고치는 에이전트.</p><p>앞의 일반현황·엑셀 취합기처럼 “나는 결과를 아는데 만드는 기술이 없다”는 상황에서 파일 단위 작업을 대신 수행. 바로 다음 장에서 이 발표자료를 실제로 만든 과정을 증거로 보여줌.</p>','OpenAI Codex official; current repository')
set_note('발표자료 제작 프로세스','1분','<h3>전체 공정을 먼저 한 번에 보여주기</h3><p>실제로 쓰는 순서는 레퍼런스 선택 → Claude로 DESIGN.md → Genspark에 디자인과 내용 동시 입력 → PowerPoint에서 추가 설정 → Claude·Codex로 일괄수정. 더 높은 완성도가 필요하면 HTML 발표본으로 확장.</p><p>중요한 점은 도구 이름이 아니라 디자인을 먼저 규칙으로 문서화하고, 발표할 내용을 별도 묶음으로 정리한 뒤 두 가지를 합치는 구조.</p>','User-provided briefing structure')

# 모든 슬라이드 시간을 60분으로 다시 배분
slides=soup.select('section.slide')
for slide in slides:
    tm=slide.select_one('template.notes .time')
    if tm: tm.string='1분'
light={'AI동호회 상반기 활동 브리핑','오늘의 흐름','상반기, 7개의 작은 변화','상반기 포트폴리오','Codex 설명','영상 강의의 모션 원칙','다음 90일'}
heavy={'국장님 인사','국장님이 원한 것은 모바일 탐색','폰에서 안 된다는 말이 방향을 바꿈','제목 규칙은 지적받으며 만들었다','내가 생각한 이상적인 협업 구조','회색 테두리 규칙을 찾은 과정','엑셀을 몰라도 해결책은 만들 수 있다','이 한 문장을 만드는 데 5시간'}
for slide in slides:
    tm=slide.select_one('template.notes .time'); title=slide.get('data-title')
    if title in light: tm.string='30초'
    if title in heavy: tm.string='1분 30초'
sec('마무리와 질문').select_one('template.notes .time').string='3분 30초'

path.write_text(str(soup),encoding='utf-8')
print('slides',len(slides),'notes',len(soup.select('template.notes')))
