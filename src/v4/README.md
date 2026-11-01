# ToolPivio V4 original visuals

These 23 SVG illustrations were authored as vector geometry for ToolPivio: one distinct composition for each of the 19 working tools and four information pages. No photograph, external image, downloaded icon package, external font, script, or remote asset is included.

`visuals.json` maps tool/page IDs to the source filename, category, short benefit and descriptive text. All images use a stable `0 0 360 220` view box, transparent backgrounds and ToolPivio's navy/teal/mint palette. Each source includes a title and description; card watermarks are decorative and therefore use empty image alt text.

`python3 scripts/build.py` copies each source into `docs/assets/v4/<id>.<sha256-prefix>.svg` and writes the public asset manifest. Content hashes allow safe caching. Existing tracked hashed versions are retained so a cached or restored theme can still load its original artwork. Page banners and card watermarks use the same original source artwork with different visual treatments.
