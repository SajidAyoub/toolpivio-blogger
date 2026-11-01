"""Regression checks for V4 page components and preserved published tool contracts."""
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build_info import INFO_PAGES, render_info_body, render_info_hosted, source_content
from build_seo import HOST, ROOT, load_tools
from visuals import ASSET_ROOT, load_visuals, render_banner


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def matching(self, name, key=None, value=None):
        return [attrs for tag, attrs in self.tags if tag == name and (key is None or attrs.get(key) == value)]


class BannerTests(unittest.TestCase):
    def test_all_tools_and_information_pages_have_distinct_cache_safe_artwork(self):
        visuals = load_visuals()
        expected = {tool['id'] for tool in load_tools()} | set(INFO_PAGES)
        self.assertEqual(set(visuals), expected)
        hashes = []
        for page_id, item in visuals.items():
            artwork = ROOT / 'src/v4/artwork' / item['artwork']
            digest = sha256(artwork.read_bytes()).hexdigest()[:12]
            hashes.append(digest)
            self.assertEqual(item['asset_url'], ASSET_ROOT + page_id + '.' + digest + '.svg')
            self.assertTrue((ROOT / 'docs/assets/v4' / item['asset_name']).is_file(), page_id)
            self.assertGreater(len(item['description']), 15, page_id)
        self.assertEqual(len(set(hashes)), len(expected), 'Every banner must have its own purposeful artwork')

    def test_blogger_body_contracts_and_hosted_headings_remain_intact(self):
        for tool in load_tools():
            with self.subTest(tool=tool['id']):
                body = Document((ROOT / tool['blogger_file']).read_text(encoding='utf-8'))
                self.assertEqual(len(body.matching('div', 'data-page-banner', tool['id'])), 1)
                self.assertFalse(body.matching('h1'))
                self.assertFalse(body.matching('meta'))
                self.assertFalse(body.matching('title'))
                self.assertFalse(body.matching('link', 'rel', 'canonical'))
                frame = body.matching('iframe')
                self.assertEqual(len(frame), 1)
                self.assertEqual(frame[0]['src'], HOST + '/embed.html?tool=' + tool['id'])
                self.assertEqual(frame[0]['sandbox'], 'allow-scripts allow-forms allow-same-origin allow-downloads')
                self.assertFalse('scrolling' in frame[0], 'Do not hide a broken nested scrollbar')
                self.assertEqual(len(body.matching('nav', 'aria-label', 'More from ToolPivio')), 1)
                hosted = Document((ROOT / 'docs/tools' / (tool['id'] + '.html')).read_text(encoding='utf-8'))
                self.assertEqual(len(hosted.matching('h1')), 1)
                self.assertEqual(len(hosted.matching('div', 'data-page-banner', tool['id'])), 1)
                self.assertEqual(hosted.matching('link', 'rel', 'canonical')[0]['href'], tool['canonical'])

    def test_information_content_is_static_and_source_text_is_preserved(self):
        for page_id in INFO_PAGES:
            with self.subTest(page=page_id):
                body_source = render_info_body(page_id)
                self.assertIn(source_content(page_id), body_source)
                self.assertFalse(Document(body_source).matching('h1'))
                body = Document((ROOT / 'pages' / (page_id + '.html')).read_text(encoding='utf-8'))
                self.assertEqual(len(body.matching('div', 'data-page-banner', page_id)), 1)
                self.assertFalse(body.matching('h1'))
                # Contact is replaced by the reviewed form build in the next phase.
                if page_id != 'contact':
                    self.assertIn(source_content(page_id), (ROOT / 'pages' / (page_id + '.html')).read_text(encoding='utf-8'))
                hosted = Document((ROOT / 'docs/info' / (page_id + '.html')).read_text(encoding='utf-8'))
                self.assertEqual(len(hosted.matching('h1')), 1)
                self.assertEqual(hosted.matching('link', 'rel', 'canonical')[0]['href'], 'https://toolpivio.blogspot.com/p/' + page_id + '.html')

    def test_banner_heading_api_rejects_unreviewed_markup(self):
        with self.assertRaises(ValueError):
            render_banner('roas', title_tag='script')
        sample = Document(render_info_hosted('contact', content='<p>Static fallback.</p>', relative_prefix='', head_extra='<meta name="robots" content="noindex,follow">'))
        self.assertEqual(len(sample.matching('h1')), 1)
        self.assertEqual(sample.matching('meta', 'name', 'robots')[0]['content'], 'noindex,follow')
        self.assertEqual(sample.matching('link', 'rel', 'canonical')[0]['href'], 'https://toolpivio.blogspot.com/p/contact.html')


if __name__ == '__main__':
    unittest.main()
