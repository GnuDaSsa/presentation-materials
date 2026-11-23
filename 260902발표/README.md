# DLC AI동호회 1시간 브리핑

성남시 AI 동호회 상반기 사례, 최근 AI 소식, AI 챔피언 경험, CLI·에이전트 도구, 발표자료 제작 과정, 공동구독 운영과 향후 아이디어를 담은 63장 HTML 발표자료.

## 바로 보기

- `index.html`: GitHub/정적 호스팅용 진입 파일
- `DLC_AI동호회_1시간_브리핑.html`: 원본 발표 파일
- `presentation.html`: 로컬 발표용 별칭

## 로컬 실행

```bash
python3 -m http.server 8765
```

브라우저에서 다음 주소를 연다.

```text
http://127.0.0.1:8765/index.html
```

## 조작

- 이전/다음: 방향키, Space, PageUp/PageDown
- 처음/끝: Home/End
- 발표자 노트: `N`
- 슬라이드 개요: `O`
- 전체 화면: `F`
- 애니메이션 다시 재생: `R`

## 검증

```bash
bash scripts/verify-html-deck.sh
```

현재 기준: 63장, 60분, 이미지 배치 67개, 브라우저 overflow·깨진 이미지·콘솔 오류 0건.

## 참고·첨부자료

- [`attachments/README.md`](attachments/README.md): 첨부자료 안내와 보안 제외 기준
- `attachments/design-reference/`: Genspark `Design Interior` 디자인 참고용 PPTX
- `html-deck/assets/evidence/`: 실제 화면·공식 자료·익명화된 사용후기·시연 정지 캡처
- `html-deck/assets/generated/`: 규칙과 작동 원리를 설명하는 발표용 도해
- [`docs/source-notes.txt`](docs/source-notes.txt): 사례별 출처와 프로비넌스 요약

디자인 참고 PPTX 안의 과거 문구·수치·사례 배열은 현행 발표의 근거가 아니다. 최종 발표 내용은 HTML을 기준으로 한다.

## 공개 범위

실제 업무 화면과 내부 사례를 포함하므로 저장소는 비공개로 운영한다. 내부 HWPX·PDF·Excel 원본, 실명 메신저 화면, 연락처·계정 정보는 업로드하지 않았다. 외부 공개 전 이미지·문서·출처를 다시 검토해야 한다.
