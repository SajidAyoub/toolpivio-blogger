#!/usr/bin/env python3
"""ToolPivio Blogger Pages publisher. Preview by default; no theme uploads."""
import argparse
import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse

from page_registry import expected_url, load_registry, read_page_files

ROOT = Path(__file__).resolve().parent.parent
SECRET_DIR = ROOT / "secrets"
CLIENT_FILE = SECRET_DIR / "oauth_client.json"
TOKEN_FILE = SECRET_DIR / "token.json"
SCOPES = ["https://www.googleapis.com/auth/blogger"]
BLOG_URL = "https://toolpivio.blogspot.com/"
PAGES = [(p["title"], p["file"], p["expected_path"], p.get("tool")) for p in load_registry()]


def load_auth(interactive=False):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

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


def execute_with_rate_limit_retry(request, max_attempts=5):
    """Retry transient Blogger quota throttling without retrying other HTTP failures."""
    for attempt in range(max_attempts):
        try:
            return request.execute()
        except Exception as error:
            status = getattr(getattr(error, "resp", None), "status", None)
            if status != 429 or attempt == max_attempts - 1:
                raise
            seconds = min(30 * (2 ** attempt), 120)
            print(f"Google Blogger 429 rate limit: pausing {seconds}s before retry "
                  f"{attempt + 2}/{max_attempts}", flush=True)
            time.sleep(seconds)


def sync_pages(service, blog_id, new_pages, apply=False, replace_existing=False,
               write_interval_seconds=0):
    """Publish an already validated set. Theme and navigation are never modified."""
    known = {}
    for p in existing_pages(service, blog_id):
        known.setdefault(p["title"].strip().casefold(), []).append(p)
    plan = []
    for title, html, expected_path, filename in new_pages:
        found = known.get(title.casefold(), [])
        if len(found) > 1:
            raise SystemExit(f"Safety stop: duplicate existing pages named {title!r}")
        if found and not expected_url(found[0].get("url", ""), expected_path):
            raise SystemExit(f"Safety stop: existing page URL does not match registration for {filename}")
        plan.append((title, html, expected_path, found[0] if found else None))
    last_write_time = None
    for title, html, expected_path, page in plan:
        if page:
            print(f"{'UPDATE' if replace_existing else 'SKIP EXISTING'}: {title}")
            if apply and replace_existing:
                if last_write_time is not None and write_interval_seconds:
                    time.sleep(max(0, write_interval_seconds - (time.monotonic() - last_write_time)))
                result = execute_with_rate_limit_retry(service.pages().patch(
                    blogId=blog_id, pageId=page["id"],
                    body={"title": title, "content": html}
                ))
                last_write_time = time.monotonic()
                print("Updated URL:", result.get("url"))
        else:
            print(f"{'CREATE' if apply else 'WOULD CREATE'}: {title}")
            if apply:
                if last_write_time is not None and write_interval_seconds:
                    time.sleep(max(0, write_interval_seconds - (time.monotonic() - last_write_time)))
                result = execute_with_rate_limit_retry(service.pages().insert(
                    blogId=blog_id, isDraft=False,
                    body={"title": title, "content": html}
                ))
                last_write_time = time.monotonic()
                print("Published URL:", result.get("url"))
                if not expected_url(result.get("url", ""), expected_path):
                    print("URL VERIFICATION REQUIRED: registration expected", expected_path)
                    print("Keep hosted tool navigation until the returned Blogger URL is verified.")
    if not apply:
        print("PREVIEW ONLY: No live pages changed. Use --apply to publish.")

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
    try:
        new_pages = read_page_files(args.only_file)
    except (ValueError, OSError) as error:
        raise SystemExit(str(error)) from None
    from googleapiclient.discovery import build
    service = build("blogger", "v3", credentials=load_auth(), cache_discovery=False)
    blog = service.blogs().getByUrl(url=args.blog_url).execute()
    if urlparse(args.blog_url).hostname != urlparse(blog.get("url", "")).hostname:
        raise SystemExit("Safety stop: Google returned a different blog hostname")
    blog_id = blog["id"]
    print(f"Target blog: {blog.get('name')} — {blog.get('url')}")
    # Spread Blogger writes across time to avoid quota bursts. No delay for preview.
    sync_pages(service, blog_id, new_pages, args.apply, args.replace_existing,
               write_interval_seconds=15 if args.apply else 0)



if __name__ == "__main__":
    main()
