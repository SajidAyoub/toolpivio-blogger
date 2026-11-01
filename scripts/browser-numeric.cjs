const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const read=p=>fs.readFileSync(root+'/'+p,'utf8');
const ids=['roas','margin','dpi',...JSON.parse(read('src/new-tools.json')).map(t=>t.id)];
const expected={roas:'5×',margin:'40%',dpi:'300 PPI',cpc:'2 (',cpm:'5 (',ctr:'2.5%',cpa:'20 (',discount:'60 (',markup:'66.6667%','break-even':'100','bleed-trim':'216 × 303 mm','print-size':'10 × 8 in','video-size':'60.96 MB','frames-duration':'10 seconds'};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const id of ids){
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+read('src/styles.css')+'</style></head><body><main style="max-width:900px;margin:auto;padding:12px"><div data-tool="'+id+'"></div></main><script>'+read('src/calculators.js')+'</script><script>'+read('src/tool-definitions.js')+'</script><script>'+read('src/app.js')+'</script></body></html>');
  const form=page.locator('form');await form.getByRole('button',{name:'Calculate',exact:true}).click();assert.ok((await form.locator('.error').textContent()).length>0,id+' validates missing values');
  await form.getByRole('button',{name:'Use example',exact:true}).click();await form.locator('input:not([disabled])').first().press('Enter');assert.ok((await form.locator('.result').textContent()).includes(expected[id]),id+' sample result');
  const first=form.locator('input:not([disabled])').first();await first.fill('-1');assert.ok(await form.locator('.result').isHidden(),id+' clears stale result');await form.getByRole('button',{name:'Calculate',exact:true}).click();assert.ok((await form.locator('.error').textContent()).length>0,id+' rejects negative');
  await form.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await first.inputValue(),'');assert.ok(await form.locator('.result').isHidden());assert.equal(await form.locator('.error').textContent(),'');
  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' no overflow at '+width);}
 }
 await page.setContent('<div data-tool="video-size"></div><script>'+read('src/calculators.js')+'</script><script>'+read('src/tool-definitions.js')+'</script><script>'+read('src/app.js')+'</script>');
 const form=page.locator('form');await form.getByRole('button',{name:'Use example',exact:true}).click();await form.locator('[name=mode]').selectOption('bitrate');assert.ok(await form.locator('[name=videoMbps]').isDisabled());assert.ok(await form.locator('[name=fileMB]').isEnabled());await form.getByRole('button',{name:'Calculate',exact:true}).click();assert.ok((await form.locator('.result').textContent()).includes('8 Mbps'));await form.getByRole('button',{name:'Reset',exact:true}).click();await page.waitForTimeout(20);assert.equal(await form.locator('[name=mode]').inputValue(),'size');assert.ok(await form.locator('[name=fileMB]').isDisabled());
 // Exercise unit selectors and the alternate frames-to-duration direction in real DOM forms.
 for(const [id,selections,expectedText]of[
  ['dpi',{unit:'cm'},'762 PPI'],
  ['bleed-trim',{unit:'in'},'216 × 303 in'],
  ['print-size',{to:'mm'},'254 × 203.2 mm'],
  ['frames-duration',{mode:'duration'},'9,000']
 ]){
  await page.setContent('<div data-tool="'+id+'"></div><script>'+read('src/calculators.js')+'</script><script>'+read('src/tool-definitions.js')+'</script><script>'+read('src/app.js')+'</script>');
  const current=page.locator('form');await current.getByRole('button',{name:'Use example',exact:true}).click();for(const [name,value]of Object.entries(selections))await current.locator('[name="'+name+'"]').selectOption(value);await current.getByRole('button',{name:'Calculate',exact:true}).click();assert.ok((await current.locator('.result').textContent()).includes(expectedText),id+' alternate selection');
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('Numeric browser: 14 tools, examples, Enter submission, missing/negative validation, stale-result clearing, Reset, bitrate mode, and 360/768/1440px checks passed.');
})().catch(e=>{console.error(e);process.exit(1);});
