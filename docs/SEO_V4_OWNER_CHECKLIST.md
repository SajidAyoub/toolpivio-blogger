# V4 SEO audit and owner checklist

This audit covers repository source and locally generated documents on November 2, 2026. It does not report live response codes, indexing, Google-selected canonicals, rankings, Search Console access or field performance. The owner confirmed V3 installation, a homepage with nineteen cards and successful use of most tools; that is separate from this source audit. Read the current production override in `AGENTS.md` before interpreting historical V2/V3 installation notes.

## Source findings

| Area | Evidence and intended behavior | Owner verification still required |
| --- | --- | --- |
| Canonical policy | `scripts/build_seo.py` and `src/seo.json` retain nineteen intended tool primaries: the three established Blogger calculator addresses and sixteen self-canonical hosted guides. Hosted aliases of the established calculators point to Blogger. | Check one intended canonical in the rendered head, including `?m=1` Blogger URLs, and confirm its destination loads. |
| Published Blogger copies | The registry marks the sixteen additional Blogger permalinks `url_verified: false`. The V4 brief says publishing succeeded, but actual returned URLs have not been recorded as verified in the repository. Their native Blogger head may declare a Blogger self-canonical while the hosted guide is also self-canonical. | Inspect each actual published URL and its head. Resolve cross-host duplicate-primary signals in a reviewed follow-up once the URLs are verified; do not assume nineteen unique sitewide canonicals are proven. |
| Titles and descriptions | Each of nineteen hosted guides has one title, one description and one H1. Descriptions are unique. Blogger owns document head tags; page bodies do not add title/meta/canonical tags or H1s. The three established pages have conditional description fallbacks in the theme. | Set Blogger Search Descriptions and inspect rendered head for duplicates after manual theme installation. |
| Open Graph | Hosted guides provide title, description, site name, type and canonical URL. V4 adds equivalent metadata to the hosted catalog and a Blogger homepage description fallback. | Check shared-link metadata from public source. A crawler may cache an earlier version. No social-image preview or rich result is promised. |
| Structured data | Guides describe actual free `SoftwareApplication` tools with their intended canonical URLs. The homepage describes ToolPivio as a WebSite/Organization. No ratings, reviews, awards or ranking claims are supplied. | Validate deployed output with Schema Markup Validator and Google Rich Results Test. Eligibility is not a promise of a rich result. |
| Search | Homepage search and category filters operate in the browser; they do not provide a public query-search landing endpoint. No `SearchAction` is declared. | Check filtering with JavaScript enabled, and usable static tool links when its enhancement asset fails. |
| Internal links | Each guide links to at least one real tool in its category. Related links use canonical documents, not runtime query strings. Breadcrumbs and back-to-tools links aid navigation. | Check all nineteen tool targets, keyboard navigation and related links after deployment. Keep new Blogger paths out of navigation until verified. |
| Discovery | `docs/sitemap.xml` contains exactly sixteen unique hosted canonical guide URLs. The three hosted aliases, catalog alias, runtime and unverified Blogger paths are excluded. `embed.html` retains `noindex,follow`. | Fetch both sites' actual sitemaps and inspect robots behavior. Indexable guides must not accidentally inherit `noindex`. |
| Content | Tool guides already include definitions, steps, formulas or processing explanations, worked examples and limitations. V4 adds focused answers about video size units, exact compression limits and PDF image fitting/transparency. | Review whether explanations match actual output; avoid adding repetitive FAQs just to increase word count. |
| Performance and access | Guides are static HTML with local system fonts; processing stays in the iframe runtime. SVG artwork has no remote image dependency. Numeric/file behavior is checked separately by automated browser suites. | Measure mobile Lighthouse/PageSpeed on public URLs. Check real devices, 200% text size, focus, contrast, iframe fitting and page-body rendering. No Core Web Vitals score or accessibility-conformance claim follows from source checks. |

Do not change the canonical policy merely because a Blogger publish action is green. If a verified Blogger copy becomes the preferred primary, make a separate reviewed change that updates its true URL in SEO metadata and catalog mapping, rebuilds aliases and removes the hosted URL from the hosted sitemap. Keep native Blogger head ownership and preserve established URLs.

## Blogger settings and rendered-page checks — owner only

1. Under Blogger **Settings → Privacy**, confirm **Visible to search engines** matches the site's intended public status. Do not enable custom robots settings as a routine release step.
2. Under **Settings → Meta tags**, enable a Search Description and enter a concise homepage description covering the real tools. In **Pages → selected page → Search Description**, use [BLOGGER_SEARCH_DESCRIPTIONS.md](BLOGGER_SEARCH_DESCRIPTIONS.md) for tool-specific text. Preserve registered page titles.
3. After the reviewed V4 upload, inspect **View page source**, including a phone URL with `?m=1`. Confirm one intended title, description, canonical and visible main H1. Inspect About, Contact and one calculator so Blogger's native page renderer is exercised.
4. Open the actual URLs printed in the selective publisher's `Published URL` or `Updated URL` logs. Verify the sixteen new page paths before changing registry verification flags or navigation. A successful API response does not prove that a canonical target was chosen correctly.
5. Confirm the public hosted guides show their useful explanations without JavaScript. The interactive runtime needs JavaScript and should remain `noindex,follow`; the guide itself should remain eligible for indexing.

## Search Console — two separate URL-prefix properties

These authenticated account actions belong to the owner. No account is connected or verified by this repository.

1. Add the URL-prefix property **`https://toolpivio.blogspot.com/`**. Use the verification method offered to the signed-in Blogger owner. If Google supplies a verification meta tag, add that exact tag to the theme through a reviewed change; do not invent or reuse a token.
2. Add the URL-prefix property **`https://sajidayoub.github.io/toolpivio-blogger/`** for the hosted canonical guides. If Google offers HTML-file verification, add the exact verification file under `docs/`, merge the reviewed PR, wait for Pages deployment and then click Verify. The project does not own DNS for the `github.io` host.
3. Open `https://toolpivio.blogspot.com/sitemap.xml` and `https://toolpivio.blogspot.com/sitemap-pages.xml`. Submit only URLs that actually return valid sitemaps for this blog. The Pages sitemap is a separate file: `https://sajidayoub.github.io/toolpivio-blogger/sitemap.xml`; submit it in the Pages property.
4. Inspect `https://toolpivio.blogspot.com/robots.txt` and the robots meta of sample deployed pages. A project file at `docs/robots.txt` would not control `https://sajidayoub.github.io/robots.txt`; do not claim project-wide robots control from that path.
5. In URL Inspection, check the homepage, an established Blogger calculator and one hosted canonical guide. Compare user-declared and Google-selected canonical, indexing eligibility and live fetch status. Request indexing only when appropriate; requests do not guarantee inclusion or a timeline.
6. Monitor sitemap processing, Page Indexing, Search Performance and Core Web Vitals when data becomes available. Investigate actual errors rather than promising rankings or AdSense acceptance.

## Local release checks

Run `npm run build`, `npm test`, `npm run test:browser` and `python3 scripts/validate_v4_seo.py` after integration. The V4 SEO audit checks canonical/OG consistency, nineteen guides, sixteen sitemap entries, category links, breadcrumbs, truthful schema and Blogger head ownership. It supports the existing V3 output while V4 is being assembled; V4 theme/catalog checks activate once its release XML exists. These checks are local evidence, not production or Google-account verification.

Installation and rollback are in [V4_INSTALL.md](V4_INSTALL.md). Contact delivery requires its own activated form endpoint and a real Gmail receipt check; see [CONTACT_EMAIL_SETUP.md](CONTACT_EMAIL_SETUP.md).
