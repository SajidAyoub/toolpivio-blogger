/* Local hosted guides and native-class Blogger fixtures; this is not a live Blogger test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGES = 'https://sajidayoub.github.io';
const PREFIX = '/toolpivio-blogger/';
const BLOG = 'https://toolpivio.blogspot.com';
const tools = [{id:'roas',file:'roas'},{id:'margin',file:'profit-margin'},{id:'dpi',file:'print-dpi'},...['new-tools','file-tools'].flatMap(name => JSON.parse(fs.readFileSync(path.join(ROOT,'src',name+'.json'))).map(t => ({id:t.id,file:t.id})))];
const infos = ['about','contact','privacy-policy','terms'];
const visual = JSON.parse(fs.readFileSync(path.join(ROOT,'src/v4/visuals.json')));
const widths = [360,390,768,1024,1440];
function fixture(id,file) {
  const title=visual[id].title.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const css=fs.readFileSync(path.join(ROOT,'src/v3/styles.css'),'utf8');
  const js=fs.readFileSync(path.join(ROOT,'src/v3/site.js'),'utf8');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:16px/1.6 system-ui;background:#f4f8f7;color:#12283e}main{max-width:1000px;margin:auto;padding:20px 16px}h1{font-size:28px;line-height:1.2}'+css+'</style></head><body><main id="main"><div class="tp-wrap tp-page-heading"><h1>'+title+'</h1></div><section id="page_body"><div class="Blog" id="Blog1"><article class="post-outer-container"><div class="post-body entry-content">'+fs.readFileSync(path.join(ROOT,'pages',file+'.html'),'utf8')+'</div></article></div></section></main><script>'+js+'</script></body></html>';
}
(async()=>{
  fs.mkdirSync(path.join(ROOT,'work'),{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const errors=[];
  const missing=[];
  context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
  await context.route('**/*', async route=>{
    const url=new URL(route.request().url());
    if(url.protocol==='blob:'||url.protocol==='data:')return route.continue();
    if(url.origin===BLOG&&url.pathname.startsWith('/fixture/')){
      const id=url.pathname.split('/').pop();const tool=tools.find(t=>t.id===id);
      return route.fulfill({contentType:'text/html',body:fixture(id,tool?tool.file:id)});
    }
    if(url.origin!==PAGES||!url.pathname.startsWith(PREFIX))return route.abort();
    const target=path.resolve(ROOT,'docs',decodeURIComponent(url.pathname.slice(PREFIX.length))||'index.html');
    if(!target.startsWith(path.join(ROOT,'docs')+path.sep)||!fs.existsSync(target)){missing.push(url.href);return route.abort();}
    const contentType=target.endsWith('.svg')?'image/svg+xml':target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/html';
    return route.fulfill({contentType,body:fs.readFileSync(target)});
  });
  try{
    const page=await context.newPage();
    for(const item of [...tools,...infos.map(id=>({id,file:id}))]){
      await page.goto(BLOG+'/fixture/'+item.id);
      assert.equal(await page.locator('h1').count(),1,item.id+' one theme heading');
      assert.equal(await page.locator('#Blog1 h1,#Blog1 meta,#Blog1 title,#Blog1 link[rel=canonical]').count(),0,item.id+' no body head markup');
      const banner=page.locator('[data-page-banner="'+item.id+'"]');
      await banner.locator('img').waitFor();
      assert.ok(await banner.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0),item.id+' artwork loads');
      assert.ok(await page.locator('.post-body').isVisible(),item.id+' native-class body visible');
      assert.equal(await page.locator('.tp-page-back-link').count(),1,item.id+' useful return CTA');
      for(const width of widths){
        await page.setViewportSize({width,height:1000});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),item.id+' '+width+' fixture overflow');
        assert.ok(await banner.evaluate(el=>el.getBoundingClientRect().height<255),item.id+' compact banner');
        if(width<=390&&tools.includes(item))assert.ok(await page.locator('iframe').evaluate(el=>el.getBoundingClientRect().top<740),item.id+' inputs near mobile page top');
        if(width===360&&['roas','image-resizer','about','privacy-policy'].includes(item.id))await page.screenshot({path:path.join(ROOT,'work','v4-banner-'+item.id+'-360.png'),fullPage:true});
      }
      if(['roas','image-resizer','about','privacy-policy'].includes(item.id))await page.screenshot({path:path.join(ROOT,'work','v4-banner-'+item.id+'.png'),fullPage:true});
      const hosted=tools.includes(item)?'tools/'+item.id+'.html':'info/'+item.id+'.html';
      await page.goto(PAGES+PREFIX+hosted);
      assert.equal(await page.locator('h1').count(),1,item.id+' one hosted heading');
      assert.equal(await page.locator('link[rel=canonical]').count(),1,item.id+' one canonical');
      for(const width of widths){
        await page.setViewportSize({width,height:1000});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),item.id+' '+width+' hosted overflow');
      }
    }
    // Legal and informational copy is available when JavaScript is disabled.
    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:900}});
    await nojs.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.origin!==PAGES||!url.pathname.startsWith(PREFIX))return route.abort();
      const target=path.resolve(ROOT,'docs',url.pathname.slice(PREFIX.length));
      if(!target.startsWith(path.join(ROOT,'docs')+path.sep)||!fs.existsSync(target))return route.abort();
      return route.fulfill({contentType:target.endsWith('.svg')?'image/svg+xml':'text/html',body:fs.readFileSync(target)});
    });
    const fallback=await nojs.newPage();
    for(const id of infos){await fallback.goto(PAGES+PREFIX+'info/'+id+'.html');assert.ok((await fallback.locator('.tp-page-article').innerText()).trim().length>80,id+' meaningful static copy');assert.ok(await fallback.locator('.tp-page-banner').isVisible());}
    await nojs.close();
    assert.deepEqual(errors,[]);
    assert.deepEqual(missing,[]);
    console.log('V4 banners: 23 unique loaded illustrations; 19 tool and 4 info Blogger fixtures + hosted pages; 360/390/768/1024/1440px; compact mobile inputs, canonical/headings, return panels and no-JS information copy passed.');
  } finally {await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
