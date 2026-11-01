> **CURRENT PRODUCTION OVERRIDE (Nov 2026):** Owner installed V3 on live Blogger and reviewed homepage showing 19 cards. Read `docs/CODEX_V4_PREMIUM_UPGRADE.md` for the next V4 development task. References below describing V2 as the LIVE theme are historical; V2 remains the stable Contempo base used to generate V3/V4. Preserve the current V3 live site, native Blog1 widget, active URLs, working tools and existing deployment pipelines. Fix raw `&#8594;` card arrows and build a truthful functioning contact integration as detailed in V4 brief. Do not auto-merge V4 PRs or claim contact email is configured without real verification.\n\n# ToolPivio — Codex Project Rules

**Read `docs/CODEX_SITE_MASTER_PLAN.md` before making design, tool, content, SEO, or publishing changes.**

## Production state, verified 2026-11-01
- Live blog: https://toolpivio.blogspot.com/
- GitHub repo: SajidAyoub/toolpivio-blogger, branch `main`.
- The owner tested three Blogger-embedded calculators (ROAS, Profit Margin, Print DPI) and each Calculate/Reset works correctly.
- OAuth credentials are held privately in GitHub Actions secret `BLOGGER_AUTH_JSON`. Never print, request in chat, commit, copy to PR, or change these credentials.
- The working Blogger design is the **root** `ToolPivio_Restored_Design_v2.xml` (Contempo-based, ~151 KB). It renders Blogger About and calculator pages. **Do NOT upload `dist/toolpivio.xml`**, the broken old generator output. Preserve the native Blogger `Blog1` widget structure. PR #3 for the old theme is closed and superseded.

## Architecture and deployment — do not conflate
1. **Calculator logic:** `src/calculators.js`, `src/app.js`, `src/styles.css`, `src/embed_template.html`. Run `python scripts/build_embed.py` to regenerate `docs/embed.html`. GitHub Pages hosts `main:/docs` at https://sajidayoub.github.io/toolpivio-blogger/.
2. **Existing Blogger pages:** `pages/*.html` deployed via `tools/blogger_publish.py` and `.github/workflows/blogger-pages.yml`. Merging approved updates to registered page files triggers a selective Blogger Pages sync. New pages require edits to BOTH the publisher registry and workflow allowlist, plus checking the real resulting Blogger URL before navigation links are added.
3. **Blogger theme:** `ToolPivio_Restored_Design_v2.xml` is the ONLY trusted source of current live theme. An improved XML file is produced for the owner to upload manually using Blogger Theme → Backup → Restore/Upload. Blogger API does NOT automatically install XML themes. Never change live Theme directly through GitHub and never describe theme changes as already live.
4. **SEO:** Codex can prepare content/meta/schema and audits, but Search Console verification, indexing requests, and other account settings may require owner actions; no ranking guarantees.
5. **Images:** Create original SVG/CSS hero artwork and icons in code; user-supplied/licensed raster assets may be added and optimized. Do not claim Codex can synthesize high-end product photos from code alone.

## Development process
- Use `main` as base. Create a focused feature branch and PR; NEVER auto-merge without owner's explicit instruction.
- Preserve working calculator result logic and reset functionality. ROAS: 5000/1000 => 5×/500%; margin: (100-60)/100 => 40%; Print PPI: 3000×2400 at 10×8 inches => 300 both axes.
- Current UI issues: duplicated headings inside the calculator iframe and DPI nested scrollbar. Fix without deleting SEO content, changing live URLs, or disabling calculators.
- Prefer progressive, working features to fake placeholders. Validate XML, HTML, JS and responsive behavior, keyboard use, and formulas. When changing calculator runtime, regenerate `docs/embed.html`.
- For each PR report: changed files, tests, screenshots or visual diffs where available, deployment path, and manual owner steps. Highlight any known limitations.
- Never include tokens, private data, invented testimonials/ratings or scraped images without rights. Use no paid API by default.

## Priorities
Follow `docs/CODEX_SITE_MASTER_PLAN.md`: (A) preserve working theme and design premium V3, original banner graphics, extensible catalog and UI fixes; (B) functioning tools in marketing/e-commerce/print/video/image/PDF categories; (C) user-focused SEO; (D) controlled production deployment.

## Mobile/Cloud tasks
Codex Cloud environment should use this repo; Cloud tasks do not need owner's Windows machine running. Instructions: `docs/MOBILE_CODEX_WORKFLOW.md`. Continue in one task for iterative changes; commit finished work. Owner approves GitHub PRs before any merge.
