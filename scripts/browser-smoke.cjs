/* No external requests: production-origin routes exercise the real iframe protocol. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
fs.mkdirSync('work',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://toolpivio.blogspot.com/**',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync('dist/preview.html','utf8')}));
await page.route('https://sajidayoub.github.io/toolpivio-blogger/**',route=>{
 const url=new URL(route.request().url());
 const path=url.pathname.endsWith('embed.html')?'docs/embed.html':url.pathname.endsWith('catalog.v3.js')?'docs/catalog.v3.js':null;
 return route.fulfill({status:path?200:404,contentType:path?.endsWith('.js')?'text/javascript':'text/html',body:path?fs.readFileSync(path,'utf8'):'not found'});
});
const available=['src/tools.json','src/new-tools.json','src/file-tools.json'].filter(p=>fs.existsSync(p)).flatMap(p=>JSON.parse(fs.readFileSync(p,'utf8')));
await page.goto('https://toolpivio.blogspot.com/');
await page.locator('#tool-search').fill('Profit Margin Calculator');assert.equal(await page.locator('.tp-card:visible').count(),1);
await page.locator('#tool-search').fill('');await page.getByRole('button',{name:'Video',exact:true}).click();assert.equal(await page.locator('.tp-card:visible').count(),available.filter(t=>t.category==='Video Production Calculators').length);await page.locator('#tool-search').fill('no-such-tool-0000');assert.equal(await page.locator('.tp-card:visible').count(),0);assert.ok(await page.locator('#no-tools').isVisible());await page.getByRole('button',{name:'Clear search and filters',exact:true}).click();assert.equal(await page.locator('.tp-card:visible').count(),available.length);
await page.evaluate(()=>{window.ToolPivioCatalog={version:3,tools:[{id:'roas',title:'ROAS Calculator',description:'Revenue per advertising spend.',category:'Digital Marketing Calculators',url:'https://toolpivio.blogspot.com/p/roas-calculator.html'},{id:'margin',title:'Profit Margin Calculator',description:'Profit as a percentage of revenue.',category:'E-commerce Calculators',url:'https://toolpivio.blogspot.com/p/profit-margin-calculator.html'},{id:'dpi',title:'Print DPI Calculator',description:'Check resolution.',category:'Packaging & Printing Tools',url:'https://toolpivio.blogspot.com/p/print-dpi-calculator.html'},{id:'evil',title:'Invalid tool',description:'not accepted',category:'Other',url:'javascript:alert(1)'}]};window.dispatchEvent(new Event('toolpivio:catalog'));});
assert.equal(await page.locator('.tp-card').count(),3);assert.equal(await page.getByText('Invalid tool',{exact:true}).count(),0);
for(const width of [360,768,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow at '+width);await page.screenshot({path:'work/v3-'+width+'.png',fullPage:true});}
await page.setViewportSize({width:360,height:1000});const menu=page.getByRole('button',{name:'Menu',exact:true});await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.locator('#tp-navigation a').first().focus();await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');assert.equal(await menu.evaluate(el=>el===document.activeElement),true);
for(const [id,values,expected] of [['roas',[5000,1000],'5×'],['margin',[100,60],'40%'],['dpi',[3000,2400,10,8],'300 PPI']]){
 await page.goto('https://toolpivio.blogspot.com/');
 await page.evaluate(id=>{const iframe=document.createElement('iframe');iframe.src='https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool='+id;iframe.title=id;iframe.style='width:100%;height:600px;border:0';document.querySelector('main').prepend(iframe);},id);
 const frame=page.frameLocator('iframe');const form=frame.locator('form');await form.waitFor();const inputs=form.locator('input');
 await page.waitForFunction(()=>{const frame=document.querySelector('iframe');return frame.getAttribute('height')&&frame.style.height!=='600px';});
 assert.equal(await frame.locator('#tool-title').evaluate(el=>el.getBoundingClientRect().height),1,'duplicate heading hidden visually');
 for(let i=0;i<values.length;i++)await inputs.nth(i).fill(String(values[i]));
 await form.getByRole('button',{name:'Calculate',exact:true}).click();assert.ok((await form.locator('.result').textContent()).includes(expected));
 await page.waitForTimeout(80);assert.ok(await frame.locator('main').evaluate(el=>el.getBoundingClientRect().height<=innerHeight),'iframe content clipped');
 const goodHeight=await page.locator('iframe').getAttribute('height');
 await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://evil.example',source:document.querySelector('iframe').contentWindow,data:{type:'ToolPivio:resize',height:999}})));
 assert.equal(await page.locator('iframe').getAttribute('height'),goodHeight,'foreign origin resized iframe');
 await inputs.first().fill('');assert.ok(await form.locator('.result').isHidden());await form.getByRole('button',{name:'Calculate',exact:true}).click();assert.ok((await form.locator('.error').textContent()).length>0);await form.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await inputs.first().inputValue(),'');
}
const preview=fs.readFileSync('dist/preview.html','utf8');const about=fs.readFileSync('pages/about.html','utf8');const fixture=preview.replace(/<main id="main">[\s\S]*?<\/main>/,'<div class="page"><div class="page_body"><div class="centered"><main id="main"><nav class="tp-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>About</span></nav><section id="page_body"><div class="Blog"><div class="blog-posts"><article class="post-outer-container"><div class="post-outer"><h3 class="post-title">About ToolPivio</h3><div class="post-body">'+about+'</div></div></article></div></div></section></main></div></div></div>');
await page.setContent(fixture);assert.ok(await page.locator('.post-body').isVisible());assert.ok((await page.locator('.post-body').innerText()).length>200);assert.ok(await page.locator('.tp-breadcrumbs').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'work/v3-native-about-fixture.png',fullPage:true});
await page.goto('https://sajidayoub.github.io/toolpivio-blogger/embed.html?tool=does-not-exist');assert.match(await page.locator('#tool-help').textContent(),/could not be found/);assert.equal(await page.locator('form').count(),0);
assert.deepEqual(errors,[]);await browser.close();console.log('V3 browser checks passed: catalog search/filter/empty state, safe catalog URLs, mobile menu/Escape, 360/768/1440px layouts, all existing calculator examples/validation/reset, visually hidden duplicate heading, checked iframe autoheight, unknown-tool handling, native page-body visibility fixture.');
})().catch(e=>{console.error(e);process.exit(1)});
