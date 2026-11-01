# V3 validation evidence

Checks run locally on November 1, 2026. Production Blogger/GitHub Pages access was blocked by the execution environment, so none of these checks establish live deployment or indexing.

- `npm run build`: deterministic V3 release XML, hosted runtime/catalog, nineteen guides, sixteen new Blogger bodies and canonical-only sitemap. A second build leaves generated files clean.
- `npm test`: original and extended formula/validation suites; SEO output checks; twelve mocked publisher tests; all twenty-three registered Blogger sources validate without Google credentials or writes.
- XML parser and embedded JavaScript checks pass. The entire native `Blog1` subtree matches the restored working V2 reference. Root V2 and the historical `dist/toolpivio.xml` are untouched. The installable release is `releases/ToolPivio_V3_Ready_For_Blogger.xml`.
- V3 browser checks: search, category filtering, empty state, catalog URL validation, mobile menu/Escape, visually hidden duplicate embed headings, unknown-tool handling, iframe resizing with foreign-origin rejection and a native-class About visibility fixture.
- Numeric browser checks: all fourteen numeric tools, worked examples, Enter submission, missing/negative input errors, stale-result clearing, Reset and alternate units/modes. Original examples remain ROAS 5×/500%, margin 40%, and print 300 PPI.
- File browser checks: real PNG/JPG/WebP outputs, dimensions/aspect ratio, transparency/white JPEG background, quality controls, preview/download, invalid/corrupt/oversized inputs, Reset and samples. PDF creation/merge page content and order are independently parsed with pypdf; encrypted inputs are rejected.
- Integration browser checks: all nineteen generated guide documents load their actual built iframe runtime, calculate/process samples and Reset. PDF assets load locally. Canonical and heading counts, catalog links, no unexpected external requests and no page exceptions are checked.
- Browser suites cover 360, 768 and 1440 px layouts. Desktop/mobile screenshots were visually reviewed. No Lighthouse score or accessibility-conformance claim is inferred from these tests.

## Remaining owner checks

Review and merge the three PRs in order using **Create a merge commit** to preserve their shared ancestry. Wait for Pages and the selective Blogger publisher. Inspect the actual returned new-page URLs; expected paths remain provisional until verified. Check each new tool at its public hosted URL, including an image/PDF download.

Back up the current Blogger theme, install only the approved V3 release XML manually, then check About, all three established URLs, mobile layout, keyboard navigation, iframe fitting and Reset. Local fixtures do not emulate Blogger's server-side renderer.

Inspect the rendered `<head>` for one intended title, description and canonical, including mobile query URLs. Run structured-data and mobile performance checks on deployed pages. Complete the Search Console verification, sitemap and indexing steps in [SEO_DEPLOYMENT.md](SEO_DEPLOYMENT.md). No account verification, search ranking, new Blogger URL or public deployment has been assumed.

Supported file formats, processing limits and PDF limitations are listed in [FILE_TOOLS.md](FILE_TOOLS.md). See [V3_INSTALL.md](V3_INSTALL.md) and [TOOLS_DEPLOYMENT.md](TOOLS_DEPLOYMENT.md) for installation and separate theme/runtime/content rollback.
