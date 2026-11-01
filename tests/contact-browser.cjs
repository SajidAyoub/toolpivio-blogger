/* Provider requests are intercepted. This test never sends a message or enables production delivery. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const HOST = 'https://sajidayoub.github.io';
const PREFIX = '/toolpivio-blogger/';
const PROVIDER = 'https://formspree.io/f/mocktest1';
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'toolpivio-contact-test-'));
const builder = String.raw`import json,shutil,sys
from pathlib import Path
repo,scratch=map(Path,sys.argv[1:])
sys.path.insert(0,str(repo/'scripts'))
import build_contact,visuals
for name,endpoint in [('inactive',''),('configured','https://formspree.io/f/mocktest1')]:
 target=scratch/name
 shutil.copytree(repo/'src/contact',target/'src/contact')
 (target/'docs').mkdir()
 (target/'pages').mkdir()
 (target/'src/contact/config.json').write_text(json.dumps({'endpoint':endpoint}))
 build_contact.build(target)
 assets=visuals.ROOT/'docs/assets/v4'
 if assets.exists(): shutil.copytree(assets,target/'docs/assets/v4',dirs_exist_ok=True)
`;
const built = spawnSync('python3', ['-c',builder,ROOT,scratch], {encoding:'utf8'});
assert.equal(built.status, 0, built.stderr);

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
  let mode = 'inactive';
  let providerResponse = {status:200, body:{ok:true}};
  let requests = [];
  let releaseRequest;
  const errors = [], logs = [], external = [];
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => logs.push(message.text()));
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === 'https://formspree.io') {
        assert.equal(url.href, PROVIDER);
        assert.equal(request.method(), 'POST');
        requests.push({headers:request.headers(), data:request.postData()});
        if (providerResponse.pending) await new Promise(resolve => {releaseRequest=resolve;});
        if (providerResponse.abort) return route.abort('failed');
        return route.fulfill({status:providerResponse.status, contentType:providerResponse.contentType || 'application/json', body:typeof providerResponse.body === 'string' ? providerResponse.body : JSON.stringify(providerResponse.body)});
      }
      if (url.origin !== HOST || !url.pathname.startsWith(PREFIX)) {external.push(url.href);return route.abort();}
      let relative = decodeURIComponent(url.pathname.slice(PREFIX.length));
      const target = path.resolve(scratch, mode, 'docs', relative);
      assert.ok(target.startsWith(path.join(scratch,mode,'docs')+path.sep));
      if (!fs.existsSync(target)) throw new Error('Missing contact fixture asset: '+relative);
      const contentType = target.endsWith('.js') ? 'text/javascript' : target.endsWith('.css') ? 'text/css' : target.endsWith('.svg') ? 'image/svg+xml' : 'text/html';
      return route.fulfill({contentType,body:fs.readFileSync(target)});
    });
    async function open(next='configured') {
      mode=next;requests=[];
      await page.goto(HOST+PREFIX+'contact.html');
      await page.locator('#contact-copy').waitFor();
    }
    async function fill() {
      await page.locator('#contact-name').fill('Example Visitor');
      await page.locator('#contact-email').fill('visitor@example.test');
      await page.locator('#contact-reason').selectOption('Tool issue');
      await page.locator('#contact-url').fill('https://toolpivio.blogspot.com/p/roas-calculator.html');
      await page.locator('#contact-message').fill('This is a fictional contact test with a useful reproduction description.');
      const consent=page.locator('#contact-consent');
      if (await consent.count()) await consent.check();
    }
    async function outcome() {await page.waitForFunction(()=>document.querySelector('#contact-form').getAttribute('aria-busy')!=='true' && (document.querySelector('#contact-status').textContent || document.querySelector('#contact-error').textContent));}
    await open('inactive');
    fs.mkdirSync(path.join(ROOT,'work'),{recursive:true});
    await page.setViewportSize({width:390,height:1000});
    await page.screenshot({path:path.join(ROOT,'work/contact-inactive-390.png'),fullPage:true});
    assert.equal(await page.locator('#contact-form').evaluate(el=>el.tagName),'DIV');
    assert.equal(await page.locator('button[type=submit]').count(),0);
    assert.ok((await page.locator('.contact-state').textContent()).includes('not set up'));
    await fill();
    await page.locator('#contact-email').press('Enter');
    assert.equal(requests.length,0);
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('clipboard blocked');}}}));
    await page.locator('#contact-copy').click();
    assert.ok(await page.locator('#contact-draft').isVisible());
    assert.ok((await page.locator('#contact-draft-text').inputValue()).includes('Example Visitor'));
    assert.ok((await page.locator('#contact-status').textContent()).includes('No message was submitted'));
    await page.locator('#contact-clear').click();
    assert.equal(await page.locator('#contact-name').inputValue(),'');
    assert.equal(await page.locator('#contact-draft-text').inputValue(),'');
    assert.equal(requests.length,0);
    await open();
    assert.equal(await page.locator('form').getAttribute('method'),'POST');
    assert.equal(await page.locator('form').getAttribute('action'),PROVIDER);
    assert.equal(await page.locator('form').getAttribute('target'),'_blank');
    await page.locator('#contact-send').click();
    assert.equal(requests.length,0);
    assert.ok((await page.locator('#contact-error').textContent()).includes('full name'));
    await fill();
    await page.locator('#contact-consent').uncheck();
    await page.locator('#contact-send').click();
    assert.ok((await page.locator('#contact-error').textContent()).includes('privacy consent'));
    assert.equal(requests.length,0);
    await page.locator('#contact-consent').check();
    await page.locator('#contact-email').fill('invalid-email');
    await page.locator('#contact-send').click();
    assert.equal(requests.length,0);
    assert.equal(await page.locator('#contact-email').getAttribute('aria-invalid'),'true');
    await fill();
    await page.locator('#contact-url').fill('javascript:alert(1)');
    await page.locator('#contact-send').click();
    assert.equal(requests.length,0);
    assert.ok((await page.locator('#contact-error').textContent()).includes('public http'));
    await fill();
    await page.locator('#contact-message').fill('too short');
    await page.locator('#contact-send').click();
    assert.equal(requests.length,0);
    await fill();
    await page.locator('#contact-message').evaluate(el=>{el.value='x'.repeat(4001);});
    await page.locator('#contact-send').click();
    assert.equal(requests.length,0);
    await fill();
    await page.locator('#contact-gotcha').evaluate(el=>{el.value='bot';});
    await page.locator('#contact-send').click();
    assert.equal(requests.length,0);
    assert.ok((await page.locator('#contact-error').textContent()).includes('could not be accepted'));
    await page.locator('#contact-gotcha').evaluate(el=>{el.value='';});
    providerResponse={status:200,body:{ok:true},pending:true};
    await page.locator('#contact-send').click();
    await page.waitForFunction(()=>document.querySelector('#contact-form').getAttribute('aria-busy')==='true');
    assert.ok(await page.locator('#contact-send').isDisabled());
    assert.ok(await page.locator('#contact-clear').isDisabled());
    assert.ok(await page.locator('#contact-message').getAttribute('readonly')!==null);
    await page.locator('form').evaluate(el=>{el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
    await page.waitForTimeout(80);
    assert.equal(requests.length,1,'duplicate in-flight submit suppressed');
    assert.ok((await page.locator('#contact-status').textContent()).includes('Submitting'));
    releaseRequest();
    await outcome();
    assert.ok((await page.locator('#contact-status').textContent()).includes('Formspree accepted'));
    assert.ok((await page.locator('#contact-status').textContent()).includes('Inbox delivery'));
    assert.ok(await page.locator('#contact-send').isDisabled());
    assert.ok((await page.locator('#contact-message').inputValue()).length>20);
    assert.equal(requests[0].headers.accept,'application/json');
    assert.ok(requests[0].data.includes('name="email"'));
    assert.ok(requests[0].data.includes('name="_gotcha"'));
    assert.ok(!requests[0].data.includes('name="from"'));
    await page.locator('form').evaluate(el=>{el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
    assert.equal(requests.length,1,'accepted duplicate suppressed');
    await page.locator('#contact-message').fill('A different fictional message has enough details for another request.');
    assert.ok(await page.locator('#contact-send').isEnabled());
    for (const response of [{status:200,body:{ok:false}},{status:200,body:{ok:true,errors:[{message:'Rejected'}]}},{status:422,body:{errors:[{message:'Invalid data'}]}},{status:429,body:{error:'Limit'}},{status:500,body:{error:'Unavailable'}},{status:200,body:'not json',contentType:'text/html'},{abort:true}]) {
      await open();await fill();providerResponse=response;
      await page.locator('#contact-send').click();await outcome();
      assert.equal(requests.length,1);
      assert.ok((await page.locator('#contact-error').textContent()).length>0);
      assert.ok(!(await page.locator('#contact-status').textContent()).includes('accepted your message'));
      assert.ok((await page.locator('#contact-message').inputValue()).length>20);
      assert.ok(await page.locator('#contact-send').isEnabled());
      await page.waitForTimeout(80);
      assert.equal(requests.length,1,'no automatic POST retry');
    }
    for(const width of [360,390,768,1024,1440]){
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' contact overflow');
    }
    fs.mkdirSync(path.join(ROOT,'work'),{recursive:true});
    await page.screenshot({path:path.join(ROOT,'work/contact-configured-test-1440.png'),fullPage:true});
    await page.setViewportSize({width:390,height:1000});
    await page.screenshot({path:path.join(ROOT,'work/contact-configured-test-390.png'),fullPage:true});
    await page.goto(HOST+PREFIX+'info/contact.html');
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://toolpivio.blogspot.com/p/contact.html');
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,follow');
    assert.equal(errors.length,0,errors.join('\n'));
    assert.ok(!logs.some(message=>message.includes('Example Visitor')||message.includes('visitor@example.test')),'no PII logging');
    assert.deepEqual(external,[]);
    // Native HTML fallback remains usable with JavaScript disabled, without sending a test message.
    const nojs=await browser.newContext({javaScriptEnabled:false});
    let nojsMode='configured';
    await nojs.route('**/*',async route=>{
      const url=new URL(route.request().url());
      assert.equal(url.origin,HOST);
      const relative=url.pathname.slice(PREFIX.length);
      const target=path.join(scratch,nojsMode,'docs',relative);
      return route.fulfill({contentType:target.endsWith('.css')?'text/css':target.endsWith('.svg')?'image/svg+xml':'text/html',body:fs.readFileSync(target)});
    });
    const native=await nojs.newPage();await native.goto(HOST+PREFIX+'contact.html');
    assert.equal(await native.locator('form').getAttribute('action'),PROVIDER);
    assert.equal(await native.locator('form').getAttribute('method'),'POST');
    assert.ok(await native.locator('#contact-send').isVisible());
    assert.ok(await native.locator('#contact-copy').isHidden());
    assert.equal(await native.locator('form').getAttribute('novalidate'),null);
    nojsMode='inactive';await native.goto(HOST+PREFIX+'contact.html');
    assert.equal(await native.locator('form').count(),0);
    assert.equal(await native.locator('button[type=submit]').count(),0);
    await nojs.close();await context.close();
    console.log('Contact browser: inactive local draft, strict validation/consent/honeypot, accepted vs delivered copy, provider rejection/422/429/network, duplicate prevention, preserved drafts, no automatic retries or PII logs, native fallback and five responsive widths passed. No message was sent.');
  } finally {await browser.close();fs.rmSync(scratch,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exit(1);});
