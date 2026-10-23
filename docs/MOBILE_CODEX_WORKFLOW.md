# ToolPivio — Mobile Codex workflow

You can use your existing Cloud environment from the ChatGPT mobile app's Codex area (if visible in your account) or https://chatgpt.com/codex in a mobile browser. Sign in to the same ChatGPT account. Select **Cloud** and **toolpivio-blogger**; select base branch **main**. No Windows PC is required for a cloud task.

## Start a task
Sample command to paste into Codex:

> Work on SajidAyoub/toolpivio-blogger, using main as base. Read AGENTS.md first. Improve the existing ROAS Calculator page's explanatory content, keeping its data-tool marker unchanged. Validate relevant files. Create a pull request targeting main. Do not modify the theme and do not merge on my behalf. Return the PR link.

## Approve and publish from phone
1. Review the Codex PR and changed files in the GitHub mobile app or browser.
2. Merge to **main** if approved.
3. For modified known `pages/*.html`, GitHub Actions automatically runs **Publish ToolPivio Blogger Pages**, validates source, then updates only affected pages using the stored encrypted `BLOGGER_AUTH_JSON` secret.
4. Check the GitHub Actions run. If red, read logs and ask Codex to fix; do not share token values.
5. Page content visibility is currently a separate outstanding theme issue; green Actions only proves that the API operation completed.

## Important limits
- Theme layout, CSS, calculator runtime, site header/footer: Codex may prepare PRs from phone, but **Blogger theme deployment remains manual** (the Blogger API doesn't expose XML theme deployment in this setup).
- New tool pages require changes to page registry, navigation and/or calculator runtime; no claims of one-click publishing until that process has been configured and verified.
- GitHub PR #3 is an unverified Blogger theme page-body rendering repair awaiting a desktop session.
- If the phone cannot show Codex Cloud, use https://chatgpt.com/codex in your mobile browser with the same signed-in account. Availability of UI entry points can vary.
- Don't send `secrets/oauth_client.json`, `secrets/token.json`, or GitHub Actions secret into Codex prompts or chats.

## Useful links
- Repo: https://github.com/SajidAyoub/toolpivio-blogger
- Codex: https://chatgpt.com/codex
- PRs: https://github.com/SajidAyoub/toolpivio-blogger/pulls
- Actions: https://github.com/SajidAyoub/toolpivio-blogger/actions/workflows/blogger-pages.yml
- Live website: https://toolpivio.blogspot.com/
- Unverified Blogger theme fix: https://github.com/SajidAyoub/toolpivio-blogger/pull/3
