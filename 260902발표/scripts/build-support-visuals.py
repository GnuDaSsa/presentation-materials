#!/usr/bin/env python3
from pathlib import Path
from html import escape

OUT = Path('html-deck/assets/generated')
OUT.mkdir(parents=True, exist_ok=True)
PAPER='#FBFBF8'; WARM='#F1EDE4'; INK='#171717'; MUTED='#71706B'; RUST='#B65A3A'; GREEN='#205A4A'; LINE='#D7D1C5'; PALE='#E9E4DA'

def svg_start(w=1440,h=560):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<rect width="{w}" height="{h}" fill="{PAPER}"/>
<style>text{{font-family:Pretendard,'Apple SD Gothic Neo',Arial,sans-serif;fill:{INK}}}.m{{fill:{MUTED}}}.r{{fill:{RUST}}}.g{{fill:{GREEN}}}.small{{font-size:18px;font-weight:650}}.tiny{{font-size:14px;font-weight:620;letter-spacing:.3px}}.label{{font-size:14px;font-weight:800;letter-spacing:1.4px}}.big{{font-size:38px;font-weight:850}}.mid{{font-size:25px;font-weight:800}}</style>'''

def write(name,body,w=1440,h=560):
    body=(body.replace('fill="#fff"','style="fill:#fff"')
              .replace('fill="#E8C8BA"','style="fill:#E8C8BA"')
              .replace('fill="#D8D8D2"','style="fill:#D8D8D2"'))
    (OUT/name).write_text(svg_start(w,h)+body+'\n</svg>\n',encoding='utf-8')

# 13: verified runs -> more tests -> exe
body='''
<text x="52" y="48" class="label m">TEST COVERAGE · 7 VERIFIED RUNS</text>
<line x1="52" y1="70" x2="1388" y2="70" stroke="%s"/>
<text x="52" y="122" class="big">서로 다른 문서 7회로 규칙을 흔든 뒤 배포</text>
'''%LINE
names=['AI반도체과','시민봉사과','부서 03','부서 04','부서 05','타 시군 01','타 시군 02']
for i,n in enumerate(names):
    x=62+i*187
    body+=f'<circle cx="{x+46}" cy="240" r="32" fill="{GREEN}"/><path d="M{x+32} 240 l10 10 l20 -22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="{x+46}" y="302" class="small" text-anchor="middle">{escape(n)}</text>'
body+=f'''<line x1="90" y1="362" x2="1348" y2="362" stroke="{LINE}" stroke-width="2"/>
<text x="52" y="416" class="label r">NEXT</text><text x="144" y="416" class="mid">약 10회 추가 문서 시험</text>
<line x1="508" y1="407" x2="780" y2="407" stroke="{RUST}" stroke-width="3"/>
<text x="820" y="416" class="label g">RELEASE</text><text x="942" y="416" class="mid">바탕화면 EXE 더블클릭</text>
<text x="52" y="492" class="small m">제목 누락·과탐 확인</text><text x="820" y="492" class="small m">별도 AI 접속 없이 로컬 실행</text>'''
write('general-test-roadmap.svg',body)

# 23: 16 regression cases matrix
body=f'''<text x="52" y="48" class="label m">REGRESSION MATRIX · 16 CASES</text><line x1="52" y1="70" x2="1388" y2="70" stroke="{LINE}"/>
<text x="52" y="122" class="big">생산·공유·오탐 복구를 번호로 고정</text>'''
groups=[('01–05','생산','직접 사진 · fbid · video',GREEN,5),('06–12','공유','URL · 외부 미리보기 · 무증거',RUST,7),('13–14','생산 복구','머리글 오탐 · 경계선',INK,2),('15–16','공유','중첩 댓글 · 테두리 누락',MUTED,2)]
x=52
for label,outcome,desc,color,count in groups:
    width={5:330,7:430,2:235}[count]
    body+=f'<rect x="{x}" y="174" width="{width}" height="244" fill="{WARM}" stroke="{LINE}"/><text x="{x+24}" y="214" class="label" fill="{color}">{label}</text><text x="{x+24}" y="264" class="mid">{escape(outcome)}</text><text x="{x+24}" y="304" class="tiny m">{escape(desc)}</text>'
    for j in range(count):
        cx=x+28+(j%4)*54; cy=356+(j//4)*46
        body+=f'<circle cx="{cx}" cy="{cy}" r="16" fill="{color}"/><text x="{cx}" y="{cy+6}" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">{j+1}</text>'
    x+=width+18
body+=f'<text x="52" y="492" class="small m">소스에 시나리오·기대값을 남겨 규칙 수정 뒤 같은 경계를 다시 확인</text>'
write('sns-regression-16.svg',body)

# 28: department parser
body=f'''<text x="52" y="48" class="label m">DEPARTMENT PARSER · OTHER NOTES</text><line x1="52" y1="70" x2="1388" y2="70" stroke="{LINE}"/>
<rect x="52" y="126" width="390" height="310" fill="{WARM}" stroke="{LINE}"/><text x="78" y="166" class="label m">RAW 기타사항</text>
<text x="78" y="220" class="mid">실수요부서 담당자 연락처</text><text x="78" y="264" class="big r">031 · 729 · 0000</text><text x="78" y="314" class="small">AI반도체과 홍길동 주무관</text><text x="78" y="356" class="small m">괄호 · 공백 · 안내문구 혼재</text>
<path d="M470 280 H602" stroke="{RUST}" stroke-width="4"/><path d="M590 268 l18 12 l-18 12" fill="none" stroke="{RUST}" stroke-width="4"/>
<rect x="638" y="126" width="328" height="310" fill="{PAPER}" stroke="{LINE}"/><text x="664" y="166" class="label g">RULE ENGINE</text>
<text x="664" y="218" class="mid">1. 031 번호 탐지</text><text x="664" y="264" class="mid">2. 안내 문구 제거</text><text x="664" y="310" class="mid">3. 조직 접미사 확인</text><text x="664" y="356" class="mid">4. 공식 연번 정렬</text>
<path d="M994 280 H1098" stroke="{INK}" stroke-width="4"/><path d="M1086 268 l18 12 l-18 12" fill="none" stroke="{INK}" stroke-width="4"/>
<text x="1134" y="180" class="label g">CONFIRMED</text><text x="1134" y="224" class="mid">부서명 추출</text><line x1="1134" y1="250" x2="1378" y2="250" stroke="{LINE}"/>
<text x="1134" y="306" class="label r">REVIEW</text><text x="1134" y="350" class="mid">이름·전화 보존</text><text x="1134" y="386" class="small m">불명확한 행은 버리지 않음</text>
<text x="52" y="502" class="small m">162개 조직명 · 공식 번호 1–165 매핑</text>'''
write('green-department-parser.svg',body)

# 30: delivery fix
body=f'''<text x="52" y="48" class="label m">DELIVERY FAILURE → PORTABLE FIX</text><line x1="52" y1="70" x2="1388" y2="70" stroke="{LINE}"/>
<text x="52" y="122" class="big">내 PC에서 되던 것을 다른 PC에서도 되게 만든 수정</text>
<rect x="52" y="176" width="380" height="246" fill="{WARM}" stroke="{LINE}"/><text x="78" y="218" class="label r">FIRST DELIVERY</text><text x="78" y="272" class="mid">Python 미설치</text><text x="78" y="316" class="mid">BAT 한글·LF 깨짐</text><text x="78" y="370" class="small m">전달받은 업무 PC에서 실행 실패</text>
<path d="M466 298 H610" stroke="{RUST}" stroke-width="4"/><path d="M598 286 l18 12 l-18 12" fill="none" stroke="{RUST}" stroke-width="4"/>
<rect x="646" y="176" width="742" height="246" fill="{INK}"/><text x="676" y="218" class="label" fill="#E8C8BA">FINAL PORTABLE PACKAGE</text>
<text x="676" y="276" class="big" fill="#fff">ASCII + CRLF + PowerShell</text><text x="676" y="326" class="mid" fill="#fff">Python 0 · 상대경로 · Windows 기본 구성</text>
<circle cx="1170" cy="292" r="62" fill="{GREEN}"/><path d="M1138 292 l22 22 l44 -48" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
<text x="52" y="494" class="small m">검증: index 200 · template 200 · 임시 폴더 압축 해제 후 BAT 실행</text>'''
write('green-portable-fix.svg',body)

# 34: law MCP architecture
body=f'''<text x="52" y="48" class="label m">KOREAN LAW MCP · QUERY PATH</text><line x1="52" y1="70" x2="1388" y2="70" stroke="{LINE}"/>
<text x="52" y="122" class="big">기억에서 답하지 않고, 공식 법령 시스템까지 왕복</text>
<rect x="52" y="190" width="260" height="210" fill="{WARM}" stroke="{LINE}"/><text x="78" y="232" class="label m">01 · QUESTION</text><text x="78" y="292" class="mid">근거 법령은?</text><text x="78" y="332" class="small m">자연어 질문</text>
<path d="M336 292 H442" stroke="{RUST}" stroke-width="4"/><path d="M430 280 l18 12 l-18 12" fill="none" stroke="{RUST}" stroke-width="4"/>
<rect x="478" y="158" width="304" height="274" fill="{INK}"/><text x="510" y="204" class="label" fill="#E8C8BA">02 · MCP CONNECTOR</text><text x="510" y="270" class="big" fill="#fff">42 API</text><text x="510" y="318" class="mid" fill="#fff">→ 10개 도구</text><text x="510" y="368" class="small" fill="#D8D8D2">질문을 검색 호출로 변환</text>
<path d="M806 292 H912" stroke="{RUST}" stroke-width="4"/><path d="M900 280 l18 12 l-18 12" fill="none" stroke="{RUST}" stroke-width="4"/>
<rect x="948" y="190" width="440" height="210" fill="{PAPER}" stroke="{LINE}"/><text x="976" y="232" class="label g">03 · OFFICIAL SOURCE</text><text x="976" y="282" class="mid">법령 · 판례 · 행정규칙</text><text x="976" y="326" class="small m">조문 · 시행일 · 관련 항목 확인</text><text x="976" y="366" class="small r">담당자 최종 판단</text>
<text x="52" y="496" class="small m">질문 → 도구 호출 → 공식 근거 → 출처를 붙인 답변</text>'''
write('korean-law-query-path.svg',body)

# 38: five hour timeline
body=f'''<text x="52" y="48" class="label m">5-HOUR BUILD LOG · ONE SENTENCE TO WORKFLOW</text><line x1="52" y1="70" x2="1388" y2="70" stroke="{LINE}"/>
<text x="52" y="122" class="big">짧은 명령 뒤에 네 개의 결정을 붙인 시간</text>
<line x1="92" y1="286" x2="1348" y2="286" stroke="{LINE}" stroke-width="5"/>
'''
steps=[('1H','표 위치','이름·번호·등록일 열'),('2H','최근 7일','날짜 비교 규칙'),('3H','중복 방지','기존 연락처 확인'),('4H','연락처 등록','Apple 주소록 실행'),('5H','발송 확인','대상·문구 승인')]
for i,(hour,title,desc) in enumerate(steps):
    x=92+i*314
    color=RUST if i<4 else GREEN
    body+=f'<circle cx="{x}" cy="286" r="24" fill="{color}"/><text x="{x}" y="294" font-size="13" font-weight="850" fill="#fff" text-anchor="middle">{hour}</text><text x="{x}" y="352" class="mid" text-anchor="middle">{escape(title)}</text><text x="{x}" y="390" class="tiny m" text-anchor="middle">{escape(desc)}</text>'
body+=f'<rect x="52" y="444" width="1336" height="62" fill="{WARM}"/><text x="720" y="484" class="small" text-anchor="middle">구조화 = 입력 위치 · 선택 조건 · 행동 순서 · 사람 확인 지점</text>'
write('member-five-hour-build.svg',body)

# 40: quarterly rotation concept
body=f'''<text x="52" y="48" class="label m">ANNUAL ACCESS PLAN · CONCEPT ONLY</text><line x1="52" y1="70" x2="1388" y2="70" stroke="{LINE}"/>
<text x="52" y="122" class="big">계정 2개가 한 분기에 10명을 지원한다는 계산</text>
'''
for q in range(4):
    x=52+q*334
    body+=f'<rect x="{x}" y="180" width="300" height="240" fill="{WARM if q%2==0 else PAPER}" stroke="{LINE}"/><text x="{x+24}" y="220" class="label {"r" if q<3 else "g"}">{q+1}분기</text><text x="{x+24}" y="278" class="big">10명</text><text x="{x+24}" y="324" class="small m">계정 A 5명 + 계정 B 5명</text>'
    for j in range(10):
        cx=x+28+(j%5)*49; cy=370+(j//5)*28
        body+=f'<circle cx="{cx}" cy="{cy}" r="9" fill="{GREEN if q==3 else RUST}"/>'
body+=f'<text x="52" y="492" class="big g">연간 목표 40명</text><text x="396" y="492" class="small r">구매 전 가족그룹 변경 제한 검증</text>'
write('gemini-quarter-plan.svg',body)
