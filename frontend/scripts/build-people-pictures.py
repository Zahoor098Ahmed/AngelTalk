"""Package complete-body AAC restorations, preserving their full HD resolution."""
import base64,io,json,sys
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
assets=root/'assets/image-edits/people-complete'
rows=json.loads((assets/'manifest.json').read_text(encoding='utf8'))
names={'preposition':'peoplePrepositionPictures.json','pronouns':'peoplePronounPictures.json','school':'peopleSchoolPictures.json','verb a':'peopleVerbAPictures.json'}
groups={name:{} for name in names}
report=[]
for row in rows:
    file=assets/(row['slug']+'-clear.png')
    if not file.exists():continue
    image=Image.open(file).convert('RGB')
    output=io.BytesIO();image.save(output,format='JPEG',quality=94,subsampling=0)
    uri='data:image/jpeg;base64,'+base64.b64encode(output.getvalue()).decode('ascii')
    for key in set([row['key'],*row['aliases']]):groups[row['folder']][key]=uri
    report.append({'key':row['key'],'file':file.name,'width':image.width,'height':image.height,'bytes':len(output.getvalue())})
if len(report)!=len(rows) and '--allow-partial' not in sys.argv:
    missing=[r['key'] for r in rows if not (assets/(r['slug']+'-clear.png')).exists()]
    raise RuntimeError('Missing restored pictures: '+', '.join(missing))
for folder,name in names.items():
    encoded=json.dumps(groups[folder],separators=(',',':'))+'\n'
    if len(encoded.encode())>24*1024*1024:raise RuntimeError(name+' exceeds the picture chunk limit')
    (root/'src/modules'/name).write_text(encoded,encoding='utf8')
(assets/'bundled.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
batch=assets/'batch-prompts.json'
prompt_by_key={row['key']:row for row in json.loads(batch.read_text(encoding='utf8'))} if batch.exists() else {}
corrections=[]
for file in sorted(assets.glob('*-prompt.json')):
    receipt=json.loads(file.read_text(encoding='utf8'))
    if '-correction-' in file.name:corrections.append(receipt)
    else:prompt_by_key[receipt['key']]=receipt
prompts=[*prompt_by_key.values(),*corrections]
(assets/'prompts.json').write_text(json.dumps(prompts,indent=2)+'\n',encoding='utf8')
print(f'Bundled {len(report)}/{len(rows)} HD people pictures.')
