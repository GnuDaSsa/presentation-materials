from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import shutil

ROOT = Path('/Users/gnudas/Documents/동호회디엘씨')
AUDIT = ROOT / 'output/environment-policy-audit'
OUT = ROOT / 'html-deck/assets/evidence/environment-actual'
OUT.mkdir(parents=True, exist_ok=True)

def font(size, bold=False):
    choices = [
        '/System/Library/Fonts/AppleSDGothicNeo.ttc',
        '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
    ]
    for p in choices:
        if Path(p).exists():
            return ImageFont.truetype(p, size, index=8 if bold and p.endswith('.ttc') else 0)
    return ImageFont.load_default()

# Source workbook: retain the real table/header, remove the huge query-parameter row.
src = Image.open(AUDIT / 'source-left.png').convert('RGB')
crop = src.crop((35, 565, src.width - 5, src.height - 5))
crop.save(OUT / 'source-37-columns-crop.jpg', quality=94)

# Copy the four real output sheets, then make a readable 2x2 evidence board.
quarters = []
for q in range(1, 5):
    p = AUDIT / f'15. AI반도체과__녹색제품 구매내역({q}분기).png'
    dst = OUT / f'output-q{q}.png'
    shutil.copy2(p, dst)
    im = Image.open(p).convert('RGB')
    # Preserve department, header, first row and totals/formula rows in two strips.
    top = im.crop((35, 42, im.width - 25, 225))
    bottom = im.crop((35, im.height - 115, im.width - 25, im.height - 8))
    thumb = Image.new('RGB', (820, 270), '#fbfbf8')
    top.thumbnail((800, 165))
    bottom.thumbnail((800, 88))
    thumb.paste(top, ((820-top.width)//2, 8))
    thumb.paste(bottom, ((820-bottom.width)//2, 176))
    quarters.append(thumb)

canvas = Image.new('RGB', (1720, 650), '#f1ede4')
d = ImageDraw.Draw(canvas)
labels = [('1분기', '110,400원 · 100%'), ('2분기', '82,800원 · 100%'),
          ('3분기', '55,200원 · 100%'), ('4분기', '0원 · #DIV/0!')]
for i, (im, (lab, val)) in enumerate(zip(quarters, labels)):
    x = 30 + (i % 2) * 845
    y = 28 + (i // 2) * 308
    canvas.paste(im.resize((800, 263)), (x, y))
    d.rectangle((x, y, x+800, y+50), fill='#171717')
    d.text((x+18, y+10), lab, fill='white', font=font(25, True))
    fill = '#ffd400' if i == 3 else '#cdeee9'
    d.rounded_rectangle((x+545, y+8, x+786, y+43), 9, fill=fill)
    d.text((x+558, y+14), val, fill='#171717', font=font(18, True))
canvas.save(OUT / 'quarter-output-board.jpg', quality=94)

def svg(name, body):
    (OUT / name).write_text(body, encoding='utf-8')

svg('source-map.svg', '''<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="600" viewBox="0 0 1500 600">
<style>.bg{fill:#fbfbf8}.ink{fill:#171717}.muted{fill:#706f69}.rust{fill:#b65a3a}.green{fill:#205a4a}.box{fill:#f1ede4;stroke:#d7d1c5;stroke-width:2}.head{font:800 39px Arial,"Apple SD Gothic Neo",sans-serif}.big{font:850 66px Arial,"Apple SD Gothic Neo",sans-serif}.mid{font:800 25px Arial,"Apple SD Gothic Neo",sans-serif}.small{font:600 19px Arial,"Apple SD Gothic Neo",sans-serif}.mono{font:800 18px ui-monospace,monospace}</style>
<rect width="1500" height="600" class="bg"/><text x="42" y="58" class="head ink">실제 원본은 ‘엑셀 한 장’이 아니라 1,650건 × 37열</text>
<rect x="42" y="102" width="390" height="410" class="box"/><text x="72" y="154" class="mid ink">원본 testfile.xlsx</text><text x="72" y="235" class="big rust">1,650</text><text x="294" y="235" class="mid ink">행</text><text x="72" y="326" class="big rust">37</text><text x="190" y="326" class="mid ink">열</text><text x="72" y="386" class="small muted">2026.01–04 계약·납품요구 내역</text><text x="72" y="424" class="small muted">메모가 있는 행 1,597건</text><text x="72" y="462" class="small muted">031 포함 행 1,558건</text>
<text x="470" y="138" class="mid ink">실제 변환에 필요한 열만 선택</text>
<g class="mono"><rect x="470" y="172" width="980" height="64" fill="#171717"/><text x="492" y="212" fill="white">M 기준일자</text><text x="678" y="212" fill="white">P/Q 녹색인증</text><text x="910" y="212" fill="white">V 기타사항</text><text x="1095" y="212" fill="white">AA 물품식별명</text><text x="1310" y="212" fill="white">AJ/AK 수량·금액</text></g>
<path d="M470 278H1438" stroke="#b65a3a" stroke-width="5"/><path d="M1420 265l25 13-25 13" fill="none" stroke="#b65a3a" stroke-width="5"/>
<rect x="470" y="318" width="300" height="150" fill="#dbe7e1"/><text x="498" y="362" class="mid green">분기 판정</text><text x="498" y="406" class="small ink">M열 YYYYMMDD</text><text x="498" y="438" class="small muted">1–3 / 4–6 / 7–9 / 10–12월</text>
<rect x="792" y="318" width="310" height="150" fill="#e7ded2"/><text x="820" y="362" class="mid rust">부서 복원</text><text x="820" y="406" class="small ink">V열의 031과 부서명</text><text x="820" y="438" class="small muted">미확인 행은 버리지 않고 별도 보존</text>
<rect x="1124" y="318" width="326" height="150" fill="#171717"/><text x="1152" y="362" class="mid" fill="white">부서별 결과</text><text x="1152" y="406" class="small" fill="white">1~4분기 시트</text><text x="1152" y="438" class="small" fill="#cdeee9">합계 · 비율 · 서식</text>
<text x="42" y="558" class="small muted">실제 파일 감사 결과 기반 재구성 · 개인정보가 포함된 V열 원문은 화면에 노출하지 않음</text></svg>''')

svg('masked-memo-parser.svg', '''<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="600" viewBox="0 0 1500 600">
<style>.bg{fill:#fbfbf8}.ink{fill:#171717}.muted{fill:#706f69}.rust{fill:#b65a3a}.green{fill:#205a4a}.box{fill:#f1ede4;stroke:#d7d1c5;stroke-width:2}.head{font:800 39px Arial,"Apple SD Gothic Neo",sans-serif}.mid{font:800 25px Arial,"Apple SD Gothic Neo",sans-serif}.small{font:600 20px Arial,"Apple SD Gothic Neo",sans-serif}.mono{font:700 20px ui-monospace,monospace}</style>
<rect width="1500" height="600" class="bg"/><text x="42" y="58" class="head ink">V열 ‘기타사항’은 정형 데이터가 아니라 긴 자유문</text>
<rect x="42" y="105" width="655" height="372" class="box"/><text x="70" y="150" class="mid ink">실제 행의 구조 — 개인정보 마스킹</text><text x="70" y="205" class="mono muted">물품은 납품시 단가가 적용...</text><text x="70" y="255" class="mono ink">- 실수요부서 담당자, 전화번호 :</text><rect x="70" y="278" width="570" height="62" fill="#fff" stroke="#b65a3a" stroke-width="3"/><text x="92" y="317" class="mono rust">시설공사과 ○○○, 031-***-****</text><text x="70" y="386" class="mono muted">- 기타 : 납품장소 및 세부내용...</text><text x="70" y="439" class="small muted">같은 정보가 쉼표·공백·직급 순서까지 제각각</text>
<path d="M735 290H855" stroke="#b65a3a" stroke-width="5"/><path d="M837 277l25 13-25 13" fill="none" stroke="#b65a3a" stroke-width="5"/>
<rect x="885" y="105" width="565" height="372" fill="#171717"/><text x="920" y="152" class="mid" fill="white">규칙 엔진</text><text x="920" y="212" class="small" fill="white">01 · 031 패턴 탐색</text><text x="920" y="258" class="small" fill="white">02 · 앞쪽 문맥에서 부서 후보 추출</text><text x="920" y="304" class="small" fill="white">03 · 조직 접미사·공식 목록과 대조</text><text x="920" y="350" class="small" fill="white">04 · 날짜로 분기 판정</text><rect x="920" y="386" width="230" height="55" fill="#cdeee9"/><text x="942" y="421" class="mid green">확정 폴더</text><rect x="1170" y="386" width="240" height="55" fill="#e7ded2"/><text x="1192" y="421" class="mid rust">검토 폴더</text>
<text x="42" y="545" class="small muted">실제 원본 1,650행 중 V열 메모 1,597건 · 031 포함 1,558건 · 행을 버리지 않고 추적 가능하게 분기</text></svg>''')

svg('quarter-summary.svg', '''<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="600" viewBox="0 0 1500 600">
<style>.bg{fill:#fbfbf8}.ink{fill:#171717}.muted{fill:#706f69}.rust{fill:#b65a3a}.box{fill:#f1ede4;stroke:#d7d1c5;stroke-width:2}.head{font:800 39px Arial,"Apple SD Gothic Neo",sans-serif}.big{font:850 43px Arial,"Apple SD Gothic Neo",sans-serif}.mid{font:800 24px Arial,"Apple SD Gothic Neo",sans-serif}.small{font:600 18px Arial,"Apple SD Gothic Neo",sans-serif}</style><rect width="1500" height="600" class="bg"/><text x="42" y="58" class="head ink">실제 AI반도체과 결과: 분기별 시트와 합계가 자동 생성</text>
<g><rect x="42" y="112" width="335" height="300" class="box"/><text x="72" y="160" class="mid ink">1분기</text><text x="72" y="235" class="big rust">110,400원</text><text x="72" y="286" class="small muted">복사용지 4개 · 녹색장터</text><text x="72" y="354" class="mid ink">녹색구매 100%</text></g>
<g><rect x="395" y="112" width="335" height="300" class="box"/><text x="425" y="160" class="mid ink">2분기</text><text x="425" y="235" class="big rust">82,800원</text><text x="425" y="286" class="small muted">복사용지 3개 · 녹색장터</text><text x="425" y="354" class="mid ink">녹색구매 100%</text></g>
<g><rect x="748" y="112" width="335" height="300" class="box"/><text x="778" y="160" class="mid ink">3분기</text><text x="778" y="235" class="big rust">55,200원</text><text x="778" y="286" class="small muted">복사용지 2개 · 녹색장터</text><text x="778" y="354" class="mid ink">녹색구매 100%</text></g>
<g><rect x="1101" y="112" width="349" height="300" fill="#171717"/><text x="1131" y="160" class="mid" fill="white">4분기</text><text x="1131" y="235" class="big" fill="#ffd400">0원</text><text x="1131" y="286" class="small" fill="#d8d8d2">데이터 없음</text><text x="1131" y="354" class="mid" fill="#ff8b6b">#DIV/0!</text></g>
<rect x="42" y="446" width="1408" height="86" fill="#dbe7e1"/><text x="72" y="498" class="mid ink">1~3분기 누계 248,400원 · 빈 분기는 IFERROR 또는 0% 처리 규칙이 추가로 필요</text><text x="42" y="574" class="small muted">실제 15. AI반도체과.xlsx의 값과 수식 감사 결과</text></svg>''')

print(OUT)
