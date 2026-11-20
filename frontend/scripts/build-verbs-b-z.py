"""Package every B-Z verb and all its forms, without storing duplicate image bytes."""
import base64,io,json,sys
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
assets=root/'assets/image-edits/verbs-b-z';modules=root/'src/modules'
manifest=json.loads((assets/'manifest.json').read_text(encoding='utf8'))
native_file=assets/'native-updated.json'
native=json.loads(native_file.read_text(encoding='utf8')) if native_file.exists() else {}
data={};aliases={};report=[];missing=[]
for row in manifest:
    key=row['key'];file=assets/(row['slug']+'-clear.png')
    if row['status']=='native-vector':
        uri=native.get(key)
        if not uri:missing.append(key);continue
        width=height=1024
    elif file.exists():
        picture=Image.open(file).convert('RGB');width,height=picture.size
        if max(width,height)<1024:raise RuntimeError('HD output too small: '+key)
        output=io.BytesIO();picture.save(output,format='JPEG',quality=94,subsampling=0)
        uri='data:image/jpeg;base64,'+base64.b64encode(output.getvalue()).decode('ascii')
    else:missing.append(key);continue
    data[key]=uri;aliases[key]=row['tileLabels']
    report.append({'key':key,'width':width,'height':height,'forms':len(row['tileLabels']),'type':row['status']})
if missing and '--allow-partial' not in sys.argv:raise RuntimeError('Missing verb pictures: '+', '.join(missing))
chunks=[];chunk={};size=2
for key,value in data.items():
    length=len(json.dumps({key:value},separators=(',',':')).encode())
    if chunk and size+length>18*1024*1024:chunks.append(chunk);chunk={};size=2
    chunk[key]=value;size+=length
if chunk:chunks.append(chunk)
if not chunks:raise RuntimeError('No verb restorations are ready')
imports=[]
for index,chunk in enumerate(chunks):
    filename=f'verbsBtoZ.part-{index:02}.json'
    (modules/filename).write_text(json.dumps(chunk,separators=(',',':'))+'\n',encoding='utf8')
    imports.append(f'import part{index} from "./{filename}";')
(modules/'verbsBtoZAliases.json').write_text(json.dumps(aliases,separators=(',',':'))+'\n',encoding='utf8')
module='// Generated from reviewed full-body verb restorations; all forms share the same HD image.\n'+'\n'.join(imports)+'\nimport aliases from "./verbsBtoZAliases.json";\n'
module+='const pictures: Record<string,string> = Object.assign({}, '+', '.join(f'part{i}' for i in range(len(chunks)))+');\n'
module+='for (const [key, labels] of Object.entries(aliases)) {\n  const folder=key.split("::")[0];\n  for (const label of labels) pictures[`${folder}::${label}`]=pictures[key];\n}\nexport default pictures;\n'
(modules/'verbsBtoZPictures.ts').write_text(module,encoding='utf8')
(assets/'coverage.json').write_text(json.dumps({'ready':len(report),'expected':len(manifest),'missing':missing,'pictures':report},indent=2)+'\n',encoding='utf8')
prompts=[]
for receipt in sorted(assets.glob('receipts-*.json')):prompts.extend(json.loads(receipt.read_text(encoding='utf8')))
(assets/'prompts.json').write_text(json.dumps(prompts,indent=2)+'\n',encoding='utf8')
print(f'Bundled {len(report)}/{len(manifest)} verbs covering {sum(len(x) for x in aliases.values())} form labels into {len(chunks)} image parts.')
