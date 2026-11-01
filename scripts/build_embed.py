"""Build the self-contained calculator runtime and local optional PDF library."""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
template = (ROOT / "src/embed_template.html").read_text(encoding="utf-8")
legacy_ids = {"roas": "roas", "profit-margin": "margin", "print-dpi": "dpi"}
options = {}
for source in ("src/tools.json", "src/new-tools.json", "src/file-tools.json"):
    path = ROOT / source
    if path.exists():
        for tool in json.loads(path.read_text(encoding="utf-8")):
            key = tool.get("id") or legacy_ids[tool["slug"]]
            if key in options:
                raise ValueError(f"Duplicate tool id: {key}")
            options[key] = [tool["title"], tool["description"]]
options_json = json.dumps(options, ensure_ascii=False).replace("</", "<\\/")
if "@@TOOLPIVIO_OPTIONS_JSON@@" in template:
    template = template.replace("@@TOOLPIVIO_OPTIONS_JSON@@", options_json)
else:
    template, count = re.subn(r"const options=\{.*?\};const selected=", lambda _: "const options=" + options_json + ";const selected=", template, count=1)
    assert count == 1, "Missing embed options placeholder"

scripts = []
for source in ("src/tool-definitions.js", "src/image-tools.js", "src/app.js"):
    path = ROOT / source
    if path.exists():
        scripts.append(path.read_text(encoding="utf-8"))
sources = {
    "@@TOOLPIVIO_CSS@@": (ROOT / "src/styles.css").read_text(encoding="utf-8"),
    "@@TOOLPIVIO_CALCULATORS_JS@@": (ROOT / "src/calculators.js").read_text(encoding="utf-8"),
    "@@TOOLPIVIO_APP_JS@@": "\n".join(scripts),
}
for token, content in sources.items():
    assert template.count(token) == 1, f"Unexpected count for {token}"
    template = template.replace(token, content)
assert not re.search(r"@@TOOLPIVIO_[A-Z_]+@@", template), "Unfilled embed token"
target = ROOT / "docs/embed.html"
target.write_text(template, encoding="utf-8")
for filename in ("pdf-lib.min.js", "pdf-lib.LICENSE.txt"):
    source = ROOT / "src/vendor" / filename
    if source.exists():
        output = ROOT / "docs/assets" / filename
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, output)
print(f"Built {target.relative_to(ROOT)} with {len(options)} registered tools")
