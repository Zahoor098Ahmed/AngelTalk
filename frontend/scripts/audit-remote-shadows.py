"""Audit external curated word pictures with the same ground-shadow cleanup."""
import base64, concurrent.futures, hashlib, importlib.util, io, json, urllib.request
from pathlib import Path
from word_picture_data import load_picture_data
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('shadow_cleanup',ROOT/'scripts/remove-library-shadows.py')
cleanup=importlib.util.module_from_spec(spec);spec.loader.exec_module(cleanup)
files=['uniquePictures.json','symbolPictures.json','homeCategoryPictures.json']
refs={}
for file in files:
    data=load_picture_data(ROOT/'src/modules'/file)
    for key,uri in data.items():
        if isinstance(uri,str) and uri.startswith('http'):refs.setdefault(uri,[]).append([file,key])
cache=ROOT/'.cache/shadow-remote';cache.mkdir(parents=True,exist_ok=True)
def check(item):
    uri,keys=item;digest=hashlib.sha256(uri.encode()).hexdigest()[:20];path=cache/(digest+'.source')
    try:
        if not path.exists():
            req=urllib.request.Request(uri,headers={'User-Agent':'AngelTalkImageAudit/1.0'})
            with urllib.request.urlopen(req,timeout=20) as response:path.write_bytes(response.read())
        original=Image.open(path).convert('RGBA')
        result,components,pixels=cleanup.clean(original)
        if components:
            output=cache/(digest+'.png');result.save(output,optimize=True)
            return {'uri':uri,'refs':keys,'output':str(output),'removedPixels':pixels,'components':components}
        return {'uri':uri,'unchanged':True}
    except Exception as exc:return {'uri':uri,'error':str(exc)}
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    for row in pool.map(check,refs.items()):
        rows.append(row)
        if len(rows)%50==0:print('External pictures scanned:',len(rows),'/',len(refs),flush=True)
report={'scanned':len(rows),'changed':[r for r in rows if 'output' in r],'errors':[r for r in rows if 'error' in r]}
(ROOT/'assets/image-edits/library-no-shadow/remote-audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps({'scanned':len(rows),'changed':len(report['changed']),'errors':len(report['errors'])}))
