"""Create inspection sheets of the current assets; never changes the source images."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'assets/image-edits/requested-cleanup'
rows = [r for r in json.loads((ROOT/'audit.json').read_text()) if r.get('file') and r.get('mime') != 'image/svg+xml']
edited='--edited' in sys.argv
if edited:
    rows=[dict(r,file=r['slug']+'-clear.png') for r in rows if (ROOT/(r['slug']+'-clear.png')).exists()]
for start in range(0,len(rows),48):
    group=rows[start:start+48]
    sheet=Image.new('RGB',(1200,((len(group)+5)//6)*175),'#e4e8ed')
    draw=ImageDraw.Draw(sheet)
    for i,row in enumerate(group):
        picture=Image.open(ROOT/row['file']).convert('RGBA')
        size=picture.size
        picture.thumbnail((185,140))
        x=(i%6)*200;y=(i//6)*175
        sheet.paste('white',(x+3,y+3,x+197,y+145))
        sheet.paste(picture,(x+(200-picture.width)//2,y+3+(140-picture.height)//2),picture)
        draw.text((x+5,y+147),row['word'],fill='black')
        draw.text((x+5,y+160),str(size),fill='black')
    sheet.save(ROOT/f'{"clear" if edited else "audit"}-sheet-{start//48}.jpg',quality=93)
