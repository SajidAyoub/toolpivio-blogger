# ToolPivio

Smart Tools. Simple Solutions.

A zero-runtime-dependency Blogger theme with ROAS, profit margin, and print resolution calculators. All calculations run locally. No paid APIs, accounts, external fonts, analytics, or backend are required by the theme.

## Files

- `src/`: shared calculator formulas, UI behavior, styles, and tool metadata.
- `scripts/build.py`: deterministic Blogger XML and standalone preview generator.
- `dist/toolpivio.xml`: uploadable theme.
- `dist/preview.html`: local design and interaction preview, with all three calculators on one page. Its Blogger links require an installed blog.
- `pages/`: seven ready-to-paste Blogger Page bodies; no inline JavaScript.
- `tests/`: automated formula and invalid-input checks.
- `scripts/validate.py`: XML, template structure, embedded JavaScript, size, and link checks.
- `scripts/browser-smoke.cjs`: optional Playwright interaction and layout smoke test.
- `.github/workflows/validate.yml`: dependency-free build and formula checks.
- `docs/INSTALL.md`: installation, URL mapping, SEO, and rollback.
- `docs/VALIDATION.md`: results and outstanding live checks.

## Develop

Use Node 22+ and Python 3. No npm install is necessary for the required checks:

```sh
npm run build
npm test
```

Edit source files, then rebuild and commit both source and `dist/`. Formula tests import the same implementation bundled in the theme. Optional browser smoke testing needs Playwright and Chromium installed in your development environment; it is not a website dependency.

Read [installation instructions](docs/INSTALL.md) before uploading. This release is ready for Blogger staging acceptance; Blogger import and live rendering cannot be certified from local XML validation alone. No live Blogger changes have been made.
