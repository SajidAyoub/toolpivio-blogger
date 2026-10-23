# ToolPivio Blogger API OAuth setup

This adds automated Blogger **Page** publishing; it does not upload or update the Blogger XML theme.

## One-time setup on your Windows PC

1. Visit https://console.cloud.google.com/ and create/select a Google Cloud project called ToolPivio Blogger.
2. In **APIs & Services → Library**, enable **Blogger API v3**.
3. In **Google Auth platform → Branding/Audience**, configure OAuth consent. Use **External** if applicable, provide your support email, and add your own Google account as a test user while the app is in Testing.
4. In **Clients → Create client**, choose **Desktop app** and download its OAuth JSON.
5. Download/clone the repository branch `feat/toolpivio-v1`. Create a local `secrets` folder and save your downloaded client JSON as `secrets/oauth_client.json`. Do not share either this file or any token in chat.
6. Open Command Prompt in the repository folder and run:
   - `py -m pip install -r requirements-blogger.txt`
   - `py tools/blogger_publish.py auth`
   A Google consent window opens. Sign in with the owner/editor of toolpivio.blogspot.com and approve access. An ignored `secrets/token.json` is saved on your computer.
7. Preview page changes: `py tools/blogger_publish.py sync` (no changes).
8. Publish missing pages: `py tools/blogger_publish.py sync --apply`.
9. Only if deliberately updating already existing page titles: `py tools/blogger_publish.py sync --apply --replace-existing`.

The script verifies the target blog hostname, reads existing live/draft page titles, refuses ambiguous duplicate titles, and skips existing titles by default. After publishing, verify actual page URLs match the links in the XML theme. The Blogger API might create different slugs.

## Optional GitHub Actions publisher

After **local OAuth** succeeds, in GitHub open **Settings → Secrets and variables → Actions**. Add secret `BLOGGER_AUTH_JSON` with the complete JSON from **your local secrets/token.json**, pasted only into the encrypted secret field. Do not commit, upload, paste in chat, or send to Codex. Merge the PR to make the workflow appear on the main branch. In **Actions → Publish ToolPivio Blogger Pages**, manually trigger mode `preview` or `apply`. Mode `replace` overwrites matching titles; back up pages first.

**Security:** This OAuth scope grants Blogger content management access. GitHub Actions secrets are readable by authorized workflows. A Google OAuth External/Testing refresh token can expire after seven days; the connection may require reauthorization. Revoking the token in your Google Account stops further access. No credentials have been created or shared as part of this code change.

**Limitations:** Google Cloud OAuth configuration and initial Google login require user action. Neither Codex's GitHub connection nor the GitHub PR itself authenticates to Blogger. The installed Blogger theme must be edited separately. The API publisher does not handle Blogger theme changes.
