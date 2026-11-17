"""Verify all edited image references, dimensions, transparency and foreground pixels."""
import base64, importlib.util, io, json
from pathlib import Path
from word_picture_data import load_picture_data
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
report=json.loads((ROOT/'assets/image-edits/library-no-shadow/audit.json').read_text(encoding='utf8'))
changed=0;cache={};before_maps={};after_maps={}
for file in ['uniquePictures.json','homeCategoryPictures.json','monthPictures.json']:
    old=json.loads((ROOT/'.cache/shadow-originals'/file).read_text(encoding='utf8'))
    new=load_picture_data(ROOT/'src/modules'/file)
    assert type(old) is type(new)
    assert (set(old)==set(new) if isinstance(old,dict) else len(old)==len(new)),file
    before_maps[file]=old;after_maps[file]=new
    for key in (old if isinstance(old,dict) else range(len(old))):
        if old[key]==new[key]:continue
        changed+=1;pair=(old[key],new[key])
        if pair in cache:continue
        a=np.array(Image.open(io.BytesIO(base64.b64decode(old[key].split(',',1)[1]))).convert('RGBA'))
        b=np.array(Image.open(io.BytesIO(base64.b64decode(new[key].split(',',1)[1]))).convert('RGBA'))
        assert a.shape==b.shape,(file,key,'dimensions')
        assert np.array_equal(a[:,:,3],b[:,:,3]),(file,key,'alpha')
        rgb=a[:,:,:3].astype(np.int16)
        foreground=(rgb.mean(2)<180)|((rgb.max(2)-rgb.min(2))>65)
        assert np.array_equal(a[foreground],b[foreground]),(file,key,'foreground details')
        cache[pair]=True
assert changed==report['updatedReferences'],(changed,report['updatedReferences'])
assert len(cache)==report['changedImages']
assert not report['errors'],report['errors']
spec=importlib.util.spec_from_file_location('shadow_cleanup',ROOT/'scripts/remove-library-shadows.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
# A grey object with an outline is content, rather than a ground shadow.
grey=Image.new('RGB',(256,256),'white');draw=ImageDraw.Draw(grey)
draw.rectangle((30,80,225,210),fill=(212,212,212),outline='black',width=3)
cleaned,_,_=module.clean(grey)
assert np.array_equal(np.array(grey),np.array(cleaned.convert('RGB'))),'grey subject must survive'
photo=ROOT/'.cache/shadow-remote/e54adff9a8fd56f134f9.source'
if photo.exists():
    _,components,_=module.clean(Image.open(photo));assert not components,'photo subject must survive'
print('PASS:',len(cache),'unique edited images;',changed,'references; dimensions, alpha, foreground and grey-photo regressions.')
# A compact, reviewable before/after preview from the real final app assets.
names=['sloth bear','turtles','bread','hand','muffin pan','whisk','food coloring','us dollar','tower toy','cream cheese','vehicles::bicycle','vehicles::fire engine']
sheet=Image.new('RGB',(640,len(names)*280),'white');draw=ImageDraw.Draw(sheet)
for row,key in enumerate(names):
    for col,data in enumerate([before_maps['uniquePictures.json'],after_maps['uniquePictures.json']]):
        im=Image.open(io.BytesIO(base64.b64decode(data[key].split(',',1)[1]))).convert('RGB');im.thumbnail((256,256))
        sheet.paste(im,(col*320+32,row*280+22));draw.text((col*320+8,row*280+5),('BEFORE ' if col==0 else 'AFTER ')+key,fill='black')
sheet.save(ROOT/'assets/image-edits/library-no-shadow/final-review.jpg',quality=95)
