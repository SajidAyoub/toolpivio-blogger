# Release validation

## Completed locally

- `npm run build`: deterministic self-contained XML and standalone preview.
- Six Node test cases: ROAS and margin examples, break-even, losses, zero revenue where permitted, decimal/string amounts, inch/cm conversion, unequal print axes, empty/whitespace/missing/negative/nonnumeric/infinite values, zero divisors, fractional pixels, invalid units, and numeric overflow.
- XML parsed successfully with Python ElementTree; Blogger namespaces, skin, Blog widget, expected Page links, and embedded JavaScript syntax checked. Theme is below 100 KB.
- Chromium with Playwright: search, category filters, empty state, all three calculator results, missing-value errors, clearing stale results, reset, and no horizontal overflow at 360, 768, and 1440 px. No browser JavaScript exceptions. Desktop preview visually reviewed.
- All source and assets are local. No runtime API requests or external font/image dependencies.

## Required Blogger staging checks

Local preview does not emulate Blogger's server rendering. Before approving live deployment:

- Import XML on a test blog. Confirm Blogger accepts template expressions and provides the Blog widget's inherited comment includables.
- Create all seven Pages, confirm generated paths, and verify each navigation/footer/tool link returns the correct Page.
- Confirm the HTML editor retains `data-tool` markers and the theme script mounts exactly one calculator per tool Page. Test examples, invalid values, reset, unit selection, keyboard focus, and announcements with a screen reader.
- Confirm Contact comments work with the chosen Blogger settings; verify moderation and Google account requirements. The theme cannot supply private messaging without a real contact channel.
- Confirm homepage-only catalog, Page titles/body, 404, custom-domain HTTPS, mobile `?m=1`, and landscape/tablet layouts.
- Inspect rendered HTML for one main H1 per tool Page, canonical URL, description, title, and valid structured data. Validate with Google's Rich Results Test; Organization markup need not produce a rich result.
- Run Lighthouse and manual keyboard/screen-reader checks on the actual blog. No accessibility conformance or performance score is claimed from local checks.
- Check generated Blogger scripts/cookies and align policy/consent behavior with actual settings.

## Scope and limitations

Three working calculators; the five category filters intentionally include categories with no released tools. No image upload, PDF processing, video calculator, accounts, analytics, ads, payment, or private contact backend is advertised. Print DPI reports effective image PPI, not physical printer dot resolution. Binary floating point and two-decimal display rounding apply; these are planning tools, not accounting-grade decimal arithmetic.

The standalone preview combines homepage and tool bodies for review. Its root-relative Blogger links are intentionally tested after installation, not by opening the preview file. XML validation establishes well-formedness, not acceptance by Blogger. No live Blogger publication is part of this phase.
