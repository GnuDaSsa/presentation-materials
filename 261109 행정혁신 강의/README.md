# 토목8급 사진우의 행정혁신 이야기 · PIXEL QUEST

`index.html` 더블클릭으로 열기. 폴더째 옮길 것.

- 조작: → / Space (프리젠터 PageDown) = 다음 · 화면 클릭으로는 넘어가지 않음(대사 타이핑 중이면 즉시 완성), ← = 이전, F = 전체화면, N = 발표자 노트, 하단 진행바 칸 클릭 = 이동
- 기반: 바탕화면 `261022 나주 강의자료` (자기소개·업적 로그 재사용, 원본 폴더는 수정하지 않음)
- 구성(155장 · 86장 쉬는 시간): INTRO → STAGE 1~11 → FINAL STAGE 기술 환원 → THE END
- 픽셀 그림은 전부 `sprites.js`에서 코드로 그림 (이미지 파일 없음)
- 글꼴: Galmuri (OFL), Pretendard (OFL) — `assets/fonts`

## 새 장표 넣는 법
- 장면형: `<canvas class="bg" data-scene="city|city:night|office|office:night|meeting|hall|map">` + 캐릭터 `<canvas class="sp" data-sp="hero|friend|mentor|boss|staff1~4">` + 대화창 `.win.light.dlg`
- 정보형: `<div class="stars">` + `.win` 패널
- `data-s="1"` 등 단계 번호를 주면 넘길 때마다 순서대로 등장
- `<aside class="note">`에 발표자 노트
