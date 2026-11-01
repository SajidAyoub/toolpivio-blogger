"""Offline registry and publishing-boundary tests; never contacts Google."""
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import page_registry
import blogger_publish


class RegistryTests(unittest.TestCase):
    def test_registry_and_selective_existing_pages(self):
        registry = page_registry.load_registry()
        self.assertGreaterEqual(len(registry), 7)
        pages = page_registry.read_page_files(["pages/roas.html"])
        self.assertEqual(len(pages), 1)
        self.assertEqual(pages[0][0], "ROAS Calculator")
        with self.assertRaisesRegex(ValueError, "Unrecognized"):
            page_registry.read_page_files(["pages/injected.html"])

    def test_all_tool_metadata_has_explicit_registration(self):
        registry = {entry.get("tool"): entry for entry in page_registry.load_registry() if entry.get("tool")}
        for filename in ["src/new-tools.json", "src/file-tools.json"]:
            if not (ROOT / filename).exists():
                continue
            for tool in json.loads((ROOT / filename).read_text()):
                self.assertEqual(registry[tool["id"]]["title"], tool["title"])
                self.assertEqual(registry[tool["id"]]["file"], f"pages/{tool['id']}.html")
                self.assertFalse(registry[tool["id"]]["url_verified"])

    def test_embeds_are_parsed_and_origin_is_exact(self):
        for source, valid in [
            ('<iframe title="ROAS" src="https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool=roas&amp;v=3"></iframe>', True),
            ('<iframe title="ROAS" src="https://sajidayoub.github.io.evil.test/toolpivio-blogger/embed.html?tool=roas"></iframe>', False),
            ('<iframe title="ROAS" src="https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool=margin"></iframe>', False),
            ('<iframe src="https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool=roas"></iframe>', False),
            ('<div data-tool="roas"></div>', True),
        ]:
            parser = page_registry.ToolMarkers("roas")
            parser.feed(source)
            self.assertEqual(parser.valid, valid, source)

    def test_duplicate_and_unsafe_registration_rejected(self):
        entry = {"title":"A", "file":"pages/a.html", "expected_path":"/p/a.html"}
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "tools").mkdir()
            target = root / "tools/page_registry.json"
            target.write_text(json.dumps([entry, entry]))
            with self.assertRaisesRegex(ValueError, "Duplicate"):
                page_registry.load_registry(root)
            target.write_text(json.dumps([{**entry, "file":"pages/../private.html"}]))
            with self.assertRaisesRegex(ValueError, "Unsafe"):
                page_registry.load_registry(root)

    def test_expected_url_matches_host_and_path(self):
        self.assertTrue(page_registry.expected_url("https://toolpivio.blogspot.com/p/about.html", "/p/about.html"))
        self.assertFalse(page_registry.expected_url("https://toolpivio.blogspot.com.evil.test/p/about.html", "/p/about.html"))
        self.assertFalse(page_registry.expected_url("https://toolpivio.blogspot.com/p/other.html", "/p/about.html"))


class PublisherTests(unittest.TestCase):
    pages = [("ROAS Calculator", "<p>body</p>", "/p/roas-calculator.html", "pages/roas.html")]
    existing = [{"id":"existing", "title":"ROAS Calculator", "url":"https://toolpivio.blogspot.com/p/roas-calculator.html"}]

    def run_sync(self, existing, apply=False, replace=False):
        service = MagicMock()
        service.pages().insert().execute.return_value = {"url":"https://toolpivio.blogspot.com/p/roas-calculator.html"}
        service.reset_mock()
        with patch.object(blogger_publish, "existing_pages", return_value=existing), contextlib.redirect_stdout(io.StringIO()):
            blogger_publish.sync_pages(service, "blog", self.pages, apply, replace)
        return service

    def test_preview_has_no_writes(self):
        service = self.run_sync([])
        service.pages.assert_not_called()

    def test_existing_skipped_without_replace(self):
        service = self.run_sync(self.existing, True)
        service.pages.assert_not_called()

    def test_selected_existing_patched_only(self):
        service = self.run_sync(self.existing, True, True)
        service.pages().patch.assert_called_once_with(blogId="blog", pageId="existing", body={"title":"ROAS Calculator","content":"<p>body</p>"})
        service.pages().insert.assert_not_called()

    def test_missing_created_only_with_apply(self):
        service = self.run_sync([], True)
        service.pages().insert.assert_called_once()
        service.pages().patch.assert_not_called()

    def test_duplicate_or_wrong_url_stops_before_write(self):
        for existing in [self.existing * 2, [{**self.existing[0], "url":"https://toolpivio.blogspot.com/p/unrelated.html"}]]:
            with self.assertRaises(SystemExit):
                self.run_sync(existing, True, True)

    def test_preflight_stops_all_writes_if_later_page_is_ambiguous(self):
        service = MagicMock()
        pages = self.pages + [("Other", "body", "/p/other.html", "pages/other.html")]
        existing = self.existing + [{"title":"Other", "id":"duplicate1"}, {"title":"Other", "id":"duplicate2"}]
        with patch.object(blogger_publish, "existing_pages", return_value=existing), self.assertRaises(SystemExit):
            blogger_publish.sync_pages(service, "blog", pages, True, True)
        service.pages.assert_not_called()

    def test_existing_pages_fetches_live_draft_and_pagination(self):
        service = MagicMock()
        service.pages().list().execute.side_effect = [{"items":[{"id":"1"}],"nextPageToken":"next"},{"items":[{"id":"2"}]},{"items":[{"id":"3"}]}]
        service.reset_mock()
        self.assertEqual([p["id"] for p in blogger_publish.existing_pages(service,"blog")], ["1","2","3"])
        self.assertEqual(service.pages().list.call_count, 3)


if __name__ == "__main__":
    unittest.main()
