#!/usr/bin/env python3
"""Build crawlable tool guides and Blogger page bodies without any network writes.

The tool manifests define availability. SEO overrides add explanations, never tools.
Existing Blogger URLs remain canonical; new tools use their GitHub Pages guide until
an actual Blogger publish response has been reviewed and a canonical override added.
"""
from pathlib import Path
import argparse
import html
import json
import re
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HOST = 'https://sajidayoub.github.io/toolpivio-blogger'
BLOG = 'https://toolpivio.blogspot.com'
LEGACY = {
    'roas': ('roas', '/p/roas-calculator.html'),
    'profit-margin': ('margin', '/p/profit-margin-calculator.html'),
    'print-dpi': ('dpi', '/p/print-dpi-calculator.html'),
}
CSS = '''*{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:#f4f8f7;color:#12283e;font:17px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif}a{color:#087f75;text-underline-offset:3px}a:hover{text-decoration-thickness:2px}a:focus-visible,button:focus-visible{outline:3px solid #087f75;outline-offset:4px}.skip{position:absolute;left:16px;top:-100px;background:#fff;padding:12px;z-index:5}.skip:focus{top:12px}header{border-bottom:1px solid #dce6e5;background:#fff}.nav{max-width:1060px;margin:auto;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{font-size:25px;font-weight:800;letter-spacing:-1px;text-decoration:none;color:#12283e}.brand span{color:#087f75}nav{display:flex;gap:20px;flex-wrap:wrap}nav a{font-size:15px;font-weight:600}main{max-width:1000px;margin:auto;padding:32px 24px 64px}.breadcrumbs{font-size:14px;margin-bottom:24px}.eyebrow{font-size:13px;letter-spacing:.1em;text-transform:uppercase;font-weight:750;color:#087f75}h1{font-size:clamp(30px,5vw,46px);line-height:1.15;letter-spacing:-1.4px;margin:12px 0 20px}h2{font-size:25px;line-height:1.3;letter-spacing:-.4px;margin-top:0}h3{font-size:19px;line-height:1.4}.intro{font-size:19px;max-width:770px;color:#40556a}.privacy{font-size:14px;color:#40556a}.tool-shell,section.guide{background:#fff;border:1px solid #dce6e5;border-radius:20px;padding:28px;margin-top:24px;box-shadow:0 10px 30px #12283e05}.tool-shell{padding:8px 12px 20px}iframe{display:block;width:100%;max-width:100%;border:0;background:#fff;border-radius:14px}.fallback{margin:8px 12px 0;font-size:14px}.guide p:last-child{margin-bottom:0}.formula{background:#edf7f4;border-left:3px solid #087f75;padding:16px 20px;border-radius:0 12px 12px 0}.related{display:flex;gap:12px;flex-wrap:wrap;padding:0;list-style:none}.related a{display:block;padding:10px 14px;background:#edf7f4;border-radius:10px}li+li{margin-top:8px}.related li+li{margin-top:0}footer{background:#12283e;color:#fff;padding:30px 24px;text-align:center;font-size:14px}footer a{color:#bcf1df;margin:0 10px}.guide li{padding-left:4px}noscript p{padding:12px;background:#fff3cf}@media(max-width:600px){.nav{padding:16px;align-items:flex-start;flex-direction:column;gap:10px}nav{gap:16px}main{padding:24px 16px 40px}.tool-shell,section.guide{padding:20px}.tool-shell{padding:4px 2px 14px}.intro{font-size:17px}.formula{padding:14px}h1{letter-spacing:-.7px}}'''
RESIZE_JS = '''(function(){'use strict';var frame=document.querySelector('iframe[data-toolpivio-frame]');if(!frame)return;var origin=new URL(frame.src,location.href).origin;window.addEventListener('message',function(event){if(event.origin!==origin||event.source!==frame.contentWindow)return;var data=event.data;if(!data||data.type!=='ToolPivio:resize'||!Number.isFinite(data.height)||data.height<100||data.height>12000)return;frame.style.height=Math.ceil(data.height)+'px';frame.height=String(Math.ceil(data.height));});frame.addEventListener('load',function(){frame.contentWindow.postMessage({type:'ToolPivio:requestResize'},origin);});})();'''


def escape(value):
    return html.escape(str(value), quote=True)


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def load_tools():
    overrides = read_json('src/seo.json')
    records = []
    for item in read_json('src/tools.json'):
        tool_id, path = LEGACY[item['slug']]
        record = dict(item, id=tool_id, blogger_file=f"pages/{item['slug']}.html", canonical=BLOG + path)
        record.update(overrides.get(tool_id, {}))
        records.append(record)
    for filename in ('src/new-tools.json', 'src/file-tools.json'):
        if not (ROOT / filename).exists():
            continue
        for item in read_json(filename):
            record = dict(item, blogger_file=f"pages/{item['id']}.html", canonical=f"{HOST}/tools/{item['id']}.html")
            record.update(overrides.get(item['id'], {}))
            records.append(record)
    ids = set()
    for record in records:
        tool_id = record['id']
        if not re.fullmatch(r'[a-z][a-z0-9-]*', tool_id) or tool_id in ids:
            raise ValueError(f'Invalid or duplicate tool id: {tool_id!r}')
        ids.add(tool_id)
        for key in ('title', 'category', 'description', 'formula', 'example', 'limitations'):
            if not isinstance(record.get(key), str) or not record[key].strip():
                raise ValueError(f'Missing {key} for {tool_id}')
        parsed = urlparse(record['canonical'])
        if parsed.scheme != 'https' or parsed.netloc not in {'toolpivio.blogspot.com', 'sajidayoub.github.io'} or parsed.query or parsed.fragment:
            raise ValueError(f'Unexpected canonical URL for {tool_id}')
    return records


def related_links(tool, records, hosted=False):
    choices = [record for record in records if record['id'] != tool['id'] and record['category'] == tool['category']]
    if len(choices) < 2:
        choices += [record for record in records if record['id'] != tool['id'] and record not in choices]
    links = []
    for record in choices[:4]:
        # Link directly to canonical documents rather than query-string embeds.
        links.append(f'<li><a href="{escape(record["canonical"])}">{escape(record["title"])}</a></li>')
    return '<ul class="related">' + ''.join(links) + '</ul>'


def content_sections(tool, records):
    steps = tool.get('steps', ['Enter values in the labeled inputs, using consistent units.', 'Calculate or process the result, then review the output.', 'Reset to clear the form before starting another calculation.'])
    instructions = '<section class="guide" aria-labelledby="how-to-use"><h2 id="how-to-use">How to use this tool</h2><ol>' + ''.join(f'<li>{escape(step)}</li>' for step in steps) + '</ol></section>'
    formula_title = 'How processing works' if tool['id'] in {'image-resizer', 'image-compressor', 'image-converter', 'images-to-pdf', 'pdf-merge'} else 'Formula and units'
    sections = instructions + f'<section class="guide"><h2>{formula_title}</h2><p class="formula">{escape(tool["formula"])}</p><h3>Worked example</h3><p>{escape(tool["example"])}</p></section><section class="guide"><h2>What to check before using the result</h2><p>{escape(tool["limitations"])}</p></section>'
    for item in tool.get('faq', []):
        sections += f'<section class="guide"><h2>{escape(item["question"])}</h2><p>{escape(item["answer"])}</p></section>'
    sections += '<section class="guide"><h2>Related tools</h2>' + related_links(tool, records) + '</section>'
    return sections


def iframe(tool, absolute=False):
    src = f'{HOST}/embed.html?tool={tool["id"]}' if absolute else f'../embed.html?tool={tool["id"]}'
    height = 760 if tool['id'] in {'dpi', 'image-resizer', 'image-compressor', 'image-converter', 'images-to-pdf', 'pdf-merge'} else 560
    return f'<div class="toolpivio-embed tool-shell" data-toolpivio-calculator="{escape(tool["id"])}"><iframe data-toolpivio-frame="true" title="{escape(tool["title"])}" src="{escape(src)}" width="100%" height="{height}" style="display:block;width:100%;height:{height}px;max-width:100%;border:0;border-radius:14px;background:#fff" loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms allow-same-origin allow-downloads"></iframe><p class="fallback">If the tool does not load, <a href="{escape(HOST + "/embed.html?tool=" + tool["id"])}" target="_blank" rel="noopener noreferrer">open it directly</a>.</p></div>'


def schema(tool):
    application = {'@context': 'https://schema.org', '@type': 'SoftwareApplication', 'name': tool['title'], 'description': tool['description'], 'url': tool['canonical'], 'applicationCategory': 'UtilitiesApplication', 'operatingSystem': 'Any modern web browser', 'isAccessibleForFree': True, 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}}
    return '<script type="application/ld+json">' + json.dumps(application, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c') + '</script>'


def render_hosted(tool, records):
    title = tool['title'] + ' | ToolPivio'
    body = f'<p class="eyebrow">{escape(tool["category"])}</p><h1>{escape(tool["title"])}</h1><p class="intro">{escape(tool.get("intro", tool["description"]))}</p><p class="privacy">Free to use. No sign-up. Calculations and selected files are processed in your browser.</p>' + iframe(tool) + '<noscript><p>Enable JavaScript to use the tool. The explanation and worked example below are available without JavaScript.</p></noscript>' + content_sections(tool, records)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)}</title><meta name="description" content="{escape(tool['description'])}"><link rel="canonical" href="{escape(tool['canonical'])}"><meta property="og:type" content="website"><meta property="og:site_name" content="ToolPivio"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(tool['description'])}"><meta property="og:url" content="{escape(tool['canonical'])}"><meta name="twitter:card" content="summary"><style>{CSS}</style>{schema(tool)}</head><body><a class="skip" href="#main">Skip to content</a><header><div class="nav"><a class="brand" href="../index.html">Tool<span>Pivio</span>.</a><nav aria-label="Main navigation"><a href="../index.html#tools">All tools</a><a href="{BLOG}/p/about.html">About</a><a href="{BLOG}/p/contact.html">Contact</a></nav></div></header><main id="main"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">All tools</a><span aria-hidden="true"> / </span><span aria-current="page">{escape(tool['title'])}</span></nav>{body}</main><footer><p>ToolPivio · Smart Tools. Simple Solutions.</p><p><a href="{BLOG}/p/privacy-policy.html">Privacy policy</a><a href="{BLOG}/p/terms.html">Terms</a></p></footer><script>{RESIZE_JS}</script></body></html>
'''


def render_blogger(tool, records):
    # Blogger renders the page title and owns head/canonical tags. No second h1.
    body = f'<p>{escape(tool.get("intro", tool["description"]))}</p>' + iframe(tool, absolute=True)
    body += '<noscript><p>Enable JavaScript to use the tool. The formula and worked example can also be used manually.</p></noscript>' + content_sections(tool, records)
    if tool['id'] in {'roas', 'margin', 'dpi'}:
        body += schema(tool)
    return body + '\n'


def build(include_existing_blogger=False):
    records = load_tools()
    target = ROOT / 'docs/tools'
    target.mkdir(parents=True, exist_ok=True)
    blogger_count = 0
    for tool in records:
        (target / (tool['id'] + '.html')).write_text(render_hosted(tool, records), encoding='utf-8')
        if include_existing_blogger or tool['id'] not in {'roas', 'margin', 'dpi'}:
            (ROOT / tool['blogger_file']).write_text(render_blogger(tool, records), encoding='utf-8')
            blogger_count += 1
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    sitemap = ET.Element(ns + 'urlset')
    for tool in records:
        expected = f'{HOST}/tools/{tool["id"]}.html'
        if tool['canonical'] == expected:
            ET.SubElement(ET.SubElement(sitemap, ns + 'url'), ns + 'loc').text = expected
    ET.ElementTree(sitemap).write(ROOT / 'docs/sitemap.xml', encoding='utf-8', xml_declaration=True)
    print(f'Built {len(records)} hosted guides, {blogger_count} Blogger bodies and canonical-only sitemap.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--existing-blogger', action='store_true', help='Also regenerate the three existing registered Blogger page bodies; review before merging.')
    build(parser.parse_args().existing_blogger)
