# ToolPivio — Codex Website Development Master Plan
Updated: 2026-11-01

## Objective
Upgrade https://toolpivio.blogspot.com/ into a visually polished, fully usable, SEO-friendly, mobile-first collection of free calculators and lightweight image/PDF utilities. Keep costs at zero except existing owner accounts/services. This is a production website, not a mockup.

## Source of truth: understand the TWO separate deployment tracks
1. **Live Blogger theme**: the working Contempo-based `ToolPivio_Restored_Design_v2.xml` uploaded at repository root. This file (not `dist/toolpivio.xml`) is the current reference. Preserve the native Contempo Blog1 page-rendering widget and all necessary Blogger XML namespaces, `b:skin`, `b:section`, and data bindings. The earlier custom theme in `dist/toolpivio.xml` caused blank Pages and must NOT be installed.
2. **Live calculator runtime**: `docs/embed.html` served by GitHub Pages from `main:/docs`; its source is `src/embed_template.html`, `src/calculators.js`, `src/app.js`, `src/styles.css`. Rebuild with `python scripts/build_embed.py` and commit generated file. Current hosted tools: `?tool=roas`, `?tool=margin`, `?tool=dpi`.
3. **Blogger SEO page content**: `pages/*.html` managed with `tools/blogger_publish.py`, the GitHub Actions encrypted `BLOGGER_AUTH_JSON` secret, and the workflow `.github/workflows/blogger-pages.yml`. Editing existing registered pages and merging PR to main deploys changed pages. Creating NEW pages needs explicit registry/workflow updates and returned URL verification.
4. **Theme deployment limitation**: Blogger v3 API used here supports pages/posts, not theme XML. Export improved theme XML to a dedicated release file and provide simple manual Theme → Backup → Restore → Upload instructions. No claims of full automatic theme deployment. Avoid overwriting live theme until owner has approved a verified build.
5. **Known live status**: on 2026-11-01 all three existing calculators' Calculate and Reset features were verified on Blogger. ROAS 5000/1000 = 5×, margin (100 - 60) /100 = 40%, print 3000×2400 at 10×8in = 300 PPI. Preserve these.

## Workstreams (execute in controlled phases, with tests and PRs)

### A. Design system and one-time theme upgrade
- Keep ToolPivio brand (navy #12283e, teal #087f75, white, pale green/gray), professional modern SaaS design, responsive cards and typography.
- Improve home hero, attractive **original** graphic/banner (SVG/CSS gradients and shapes), clear tool categories, category icons, search/filter behavior, CTA to each working tool, consistent nav/footer.
- User may supply/generate additional raster illustrations; do not embed copyrighted unlicensed photos or rely on unstable external hotlinks. SVG graphics can be authored directly by Codex.
- Create accessible mobile nav, helpful page breadcrumbs, empty-category states, focus labels, alt text where applicable; never advertise a tool that cannot actually run.
- Preserve existing Blogger native page content rendering, privacy/terms/about pages, and current live calculator URLs.
- Address duplicated calculator headings and DPI iframe's nested scrollbar without breaking functionality. Prefer avoiding large blank iframe areas. No layout shift.
- Implement an **updatable tool catalog** in the theme: ideally load a versioned JS asset from GitHub Pages to populate/extend homepage tool cards after the ONE necessary theme upload, with static fallback links and sensible progressive enhancement; do not assume runtime JS alone fixes SEO.
- Theme output: `releases/ToolPivio_V3_Ready_For_Blogger.xml` or equivalent; include an installation and rollback note. Run XML parser checks and browser-preview tests; clearly mark live upload as pending.

### B. Actually working utilities by category
Each tool must show labels, validation, sample values, useful results, Reset, plain-English formulas/help, responsive UI, and real browser behavior. Add unit tests for calculations or browser tests for file tools. Prefer client-side processing without paid APIs. Never present placeholders as ready.
Suggested priorities:
1. Digital marketing: ROAS (existing), CPC, CPM, CTR, CPA.
2. E-commerce: Profit Margin (existing), Markup, Discount/Sale Price, Break-even Units.
3. Packaging/print: Print PPI (existing), Bleed/Trim Size, mm–in–px size converter (explain DPI/PPI).
4. Video: Video File Size/Bitrate Estimator, Frames/Duration Converter.
5. Image/PDF: Image Resize & JPG/PNG/WebP Conversion via browser Canvas, Image Compression with quality preview; PDF Merge and Images-to-PDF only when a suitable open-source library is bundled with license, browser-tested, and user-facing limitations noted.
Don't attempt 15 complex tools in one untested code change. Prioritize stable deliverables and label the rest as backlog.

### C. Content and SEO
- Conduct honest SEO audit of existing live URLs, headings, meta/title behavior, Search Description, indexability, page duplication, navigational links, mobile performance. Don't claim Search Console or live Search stats without user connection.
- Add unique user-oriented descriptions for each real tool: purpose, when to use, worked example, input units, limitations, FAQs only where useful; avoid generic keyword stuffing or mass-generated near-duplicate pages.
- Add valid canonical URLs and structured data (WebSite/Organization or SoftwareApplication only where attributes are true); do not invent reviews, ratings, screenshots, download counts, awards, authors, or pricing.
- Ensure accessible labels, alt attributes, Open Graph tags when compatible, internal links and search-friendly paths. Blogger often controls canonical/head tags—inspect rendered output and avoid duplicate canonical/meta.
- Plan Google Search Console property verification, sitemap submission and indexing checks as separate owner actions. Ranking/AdSense approval are not guaranteed.
- Never put sensitive OAuth client secrets, tokens or account data in code or public docs.

### D. Deployment and verification
- Validate current three calculator URLs first and after each change.
- Development PR on a feature branch targeting `main`; tests must pass; owner reviews and merges. Do NOT auto-merge or directly change the live Blogger Theme.
- New page: add a known `pages/*.html`, register it with correct title/slug/hosted tool id, check workflow's allowed paths, publish with approved API action, read actual returned Blogger URL. Only then link it from theme/catalog. Avoid dead links.
- GitHub Pages runtime: after merger, use `docs/embed.html?tool=<id>` and verify functionality. Blogger API will update known pages if `pages/*.html` changed and workflow passes; generated theme XML still needs one manual install.
- Ensure the PR describes which changes auto-deploy, which require manual upload, proof of checks, and rollback instructions.
- If a feature depends on browser capabilities or needs a paid API, implement a clear supported subset and document the limitation rather than faking function.

## First Codex deliverable
Start by **auditing repo** and doing **Phase A**: preserve currently working theme, create polished V3 with hero graphic/clean layout, design system, remove iframe duplicate headings/scrollbar in appropriate source, prepare extensible catalog, and write concise release instructions. Then create a PR for owner review without merging. If in a single task you can safely add a few simple calculators and corresponding tests, place them in a separate PR or well-bounded commits, but do not compromise Phase A quality.

## Definition of Done
- Existing About content and three calculators still work.
- New graphics are original, design matches brand, responsive mobile/desktop.
- Calculators return tested correct examples and Reset works.
- Existing Blogger URLs do not break.
- HTML/XML validation, build and test pass; manual theme upload clearly identified.
- SEO claims are substantiated and no secret is exposed.
