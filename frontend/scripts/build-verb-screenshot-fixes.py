"""Bundle reviewed screenshot corrections and reuse each image for every form."""
import base64, io, json
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
assets = root / 'assets/image-edits/verb-screenshot-fixes'
modules = root / 'src/modules'
pictures = {}
for word, labels in {
    'add': ['add', 'added', 'adding', 'adds'],
    'apply': ['apply', 'applied', 'applying', 'applies'],
    'assist': ['assist', 'assisted', 'assisting', 'assists'],
}.items():
    image = Image.open(assets / (word + '-clear.png')).convert('RGB')
    encoded = io.BytesIO()
    image.save(encoded, format='JPEG', quality=94, subsampling=0)
    pictures['verb a::' + word] = 'data:image/jpeg;base64,' + base64.b64encode(encoded.getvalue()).decode()
(modules / 'verbScreenshotFixes.json').write_text(json.dumps(pictures, separators=(',', ':')) + '\n', encoding='utf8')
print('Bundled Add, Apply and Assist screenshot corrections.')
