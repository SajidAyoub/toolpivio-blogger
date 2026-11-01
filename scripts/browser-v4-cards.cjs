/* Exercise actual generated static HTML and the catalog event independently. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const BLOG='https://toolpivio.blogspot.com';
const PAGES='https://sajidayoub.github.io/toolpivio-blogger/';
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const catalogSandbox={window:{dispatchEvent(){}},Event:function(){}};
vm.runInNewContext(read('docs/catalog.v3.js'),catalogSandbox);
const records=JSON.parse(JSON.stringify(catalogSandbox.window.ToolPivioCatalog.tools));
const preview=read('dist/preview.html');
const widths=[360,390,768,1024,1440];
const expectedSnapshot=records.map(t=>({id:t.id,href:t.url,art:t.illustration,title:t.title}));
async function setup(page){
 await page.route(BLOG+'/**',route=>route.fulfill({contentType:'text/html',body:preview}));
 await page.route(PAGES+'**',route=>{const url=new URL(route.request().url());const rel=url.pathname.replace('/toolpivio-blogger/','');const local=path.resolve(ROOT,'docs',rel);if(!local.startsWith(path.join(ROOT,'docs')+path.sep)||!fs.existsSync(local))return route.fulfill({status:404,body:'not found'});return route.fulfill({contentType:local.endsWith('.svg')?'image/svg+xml':local.endsWith('.js')?'text/javascript':'text/html',body:fs.readFileSync(local)});});
}
async function snapshot(page){return page.locator('.tp-card').evaluateAll(cards=>cards.map(c=>({id:c.dataset.toolId,href:c.querySelector('a').href,art:c.querySelector('.tp-card-art')?.src,title:c.querySelector('h3').textContent})));}
async function assertCards(page, mode){
 assert.deepEqual(await snapshot(page),expectedSnapshot,mode+' catalog consistency');
 assert.equal(await page.locator('.tp-card').count(),19);
 assert.equal(await page.locator('.tp-card a').count(),19,'one link per card');
 assert.equal(await page.locator('.tp-card .tp-card-arrow').count(),19,'real SVG CTA arrows');
 assert.equal(await page.locator('.tp-card [tabindex]').count(),0,'no duplicate focus targets');
 const labels=await page.locator('.tp-card .tp-card-cta').allTextContents();assert.ok(labels.every(t=>t==='Open Tool'));
 assert.ok(!await page.locator('.tp-cards').innerText().then(t=>t.includes('&#8594;')||t.includes('&amp;')),'literal HTML entity visible');
 assert.equal(new Set(await page.locator('.tp-card-art').evaluateAll(imgs=>imgs.map(i=>i.src))).size,19,'unique per-tool artwork');
 for(const width of widths){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),mode+' overflow at '+width);const heights=await page.locator('.tp-card:visible').evaluateAll(cards=>cards.map(c=>c.getBoundingClientRect().height));assert.ok(heights.every(n=>n>220&&n<440),'card heights remain balanced');if(mode==='static')await page.screenshot({path:path.join(ROOT,'work','v4-cards-'+width+'.png'),fullPage:true});}
}
async function checkActivations(page, mode){
 const destinations=[];await page.route(BLOG+'/**',route=>{const request=route.request();const url=new URL(request.url());if(url.pathname!=='/'){destinations.push(request.url());return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Tool destination</title><p>Destination fixture</p>'});}return route.fulfill({contentType:'text/html',body:preview});});
 await page.route(PAGES+'tools/**',route=>{destinations.push(route.request().url());return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Tool destination</title>'});});
 async function reset(){await page.goto(BLOG+'/');if(mode==='dynamic')await page.evaluate(records=>{window.ToolPivioCatalog={version:3,tools:records};window.dispatchEvent(new Event('toolpivio:catalog'));},records);}
 for(const tool of records){await reset();const card=page.locator('[data-tool-id="'+tool.id+'"]');await card.scrollIntoViewIfNeeded();await card.locator('.tp-card-art').evaluate(img=>img.decode());await card.click({position:{x:Math.floor((await card.boundingBox()).width/2),y:Math.floor((await card.boundingBox()).height/2)}});await page.waitForURL(tool.url);assert.equal(destinations.at(-1),tool.url,mode+' center '+tool.id);}
 for(const spot of ['top-left','top-right','bottom-left','bottom-right','cta','keyboard']){await reset();const tool=records[0];const card=page.locator('[data-tool-id="'+tool.id+'"]');await card.scrollIntoViewIfNeeded();const box=await card.boundingBox();if(spot==='cta')await card.locator('.tp-card-cta').click();else if(spot==='keyboard'){await card.locator('a').focus();await page.keyboard.press('Enter');}else await card.click({position:{x:spot.endsWith('right')?box.width-7:7,y:spot.startsWith('bottom')?box.height-7:7}});await page.waitForURL(tool.url);assert.equal(destinations.at(-1),tool.url,mode+' '+spot);}
}
(async()=>{
 fs.mkdirSync(path.join(ROOT,'work'),{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const errors=[];
 for(const mode of ['static','dynamic']){
  const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await setup(page);await page.goto(BLOG+'/');
  if(mode==='dynamic')await page.evaluate(records=>{window.ToolPivioCatalog={version:3,tools:records};window.dispatchEvent(new Event('toolpivio:catalog'));},records);
  await assertCards(page,mode);
  await page.locator('#tool-search').fill('does-not-match-0000');assert.equal(await page.locator('.tp-card:visible').count(),0);assert.ok(await page.locator('#no-tools').isVisible());await page.getByRole('button',{name:'Clear search and filters',exact:true}).click();assert.equal(await page.locator('.tp-card:visible').count(),19);
  for(const category of new Set(records.map(t=>t.category))){await page.locator('[data-filter="'+category+'"]').click();assert.equal(await page.locator('.tp-card:visible').count(),records.filter(t=>(t.categories||t.category).split('|').includes(category)).length);}await page.locator('[data-filter="All tools"]').click();
  const first=page.locator('.tp-card').first();await first.scrollIntoViewIfNeeded();const text=first.locator('p:not(.tp-tag)').first();const textBox=await text.evaluate(el=>{const r=document.createRange();r.setStart(el.firstChild,0);r.setEnd(el.firstChild,1);const rect=r.getBoundingClientRect();return {x:rect.x,y:rect.y,width:el.clientWidth,height:rect.height};});await page.mouse.move(textBox.x+1,textBox.y+textBox.height/2);await page.mouse.down();await page.mouse.move(textBox.x+Math.min(textBox.width-2,180),textBox.y+textBox.height/2,{steps:15});await page.mouse.up();assert.ok(await page.evaluate(()=>window.getSelection().toString().length>3),'card text remains selectable by pointer drag');assert.equal(page.url(),BLOG+'/','selection does not activate link');await page.evaluate(()=>window.getSelection().removeAllRanges());await first.hover();await page.waitForTimeout(250);const hoverOpacity=await first.locator('.tp-card-art').evaluate(img=>Number(getComputedStyle(img).opacity));assert.ok(hoverOpacity>=.1&&hoverOpacity<=.25,'hover art gentle');await first.locator('a').focus();await page.waitForTimeout(250);assert.ok(await first.evaluate(c=>getComputedStyle(c).borderTopColor==='rgb(8, 127, 117)'));assert.ok(await first.locator('a').evaluate(a=>getComputedStyle(a).outlineWidth==='3px'));await page.screenshot({path:path.join(ROOT,'work','v4-'+mode+'-focus.png'),fullPage:true});
  if(mode==='dynamic'){await page.evaluate(records=>{const copies=records.map((t,i)=>({...t,illustration:i===0?'https://evil.example/tracker.svg':t.illustration}));copies.push({id:'evil',title:'Malicious',category:'Bad',description:'Bad',url:'javascript:alert(1)',illustration:'https://evil.example/tracker.svg'});window.ToolPivioCatalog={version:3,tools:copies};window.dispatchEvent(new Event('toolpivio:catalog'));},records);assert.equal(await page.locator('.tp-card').count(),19);assert.equal(await page.locator('.tp-card').first().locator('img').count(),0,'untrusted illustration URL rejected');}
  await checkActivations(page,mode);await context.close();
 }
 const noJS=await browser.newContext({javaScriptEnabled:false});const noPage=await noJS.newPage();await setup(noPage);await noPage.goto(BLOG+'/');await assertCards(noPage,'JavaScript disabled');await noPage.locator('.tp-card').first().click({position:{x:10,y:10}});await noPage.waitForURL(records[0].url);await noJS.close();
 const touch=await browser.newContext({viewport:{width:390,height:1000},isMobile:true,hasTouch:true});const touchPage=await touch.newPage();await setup(touchPage);await touchPage.goto(BLOG+'/');const touchArt=touchPage.locator('.tp-card-art').first();assert.ok(await touchArt.evaluate(i=>Number(getComputedStyle(i).opacity)>0),'touch art visible at rest');await touchPage.screenshot({path:path.join(ROOT,'work','v4-touch-390.png'),fullPage:true});await touch.close();
 const reduced=await browser.newContext({reducedMotion:'reduce'});const reducedPage=await reduced.newPage();await setup(reducedPage);await reducedPage.goto(BLOG+'/');const reducedCard=reducedPage.locator('.tp-card').first();await reducedCard.hover();assert.equal(await reducedCard.evaluate(c=>getComputedStyle(c).transform),'none');assert.equal(await reducedCard.locator('.tp-card-art').evaluate(i=>getComputedStyle(i).transitionDuration),'0s');await reduced.close();
 assert.deepEqual(errors,[]);await browser.close();console.log('V4 card checks passed: 19 distinct SVGs, static/dynamic/no-JS catalog parity, center/corners/CTA/Enter navigation, same-tab links, filters, 360/390/768/1024/1440px layouts, focus/hover/touch/reduced motion and safe illustration URLs.');
})().catch(e=>{console.error(e);process.exit(1)});
