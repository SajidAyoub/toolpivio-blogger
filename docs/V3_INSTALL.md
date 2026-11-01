# ToolPivio V3 installation and rollback

V3 is prepared for review. Nothing in this branch installs a Blogger theme.

1. Review and merge the design PR. In GitHub **Settings → Pages**, use **Deploy from a branch**, branch `main`, folder `/docs`. Wait for the Pages deployment to finish.
2. Open `https://sajidayoub.github.io/toolpivio-blogger/` and `embed.html?tool=roas`, `?tool=margin`, `?tool=dpi`. Check Calculate and Reset. The catalog stays available without its enhancement script.
3. In Blogger **Theme**, use the menu beside Customize → **Backup** → download your current working theme. Keep this separate from the repository.
4. Download `releases/ToolPivio_V3_Ready_For_Blogger.xml` from the approved commit. In Blogger **Theme → Restore → Upload**, select that file. **Do not upload `dist/toolpivio.xml`**; it is a superseded legacy artifact.
5. Check the home page at desktop and phone widths. Test menu, search, categories and keyboard focus. Open About to confirm native Blogger page rendering. Confirm these unchanged URLs: `/p/roas-calculator.html`, `/p/profit-margin-calculator.html`, `/p/print-dpi-calculator.html`.
6. Check 5000/1000 → 5× ROAS; revenue 100 and cost 60 → 40% margin; 3000×2400 pixels at 10×8 inches → 300 PPI. Check empty input errors and Reset. The iframe title remains available to screen readers; V3's checked message listener fits the iframe to its contents. If resizing is unavailable, the iframe remains scrollable and the existing direct link works.

Only the XML theme requires this manual install. Future catalog changes come from the versioned `catalog.v3.js` file on GitHub Pages; the theme keeps three static Blogger links when the network/script is unavailable. New tools use their verified generated Pages paths. New Blogger paths must be verified after publishing before substituting those links.

To rebuild: `npm run build` and `python3 scripts/build_embed.py`. Commit generated `releases`, `dist/preview.html`, `docs/index.html`, `docs/catalog.v3.js` and `docs/embed.html` alongside their sources. `src/tools.json` contains existing tools. Optional `src/new-tools.json` and `src/file-tools.json` extend the catalog with records containing `id`, `title`, `category`, `description` and `icon`; each requires a working hosted `tools/<id>.html` page before release.

For rollback, restore the theme backup in Blogger. For a Pages/runtime regression, revert the approved PR in GitHub, merge the revert after review, and wait for Pages deployment. Reverting GitHub cannot undo a manual Blogger theme upload. Existing registered `pages/*.html` content changes deploy separately through the existing Blogger API workflow after merge; this design branch does not change those files or OAuth settings.

The preview demonstrates V3's visual layer and catalog. It cannot execute Blogger's server-side widgets; native About/body rendering must be confirmed after the owner installs the approved theme.
