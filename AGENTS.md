# ToolPivio — instructions for Codex (including mobile cloud tasks)

You are working on ToolPivio, a Blogger-hosted free-tools site.

## Repository and live deployment
- GitHub: SajidAyoub/toolpivio-blogger, default branch main.
- Live blog: https://toolpivio.blogspot.com/
- The Blogger API OAuth client, credentials and token are **not** in the repo. Never request them in chat, log them, commit them or upload them to a PR.
- A GitHub Actions workflow in .github/workflows/blogger-pages.yml automatically updates *changed, recognized* pages/*.html files after a change is merged/pushed to main and its validation passes.
- Existing pages: roas.html, profit-margin.html, print-dpi.html, about.html, contact.html, privacy-policy.html, terms.html. The publisher has an explicit registry in tools/blogger_publish.py. Adding a new file is **not** sufficient to deploy a new Page.
- Theme XML is generated from scripts/build.py and src/* into dist/toolpivio.xml. **Theme XML is not deployed via the Blogger API**. Theme changes need an explicit, separate Blogger HTML-editor upload.

## Standard workflow when the owner sends a command from mobile
1. Prefer Codex **Cloud** with this repository and base branch main; cloud tasks do not require the user's PC.
2. Read relevant source files and identify whether the request is PAGE CONTENT or THEME/TOOL CODE.
3. Make only changes necessary to the requested task. Never modify secrets, GitHub Actions authorization, or Blogger credentials.
4. For a page-only content update, modify an existing pages/*.html file, keep its calculator data-tool marker intact, and preserve the intended page title.
5. For theme/UI/calculator JavaScript changes, modify sources; run npm run build and npm test so generated dist output stays in sync. Clearly state that resulting theme change is **not live** until uploaded to Blogger.
6. Run the appropriate checks. Create a Pull Request targeting main. The owner reviews and merges it from phone; never auto-merge without being instructed.
7. Report PR URL and whether merging will trigger the Blogger Pages auto-publisher:
   - Changed recognized pages/*.html: Yes, after validation.
   - Only theme, scripts, styling, images, or docs: No.
   - New pages or tools: require registry, theme/navigation, and likely manual theme upload; do not claim fully automatic deployment.
8. If a change can break the site, note risk and preserve rollback instructions.

## Known issue as of October 24, 2026
- Blogger API publishing was verified by the user's CMD and GitHub Actions was green after PR #2, but live About page screenshot showed a blank page body beneath the header.
- PR #3 (fix/blogger-blog1-page-rendering) is a proposed theme fix, not yet proven live. Do not assume content rendering is repaired. Leave this theme deployment/testing for the user's next desktop session unless specifically requested.
- No need to repeat OAuth setup unless the token expires or GitHub Actions starts failing.

## November 1, 2026: standalone hosted calculators (preferred)
- Functional calculator embed source is built by `python scripts/build_embed.py` from `src/embed_template.html`, `src/styles.css`, `src/app.js`, `src/calculators.js`. It generates `docs/embed.html`.
- GitHub Pages should be configured **once** under Settings → Pages → Deploy from branch: `main` and folder `/docs`. Until enabled and verified, the hosted embed URL is not confirmed live.
- Hosted calculator URL: `https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool=roas` (or `margin`, `dpi`).
- PR #4 replaces the three existing Blogger page calculator placeholder divs with accessible iframe embeds. **Do not merge until GitHub Pages is enabled and the embed URL works.** After merge, Blogger Pages GitHub Action deploys the three pages automatically.
- For *future calculator changes*, edit source files and regenerate `docs/embed.html`; GitHub Pages publishes updated `docs` assets upon approved merge. Updates to known Blogger page text still auto-deploy via Blogger API. For a **new tool** you must update registry, Blogger page, navigation links, and embed generator; do not assume new page discovery automatically.
- Live Blogger theme is a working Contempo-based ToolPivio V2 applied manually; the repository's old theme generator `scripts/build.py` and `dist/toolpivio.xml` are **not** that live theme. Do not upload old dist XML or call it the current live template. Preserve the working Blogger appearance until source is synced.


## VERIFIED LIVE STATUS — 2026-11-01 (supersedes earlier pending warnings)
- User confirmed in live Blogger screenshots that all THREE calculators work: ROAS 5000/1000 = 5× (500%), Profit Margin 100/60 = 40 (40%), and Print DPI 3000×2400 at 10×8 inches = 300 PPI. User also tested Reset for all three.
- The GitHub Pages calculator host at `https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool=roas` is LIVE; `margin` and `dpi` variants are embedded into Blogger Pages. PR #4 has MERGED. Blogger GitHub Actions run #6 succeeded and updated all three Blogger pages.
- Google OAuth project was switched to IN PRODUCTION, a new OAuth token was generated locally and the encrypted GitHub Actions secret `BLOGGER_AUTH_JSON` was renewed; do not handle or reveal secrets.
- The currently LIVE Blogger theme is **ToolPivio_Restored_Design_v2.xml**, a working Contempo-based design. The repo's generated `dist/toolpivio.xml` is an outdated, problematic custom theme and MUST NOT be applied to Blogger or treated as the live theme. The earlier page-body blank issue was resolved using the current Contempo-based theme; avoid resurrecting PR #3.
- CURRENT quirks: some Blogger calculator pages repeat the headline inside the iframe; the DPI iframe has an internal scrollbar. These are UI polish items only. Preserve functionality during any cleanup.
- Working content pipeline: edit an existing `pages/*.html` -> PR -> merge to `main` -> GitHub Actions validates and updates only changed Blogger Pages. Calculator code pipeline: edit `src/calculators.js`, `src/app.js`, `src/styles.css` and/or `src/embed_template.html`; run `python scripts/build_embed.py` to regenerate `docs/embed.html`; commit both source and generated file; PR -> merge -> GitHub Pages serves new calculator code. GitHub Actions validates generated asset. No theme upload needed for these kinds of changes.
- For NEW calculators, implement the calculator host, update registry `tools/blogger_publish.py`, and create the Blogger page, but do NOT claim Blogger navigation/homepage cards update automatically: those are still in the live theme, whose sources have not yet been synchronized into GitHub.
- Recommended Codex method: choose this repo, base `main`, read AGENTS.md, make a single bounded task with tests, then create a PR without self-merging. Owner reviews/merges; website updates via relevant pipeline. Cloud Codex can work without owner's PC.
