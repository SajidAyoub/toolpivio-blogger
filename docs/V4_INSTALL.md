# ToolPivio V4 installation and rollback

The live baseline is the owner's working V3 Blogger theme. V4 is a reviewed upgrade; no PR merge installs a Blogger theme. The installable artifact is **`releases/ToolPivio_V4_Ready_For_Blogger.xml`**. Never upload historical `dist/toolpivio.xml` or replace the trusted root V2 reference.

## Review and merge order

Review [#9 cards](https://github.com/SajidAyoub/toolpivio-blogger/pull/9), [#10 banners](https://github.com/SajidAyoub/toolpivio-blogger/pull/10), [#11 contact](https://github.com/SajidAyoub/toolpivio-blogger/pull/11), and [#12 SEO/release](https://github.com/SajidAyoub/toolpivio-blogger/pull/12), in that order, using **Create a merge commit**. Do not enable automatic merging. All target `main`; later branches include the preceding phase so they can be tested as a complete build. The PR descriptions link to focused phase comparisons.

1. **Cards and V4 theme:** whole-card navigation, arrow rendering, nineteen original ghost visuals, focus/touch states and theme output.
2. **Page banners:** nineteen tool banners, four informational-page banners and related-tool presentation. Review generated Blogger body updates, including the explicit rebuild of the three established bodies.
3. **Contact and privacy:** configured integration code, truthful inactive contact state, consent/privacy wording and setup instructions. The source can merge before account activation; delivery remains unverified.
4. **SEO and release validation:** targeted helpful content, canonical/discovery checks, owner checklist and final installation evidence.

Before each merge, inspect passing checks and the current branch dependency. Wait for prior merges and deployment checks to finish. Preserve the existing authenticated selective page publisher and its HTTP 429 retry behavior; do not replace it with broad republishing or change OAuth credentials.

## Publish assets and page bodies

1. Verify GitHub **Settings → Pages → Deploy from a branch**, branch `main`, folder `/docs`. Wait for the Pages deployment associated with the final approved commit. Generated guides, runtime and catalog assets publish from that folder.
2. Changed, registered `pages/*.html` files are updated by **Publish ToolPivio Blogger Pages** after its validation passes. Inspect the Actions result and only the URLs actually returned by Blogger. A docs/theme-only merge does not trigger a Blogger body write. If throttled, allow the built-in retry to finish and investigate the final workflow result before retrying.
3. Check the public hosted catalog and all nineteen tool links. Run a numeric example and Reset, and produce/download an image and PDF. Check `embed.html?tool=roas`, `?tool=margin`, `?tool=dpi` directly. A green workflow is deployment evidence, not proof of every public interaction.
4. Review the published About, Contact, Privacy and Terms bodies and all nineteen tool banners. A page body must contain no extra H1/head/meta/canonical; the Blogger theme owns those document elements. Keep any fallback direct-open tool links available if iframe sizing fails.

The sixteen newer Blogger pages were reported published in the V4 brief, but their repository URL verification flags remain false. Keep their currently intended primary links on the generated hosted guides until actual returned Blogger URLs and canonical behavior are verified. Do not guess permalinks from titles.

## Back up V3 and manually install V4

1. In Blogger **Theme**, open the menu beside Customize → **Backup** and download the currently working V3 theme. Save it with its date separately from the V4 download.
2. From the final approved commit, download only **`releases/ToolPivio_V4_Ready_For_Blogger.xml`**. Confirm that it is the V4 artifact associated with the release checks, not the V3 release or `dist/toolpivio.xml`.
3. In Blogger **Theme → Restore → Upload**, select that V4 XML. This manual action changes the theme. GitHub Pages and the Blogger Pages API do not install XML themes.
4. Open the homepage at 360, 390, 768, 1024 and 1440 CSS pixels where practical. Check all nineteen cards: center, edge and CTA activation, Enter from keyboard focus, correct same-tab targets, teal border, readable ghost visual, proper arrow, touch behavior and reduced-motion preference. Test search, categories, counts, no-results reset and mobile navigation.
5. Open About to confirm native page-body rendering. Confirm the established addresses remain unchanged:
   - `https://toolpivio.blogspot.com/p/roas-calculator.html`: 5,000 / 1,000 → 5× and 500%.
   - `https://toolpivio.blogspot.com/p/profit-margin-calculator.html`: 100 revenue and 60 cost → 40 profit and 40% margin.
   - `https://toolpivio.blogspot.com/p/print-dpi-calculator.html`: 3,000 × 2,400 pixels at 10 × 8 inches → 300 PPI on both axes.
6. Test validation and Reset, mobile iframe fitting, direct-open fallback and local file downloads. Inspect a tool banner and each informational banner. Local previews cannot execute Blogger's server-side renderer, so these live checks remain necessary.
7. Complete [SEO_V4_OWNER_CHECKLIST.md](SEO_V4_OWNER_CHECKLIST.md), including rendered canonical/description checks and the separate Blogger/Pages Search Console properties.

## Contact activation is a separate owner action

`src/contact/config.json` stores the public Formspree endpoint. Its empty endpoint deliberately ships an inactive draft state with **Copy draft** and **Clear**, without a Send action. The owner has not supplied or activated a Formspree endpoint. Do not call contact delivery configured or functional yet.

Follow [CONTACT_EMAIL_SETUP.md](CONTACT_EMAIL_SETUP.md): create the form account, verify the intended Gmail recipient, add only the public `https://formspree.io/f/…` endpoint through a reviewed change, rebuild/publish and submit a real test. Confirm the message arrives in Gmail inbox or spam before declaring delivery verified. A provider's accepted response and the site's success state do not prove inbox delivery. Never provide Gmail passwords, OAuth tokens or private API keys in chat or source.

## Rollback by deployment track

- **Theme:** restore the downloaded working V3 backup in Blogger **Theme → Restore → Upload**. A GitHub revert does not restore an installed theme.
- **Hosted runtime/catalog/guides:** create and review a revert PR for the relevant change, merge it and wait for Pages deployment. Recheck canonical targets and downloads.
- **Blogger bodies:** a reviewed revert of changed registered page files triggers the selective publisher on merge. Keep retry behavior and existing page titles/URLs. Reverting source does not delete a Blogger Page already created; review any visibility/removal manually with links kept consistent.
- **Contact:** clear the public endpoint in a reviewed source change and publish the inactive draft state if the integration must be disabled. Preserve the provider account and private credentials.

Report the exact failed URL and behavior before broad retries. Do not restore historical broken `dist/toolpivio.xml`, recreate working pages, or expose credentials during recovery.
