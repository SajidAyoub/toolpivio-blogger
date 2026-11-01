/* Exercise generated Pages documents and embeds together, without external requests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const origin = 'https://sajidayoub.github.io';
const prefix = '/toolpivio-blogger/';
const numeric = ['roas', 'margin', 'dpi', ...JSON.parse(fs.readFileSync(path.join(ROOT, 'src/new-tools.json'))).map(t => t.id)];
const files = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/file-tools.json'))).map(t => t.id);

(async () => {
  fs.mkdirSync(path.join(ROOT, 'work'), {recursive:true});
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.protocol === 'blob:' || url.protocol === 'data:') return route.continue();
      if (url.origin !== origin || !url.pathname.startsWith(prefix)) {external.push(url.href); return route.abort();}
      const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
      const target = path.resolve(ROOT, 'docs', relative);
      if (!target.startsWith(path.join(ROOT, 'docs') + path.sep) || !fs.existsSync(target)) throw Error('Missing generated asset: ' + relative);
      const contentType = target.endsWith('.js') ? 'text/javascript' : target.endsWith('.xml') ? 'application/xml' : 'text/html';
      return route.fulfill({contentType,body:fs.readFileSync(target)});
    });
    await page.goto(origin + prefix);
    assert.equal(await page.locator('.tp-card').count(), numeric.length + files.length);
    await page.locator('#tool-search').fill('video');
    assert.equal(await page.locator('.tp-card:visible').count(), 2);
    await page.locator('#tool-search').fill('');
    for (const width of [360,768,1440]) {
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({path:path.join(ROOT, 'work', 'complete-home-' + width + '.png'), fullPage:true});
    }
    for (const id of [...numeric, ...files]) {
      await page.goto(origin + prefix + 'tools/' + id + '.html');
      assert.equal(await page.locator('h1').count(), 1, id + ' single guide heading');
      assert.equal(await page.locator('link[rel=canonical]').count(), 1);
      const iframe = page.locator('iframe');
      const frame = page.frameLocator('iframe');
      const form = frame.locator('form');
      await form.waitFor();
      assert.equal(await frame.locator('#calculator-host').getAttribute('data-tool'), id);
      assert.equal(await frame.locator('#tool-title').evaluate(el => el.getBoundingClientRect().height), 1);
      if (numeric.includes(id)) {
        await form.getByRole('button', {name:'Use example',exact:true}).click();
        await form.getByRole('button', {name:'Calculate',exact:true}).click();
        assert.ok(await form.locator('.result').isVisible(), id + ' generated numeric result');
      } else {
        await form.getByRole('button', {name:/^Use sample /}).click();
        await form.locator('[name=file]').evaluate(async el => {
          const started = Date.now();
          while (!el.files.length && Date.now() - started < 5000) await new Promise(resolve => setTimeout(resolve, 20));
          if (!el.files.length) throw Error('Sample did not populate file input');
        });
        await form.getByRole('button', {name:'Process',exact:true}).click();
        await form.locator('.file-preview').waitFor({state:'visible'});
        assert.ok(await form.locator('.file-download').getAttribute('href'));
      }
      assert.equal(await form.locator('.error').textContent(), '', id + ' no processing errors');
      for (const width of [360,1440]) {
        await page.setViewportSize({width,height:1000});
        await page.waitForTimeout(80);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), id + ' guide overflow');
        assert.ok(await frame.locator('html').evaluate(el => el.scrollWidth <= innerWidth), id + ' embed overflow');
        assert.ok(await frame.locator('main').evaluate(el => el.getBoundingClientRect().height <= innerHeight + 2), id + ' fits resized iframe');
      }
      if (id === 'roas' || id === 'image-resizer') await page.screenshot({path:path.join(ROOT, 'work', id + '-guide.png'),fullPage:true});
      await form.getByRole('button', {name:'Reset',exact:true}).click();
      assert.ok(await form.locator('.result').isHidden(), id + ' reset');
      if (files.includes(id)) assert.equal(await form.locator('.file-download').getAttribute('href'), null);
      assert.ok(Number(await iframe.getAttribute('height')) > 100);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log('Integration: 19 generated guides, actual embeds, examples/processing/Reset, local PDF assets, canonical/headings, catalog and responsive autoheight passed.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exit(1);});
