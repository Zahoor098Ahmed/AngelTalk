"""Bundle reviewed white-background restorations at their full generated resolution."""
import base64
import io
import json
import sys
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/image-edits/requested-cleanup'
rows=json.loads((ASSETS/'audit.json').read_text(encoding='utf8'))
pictures={}
report=[]
for row in rows:
    source=ASSETS/(row['slug']+'-clear.png')
    if not source.exists():continue
    image=Image.open(source).convert('RGB')
    buffer=io.BytesIO()
    image.save(buffer,format='JPEG',quality=96,subsampling=0)
    uri='data:image/jpeg;base64,'+base64.b64encode(buffer.getvalue()).decode('ascii')
    for key in set([row['word'],*row.get('aliases',[])]):pictures[key]=uri
    report.append({'word':row['word'],'file':source.name,'width':image.width,'height':image.height,'bytes':len(buffer.getvalue())})
if len(report)!=32 and '--allow-partial' not in sys.argv:
    raise RuntimeError(f'Expected all 32 requested restorations; found {len(report)}')
(ROOT/'src/modules/requestedPictureReplacements.json').write_text(json.dumps(pictures,separators=(',',':'))+'\n',encoding='utf8')
(ASSETS/'bundled.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(f'Bundled {len(report)} restored images across {len(pictures)} picture keys.')
