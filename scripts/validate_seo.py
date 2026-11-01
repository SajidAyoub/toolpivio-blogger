#!/usr/bin/env python3
"""Check generated SEO documents as outputs, including canonical and link integrity."""
from html.parser import HTMLParser
from pathlib import Path
import json
import sys
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_seo import HOST, ROOT, load_tools


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.scripts = []
        self._json_script = False
        self._script_parts = []
        self.feed(source)
        self.close()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self._json_script = True
            self._script_parts = []

    def handle_endtag(self, tag):
        if tag == 'script' and self._json_script:
            self.scripts.append(json.loads(''.join(self._script_parts)))
            self._json_script = False

    def handle_data(self, data):
        if self._json_script:
            self._script_parts.append(data)

    def matching(self, tag, key=None, value=None):
        return [attrs for element, attrs in self.elements if element == tag and (key is None or attrs.get(key) == value)]


def check():
    records = load_tools()
    canonical_paths = set()
    descriptions = set()
    titles = set()
    for tool in records:
        path = ROOT / 'docs/tools' / (tool['id'] + '.html')
        source = path.read_text(encoding='utf-8')
        doc = Document(source)
        assert len(doc.matching('h1')) == 1, path
        assert len(doc.matching('title')) == 1, path
        canonical = doc.matching('link', 'rel', 'canonical')
        assert len(canonical) == 1 and canonical[0]['href'] == tool['canonical'], path
        meta = doc.matching('meta', 'name', 'description')
        assert len(meta) == 1 and meta[0].get('content') == tool['description'], path
        assert tool['description'] not in descriptions, f'Duplicate description: {path}'
        descriptions.add(tool['description'])
        assert tool['title'] not in titles, f'Duplicate title: {path}'
        titles.add(tool['title'])
        assert not doc.matching('meta', 'name', 'robots'), path
        assert len(doc.scripts) == 1, path
        application = doc.scripts[0]
        assert application['@type'] == 'SoftwareApplication' and application['url'] == tool['canonical'], path
        assert application['isAccessibleForFree'] is True and application['offers']['price'] == '0', path
        assert 'aggregateRating' not in application and 'review' not in application, path
        frame = doc.matching('iframe')
        assert len(frame) == 1 and frame[0]['src'] == '../embed.html?tool=' + tool['id'], path
        assert frame[0].get('title') == tool['title'], path
        for anchor in doc.matching('a'):
            href = anchor.get('href', '')
            parsed = urlparse(href)
            if parsed.netloc == 'sajidayoub.github.io' and parsed.path.startswith('/toolpivio-blogger/'):
                local = ROOT / 'docs' / parsed.path.removeprefix('/toolpivio-blogger/')
                assert local.exists(), f'Broken hosted link {href} in {path}'
            elif not parsed.scheme and parsed.path:
                assert (path.parent / parsed.path).resolve().exists(), f'Broken relative link {href} in {path}'
        blogger = Document((ROOT / tool['blogger_file']).read_text(encoding='utf-8'))
        assert not blogger.matching('h1'), tool['blogger_file']
        assert not blogger.matching('link', 'rel', 'canonical'), tool['blogger_file']
        embedded = blogger.matching('iframe')
        assert len(embedded) == 1 and embedded[0]['src'] == HOST + '/embed.html?tool=' + tool['id'], tool['blogger_file']
        if tool['id'] in {'image-resizer', 'image-compressor', 'image-converter', 'images-to-pdf', 'pdf-merge'}:
            assert 'allow-downloads' in embedded[0]['sandbox'], tool['blogger_file']
        expected = f'{HOST}/tools/{tool["id"]}.html'
        if tool['canonical'] == expected:
            canonical_paths.add(expected)
    tree = ET.parse(ROOT / 'docs/sitemap.xml')
    locations = [node.text for node in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    assert len(locations) == len(set(locations)), 'Duplicate sitemap URLs'
    assert set(locations) == canonical_paths, 'Sitemap must contain only hosted canonical guides'
    print(f'SEO: {len(records)} guides checked for headings, unique descriptions, canonical URLs, true schema, working local links, Blogger embeds and sitemap scope.')


if __name__ == '__main__':
    check()
