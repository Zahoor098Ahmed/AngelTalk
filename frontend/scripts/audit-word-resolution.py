import argparse
import base64
import io
import json
import re
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description="List bundled word pictures that need higher-resolution originals.")
    parser.add_argument("--minimum", type=int, default=512)
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args()
    modules = Path(__file__).resolve().parents[1] / "src" / "modules"
    source = (modules / "uniquePictures.ts").read_text(encoding="utf-8")
    imports = dict(re.findall(r'import (\w+) from "\./([^"]+\.json)";', source))
    pictures = {}
    for assignment in re.findall(r"Object\.assign\(([^)]+)\)", source):
        for name in assignment.split(",")[1:]:
            filename = imports[name.strip()]
            pictures.update(json.loads((modules / filename).read_text(encoding="utf-8")))

    report = {"checked": 0, "lowResolution": [], "external": [], "unreadable": []}
    for word, uri in sorted(pictures.items()):
        if word.startswith("folder::") or uri.startswith("data:image/svg+xml"):
            continue
        if not uri.startswith("data:"):
            report["external"].append(word)
            continue
        try:
            with Image.open(io.BytesIO(base64.b64decode(uri.split(",", 1)[1]))) as picture:
                width, height = picture.size
        except (OSError, ValueError, IndexError):
            report["unreadable"].append(word)
            continue
        report["checked"] += 1
        if max(width, height) < args.minimum:
            report["lowResolution"].append({"word": word, "width": width, "height": height})
    if args.summary:
        report = {key: len(value) if isinstance(value, list) else value for key, value in report.items()}
    print(json.dumps(report, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
