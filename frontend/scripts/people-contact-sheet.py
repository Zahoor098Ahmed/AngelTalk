"""Inspection-only contact sheets; originals and restored assets stay unchanged."""
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]/'assets/image-edits/people-complete'
rows=json.loads((root/'manifest.json').read_text())
edited='--edited' in sys.argv
if edited:rows=[r for r in rows if (root/(r['slug']+'-clear.png')).exists()]
for start in range(0,len(rows),48):
    group=rows[start:start+48]
    canvas=Image.new('RGB',(1200,((len(group)+5)//6)*180),'#e4e8ed');draw=ImageDraw.Draw(canvas)
    for i,row in enumerate(group):
        file=row['slug']+'-clear.png' if edited else row['original']
        image=Image.open(root/file).convert('RGBA');image.thumbnail((186,147))
        x=i%6*200;y=i//6*180
        canvas.paste('white',(x+3,y+3,x+197,y+153))
        canvas.paste(image,(x+(200-image.width)//2,y+3+(147-image.height)//2),image)
        draw.text((x+4,y+155),row['folder'],fill='black')
        draw.text((x+4,y+168),row['word'],fill='black')
    canvas.save(root/f'{"clear" if edited else "original"}-sheet-{start//48}.jpg',quality=93)
