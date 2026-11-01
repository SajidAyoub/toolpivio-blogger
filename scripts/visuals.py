"""Shared V4 page banners using the same cache-safe artwork as catalog cards."""
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = 'https://sajidayoub.github.io/toolpivio-blogger/assets/v4/'


def escape(value):
    return html.escape(str(value), quote=True)


@lru_cache(maxsize=1)
def load_visuals():
    path = ROOT / 'src/v4/visuals.json'
    if not path.exists():
        raise FileNotFoundError('Missing src/v4/visuals.json; include the V4 artwork sources before building page banners.')
    document = json.loads(path.read_text(encoding='utf-8'))
    records = document.get('visuals', document)
    result = {}
    for key, item in records.items():
        if not re.fullmatch(r'[a-z][a-z0-9-]*', key):
            raise ValueError(f'Invalid visual id: {key!r}')
        record = dict(item)
        for field in ('title', 'category', 'benefit', 'description', 'artwork'):
            if not isinstance(record.get(field), str) or not record[field].strip():
                raise ValueError(f'Missing visual {field} for {key}')
        if not re.fullmatch(r'[a-z0-9-]+\.svg', record['artwork']):
            raise ValueError(f'Unexpected artwork filename for {key}')
        source = ROOT / 'src/v4/artwork' / record['artwork']
        digest = sha256(source.read_bytes()).hexdigest()[:12]
        record['asset_name'] = f'{key}.{digest}.svg'
        record['asset_url'] = ASSET_ROOT + record['asset_name']
        result[key] = record
    return result


def banner_css():
    return (ROOT / 'src/v4/banners.css').read_text(encoding='utf-8')


def render_banner(page_id, title_tag='p', title=None):
    """Blogger owns the page h1; hosted guides use title_tag='h1' exactly once."""
    if title_tag not in {'p', 'h1'}:
        raise ValueError('A banner title must be a paragraph or the hosted page h1.')
    visual = load_visuals()[page_id]
    return (
        f'<div class="tp-page-banner" data-page-banner="{escape(page_id)}">'
        '<div class="tp-page-banner-copy">'
        f'<p class="tp-page-banner-category">{escape(visual["category"])}</p>'
        f'<{title_tag} class="tp-page-banner-title">{escape(title or visual["title"])}</{title_tag}>'
        f'<p class="tp-page-banner-benefit">{escape(visual["benefit"])}</p></div>'
        f'<img class="tp-page-banner-art" src="{escape(visual["asset_url"])}" '
        f'alt="{escape(visual["description"])}" width="360" height="220" '
        'decoding="async" fetchpriority="low"/></div>'
    )


def render_back_panel(contact=True):
    extra = '<a href="https://toolpivio.blogspot.com/p/contact.html">Report an issue or suggest a tool</a>' if contact else '<span>Choose a tool and get a clear result.</span>'
    return '<nav class="tp-page-back" aria-label="More from ToolPivio"><a class="tp-page-back-link" href="https://toolpivio.blogspot.com/#tools">Back to all tools <span aria-hidden="true">→</span></a>' + extra + '</nav>'
