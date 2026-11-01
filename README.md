# ToolPivio

Free client-side calculators and image/PDF tools, with a Blogger website and a GitHub Pages runtime. Navy, teal and white V3 design, original SVG graphics, responsive navigation, searchable categories and a progressively enhanced tool catalog. V4 adds fully clickable illustrated cards, 23 compact page banners and a configurable contact workspace.

## Deployment tracks

- **Theme:** `ToolPivio_Restored_Design_v2.xml` is the preserved working reference. Preserve the installed V3 backup; build and manually install only `releases/ToolPivio_V4_Ready_For_Blogger.xml`, after backing up Blogger. Native Contempo `Blog1` rendering is preserved. **Never install the superseded `dist/toolpivio.xml`.**
- **Tools:** GitHub Pages serves `main:/docs`. Existing embeds keep `embed.html?tool=roas`, `margin`, and `dpi`. The catalog and nineteen static tool guides are generated from source; PDF code is bundled locally and loaded only for PDF actions.
- **Blogger pages:** reviewed changes to explicitly registered `pages/*.html` deploy through the existing selective API workflow after merge. New URLs require checking the actual publish response; navigation uses working hosted guide paths until then. Secrets stay in existing encrypted Actions storage.

Read [V4 install and rollback](docs/V4_INSTALL.md), [tool deployment and registration](docs/TOOLS_DEPLOYMENT.md), and [supported file formats and limits](docs/FILE_TOOLS.md).

Contact delivery is deliberately inactive until the owner creates and verifies a Formspree form and sets its public endpoint in `src/contact/config.json`. The page currently offers a local draft and Copy/Clear controls, with no Send button or false success. Follow [CONTACT_EMAIL_SETUP.md](docs/CONTACT_EMAIL_SETUP.md).

## Working tools

Marketing: ROAS, CPC, CPM, CTR and CPA. Commerce: profit margin, discount, markup and break-even. Print: PPI/DPI, bleed/trim and size conversion. Video: file size/bitrate and frames/duration. Files: image resize, compression and JPG/PNG/WebP conversion, images-to-PDF and PDF merge. Each has validation, examples, Calculate/Process and Reset; file tools produce real downloads locally.

## Develop and verify

Use Node 22+ and Python 3.11+. Browser test packages are development dependencies, not runtime APIs.

```sh
npm ci
python3 -m pip install -r requirements-test.txt
npx playwright install chromium
npm run build
npm test
npm run test:browser
git diff --exit-code -- dist releases docs pages
```

Set `CHROMIUM_PATH` only when using a system Chromium. Source lives in `src/`; build scripts generate the release XML, `docs/embed.html`, catalog and hosted tool guides. Commit generated assets with source changes. `python3 scripts/build_seo.py --existing-blogger` explicitly refreshes the three existing Blogger bodies; normal builds preserve those approved files. `python3 tools/page_registry.py` validates all registrations without credentials or API calls.

CI verifies formulas, XML/native widget preservation, metadata/canonical/internal links, publisher behavior, whole-card navigation and original artwork, 23 banners, contact response handling, real image/PDF downloads and responsive layouts. The full browser command runs seven suites and uploads selected screenshots; provider requests in contact tests are intercepted. Local fixtures cannot prove Blogger server rendering or external deployment; verify these after the approved merge and manual theme upload.
