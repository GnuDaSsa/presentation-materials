from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('/Users/gnudas/Documents/동호회디엘씨')
PAGE = Image.open(ROOT / 'tmp/pdf-final/page-003.jpg').convert('RGB')
OUT = ROOT / 'html-deck/assets/evidence/detail'

def f(size, bold=False):
    p = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
    return ImageFont.truetype(p, size, index=8 if bold else 0)

def fit(im, box):
    x,y,w,h=box
    cp=im.copy(); cp.thumbnail((w,h))
    return cp,(x+(w-cp.width)//2,y+(h-cp.height)//2)

bookmarks = ['목차', '기구 및 인력', '주요기능', '국 예산현황', '직원현황',
             '위원회 현황', '자문단 현황', '위탁시설 현황', '자치법규 현황']

def make(kind, outname):
    W,H=1600,920
    if kind=='hwp':
        bg='#d9dadd'; bar='#f5f5f5'; side='#ffffff'; accent='#2e66d4'
        app='한컴오피스 한글 · AI혁신국 일반현황_책갈피완료.hwpx'
        tab='책갈피'
    else:
        bg='#4a4a4a'; bar='#252525'; side='#303030'; accent='#8fb9ff'
        app='AI혁신국_일반현황_책갈피완료_최종검수본_수정.pdf'
        tab='문서 개요'
    im=Image.new('RGB',(W,H),bg); d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,62),fill=bar)
    fg='#202020' if kind=='hwp' else '#f4f4f4'
    d.text((28,18),app,font=f(22,True),fill=fg)
    d.rounded_rectangle((W-178,12,W-26,50),12,fill=accent)
    d.text((W-152,20),'실제 파일',font=f(18,True),fill='white' if kind=='hwp' else '#101010')
    d.rectangle((0,62,370,H),fill=side)
    sidefg='#202020' if kind=='hwp' else '#f2f2f2'; muted='#737373' if kind=='hwp' else '#b9b9b9'
    d.text((28,92),tab,font=f(27,True),fill=sidefg)
    d.line((24,137,344,137),fill=accent,width=3)
    y=160
    for i,b in enumerate(bookmarks):
        if i==0:
            d.rounded_rectangle((18,y-7,348,y+39),8,fill='#e5edff' if kind=='hwp' else '#4a5b70')
        if i == 0:
            d.polygon([(32,y+8),(48,y+8),(40,y+20)],fill=sidefg)
        else:
            d.polygon([(34,y+5),(34,y+21),(46,y+13)],fill=sidefg)
        d.text((55,y),b,font=f(20, i==0),fill=sidefg)
        y+=52
    d.text((30,H-76),'BOOKMARK 필드 150개 이상',font=f(18,True),fill=accent)
    d.text((30,H-44),'목차 항목 → 본문 위치 연결',font=f(16),fill=muted)
    doc,pos=fit(PAGE,(410,88,1140,790)); im.paste(doc,pos)
    # Highlight the real magenta linked rows without obscuring the document.
    d.rounded_rectangle((1110,732,1510,810),16,fill='#fff3c4' if kind=='hwp' else '#222222',outline=accent,width=4)
    d.text((1132,748),'보라색 항목 = 링크/하이라이트',font=f(21,True),fill='#7d1676' if kind=='hwp' else '#f4b6ed')
    d.text((1132,782),'책갈피 선택 시 본문으로 이동',font=f(18),fill=fg)
    im.save(OUT/outname,quality=95)

make('hwp','general-hwpx-bookmarks-actual.jpg')
make('pdf','general-pdf-bookmarks-actual.jpg')
print(OUT/'general-hwpx-bookmarks-actual.jpg')
print(OUT/'general-pdf-bookmarks-actual.jpg')
