# Install ToolPivio on Blogger

Do not replace the live theme until you approve deployment. First use a separate free test blog.

1. In Blogger, select the intended **test blog**. In **Theme**, open the menu next to Customize and choose **Backup → Download**. Also use **Settings → Manage blog → Back up content**. Retain both backups.
2. In **Theme → Restore → Upload**, select `dist/toolpivio.xml`. If Blogger rejects the XML, retain its exact message and restore the backup; XML parsing alone cannot validate Blogger's importer.
3. In **Settings**, set the title to **ToolPivio** and description to **Smart Tools. Simple Solutions.** Enable HTTPS redirect. Disable the separate mobile theme, if offered, so this responsive theme serves mobile visitors too.
4. Create each Page below through **Pages → New page**. Set its title, switch the editor to **HTML view**, and paste only the matching file's contents. Do not paste the theme into a Page. Do not add a second H1: the theme renders the Page title.

| Page title | Paste file | Expected path |
| --- | --- | --- |
| ROAS Calculator | `pages/roas.html` | `/p/roas-calculator.html` |
| Profit Margin Calculator | `pages/profit-margin.html` | `/p/profit-margin-calculator.html` |
| Print DPI Calculator | `pages/print-dpi.html` | `/p/print-dpi-calculator.html` |
| About | `pages/about.html` | `/p/about.html` |
| Contact | `pages/contact.html` | `/p/contact.html` |
| Privacy Policy | `pages/privacy-policy.html` | `/p/privacy-policy.html` |
| Terms | `pages/terms.html` | `/p/terms.html` |

5. Publish these Pages on the **test blog**, then inspect each actual URL. Blogger generates Page slugs and may suffix duplicates. The calculator markers (`data-tool="roas"`, `"margin"`, `"dpi"`) must remain intact in HTML view. All executable JavaScript is already in the theme.
6. If a generated URL differs, update its links in `scripts/build.py` (header, footer, or tool-card generator), run `npm run build && npm test`, and upload the rebuilt XML. Keep root-relative `/p/...` paths; these also work with a later custom domain. Search the generated XML for each old path to confirm replacement. Do not invent Pages or leave navigation targeting unpublished URLs.
7. For Contact, enable reader comments in the Page options and **Settings → Comments**. Choose a supported comment location and moderation policy; verify that the comment interface is visible and accepts a test comment. Contact uses Blogger comments, not a fake form or an invented email address. If public comments are unsuitable, replace the Contact body with your real contact method before launch and update the privacy text. Do not claim a private inbox exists.
8. Enable **Settings → Meta tags → Enable search description**. Add an accurate search description to each Page. Suggested descriptions appear below. The theme uses Blogger's `all-head-content` for platform metadata and canonical links; inspect the rendered source for duplicate descriptions after import, since Blogger settings affect this output.
9. Complete the staging checklist in `VALIDATION.md`. After approval, repeat the backup and upload process on the live blog and create or verify all seven Pages. Uploading a theme does not create Pages automatically.

## Search descriptions

- ROAS: Calculate return on ad spend from attributed revenue and advertising costs. Includes the ROAS formula and a worked example.
- Profit Margin: Calculate profit and profit margin from revenue and costs. Understand negative margins and the difference between margin and markup.
- Print DPI: Estimate image resolution in PPI from pixel dimensions and print size in inches or centimeters, with a worked example.

The homepage includes a description and Organization structured data. Page titles and Blogger canonical metadata use the platform's data fields. No fabricated ratings or review markup are included. Submit Blogger's `/sitemap.xml` through your own Search Console account once the approved site is public. Verify indexing settings; do not add blanket noindex rules to the production site. Keep test blogs private or excluded from indexing.

## Rollback

Restore the downloaded original theme using Theme → Restore. Page bodies are separate content: recover them from your content backup if they were changed. Remove test-only Pages manually only after checking their contents and URLs. Theme restoration does not undo Page edits.

## Policy content

Review the supplied Privacy Policy and Terms for your actual operation, location, and additions. They currently describe this release's browser-only calculations and Blogger hosting/comments. Adding ads, analytics, external forms, or new data collection requires corresponding policy and consent review. No banner is included because the theme itself adds no tracking; Blogger or later integrations may require additional handling.
