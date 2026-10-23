from pathlib import Path
import json, html
root=Path(__file__).resolve().parents[1]
def read(p): return (root/p).read_text()
tools=json.loads(read('src/tools.json'))
categories=['All tools','Image & PDF Tools','Digital Marketing Calculators','Packaging & Printing Tools','E-commerce Calculators','Video Production Calculators']
cards=''
for t in tools:
 cats=t['category']+('|Image & PDF Tools' if t['slug']=='print-dpi' else '')
 cards+=f'''<article class="card" data-categories="{html.escape(cats,quote=True)}"><span class="icon" aria-hidden="true">{t['icon']}</span><p class="tag">{html.escape(t['category'])}</p><h3>{t['title']}</h3><p>{t['description']}</p><a href="/p/{t['slug']}-calculator.html">Open calculator <span aria-hidden="true">→</span></a></article>'''
# Slugs are centralized here and in installation docs.
filters=''.join(f'<button type="button" data-filter="{html.escape(c,quote=True)}" aria-pressed="{str(i==0).lower()}">{html.escape(c)}</button>' for i,c in enumerate(categories))
header='''<a class="skip" href="#page-main">Skip to content</a><header><div class="wrap nav"><a class="brand" href="/">Tool<span>Pivio</span><span aria-hidden="true">.</span></a><nav aria-label="Main navigation"><a href="/#tools">All tools</a><a href="/p/about.html">About</a><a href="/p/contact.html">Contact</a></nav></div></header>'''
home='''<section class="hero"><div class="wrap"><p class="eyebrow">Small calculations. Better decisions.</p><h1>Smart Tools.<br/><span>Simple Solutions.</span></h1><p class="lead">Less guesswork. More clarity. Free calculators for your next campaign, product, or print project.</p><div class="trust"><span>✓ Free to use</span><span>✓ No sign-up</span><span>✓ Calculations stay in your browser</span></div></div></section><section class="catalog wrap" id="tools" aria-labelledby="tools-title"><div class="catalog-top"><div><p class="eyebrow">Your everyday toolkit</p><h2 id="tools-title">Find your next solution</h2></div><div class="search"><label for="tool-search">Search tools</label><input id="tool-search" type="search" placeholder="Try “profit” or “print”…"/></div></div><div class="filters" aria-label="Filter tools by category">'''+filters+'''</div><p id="search-status" role="status" aria-live="polite">3 tools available</p><div class="cards">'''+cards+'''</div><p class="empty" id="no-tools" hidden="hidden">No tools match this selection yet. Try another category or search.</p><div class="note"><h2>Useful tools. Clear answers.</h2><p>Start with our three free calculators. Each includes a formula, a worked example, and clear results. More categories will grow as new tools are ready.</p><p>Video production tools are not available in this release.</p></div><noscript><p class="noscript">Enable JavaScript for search, filters, and calculators. All available tools are linked above.</p></noscript></section>'''
footer='''<footer><div class="wrap footer-row"><div><a class="brand" href="/">ToolPivio.</a><p>Smart Tools. Simple Solutions.</p><p>Free tools for thoughtful decisions.</p></div><div class="footer-links"><a href="/p/about.html">About</a><a href="/p/contact.html">Contact</a><a href="/p/privacy-policy.html">Privacy Policy</a><a href="/p/terms.html">Terms</a></div></div></footer>'''
js=read('src/calculators.js')+'\n'+read('src/app.js')
xml='''<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:version="2" class="v2" expr:dir="data:blog.languageDirection" lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:b="http://www.google.com/2005/gml/b" xmlns:data="http://www.google.com/2005/gml/data" xmlns:expr="http://www.google.com/2005/gml/expr">
<head><meta content="width=device-width, initial-scale=1" name="viewport"/>
<b:include data="blog" name="all-head-content"/>
<title><data:blog.pageTitle/></title>
<b:if cond="data:blog.url == data:blog.homepageUrl"><meta name="description" content="Free ROAS, profit margin, and print DPI calculators. ToolPivio makes everyday marketing, e-commerce, and printing calculations simple."/></b:if>
<meta property="og:site_name" content="ToolPivio"/><meta property="og:title" expr:content="data:blog.pageTitle"/><meta property="og:url" expr:content="data:blog.canonicalUrl"/><meta property="og:type" content="website"/>
<b:skin><![CDATA['''+read('src/styles.css')+''']]></b:skin></head><body>'''+header+'''<main id="page-main"><b:if cond="data:blog.url == data:blog.homepageUrl">'''+home+'''</b:if><b:section id="main" class="main-content" maxwidgets="1" showaddelement="no"><b:widget id="Blog1" locked="true" title="Page content" type="Blog" version="1" visible="true"><b:includable id="main" var="top"><b:if cond="data:blog.url != data:blog.homepageUrl"><b:loop values="data:posts" var="post"><article class="page"><h1><data:post.title/></h1><div class="article-body"><data:post.body/></div><b:if cond="data:post.allowComments"><b:include data="post" name="comments"/></b:if></article></b:loop><b:if cond="data:blog.pageType == &quot;error_page&quot;"><article class="page"><h1>Page not found</h1><p>This page is unavailable. <a href="/">Explore our tools</a>.</p></article></b:if></b:if></b:includable></b:widget></b:section></main>'''+footer+'''<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"ToolPivio","slogan":"Smart Tools. Simple Solutions."}</script><script type="text/javascript"><![CDATA['''+js+''']]></script></body></html>'''
(root/'dist/toolpivio.xml').write_text(xml)
preview='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ToolPivio preview</title><style>'+read('src/styles.css')+'</style></head><body>'+header+'<main id="main">'+home
for t in tools: preview+='<article class="page"><h1>'+t['title']+'</h1>'+t['body']+'</article>'
preview+='</main>'+footer+'<script>'+js+'</script></body></html>'
(root/'dist/preview.html').write_text(preview)
print('Built dist/toolpivio.xml and dist/preview.html')
