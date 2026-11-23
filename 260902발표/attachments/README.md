# 발표 참고·첨부자료

이 폴더는 최종 HTML 발표본을 이해하거나 다시 편집할 때 필요한 참고자료를 모은 공간이다. 저장소는 비공개 운영을 전제로 한다.

## 1. 디자인 참고 원본

- [`design-reference/Design_Interior_20260830132103_DESIGN_REFERENCE_ONLY.pptx`](design-reference/Design_Interior_20260830132103_DESIGN_REFERENCE_ONLY.pptx)
  - Genspark에서 생성한 18장짜리 `Design Interior` PPTX
  - 현재 HTML의 웜화이트 캔버스, 러닝헤더, 큰 장 번호, 베이지 이미지 매트, 러스트 포인트 프레임을 정하는 **시각 참고 자료**
  - 파일 안의 과거 문구·수치·사례 배열은 현행 발표의 사실 근거가 아니며 최종 발표본으로 사용하지 않음
  - SHA-256: `e0a8460c115346fda81f86fa7ae8eca929bd323dfa5225bd0f08fd5268ad0426`

## 2. 최종 발표본

- [`../index.html`](../index.html): GitHub 및 정적 호스팅용 진입 파일
- [`../DLC_AI동호회_1시간_브리핑.html`](../DLC_AI동호회_1시간_브리핑.html): 편집 기준 원본
- [`../html-deck/`](../html-deck/): CSS, JavaScript, 이미지·증빙 자산

로컬 실행:

```bash
python3 -m http.server 8765
```

브라우저에서 `http://127.0.0.1:8765/index.html` 접속.

## 3. 발표 근거·첨부 이미지

| 위치 | 내용 | 취급 기준 |
|---|---|---|
| [`../html-deck/assets/evidence/demo-stills/`](../html-deck/assets/evidence/demo-stills/) | 일반현황·SNS·환경정책과 시연영상의 단계별 정지 캡처 | 발표 중 재생 실패를 피하기 위한 고정 증거 화면 |
| [`../html-deck/assets/evidence/detail/`](../html-deck/assets/evidence/detail/) | 실제 UI, 공식 자료, Pinterest·Claude·Genspark 작업 화면 | 장별 설명과 직접 대응하는 선별 캡처 |
| [`../html-deck/assets/evidence/environment-actual/`](../html-deck/assets/evidence/environment-actual/) | 환경정책과 실제 Excel 구조의 익명화·크롭 자료 | 이름·전화번호 등 식별정보 제외 |
| [`../html-deck/assets/evidence/testimonials/`](../html-deck/assets/evidence/testimonials/) | SNS 취합기 사용후기 4건 | 이름·프로필·소속·직급·본문 실명 블러 처리 사본만 사용 |
| [`../html-deck/assets/generated/`](../html-deck/assets/generated/) | 규칙·검증·운영 구조 설명용 SVG/PNG | 실제 시스템 캡처가 아닌 `개념 시각화`·`발표용 재구성` |
| [`../docs/source-notes.txt`](../docs/source-notes.txt) | GitHub·GitLab·공식 문서·프로젝트 노트 출처 요약 | 발표 문구의 출처·프로비넌스 확인용 |

## 4. 포함하지 않은 원본

다음 자료는 저장소가 비공개여도 불필요한 노출을 막기 위해 업로드하지 않음.

- 성남시 내부 현황 HWPX·PDF 원본
- 환경정책과 원본 Excel과 연락처가 포함된 셀 전체
- 실명·프로필·소속이 남아 있는 메신저 원본 이미지
- 공동구독 계정, 자격증명, 연락처, 개인식별정보
- 작업 중간 캐시·브라우저 자동화 출력·임시 렌더

원본이 필요한 경우 로컬 보관 자료에서 별도 확인하고, 외부 공유 전 다시 익명화 검토.

## 5. 검증

```bash
bash scripts/verify-html-deck.sh
python3 -m zipfile -t attachments/design-reference/Design_Interior_20260830132103_DESIGN_REFERENCE_ONLY.pptx
```

HTML 구조·이미지 경로·슬라이드 시간과 PPTX 패키지 무결성을 각각 검사.
