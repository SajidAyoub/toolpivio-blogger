"""Public page registrations and offline validation. Contains no credentials."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
BLOG_ORIGIN = "https://toolpivio.blogspot.com"
EMBED_ORIGIN = "https://sajidayoub.github.io"
EMBED_PATH = "/toolpivio-blogger/embed.html"


def load_registry(root=ROOT):
    entries = json.loads((root / "tools/page_registry.json").read_text(encoding="utf-8"))
    seen_files, seen_titles, seen_paths = set(), set(), set()
    for entry in entries:
        filename, title, path = entry["file"], entry["title"], entry["expected_path"]
        if not filename.startswith("pages/") or not filename.endswith(".html") or ".." in filename:
            raise ValueError(f"Unsafe page filename: {filename}")
        if not title.strip() or not path.startswith("/p/") or not path.endswith(".html"):
            raise ValueError(f"Invalid page registration: {filename}")
        if filename in seen_files or title.casefold() in seen_titles or path in seen_paths:
            raise ValueError(f"Duplicate page registration: {filename}")
        seen_files.add(filename)
        seen_titles.add(title.casefold())
        seen_paths.add(path)
    return entries


class ToolMarkers(HTMLParser):
    def __init__(self, marker):
        super().__init__()
        self.marker = marker
        self.valid = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "div" and attrs.get("data-tool") == self.marker:
            self.valid = True
        if tag == "iframe":
            url = urlparse(attrs.get("src", ""))
            if (url.scheme == "https" and url.netloc == "sajidayoub.github.io"
                    and url.path == EMBED_PATH
                    and parse_qs(url.query).get("tool") == [self.marker]
                    and attrs.get("title", "").strip()):
                self.valid = True


def selected_registrations(only_files=None, root=ROOT):
    entries = load_registry(root)
    wanted = set(only_files or [])
    allowed = {entry["file"] for entry in entries}
    unknown = wanted - allowed
    if unknown:
        raise ValueError(f"Unrecognized page filename(s): {sorted(unknown)}")
    return [entry for entry in entries if not wanted or entry["file"] in wanted]


def read_page_files(only_files=None, root=ROOT):
    result = []
    for entry in selected_registrations(only_files, root):
        filename = entry["file"]
        content = (root / filename).read_text(encoding="utf-8").strip()
        if not content:
            raise ValueError(f"Empty page: {filename}")
        if entry.get("tool"):
            parser = ToolMarkers(entry["tool"])
            parser.feed(content)
            if not parser.valid:
                raise ValueError(f"Missing calculator marker or hosted iframe in {filename}")
        result.append((entry["title"], content, entry["expected_path"], filename))
    return result


def expected_url(url, expected_path):
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.netloc == "toolpivio.blogspot.com" and parsed.path == expected_path


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Validate registered Blogger sources without credentials")
    parser.add_argument("--only-file", action="append", default=[])
    args = parser.parse_args()
    pages = read_page_files(args.only_file)
    print(f"Validated {len(pages)} registered Blogger page sources; no API calls made.")
