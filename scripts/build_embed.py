from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
template = (ROOT / "src/embed_template.html").read_text(encoding="utf-8")
sources = {
    "@@TOOLPIVIO_CSS@@": ROOT / "src/styles.css",
    "@@TOOLPIVIO_CALCULATORS_JS@@": ROOT / "src/calculators.js",
    "@@TOOLPIVIO_APP_JS@@": ROOT / "src/app.js",
}
for token, path in sources.items():
    assert template.count(token) == 1, f"Unexpected count for {token}"
    template = template.replace(token, path.read_text(encoding="utf-8"))
target = ROOT / "docs/embed.html"
target.write_text(template, encoding="utf-8")
print(f"Built {target.relative_to(ROOT)}")
