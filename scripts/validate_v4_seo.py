#!/usr/bin/env python3
"""Audit canonical, social and discovery output without network or account access.

Run after npm run build. Existing V3 output is supported; V4-specific theme checks
activate when the V4 release exists. This cannot establish live indexing or CWV.
"""
from pathlib import Path
import json
import sys
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_seo import BLOG, HOST, ROOT, load_tools
from validate_seo import Document

LEGACY = {
    'roas': BLOG + '/p/roas-calculator.html',
    'margin': BLOG + '/p/profit-margin-calculator.html',
    'dpi': BLOG + '/p/print-dpi-calculator.html',
}
NS = {'b': 'http://www.google.com/2005/gml/b', 'h': 'http://www.w3.org/1999/xhtml'}
FORBIDDEN_CLAIMS = {'aggregateRating', 'review', 'ratingValue', 'ratingCount', 'reviewCount', 'award'}


def objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from objects(child)


def assert_truthful_schema(doc, label):
    for script in doc.scripts:
        for item in objects(script):
            assert not FORBIDDEN_CLAIMS.intersection(item), f'Unsupported schema claim in {label}'
            assert item.get('@type') != 'SearchAction', f'No functional public search endpoint exists: {label}'


def single_meta(doc, key, name, expected, label):
    matches = doc.matching('meta', key, name)
    assert len(matches) == 1, f'Expected one {name} in {label}'
    assert matches[0].get('content') == expected, f'Wrong {name} in {label}'


def check():
    records = load_tools()
    assert len(records) == 19, 'V4 must preserve all nineteen existing tools'
    expected_sitemap = set()
    for tool in records:
        tool_id = tool['id']
        expected = LEGACY.get(tool_id, f'{HOST}/tools/{tool_id}.html')
        assert tool['canonical'] == expected, f'Unreviewed canonical change for {tool_id}'
        if tool_id not in LEGACY:
            expected_sitemap.add(expected)
        path = ROOT / 'docs/tools' / (tool_id + '.html')
        source = path.read_text(encoding='utf-8')
        doc = Document(source)
        assert len(doc.matching('title')) == 1 and len(doc.matching('h1')) == 1, path
        assert len(doc.matching('meta', 'name', 'description')) == 1, path
        canonical = doc.matching('link', 'rel', 'canonical')
        assert len(canonical) == 1 and canonical[0].get('href') == expected, path
        for attrs in doc.matching('meta', 'name', 'robots'):
            assert 'noindex' not in attrs.get('content', '').lower(), path
        for name, value in [('og:title', tool['title'] + ' | ToolPivio'), ('og:description', tool['description']), ('og:url', expected), ('og:type', 'website'), ('og:site_name', 'ToolPivio')]:
            single_meta(doc, 'property', name, value, path)
        assert_truthful_schema(doc, path)
        applications = [item for script in doc.scripts for item in objects(script) if item.get('@type') == 'SoftwareApplication']
        assert len(applications) == 1 and applications[0]['url'] == expected, path
        assert applications[0].get('isAccessibleForFree') is True, path
        # The guide must help visitors find another real tool in the same category.
        same_category = {record['canonical'] for record in records if record['id'] != tool_id and record['category'] == tool['category']}
        linked = {anchor.get('href') for anchor in doc.matching('a')}
        assert same_category.intersection(linked), f'Missing category internal link in {path}'
        assert doc.matching('nav', 'aria-label', 'Breadcrumb'), f'Missing breadcrumb in {path}'
        for image in doc.matching('img'):
            assert 'alt' in image, f'Unlabeled image in {path}'
        blogger_path = ROOT / tool['blogger_file']
        blogger = Document(blogger_path.read_text(encoding='utf-8'))
        for forbidden in ['head', 'title', 'h1', 'meta']:
            assert not blogger.matching(forbidden), f'Blogger owns {forbidden}: {blogger_path}'
        assert not blogger.matching('link', 'rel', 'canonical'), blogger_path
        assert_truthful_schema(blogger, blogger_path)
    sitemap = ET.parse(ROOT / 'docs/sitemap.xml')
    urls = [element.text for element in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    assert len(urls) == 16 and len(set(urls)) == 16, 'Expected sixteen unique hosted canonical URLs'
    assert set(urls) == expected_sitemap, 'Sitemap must not include Blogger aliases, runtime or unverified Blogger paths'
    for tool_id in ['about', 'contact', 'privacy-policy', 'terms']:
        path = ROOT / 'pages' / (tool_id + '.html')
        doc = Document(path.read_text(encoding='utf-8'))
        assert not doc.matching('h1') and not doc.matching('head') and not doc.matching('meta'), path
    runtime = Document((ROOT / 'docs/embed.html').read_text(encoding='utf-8'))
    robots = runtime.matching('meta', 'name', 'robots')
    assert len(robots) == 1 and 'noindex' in robots[0].get('content', '').lower(), 'Keep the query runtime out of the guide index'
    v4 = ROOT / 'releases/ToolPivio_V4_Ready_For_Blogger.xml'
    if v4.exists():
        tree = ET.parse(v4)
        head = tree.find('./h:head', NS)
        includes = head.findall('.//b:include[@name="all-head-content"]', NS)
        assert len(includes) == 1, 'Keep the native Blogger head/canonical owner'
        assert not head.findall('.//h:link[@rel="canonical"]', NS), 'Do not add a second theme canonical'
        assert 'SearchAction' not in v4.read_text(encoding='utf-8'), 'A local filter is not a public SearchAction endpoint'
        index = Document((ROOT / 'docs/index.html').read_text(encoding='utf-8'))
        single_meta(index, 'property', 'og:url', BLOG + '/', 'hosted catalog')
        single_meta(index, 'property', 'og:site_name', 'ToolPivio', 'hosted catalog')
        assert len(index.matching('meta', 'property', 'og:title')) == 1, 'Catalog social title'
        assert len(index.matching('meta', 'property', 'og:description')) == 1, 'Catalog social description'
        assert_truthful_schema(index, 'hosted catalog')
    print('V4 SEO: nineteen canonical guides, sixteen sitemap URLs, OG metadata, category links, breadcrumbs, Blogger head ownership and truthful schema validated locally.')


if __name__ == '__main__':
    check()
