"""Remove low-contrast ground-shadow components from the bundled word library.
Original files remain in a local backup; all aliases are updated together.
"""
import argparse, base64, hashlib, io, json
from collections import defaultdict
from pathlib import Path
from word_picture_data import load_picture_data, write_picture_data
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MODULES = ROOT / 'src/modules'
OUT = ROOT / 'assets/image-edits/library-no-shadow'
FILES = ['uniquePictures.json', 'homeCategoryPictures.json', 'monthPictures.json']

def clean(image):
    rgba=np.array(image.convert('RGBA'))
    rgb=rgba[:,:,:3].astype(np.int16)
    h,w=rgb.shape[:2]
    lum=rgb.mean(axis=2)
    chroma=rgb.max(axis=2)-rgb.min(axis=2)
    border=np.concatenate([lum[0],lum[-1],lum[:,0],lum[:,-1]])
    if np.mean(border>245)<.8: return image,[],0
    # First find the dense, flat neutral centre of a ground shadow. Subject
    # highlights and antialiased white margins cannot seed the cleanup.
    core=(lum>=195)&(lum<=225)&(chroma<=18)&(rgba[:,:,3]>200)
    core[:int(h*.36)]=False
    labels,count=ndi.label(core)
    mask=np.zeros((h,w),bool);components=[]
    for label,sl in enumerate(ndi.find_objects(labels),1):
        if sl is None:continue
        ys,xs=sl;region=labels[sl]==label;bw=xs.stop-xs.start
        if bw<w*.08:continue
        rows=region.sum(axis=1)
        dense=rows>=max(w*.04,bw*.5)
        indices=np.flatnonzero(dense)
        if not len(indices):continue
        # Split any narrow connection to the subject ABOVE the final wide oval.
        bottom=int(indices[-1]);top=bottom
        while top>0 and dense[top-1]:top-=1
        y0=max(int(h*.36),ys.start+top-3)
        y1=min(h,ys.stop+2)
        bh=y1-y0
        if bh<3 or bh>h*.17 or bw/bh<2.5:continue
        if (y0+y1)/2<h*.44:continue
        # A ground oval is the bottom-most feature. Never punch a pale hole
        # into a photograph, garment, or grey object that continues below it.
        below=lum[min(h,y1+3):,:]<242
        if below.sum()>max(24,w*h*.002):continue
        x0=max(0,xs.start-max(4,round(w*.05)));x1=min(w,xs.stop+max(4,round(w*.05)))
        y1=min(h,ys.stop+max(4,round(h*.025)))
        band=np.zeros((h,w),bool);band[y0:y1,x0:x1]=True
        eligible=band&(lum>=180)&(lum<252)&(chroma<=65)
        seed=(labels==label)&eligible
        if seed.sum()<w*h*.0006:continue
        local=ndi.binary_propagation(seed,mask=eligible)
        # A real shadow has a white underside, not a dark object boundary.
        lower=ndi.binary_dilation(local,iterations=2)&~local
        lower[:(y0+y1)//2]=False
        if lower.any() and np.mean(lum[lower]<130)>.10:continue
        fringe=ndi.binary_dilation(local,iterations=3)&eligible
        local|=fringe
        if local.sum()<w*h*.0006:continue
        mask|=local
        components.append([x0,y0,x1-x0,y1-y0,int(local.sum())])
    if not components:return image,[],0
    result=rgba.copy();result[mask,:3]=255
    return Image.fromarray(result),components,int(mask.sum())

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--from-original',action='store_true');parser.add_argument('--remaining',action='store_true');args=parser.parse_args()
    OUT.mkdir(parents=True,exist_ok=True)
    maps={f:load_picture_data((ROOT/'.cache/shadow-originals'/f) if args.from_original and (ROOT/'.cache/shadow-originals'/f).exists() else (MODULES/f)) for f in FILES}
    inputs=maps
    if args.remaining: maps={f:load_picture_data(MODULES/f) for f in FILES}
    groups=defaultdict(list)
    for file,data in inputs.items():
        for key,uri in (data.items() if isinstance(data,dict) else enumerate(data)):
            if isinstance(uri,str) and uri.startswith(('data:image/jpeg;base64,','data:image/png;base64,')):
                groups[uri].append((file,key))
    prior=json.loads((OUT/"audit.json").read_text(encoding="utf8")) if args.remaining else {}
    changed=prior.get("images",[]); known={row["id"] for row in changed}
    unchanged=0; errors=[]; samples=[]
    reviews={"changed":[],"unchanged":[]}
    def review(kind,name,img):
        thumb=img.convert("RGB");thumb.thumbnail((112,112))
        reviews[kind].append((str(name),thumb))
    sample_names={'vehicles::bicycle','vehicles::fire engine','bread','ball-spiky','ear','turtles','sloth bear','food coloring','light bright pegs','action toy','ride in bus','whisk','us dollar','hand','cream cheese','sandy','ball-grape','clotted cream','spoon','grey','muffin pan','tower toy','swim noodle','shirt','elephant'}
    for index,(uri,refs) in enumerate(groups.items()):
        try:
            if hashlib.sha256(uri.encode()).hexdigest()[:16] in known: continue
            original=Image.open(io.BytesIO(base64.b64decode(uri.split(',',1)[1]))).convert('RGBA')
            result,components,pixels=clean(original)
            if not components:
                unchanged+=1;review("unchanged",refs[0][1],original);continue
            review("changed",refs[0][1],result)
            digest=hashlib.sha256(uri.encode()).hexdigest()[:16]
            buffer=io.BytesIO();result.save(buffer,format='PNG',optimize=True)
            value='data:image/png;base64,'+base64.b64encode(buffer.getvalue()).decode()
            keys=[key for _,key in refs]
            changed.append({'id':digest,'refs':refs,'components':components,'removedPixels':pixels,'width':original.width,'height':original.height})
            if args.apply:
                export=ROOT/'.cache/shadow-output'/(digest+'.png')
                export.parent.mkdir(parents=True,exist_ok=True)
                export.write_bytes(buffer.getvalue())
                for file,key in refs: maps[file][key]=value
            if any(key in sample_names for key in keys):samples.append((keys[0],original.copy(),result.copy()))
        except Exception as exc:errors.append({'refs':refs,'error':str(exc)})
        if index%500==0:print('Scanned',index,'/',len(groups),flush=True)
    for kind,rows in reviews.items():
        for start in range(0,len(rows),144):
            sheet=Image.new('RGB',(1440,1728),'white');draw=ImageDraw.Draw(sheet)
            for i,(name,img) in enumerate(rows[start:start+144]):
                x=(i%12)*120;y=(i//12)*144
                sheet.paste(img,(x+(120-img.width)//2,y))
                draw.text((x+2,y+114),name[:19],fill='black')
            review_dir=ROOT/'.cache/shadow-reviews'
            review_dir.mkdir(parents=True,exist_ok=True)
            sheet.save(review_dir/(kind+'-'+str(start//144).zfill(2)+'.jpg'),quality=90)
    report={'scannedUniqueEmbedded' :len(groups),'changedImages':len(changed),'updatedReferences':sum(len(x['refs']) for x in changed),'unchangedImages':unchanged,'errors':errors,'images':changed}
    (OUT/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
    if samples:
        sheet=Image.new('RGB',(640,len(samples)*290),'#f0f3f7');draw=ImageDraw.Draw(sheet)
        for row,(name,before,after) in enumerate(samples):
            for col,img in enumerate([before,after]):
                img.thumbnail((256,256));sheet.paste(img.convert('RGB'),(col*320+32,row*290+25))
                draw.text((col*320+10,row*290+6),('BEFORE ' if col==0 else 'AFTER ')+name,fill='black')
        review_dir=ROOT/'.cache/shadow-reviews'
        review_dir.mkdir(parents=True,exist_ok=True)
        sheet.save(review_dir/'sample-review.jpg',quality=95)
    if args.apply:
        for file,data in maps.items():
            backup=ROOT/'.cache/shadow-originals'/file
            backup.parent.mkdir(parents=True,exist_ok=True)
            if not backup.exists():backup.write_bytes((MODULES/file).read_bytes())
            write_picture_data(MODULES/file,data)
    print(json.dumps({k:v for k,v in report.items() if k!='images'},indent=2))

if __name__=='__main__':main()
