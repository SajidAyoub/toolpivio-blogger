# ToolPivio V4 release report

Prepared November 2, 2026. Changes remain on feature branches; no PR was auto-merged and no production theme was installed.

## PRs and order

Review and merge [#9 cards](https://github.com/SajidAyoub/toolpivio-blogger/pull/9) → [#10 banners](https://github.com/SajidAyoub/toolpivio-blogger/pull/10) → [#11 contact](https://github.com/SajidAyoub/toolpivio-blogger/pull/11) → [#12 SEO/release](https://github.com/SajidAyoub/toolpivio-blogger/pull/12), using **Create a merge commit**. All target `main` with preserved shared ancestry. Later PRs include preceding phases until they merge; focused comparison links are in their descriptions.

## Completed work

- Preserved the existing light V3 branding, hero, navigation, layout and nineteen functional tools. All cards are full semantic links with one focus target, a real SVG-arrow Open Tool CTA, subtle teal strokes/shadows, distinct ghost illustrations, visible focus/touch states and reduced-motion support. Static and dynamic catalogs use the same metadata and correct links.
- Added 23 original lightweight SVG illustrations, named descriptions and content hashes. Nineteen tools and About, Contact, Privacy and Terms receive compact navy/teal banners with stable image dimensions, useful copy, related-tool panels and return CTAs. Blogger body files add no H1 or head metadata; the native theme remains responsible for them.
- Built the configurable Formspree workspace, including required fields, consent, limits, honeypot, duplicate protection, loading, provider rejection and acceptance states, no-JS provider POST when configured, and secure iframe sizing. Empty configuration offers a local draft and Copy/Clear only. Privacy/About/Terms distinguish contact data processing from local tool files.
- Retained the three established Blogger and sixteen hosted-guide canonical policy and canonical-only hosted sitemap. Added catalog Open Graph metadata, homepage social-description fallback, focused useful FAQs, SEO validation and the owner indexing checklist. No invented ratings, reviews, rankings, SearchAction endpoint or performance score.
- Generated `releases/ToolPivio_V4_Ready_For_Blogger.xml` while preserving the native Blog1 renderer, installed V3 release reference, root V2 reference and obsolete dist XML. OAuth configuration and Blogger selective publishing/429 retry code are unchanged.

## Verification

Build, repeated generated-output consistency, four Node suites, 22 Python tests, all 23 registered sources and seven Chromium suites passed locally. Browser coverage includes fourteen numerical tools, real image/PDF outputs and independent PDF parsing, all nineteen built guides, static/dynamic/no-JS cards, all banners, five responsive widths and intercepted contact responses. Contact iframe sizing rejects forged origin/window messages. No contact email was sent. Selected CI screenshots distinguish the real inactive page from explicitly named configured test fixtures.

Details and evidence limits are in [VALIDATION.md](VALIDATION.md). The original calculator and image/PDF implementation files and built runtime remain unchanged.

## Deploy and roll back

Follow [V4_INSTALL.md](V4_INSTALL.md): merge the PRs in order after their checks pass, confirm GitHub Pages uses `main:/docs`, wait for Pages and selective registered-body publishing, and inspect returned URLs. Back up the working live V3 theme in Blogger, download the final approved V4 release XML, then manually use **Theme → Restore → Upload**. Never upload `dist/toolpivio.xml`. Test home/card navigation, About, all established calculators, mobile banners, iframe fitting, Reset and file downloads.

For rollback, restore the downloaded V3 theme backup separately in Blogger. Use a reviewed revert PR for hosted assets and registered page bodies; a code revert neither restores an installed theme nor deletes a Blogger page.

## Owner actions still required

1. Create/activate Formspree, verify the intended Gmail recipient and configure the public endpoint. Set account-side validation/spam/domain rules supported by the chosen plan. Rebuild/deploy through a reviewed configuration PR and verify a real test arrives in Gmail inbox or spam before claiming delivery. [CONTACT_EMAIL_SETUP.md](CONTACT_EMAIL_SETUP.md) gives eight exact steps; no Gmail password or private key is needed.
2. Inspect public Blogger/Pages output, returned newer Blogger permalinks and cross-host canonical behavior. Live host access was unavailable in this environment. Preserve current links until evidence supports a reviewed canonical migration.
3. Set Blogger Search Descriptions, verify the separate Search Console URL-prefix properties, submit only accessible valid sitemaps and inspect indexing/Google-selected canonicals. Measure actual mobile performance after deployment. Use [SEO_V4_OWNER_CHECKLIST.md](SEO_V4_OWNER_CHECKLIST.md); no account connection, indexing or ranking is claimed.
