"""Refresh reviewed B-Z pictures without re-encoding unrelated assets."""
import base64, io, json, sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'assets/image-edits/verbs-b-z'
manifest = json.loads((assets / 'manifest.json').read_text(encoding='utf8'))
requested = set(sys.argv[1:])
rows = [row for row in manifest if row['slug'] in requested]
if len(rows) != len(requested):
    raise RuntimeError('Unknown verb correction slug')
updates = {}
for row in rows:
    picture = Image.open(assets / (row['slug'] + '-clear.png')).convert('RGB')
    if max(picture.size) < 1024:
        raise RuntimeError('Correction must be HD')
    output = io.BytesIO()
    picture.save(output, format='JPEG', quality=94, subsampling=0)
    updates[row['key']] = 'data:image/jpeg;base64,' + base64.b64encode(output.getvalue()).decode('ascii')
found = set()
for part in (root / 'src/modules').glob('verbsBtoZ.part-*.json'):
    data = json.loads(part.read_text(encoding='utf8'))
    keys = set(data) & set(updates)
    if not keys:
        continue
    for key in keys:
        data[key] = updates[key]
    part.write_text(json.dumps(data, separators=(',', ':')) + '\n', encoding='utf8')
    found.update(keys)
if found != set(updates):
    raise RuntimeError('Some corrections were not bundled')
print(f'Bundled {len(found)} reviewed verb corrections; existing form aliases retained.')
