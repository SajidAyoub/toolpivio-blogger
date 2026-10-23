#!/usr/bin/env python3
"""ToolPivio Blogger Pages publisher. Preview by default; no theme uploads."""
import argparse
import json
import os
from pathlib import Path
from urllib.parse import urlparse

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

ROOT = Path(__file__).resolve().parent.parent
SECRET_DIR = ROOT / "secrets"
CLIENT_FILE = SECRET_DIR / "oauth_client.json"
TOKEN_FILE = SECRET_DIR / "token.json"
SCOPES = ["https://www.googleapis.com/auth/blogger"]
BLOG_URL = "https://toolpivio.blogspot.com/"
PAGES = [
    ("ROAS Calculator", "pages/roas.html", "/p/roas-calculator.html", "roas"),
    ("Profit Margin Calculator", "pages/profit-margin.html", "/p/profit-margin-calculator.html", "margin"),
    ("Print DPI Calculator", "pages/print-dpi.html", "/p/print-dpi-calculator.html", "dpi"),
    ("About", "pages/about.html", "/p/about.html", None),
    ("Contact", "pages/contact.html", "/p/contact.html", None),
    ("Privacy Policy", "pages/privacy-policy.html", "/p/privacy-policy.html", None),
    ("Terms", "pages/terms.html", "/p/terms.html", None),
]


def load_auth(interactive=False):
    raw = os.environ.get("BLOGGER_AUTH_JSON")
    if raw:
        credentials = Credentials.from_authorized_user_info(json.loads(raw), SCOPES)
    elif TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    elif interactive:
        if not CLIENT_FILE.exists():
            raise SystemExit("Save Google Desktop OAuth client JSON as secrets/oauth_client.json")
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_FILE), SCOPES)
        credentials = flow.run_local_server(host="localhost", port=0, open_browser=True)
    else:
        raise SystemExit("Not authorized. Run: py tools/blogger_publish.py auth")

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
    if not credentials.valid:
        raise SystemExit("Google authorization is invalid/expired. Re-run auth on your PC.")
    if not raw:
        SECRET_DIR.mkdir(parents=True, exist_ok=True)
        TOKEN_FILE.write_text(credentials.to_json(), encoding="utf-8")
        try:
            TOKEN_FILE.chmod(0o600)
        except OSError:
            pass
    return credentials


def read_page_files():
    pages = []
    for title, filename, expected_path, marker in PAGES:
        html = (ROOT / filename).read_text(encoding="utf-8").strip()
        if not html:
            raise SystemExit(f"Empty page: {filename}")
        if marker and f'data-tool="{marker}"' not in html:
            raise SystemExit(f"Missing calculator marker in {filename}")
        pages.append((title, html, expected_path, filename))
    return pages


def existing_pages(service, blog_id):
    pages = []
    for status in ("LIVE", "DRAFT"):
        token = None
        while True:
            result = service.pages().list(
                blogId=blog_id, status=status, maxResults=100,
                fetchBodies=False, pageToken=token
            ).execute()
            pages.extend(result.get("items", []))
            token = result.get("nextPageToken")
            if not token:
                break
    return pages


def main():
    parser = argparse.ArgumentParser(description="Blogger API page publisher")
    parser.add_argument("command", choices=["auth", "sync"])
    parser.add_argument("--apply", action="store_true", help="Create missing pages")
    parser.add_argument("--replace-existing", action="store_true", help="Update matching pages")
    parser.add_argument("--blog-url", default=BLOG_URL)
    parser.add_argument("--only-file", action="append", default=[], help="Sync only this known pages/*.html source; repeatable")
    args = parser.parse_args()
    if args.replace_existing and not args.apply:
        parser.error("--replace-existing requires --apply")
    if args.command == "auth":
        load_auth(interactive=True)
        print("OAuth complete. Token saved locally (ignored by Git).")
        return
    new_pages = read_page_files()
    if args.only_file:
        allowed = {item[1] for item in PAGES}
        unknown = set(args.only_file) - allowed
        if unknown:
            raise SystemExit(f"Unrecognized page filename(s): {sorted(unknown)}")
        new_pages = [page for page in new_pages if page[3] in set(args.only_file)]
    service = build("blogger", "v3", credentials=load_auth(), cache_discovery=False)
    blog = service.blogs().getByUrl(url=args.blog_url).execute()
    if urlparse(args.blog_url).hostname != urlparse(blog.get("url", "")).hostname:
        raise SystemExit("Safety stop: Google returned a different blog hostname")
    blog_id = blog["id"]
    print(f"Target blog: {blog.get('name')} — {blog.get('url')}")
    known = {}
    for p in existing_pages(service, blog_id):
        known.setdefault(p["title"].strip().casefold(), []).append(p)
    for title, html, expected_path, filename in new_pages:
        found = known.get(title.casefold(), [])
        if len(found) > 1:
            raise SystemExit(f"Safety stop: duplicate existing pages named {title!r}")
        if found:
            page = found[0]
            print(f"{'UPDATE' if args.replace_existing else 'SKIP EXISTING'}: {title}")
            if args.apply and args.replace_existing:
                result = service.pages().patch(
                    blogId=blog_id, pageId=page["id"],
                    body={"title": title, "content": html}
                ).execute()
                print("Updated URL:", result.get("url"))
        else:
            print(f"{'CREATE' if args.apply else 'WOULD CREATE'}: {title}")
            if args.apply:
                result = service.pages().insert(
                    blogId=blog_id, isDraft=False,
                    body={"title": title, "content": html}
                ).execute()
                print("Published URL:", result.get("url"))
                if urlparse(result.get("url", "")).path != expected_path:
                    print("WARNING: Different URL from theme link:", expected_path)
    if not args.apply:
        print("PREVIEW ONLY: No live pages changed. Use --apply to publish.")


if __name__ == "__main__":
    main()
