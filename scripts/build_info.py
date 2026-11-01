#!/usr/bin/env python3
"""Build static informational page bodies and canonical hosted preview aliases.

The source HTML in src/info is intentionally independent of generated wrappers.
Content and legal updates are reviewed in those templates, not written by the banner
builder. No JavaScript is required to read any informational page.
"""
from pathlib import Path
from build_seo import BLOG, CSS, escape
from visuals import banner_css, render_banner, render_back_panel

ROOT = Path(__file__).resolve().parents[1]
INFO_PAGES = {
    'about': {'title': 'About ToolPivio', 'description': 'Learn how ToolPivio browser tools work, how to use their results and where to find guidance or report an issue.'},
    'contact': {'title': 'Contact ToolPivio', 'description': 'Get in touch about a tool, report an issue or suggest an improvement. Read the current contact options and privacy guidance.'},
    'privacy-policy': {'title': 'Privacy Policy', 'description': 'Read how ToolPivio handles local calculator inputs, hosting information and other data practices.'},
    'terms': {'title': 'Terms of Use', 'description': 'Read the ToolPivio terms for responsible use, accuracy, availability and independent verification of tool results.'},
}


def source_content(page_id):
    return (ROOT / 'src/info' / (page_id + '.html')).read_text(encoding='utf-8')


def render_info_body(page_id, content=None):
    """Blogger's native theme supplies its title and document head."""
    if content is None:
        content = source_content(page_id)
    return '<style>' + banner_css() + '</style><div class="tp-page-content">' + render_banner(page_id) + '<div class="tp-page-article">' + content + '</div>' + render_back_panel(contact=page_id != 'contact') + '</div>\n'


def render_info_hosted(page_id, content=None, relative_prefix='../', head_extra='', body_extra=''):
    """Canonical alias; relative_prefix='' also supports docs/contact.html."""
    if content is None:
        content = source_content(page_id)
    record = INFO_PAGES[page_id]
    # Source Blogger links stay exact in page bodies; hosted previews need absolute links.
    content = content.replace('href="/p/', 'href="' + BLOG + '/p/').replace("href='/p/", "href='" + BLOG + '/p/')
    canonical = BLOG + '/p/' + page_id + '.html'
    body = render_banner(page_id, title_tag='h1') + '<div class="tp-page-article">' + content + '</div>' + render_back_panel(contact=page_id != 'contact')
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escape(record['title']) + ' | ToolPivio</title><meta name="description" content="' + escape(record['description']) + '"><link rel="canonical" href="' + canonical + '"><meta property="og:type" content="website"><meta property="og:site_name" content="ToolPivio"><meta property="og:title" content="' + escape(record['title']) + '"><meta property="og:description" content="' + escape(record['description']) + '"><meta property="og:url" content="' + canonical + '"><style>' + CSS + '\n' + banner_css() + '</style>' + head_extra + '</head><body><a class="skip" href="#main">Skip to content</a><header><div class="nav"><a class="brand" href="' + relative_prefix + 'index.html">Tool<span>Pivio</span>.</a><nav aria-label="Main navigation"><a href="' + relative_prefix + 'index.html#tools">All tools</a><a href="' + BLOG + '/p/about.html">About</a><a href="' + BLOG + '/p/contact.html">Contact</a></nav></div></header><main id="main"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="' + relative_prefix + 'index.html">All tools</a><span aria-hidden="true"> / </span><span aria-current="page">' + escape(record['title']) + '</span></nav>' + body + '</main><footer><p>ToolPivio · Smart Tools. Simple Solutions.</p><p><a href="' + BLOG + '/p/privacy-policy.html">Privacy policy</a><a href="' + BLOG + '/p/terms.html">Terms</a></p></footer>' + body_extra + '</body></html>\n'


def build():
    target = ROOT / 'docs/info'
    target.mkdir(parents=True, exist_ok=True)
    for page_id in INFO_PAGES:
        (ROOT / 'pages' / (page_id + '.html')).write_text(render_info_body(page_id), encoding='utf-8')
        (target / (page_id + '.html')).write_text(render_info_hosted(page_id), encoding='utf-8')
    print('Built four informational banners, Blogger bodies and hosted aliases; source content preserved.')


if __name__ == '__main__':
    build()
