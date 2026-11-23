# 내 업무에서 시작하는 AI 업무혁신 · PIXEL QUEST

`index.html` 더블클릭으로 열기. 폴더째 옮길 것.

- 조작: → / Space (프리젠터 PageDown) = 다음 · 화면 클릭으로는 넘어가지 않음(대사 타이핑 중이면 즉시 완성), ← = 이전, F = 전체화면, N = 발표자 노트, 하단 진행바 칸 클릭 = 이동
- 중랑구청 강의(2026.11.20)용 사본. 원본: `261109 행정혁신 강의`(해양수산과학기술진흥원 2026.11.11) — 제목·강연 퀘스트 연쇄 장표·업적 로그를 중랑구청 기준으로 수정, 대사박스 글자 확대, 1시간 분량 맞춰 STAGE 2 경진대회 본선~노트북 6장(구 30~35장)·「길드가 굴러가기 시작했다」(구 69장)·쉬는 시간 장표 삭제
- 기반: 바탕화면 `261022 나주 강의자료` (자기소개·업적 로그 재사용, 원본 폴더는 수정하지 않음)
- 구성(134장 · 쉬는 시간 장표 없음): INTRO → STAGE 1~10 → FINAL STAGE 기술 환원 → THE END
- 픽셀 그림은 전부 `sprites.js`에서 코드로 그림 (이미지 파일 없음)
- 글꼴: Galmuri (OFL), Pretendard (OFL) — `assets/fonts`

## 새 장표 넣는 법
- 장면형: `<canvas class="bg" data-scene="city|city:night|office|office:night|meeting|hall|map">` + 캐릭터 `<canvas class="sp" data-sp="hero|friend|mentor|boss|staff1~4">` + 대화창 `.win.light.dlg`
- 정보형: `<div class="stars">` + `.win` 패널
- `data-s="1"` 등 단계 번호를 주면 넘길 때마다 순서대로 등장
- `<aside class="note">`에 발표자 노트

- 112장 워크플로우 구조도: `workflow-map/`(GitHub GnuDaSsa/video-team-workflow-map, Agent Korea 덱과 같은 판)을 iframe으로 넣음. → 를 누르면 구조도 안에서 전체도 → 01 기획 … 06 편집 → 전체도(14단계)로 이동하고, 끝에서 다음 장. 일부 단계만 보이려면 iframe 주소에 `?path=0,5,6`처럼 단계 번호를 붙이면 됨(번호는 workflow-map/index.html의 steps 순서).
- STAGE 11의 워크플로우 설명 8장(워크플로우 한눈에 · 공개 레포를 내 스킬에 적용 · 01~06)은 112장 구조도와 겹쳐서 삭제. STAGE 11 간지·참고처 모음·Seedream·진행 중 퀘스트는 유지.
- 후반부 정리: STAGE 10의 Claude 모션그래픽·화성시 공모전·후처리·색보정 4장과 STAGE 11 지금의 워크플로우 챕터 전체(간지·참고처 모음·Seedream·진행 중 퀘스트)를 삭제. 워크플로우는 112장 구조도로 대체.
