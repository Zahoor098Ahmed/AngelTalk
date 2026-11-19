"""Package the approved HD kitchen assets without changing their resolution."""
import base64
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/image-edits/kitchen-clear"
WORDS = ["bread bin", "espresso cup", "measuring spoons", "rice cooker", "spray bottle"]
pictures = {}
for word in WORDS:
    source = ASSETS / (word.replace(" ", "-") + "-clear.png")
    if not source.exists():
        raise FileNotFoundError(source)
    # Keep the full generated resolution; JPEG avoids bundling multi-megabyte PNGs.
    image = Image.open(source).convert("RGB")
    encoded = io.BytesIO()
    image.save(encoded, format="JPEG", quality=96, subsampling=0)
    pictures[word] = "data:image/jpeg;base64," + base64.b64encode(encoded.getvalue()).decode("ascii")
    pictures["kitchen::" + word] = pictures[word]
    print(f"{word}: {image.width}x{image.height}, {len(encoded.getvalue())} bytes")

(ROOT / "src/modules/kitchenPictureReplacements.json").write_text(
    json.dumps(pictures, separators=(",", ":")) + "\n", encoding="utf8"
)
