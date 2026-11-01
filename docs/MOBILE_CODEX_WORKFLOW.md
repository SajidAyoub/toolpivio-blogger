# ToolPivio — Codex on Desktop or Mobile

## What is ready (verified November 1, 2026)
- Codex connected to GitHub repo `SajidAyoub/toolpivio-blogger`; select existing Cloud environment and branch `main`.
- GitHub Pages hosts functioning calculators: ROAS, Profit Margin, Print DPI.
- GitHub Actions + Blogger API + renewed Production OAuth deploy changed existing Blogger pages after an approved PR is merged to `main`.
- The live Blogger theme was uploaded separately from local XML and is `ToolPivio_Restored_Design_v2.xml` at repository root. **Do not use old generated `dist/toolpivio.xml`.**
- Read `AGENTS.md` and `docs/CODEX_SITE_MASTER_PLAN.md` for current instructions.

## Mobile
1. Open https://chatgpt.com/codex with your ChatGPT account or supported mobile interface.
2. Select Cloud environment for `toolpivio-blogger`, base `main`.
3. Paste a bounded task command: "Read AGENTS.md and docs/CODEX_SITE_MASTER_PLAN.md. Do Phase A only: improve V2 theme into V3 with original hero SVG, responsive UI, functional category catalog, and calculator iframe UI polish. Preserve native Blogger widget. Run tests. Make a PR to main. Do NOT merge or call the theme live; give manual theme upload steps."
4. Review files/checks in PR. If approved, merge. Calculator source/Page HTML approved merges deploy using their respective GitHub pipeline. The theme XML must still be uploaded separately from Blogger Theme dashboard.

## Restrictions and known issues
- Cloud environment must be selected. Codex tasks running locally on your PC will not continue if the machine shuts down.
- New Blogger page titles/slugs and GitHub Actions allowlist must be registered; do not assume new files automatically publish.
- Avoid repeated heading and internal scrollbar in existing iframe pages, but preserve working calculations.
- Do not paste `secrets/token.json`, `secrets/oauth_client.json`, any client secret, authorization code, or GitHub Actions secrets into chat.
- Any change to theme layout must be manually verified and installed; no theme upload in current Blogger API workflow.
- Google Search Console property verification and some SEO settings need the owner's manual actions.

## Links
- [Codex Cloud](https://chatgpt.com/codex)
- [GitHub repository](https://github.com/SajidAyoub/toolpivio-blogger)
- [Open PRs](https://github.com/SajidAyoub/toolpivio-blogger/pulls)
- [GitHub Actions publishing](https://github.com/SajidAyoub/toolpivio-blogger/actions/workflows/blogger-pages.yml)
- [ToolPivio Blogger](https://toolpivio.blogspot.com/)
