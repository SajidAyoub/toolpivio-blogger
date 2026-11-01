# Functional tools deployment

This release keeps the existing Blogger URLs and runs calculator and file processing in GitHub Pages. Nothing in a pull request installs the Blogger theme. Review and merge the design, tools and SEO pull requests in their documented dependency order; do not enable automatic merging.

## GitHub Pages

1. In the repository, confirm **Settings → Pages → Deploy from a branch → main → /docs**. Keep the existing domain configuration.
2. Merge the approved runtime changes and wait for the Pages deployment to complete.
3. Open `https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool=roas`, enter revenue 5000 and spend 1000, calculate 5×, then Reset. Repeat margin 100/60 → 40% and DPI 3000×2400 at 10×8 inches → 300 PPI.
4. Open the new public tool documents under `/toolpivio-blogger/tools/<id>.html` and verify calculation or a small-file download. New catalog links target these actual hosted documents while Blogger registrations await URL verification.

`scripts/build_embed.py` generates the hosted runtime from source, tool definitions and metadata. It copies the locally bundled MIT-licensed PDF library and its license to `docs/assets/`. PDF code loads only when a PDF action is used. Images and PDFs stay in the browser; no paid API or upload service is required.

## Blogger registrations and selective publishing

`tools/page_registry.json` is the explicit registry used by both `tools/blogger_publish.py` and the workflow's changed-page allowlist. Adding an arbitrary HTML file cannot publish it. Every new tool needs a registry entry, a matching `pages/<id>.html` source, and a generated GitHub Pages tool document. New entries have `url_verified: false` until the actual returned Blogger URL is checked. This field records deployment evidence; it does not change navigation automatically.

Run `python3 tools/page_registry.py` to validate registered page sources without credentials or network calls. On an approved merge that changes `pages/**`, the existing Blogger workflow validates the build and updates only changed registered page files. Existing exact titles and paths are preserved. Manual workflow modes remain: **preview** lists proposed changes without writes; **apply** creates missing registered pages; **calculators** updates only the three original calculators; **replace** updates all matching registered pages. Choose the smallest appropriate scope.

After a new Blogger page is published, inspect the workflow's `Published URL`, open it and test the embedded tool, then verify its actual path against the registry. Blogger chooses new page permalinks; a title-derived expected path is provisional. If it differs, update the registry to the returned path before marking `url_verified` true. Keep catalog links on GitHub Pages until the verified Blogger URL is deliberately adopted. Never put a token or OAuth JSON in a page, log, commit, PR or deployment note. This work does not change the existing Actions secret or require OAuth setup again.

## Theme installation and rollback

Follow `docs/V3_INSTALL.md` for the separately reviewed V3 XML. Back up the installed Blogger theme before uploading the release file. Never upload the legacy `dist/toolpivio.xml`. If a release causes a problem, restore the saved theme in Blogger. Revert the approved runtime/page commit through a reviewed PR to restore Pages assets and changed registered page bodies. A Git revert does not itself delete newly created Blogger Pages; review and remove those manually only if intended.

## Checks before approval

Run `npm run build`, `npm test`, the browser checks documented with the PR, and a generated-file cleanliness check. Registry tests cover selective updates, no writes during preview, rejection of unregistered files, exact iframe origin/tool validation, duplicate titles, and refusal to patch a page with an unexpected URL. Tests use mocks and do not contact Google. Live Pages deployment, actual Blogger returned URLs and the manual theme upload remain post-merge owner verification steps.
