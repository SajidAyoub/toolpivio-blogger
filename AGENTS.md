# ToolPivio — instructions for Codex (including mobile cloud tasks)

You are working on ToolPivio, a Blogger-hosted free-tools site.

## Repository and live deployment
- GitHub: SajidAyoub/toolpivio-blogger, default branch main.
- Live blog: https://toolpivio.blogspot.com/
- The Blogger API OAuth client, credentials and token are **not** in the repo. Never request them in chat, log them, commit them or upload them to a PR.
- A GitHub Actions workflow in .github/workflows/blogger-pages.yml automatically updates *changed, recognized* pages/*.html files after a change is merged/pushed to main and its validation passes.
- Existing pages: roas.html, profit-margin.html, print-dpi.html, about.html, contact.html, privacy-policy.html, terms.html. The publisher has an explicit registry in tools/blogger_publish.py. Adding a new file is **not** sufficient to deploy a new Page.
- Theme XML is generated from scripts/build.py and src/* into dist/toolpivio.xml. **Theme XML is not deployed via the Blogger API**. Theme changes need an explicit, separate Blogger HTML-editor upload.

## Standard workflow when the owner sends a command from mobile
1. Prefer Codex **Cloud** with this repository and base branch main; cloud tasks do not require the user's PC.
2. Read relevant source files and identify whether the request is PAGE CONTENT or THEME/TOOL CODE.
3. Make only changes necessary to the requested task. Never modify secrets, GitHub Actions authorization, or Blogger credentials.
4. For a page-only content update, modify an existing pages/*.html file, keep its calculator data-tool marker intact, and preserve the intended page title.
5. For theme/UI/calculator JavaScript changes, modify sources; run npm run build and npm test so generated dist output stays in sync. Clearly state that resulting theme change is **not live** until uploaded to Blogger.
6. Run the appropriate checks. Create a Pull Request targeting main. The owner reviews and merges it from phone; never auto-merge without being instructed.
7. Report PR URL and whether merging will trigger the Blogger Pages auto-publisher:
   - Changed recognized pages/*.html: Yes, after validation.
   - Only theme, scripts, styling, images, or docs: No.
   - New pages or tools: require registry, theme/navigation, and likely manual theme upload; do not claim fully automatic deployment.
8. If a change can break the site, note risk and preserve rollback instructions.

## Known issue as of October 24, 2026
- Blogger API publishing was verified by the user's CMD and GitHub Actions was green after PR #2, but live About page screenshot showed a blank page body beneath the header.
- PR #3 (fix/blogger-blog1-page-rendering) is a proposed theme fix, not yet proven live. Do not assume content rendering is repaired. Leave this theme deployment/testing for the user's next desktop session unless specifically requested.
- No need to repeat OAuth setup unless the token expires or GitHub Actions starts failing.
