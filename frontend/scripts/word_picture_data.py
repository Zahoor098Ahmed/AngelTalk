"""Read/write the word picture dictionary in GitHub-sized JSON chunks."""
import json
from pathlib import Path

def load_picture_data(path):
    path=Path(path)
    data=json.loads(path.read_text(encoding='utf8'))
    if path.name=='uniquePictures.json':
        for part in sorted(path.parent.glob('uniquePictures.part-*.json')):
            data.update(json.loads(part.read_text(encoding='utf8')))
    return data

def write_picture_data(path,data):
    path=Path(path)
    if path.name!='uniquePictures.json':
        path.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False)+'\n',encoding='utf8')
        return
    chunks=[];chunk={};size=2
    for key,value in data.items():
        entry_size=len(json.dumps({key:value},separators=(',',':'),ensure_ascii=False).encode('utf8'))
        if chunk and size+entry_size>24*1024*1024:
            chunks.append(chunk);chunk={};size=2
        chunk[key]=value;size+=entry_size
    if chunk:chunks.append(chunk)
    imports=[];names=[]
    for index,chunk in enumerate(chunks):
        name='uniquePictures.json' if index==0 else f'uniquePictures.part-{index:02d}.json'
        (path.parent/name).write_text(json.dumps(chunk,separators=(',',':'),ensure_ascii=False)+'\n',encoding='utf8')
        imports.append(f'import part{index} from "./{name}";')
        names.append(f'part{index}')
    module='// Generated word picture dictionary, split without changing image data.\n'+'\n'.join(imports)+'\n\nconst pictures: Record<string, string> = Object.assign({}, '+', '.join(names)+');\nexport default pictures;\n'
    path.with_suffix('.ts').write_text(module,encoding='utf8')
