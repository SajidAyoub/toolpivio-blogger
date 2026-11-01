"""Build V4 around the trusted Contempo theme; never replace its Blog1 renderer."""
from pathlib import Path
import html
import hashlib
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PAGES = 'https://sajidayoub.github.io/toolpivio-blogger/'
BLOG = 'https://toolpivio.blogspot.com'
NS = {'b': 'http://www.google.com/2005/gml/b', 'h': 'http://www.w3.org/1999/xhtml'}
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def escape(value): return html.escape(str(value), quote=True)
def cdata(value): return '<![CDATA[' + value.replace(']]>', ']]]]><![CDATA[>') + ']]>'
def write(path, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(value, encoding='utf-8')

def catalog():
    result = []
    for index, item in enumerate(json.loads(read('src/tools.json'))):
        entry = dict(item)
        entry['id'] = ['roas', 'margin', 'dpi'][index]
        entry['url'] = BLOG + '/p/' + entry['slug'] + '-calculator.html'
        entry['categories'] = entry['category'] + ('|Image & PDF Tools' if entry['id'] == 'dpi' else '')
        result.append(entry)
    for path in ['src/new-tools.json', 'src/file-tools.json']:
        if (ROOT / path).exists():
            for item in json.loads(read(path)):
                entry = dict(item)
                if not re.fullmatch(r'[a-z0-9-]+', entry['id']):
                    raise ValueError('Invalid tool id')
                entry['url'] = PAGES + 'tools/' + entry['id'] + '.html'
                entry['categories'] = entry['category']
                result.append(entry)
    assert len({item['id'] for item in result}) == len(result), 'Duplicate tool id'
    return result

def build_visuals():
    """Hash source artwork once; keep old content-addressed assets for cached themes."""
    source = json.loads(read('src/v4/visuals.json'))
    records = source.get('visuals', source)
    manifest = {}
    for visual_id, metadata in records.items():
        if not re.fullmatch(r'[a-z0-9-]+', visual_id):
            raise ValueError('Invalid visual id')
        filename = metadata['artwork']
        if filename != visual_id + '.svg':
            raise ValueError('Artwork must be the matching original SVG')
        content = (ROOT / 'src/v4/artwork' / filename).read_bytes()
        digest = hashlib.sha256(content).hexdigest()[:12]
        asset_name = visual_id + '.' + digest + '.svg'
        target = ROOT / 'docs/assets/v4' / asset_name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        manifest[visual_id] = dict(metadata, artwork=PAGES + 'assets/v4/' + asset_name)
    write('docs/assets/v4/manifest.json', json.dumps({'version': 4, 'visuals': manifest}, ensure_ascii=False, indent=2) + '\n')
    return manifest

VISUALS = build_visuals()
TOOLS = catalog()
for tool in TOOLS:
    tool['illustration'] = VISUALS[tool['id']]['artwork']

CATEGORIES = [('All tools','All tools'), ('Digital Marketing Calculators','Marketing'), ('E-commerce Calculators','E-commerce'), ('Packaging & Printing Tools','Printing'), ('Video Production Calculators','Video'), ('Image & PDF Tools','Image & PDF')]
mark = '<svg class="tp-brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="M9 10h14M16 10v13m-6-7h12" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>'
brand = mark + '<span class="tp-brand-word">Tool<span>Pivio</span>.</span>'
header = '<a class="tp-skip" href="#main">Skip to content</a><header class="tp-header"><div class="tp-wrap tp-nav"><a class="tp-brand" href="'+BLOG+'/" aria-label="ToolPivio home">'+brand+'</a><button class="tp-menu" type="button" aria-controls="tp-navigation" aria-expanded="false" hidden="hidden">Menu</button><nav class="tp-links" id="tp-navigation" aria-label="Main navigation"><a href="'+BLOG+'/#tools">All tools</a><a href="'+BLOG+'/p/about.html">About</a><a href="'+BLOG+'/p/contact.html">Contact</a><a class="tp-nav-cta" href="#tools">Explore tools <span aria-hidden="true">→</span></a></nav></div></header>'
# Homepage anchors stay local; on Blogger content pages the main CTA goes home.
header_theme = header.replace('href="#tools"', 'href="/#tools"')
check = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10l4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
icons = {
'Digital Marketing Calculators':'<path d="M4 17l5-6 4 3 7-10M15 4h5v5"/>',
'E-commerce Calculators':'<path d="M6 5h12v15H6zM9 5V3h6v2M9 10h6m-6 4h6"/>',
'Packaging & Printing Tools':'<path d="M7 8V3h10v5M7 17H4V8h16v9h-3M7 14h10v7H7zM16 11h1"/>',
'Video Production Calculators':'<path d="M3 5h13v14H3zM16 9l5-3v12l-5-3"/>',
'Image & PDF Tools':'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M4 17l5-6 4 4 4-5 4 6"/><circle cx="8" cy="8" r="1"/>'}
def icon(category): return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons.get(category,icons['Digital Marketing Calculators'])+'</svg>'
arrow = '<svg xmlns="http://www.w3.org/2000/svg" class="tp-card-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
def cards(items):
    return ''.join('<article class="tp-card" data-tool-id="'+escape(t['id'])+'" data-categories="'+escape(t['categories'])+'"><a class="tp-card-link" href="'+escape(t['url'])+'" aria-label="Open '+escape(t['title'])+'" draggable="false"><img class="tp-card-art" src="'+escape(t['illustration'])+'" width="360" height="220" alt="" aria-hidden="true" loading="lazy" decoding="async" draggable="false"/><span class="tp-icon" aria-hidden="true">'+icon(t['category'])+'</span><p class="tp-tag">'+escape(t['category'])+'</p><h3>'+escape(t['title'])+'</h3><p>'+escape(t['description'])+'</p><span class="tp-card-cta"><span>Open Tool</span>'+arrow+'</span></a></article>' for t in items)

filters = ''.join('<button type="button" data-filter="'+escape(value)+'" aria-pressed="'+str(i == 0).lower()+'">'+escape(label)+'</button>' for i,(value,label) in enumerate(CATEGORIES))
hero = read('src/v3/hero.svg')
home = '''<div class="tp-home"><section class="tp-hero" aria-labelledby="tp-hero-title"><div class="tp-wrap tp-hero-grid"><div><p class="tp-eyebrow tp-eyebrow-badge">A little clarity goes a long way</p><h1 id="tp-hero-title">Smart Tools.<span>Simple Solutions.</span></h1><p class="tp-lead">Turn everyday numbers into your next good decision. Free tools for marketing, commerce, and creative work.</p><div class="tp-hero-actions"><a class="tp-button" href="#tools">Find your tool <span aria-hidden="true">→</span></a><a class="tp-text-link" href="'''+BLOG+'''/p/about.html">Made for everyday work →</a></div><div class="tp-trust"><span>'''+check+'''Free to use</span><span>'''+check+'''No sign-up</span><span>'''+check+'''Runs in your browser</span></div></div><figure class="tp-art">'''+hero+'''</figure></div></section><div class="tp-wrap tp-benefits"><div class="tp-benefit"><span class="tp-benefit-icon">'''+icon('Digital Marketing Calculators')+'''</span><div><strong>Less guesswork</strong>Clear inputs. Useful answers.</div></div><div class="tp-benefit"><span class="tp-benefit-icon">'''+icon('E-commerce Calculators')+'''</span><div><strong>Built for your workflow</strong>From your next campaign to your next print.</div></div><div class="tp-benefit"><span class="tp-benefit-icon">'''+icon('Image & PDF Tools')+'''</span><div><strong>Private by design</strong>Your calculations stay in your browser.</div></div></div><section class="tp-wrap tp-catalog" id="tools" aria-labelledby="tools-title"><div class="tp-catalog-top"><div><p class="tp-eyebrow">Your everyday toolkit</p><h2 id="tools-title">A clear answer starts here.</h2><p class="tp-section-description">Pick a tool and get straight to what matters.</p></div><div class="tp-search"><label for="tool-search">Search the toolkit</label><input id="tool-search" type="search" placeholder="Try profit, marketing, or print…" autocomplete="off"/></div></div><div class="tp-filters" role="group" aria-label="Filter tools by category">'''+filters+'''</div><p class="tp-status" id="search-status" role="status" aria-live="polite">'''+str(len(TOOLS))+''' tools available</p><div class="tp-cards">'''+cards(TOOLS)+'''</div><div class="tp-empty" id="no-tools" hidden="hidden"><p>No tools match this selection. Try a broader search or another category.</p><button type="button" id="tp-clear-filters">Clear search and filters</button></div><div class="tp-note"><div><p class="tp-eyebrow">Useful tools. Clear thinking.</p><h2>The answer, with the working.</h2></div><p>Understand the result with formulas, practical examples, and helpful notes. Use the right units, check your assumptions, and make your next move with confidence.</p></div><noscript><p>All available tools are linked above. Enable JavaScript to use search, filters, and interactive tools.</p></noscript></section></div>'''
footer = '<footer class="tp-footer"><div class="tp-wrap tp-footer-row"><div><a class="tp-brand" href="'+BLOG+'/">'+brand+'</a><p>Smart tools for thoughtful decisions.<br/>A simpler way to work out what comes next.</p></div><nav class="tp-footer-links" aria-label="Footer navigation"><a href="'+BLOG+'/p/about.html">About</a><a href="'+BLOG+'/p/contact.html">Contact</a><a href="'+BLOG+'/p/privacy-policy.html">Privacy Policy</a><a href="'+BLOG+'/p/terms.html">Terms</a></nav></div><div class="tp-wrap tp-footer-bottom"><span>ToolPivio · Smart Tools. Simple Solutions.</span><span>Free to use. Built for clarity.</span></div></footer>'
base = read('ToolPivio_Restored_Design_v2.xml')
base_tree = ET.fromstring(base)
blog_before = ET.tostring(base_tree.find('.//b:widget[@id="Blog1"]', NS))
css = read('src/v3/styles.css')
xml = base.replace(']]></b:skin>', '\n'+css+'\n]]></b:skin>', 1)
xml = re.sub(r'<header class="tp-header">.*?</header>', lambda _: header_theme, xml, count=1, flags=re.S)
xml = re.sub(r'<b:if cond="data:view.isHomepage"><div class="tp-home">.*?</div><style type="text/css">body #page_body\{display:none!important\}</style></b:if>', lambda _: '<b:if cond="data:view.isHomepage">'+home+'<style type="text/css">body #page_body{display:none!important}</style></b:if><b:if cond="data:view.isPage"><nav class="tp-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span><data:view.title.escaped/></span></nav></b:if>', xml, count=1, flags=re.S)
# Retain legacy native-placeholder calculators, replacing only their old catalog filter.
legacy = list(base_tree.findall('.//h:script[@type="text/javascript"]', NS))[-1].text
legacy = re.sub(r"var search=document.getElementById\('tool-search'\).*?(?=var definitions=)", '', legacy, count=1, flags=re.S)
sitejs = read('src/v3/site.js')
scripts = '<script type="text/javascript">'+cdata(legacy+'\n'+sitejs)+'</script><script defer="defer" src="'+PAGES+'catalog.v3.js"></script>'
start = xml.index('<footer class="tp-footer">')
xml = xml[:start] + footer + scripts + '</body>\n</html>\n'
seo_head = '''<b:if cond="data:view.isHomepage and !data:blog.metaDescription"><meta name="description" content="Free online calculators for marketing, commerce and print projects. Clear inputs, practical formulas and useful answers."/></b:if><meta property="og:site_name" content="ToolPivio"/><meta property="og:title" expr:content="data:view.title.escaped"/><meta property="og:url" expr:content="data:blog.canonicalUrl"/><meta property="og:type" content="website"/><b:if cond="data:blog.metaDescription"><meta property="og:description" expr:content="data:blog.metaDescription"/></b:if><b:if cond="data:view.isHomepage"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","@id":"https://toolpivio.blogspot.com/#website","name":"ToolPivio","url":"https://toolpivio.blogspot.com/"},{"@type":"Organization","@id":"https://toolpivio.blogspot.com/#organization","name":"ToolPivio","url":"https://toolpivio.blogspot.com/"}]}</script></b:if>'''
xml = xml.replace('</head>', seo_head + '</head>', 1)
# Static Pages receive one semantic main heading without modifying the native widget.
xml = xml.replace('<span><data:view.title.escaped/></span></nav></b:if>', '<span aria-current="page"><data:view.title.escaped/></span></nav><div class="tp-wrap tp-page-heading"><h1><data:view.title.escaped/></h1></div><style type="text/css">#Blog1 .post-title{display:none!important}.tp-page-heading{padding-top:10px}.tp-page-heading h1{font-size:clamp(30px,5vw,44px);line-height:1.2;letter-spacing:-1px;overflow-wrap:anywhere;margin:12px 0 20px}</style></b:if>', 1)
xml = xml.replace('<title><data:view.title.escaped/></title>', '<b:if cond="data:view.isHomepage"><title>ToolPivio — Free Calculators &amp; Online Tools</title><b:else/><title><data:view.title.escaped/></title></b:if>', 1)
# Blogger owns canonical and configured Search Descriptions. Supply a fallback only
# for the three established addresses when no per-page description exists.
if (ROOT / 'src/seo.json').exists():
    descriptions = json.loads(read('src/seo.json'))
    fallback = ''
    for slug, tool_id in [('roas','roas'),('profit-margin','margin'),('print-dpi','dpi')]:
        condition = 'data:view.isPage and !data:blog.metaDescription and data:blog.canonicalUrl == "'+BLOG+'/p/'+slug+'-calculator.html"'
        fallback += '<b:if cond="'+escape(condition)+'"><meta name="description" content="'+escape(descriptions[tool_id]['description'])+'"/><meta property="og:description" content="'+escape(descriptions[tool_id]['description'])+'"/></b:if>'
    xml = xml.replace('</head>', fallback+'</head>', 1)
xml = xml.replace('Free online calculators for marketing, commerce and print projects. Clear inputs, practical formulas and useful answers.', 'Free online calculators and tools for marketing, commerce, print, video, images and PDF work. Clear inputs, practical formulas and useful answers.', 1)
home_title = 'ToolPivio — Free Calculators & Online Tools'
home_description = 'Free online calculators and tools for marketing, commerce, print, video, images and PDF work. Clear inputs, practical formulas and useful answers.'
xml = xml.replace('<meta property="og:title" expr:content="data:view.title.escaped"/>', '<b:if cond="data:view.isHomepage"><meta property="og:title" content="'+escape(home_title)+'"/><b:else/><meta property="og:title" expr:content="data:view.title.escaped"/></b:if>', 1)
xml = xml.replace('</head>', '<b:if cond="data:view.isHomepage and !data:blog.metaDescription"><meta property="og:description" content="'+escape(home_description)+'"/></b:if></head>', 1)
assert blog_before == ET.tostring(ET.fromstring(xml).find('.//b:widget[@id="Blog1"]',NS)), 'Native Blog1 changed'
write('releases/ToolPivio_V4_Ready_For_Blogger.xml', xml)
public_tools = [{k:t[k] for k in ['id','title','description','category','categories','icon','url','illustration'] if k in t} for t in TOOLS]
write('docs/catalog.v3.js', '/* Generated by scripts/build.py; v3 catalog protocol. */\nwindow.ToolPivioCatalog='+json.dumps({'version':3,'tools':public_tools},ensure_ascii=False).replace('<','\\u003c')+';\nwindow.dispatchEvent(new Event("toolpivio:catalog"));\n')
base_css = base[base.index('/* ===== ToolPivio design overrides ===== */'):base.index(']]></b:skin>')]
site_head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ToolPivio — Free Calculators &amp; Online Tools</title><meta name="description" content="Free browser calculators for marketing, commerce and print projects. Explore useful tools with clear formulas and examples."/><link rel="canonical" href="'+BLOG+'/"/><style>html,body{margin:0;font:16px/1.6 system-ui,sans-serif}a{color:#087f75}button,input{font:inherit}svg{max-width:100%}'+base_css+'\n'+css+'</style></head><body>'
site_head=site_head.replace('</head>', '<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@type':'WebSite','name':'ToolPivio','url':BLOG+'/'})+'</script></head>')
site_head=site_head.replace('Free browser calculators for marketing, commerce and print projects. Explore useful tools with clear formulas and examples.', 'Free browser tools for marketing, commerce, print, video, images and PDFs. Explore useful calculators and file utilities with clear examples.')
social = {'og:type':'website', 'og:site_name':'ToolPivio', 'og:title':home_title, 'og:description':'Free browser tools for marketing, commerce, print, video, images and PDFs. Explore useful calculators and file utilities with clear examples.', 'og:url':BLOG+'/'}
site_head=site_head.replace('</head>', ''.join('<meta property="'+key+'" content="'+escape(value)+'"/>' for key,value in social.items())+'<meta name="twitter:card" content="summary"/></head>', 1)
site = site_head+header.replace(BLOG+'/#tools','#tools')+'<main id="main">'+home+'</main>'+footer+'<script>'+sitejs+'</script></body></html>\n'
write('dist/preview.html', site)
write('docs/index.html', site)
print('Built V4 Blogger release, static preview, cache-safe artwork and compatible catalog.v3.js; trusted V2, installed V3 and legacy dist XML unchanged.')
