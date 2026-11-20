"""Read-only visual inspection sheets for every B-Z verb reference or restoration."""
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]/'assets/image-edits/verbs-b-z'
rows=json.loads((root/'manifest.json').read_text())
edited='--edited' in sys.argv
rows=[r for r in rows if r['status']=='raster' and (root/(r['slug']+'-clear.png' if edited else r['original'])).exists()]
for start in range(0,len(rows),48):
    group=rows[start:start+48];sheet=Image.new('RGB',(1200,((len(group)+5)//6)*170),'#e4e8ed');draw=ImageDraw.Draw(sheet)
    for i,row in enumerate(group):
        picture=Image.open(root/(row['slug']+'-clear.png' if edited else row['original'])).convert('RGBA');picture.thumbnail((184,140))
        x=i%6*200;y=i//6*170;sheet.paste('white',(x+3,y+3,x+197,y+144))
        sheet.paste(picture,(x+(200-picture.width)//2,y+2+(140-picture.height)//2),picture)
        draw.text((x+4,y+148),row['key'],fill='black')
    sheet.save(root/f'{"clear" if edited else "original"}-sheet-{start//48:02}.jpg',quality=92)
