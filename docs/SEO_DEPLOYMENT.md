# ToolPivio SEO and indexing release

This release provides crawlable tool guides, useful formulas and examples, unique descriptions, canonical links and truthful application structured data. It does not establish that Google has crawled, indexed or ranked any page. The owner reviews and merges the PRs; none are auto-merged and no theme is uploaded by this work.

## Audit evidence and limits

Audit date: November 1, 2026. The audit covers repository source and locally generated pages. Requests to the public Blogger and GitHub Pages URLs were unsuccessful in the execution environment; live HTML, current response codes, robots behavior, Search Console, indexing status and field performance remain unverified. The owner's previously verified three calculator examples are preserved in automated tests; this is not a new live-site verification.

| Area | Source finding and release behavior | Live check after deployment |
| --- | --- | --- |
| Blogger rendering | The restored Contempo `Blog1` renderer remains the trusted renderer. Body files contain no additional `h1`. | Open About and all three established calculator URLs; check that the page body and title render. |
| Titles | Each hosted guide has its tool name and ToolPivio in the title, with one visible `h1`. The Blogger homepage has an explicit tool-oriented title. Static Pages receive one main heading outside the unchanged Blog1 widget; its duplicate native title is hidden only on static Pages. | Inspect each rendered title and main heading, including About. |
| Descriptions | Hosted guides have unique descriptions from `src/seo.json`. The theme supplies missing descriptions for the three verified calculator addresses only; a configured Blogger Search Description takes precedence. New Blogger pages require their own Search Description setting. | Inspect rendered `<head>`; ensure a single description rather than duplicate tags. |
| Canonical | Established calculators use their existing Blogger URLs as canonical. New tool guides use their GitHub Pages paths. The native Blogger head include remains the sole theme canonical source. | Inspect one canonical per document, including Blogger mobile URLs such as `?m=1`. |
| Duplicate surfaces | Query-string calculator runtime stays `noindex,follow`; crawlable guides carry explanations. Hosted aliases for the three established tools point canonically to Blogger. The hosted catalog points canonically to Blogger's homepage. | Confirm Pages serves the runtime with its robots meta tag intact and that canonical targets load. |
| Structured data | Hosted guides describe a real free `SoftwareApplication`. Existing Blogger tool bodies also have application data using their established URLs. No review, rating, rank, download count or unsupported author claim is included. | Run Rich Results Test and Schema Markup Validator. A valid SoftwareApplication is not a promise of a Google rich result. |
| Internal links | Catalog entries link to known Blogger pages or generated hosted tool paths. Related links use canonical guide URLs. New Blogger permalinks are withheld until the publisher returns and the owner verifies them. | Check navigation and all new links after the publish workflow completes. |
| Mobile and accessibility | Generated guides use responsive typography, a skip link, labeled breadcrumbs, titled iframes, keyboard focus styles and responsive iframe sizing. | Test 360px mobile, keyboard navigation, large text and a real mobile browser; inspect the outer Blogger theme too. |
| Performance | Guides are static HTML with system fonts, CSS and a small iframe-resize listener. Processing libraries remain in the runtime, loaded only where required by the tool build. No live Lighthouse score is claimed. | Run mobile Lighthouse/PageSpeed Insights on the final Blogger and hosted URLs and address actual findings. |

## Content sources and reproducible build

- `src/tools.json`, `src/new-tools.json` and `src/file-tools.json` list actual available tools.
- `src/seo.json` supplies descriptions, usage instructions, explanations and useful questions. Formula, example and limitation fields come from each manifest unless explicitly overridden.
- `python3 scripts/build_seo.py` builds all hosted guides, the hosted sitemap and new Blogger bodies. It intentionally does not overwrite the three established Blogger bodies.
- `python3 scripts/build_seo.py --existing-blogger` also rebuilds the three established Blogger bodies. Review those changes as page content updates before merging.
- `python3 scripts/validate_seo.py` checks output headings, unique descriptions, canonical URLs, schema, local link targets, iframe sources and sitemap scope. `npm test` includes this validation through the SEO test.
- `docs/BLOGGER_SEARCH_DESCRIPTIONS.md` lists exact text to enter in Blogger's Search Description fields. These are owner settings, not an API deployment claim.

Do not put canonical tags, document titles or description meta tags into a Blogger page body. The native theme controls its `<head>`. Do not replace or remove the Contempo `all-head-content` include.

## Owner deployment and verification

1. Review the design, tools and SEO PRs and merge in their documented dependency order. Merging recognized `pages/*.html` updates triggers the existing selective Blogger publisher. GitHub Pages publishes generated assets from `main:/docs`. Check both Actions results; merging code is not proof that a public URL works.
2. In GitHub Settings → Pages, confirm “Deploy from a branch”, branch `main`, folder `/docs`. Verify `https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool=roas`, then the new tool guides linked from the hosted catalog. Each needs a calculation or processing action and Reset check.
3. Download a backup in Blogger → Theme. Upload only `releases/ToolPivio_V3_Ready_For_Blogger.xml` following `docs/V3_INSTALL.md`. Never upload `dist/toolpivio.xml`. This is a separate manual action; GitHub and the Blogger Pages API do not install themes.
4. Verify the established URLs below, including page bodies, direct-open links, Calculate and Reset:
   - `https://toolpivio.blogspot.com/p/roas-calculator.html`: 5,000 revenue / 1,000 spend → 5× and 500%.
   - `https://toolpivio.blogspot.com/p/profit-margin-calculator.html`: 100 revenue, 60 cost → 40 profit and 40% margin.
   - `https://toolpivio.blogspot.com/p/print-dpi-calculator.html`: 3,000 × 2,400 pixels at 10 × 8 inches → 300 PPI on both axes.
   - `https://toolpivio.blogspot.com/p/about.html`: content must be visible.
5. In Blogger Settings → Privacy, enable “Visible to search engines” if public indexing is intended. Under Meta tags, enable a site Search Description and write a concise homepage description. For established and newly verified pages, open Pages → the page → Search Description and use the release descriptions. Preserve each established page title so the registered publisher can identify it reliably.
6. Review every returned “Published URL” or “Updated URL” in the page-publisher Actions log. Open the new Blogger URLs to confirm actual slugs and behavior. A suggested permalink in the registry is not a verified live address. Keep the catalog on hosted guides until these checks pass.
7. If the owner chooses a verified Blogger page as a new tool's primary address, add its actual full URL as `canonical` under that tool's entry in `src/seo.json`, update the verified catalog URL mapping, rebuild the SEO files, and review a follow-up PR. The hosted guide will then canonicalize to Blogger and disappear from the hosted sitemap. Avoid publishing two competing primary copies.
8. Inspect rendered source for one title, one description, one canonical and the intended structured data. Check a new numeric tool, each file-tool mode and the old three calculators on mobile. Downloads must work inside the Blogger iframe.

## Google Search Console and sitemaps

These are account actions for the owner; the repository cannot prove property ownership or submit a private indexing request.

1. Add a URL-prefix Search Console property for `https://toolpivio.blogspot.com/`. Use a verification method offered for the signed-in Blogger owner. If a verification meta tag is required, add the exact provided token to the theme in a reviewed change; do not invent one. The repository does not contain a Search Console token.
2. Add a separate URL-prefix property for `https://sajidayoub.github.io/toolpivio-blogger/` if the hosted tool guides should be monitored. Use Search Console's HTML-file verification when offered: add the exact supplied verification file at the `docs/` root through a reviewed PR, wait for Pages deployment, then click Verify. This project cannot set a site-wide DNS record for `github.io`.
3. First open each public sitemap and confirm it returns XML successfully. For Blogger, try `https://toolpivio.blogspot.com/sitemap.xml`; also inspect `https://toolpivio.blogspot.com/sitemap-pages.xml` for static Pages. Submit only endpoints that actually return a valid sitemap for this blog. The execution environment did not verify these endpoints.
4. For the Pages property, submit `https://sajidayoub.github.io/toolpivio-blogger/sitemap.xml`. The generated sitemap includes only new hosted tool guides that are their own canonical URL. Existing calculator aliases are deliberately excluded. No unverified Blogger address is added.
5. Use URL Inspection on the homepage, an established calculator and one new canonical tool guide. Compare the user-declared canonical with Google's chosen canonical, confirm indexing is permitted, then request indexing when appropriate. Requests do not guarantee inclusion or a schedule.
6. Recheck Page Indexing, Crawl Stats where available, sitemap processing and Core Web Vitals after Google has had time to collect data. Use real errors and search data to prioritize follow-up work; do not infer rankings from valid markup.

GitHub Pages project sites do not control `https://sajidayoub.github.io/robots.txt` from this repository. Do not claim that a project-level `docs/robots.txt` controls the entire host. The `embed.html` robots meta tag and document canonical links apply at the document level.

## Rollback

Revert the relevant content/runtime commit through a reviewed PR to restore prior generated files; merging recognized page reverts republishes those bodies. Restore the downloaded Blogger theme backup separately if the manual V3 upload causes a regression. A code revert cannot remove a newly created Blogger Page: review new-page visibility or deletion in Blogger manually and keep verified links in sync. Preserve all OAuth credentials and existing page URLs during rollback.
