/* Real browser file processing and download checks with original local fixtures. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const ROOT = path.resolve(__dirname, '..');
const WORK = path.join(ROOT, 'work', 'file-browser');
const ids = ['image-resizer', 'image-compressor', 'image-converter', 'images-to-pdf', 'pdf-merge'];

(async () => {
  fs.mkdirSync(WORK, { recursive: true });
  const rgba = Buffer.alloc(640 * 480 * 4);
  for (let y = 0; y < 480; y++) for (let x = 0; x < 640; x++) { const i = (y * 640 + x) * 4; rgba[i] = x % 256; rgba[i + 1] = y % 256; rgba[i + 2] = (x + y) % 256; rgba[i + 3] = x < 20 && y < 20 ? 0 : 255; }
  const png = await sharp(rgba, { raw: { width: 640, height: 480, channels: 4 } }).png().toBuffer();
  const fixture = { name: 'original.png', mimeType: 'image/png', buffer: png };
  const server = http.createServer((req, res) => {
    if (req.url === '/assets/pdf-lib.min.js') { res.setHeader('content-type', 'text/javascript'); return res.end(fs.readFileSync(path.join(ROOT, 'src/vendor/pdf-lib.min.js'))); }
    res.setHeader('content-type', 'text/html');
    res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>File tests</title><style>' + fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8') + '</style></head><body><main class="page">' + ids.map(id => '<section><h1>' + id + '</h1><div data-file-id="' + id + '"></div></section>').join('') + '</main><script>' + fs.readFileSync(path.join(ROOT, 'src/image-tools.js'), 'utf8') + '</script><script>document.querySelectorAll("[data-file-id]").forEach(host=>ToolPivioFiles.mount(host,host.dataset.fileId))</script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
    const page = await browser.newPage({ acceptDownloads: true }); const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => requests.push(r.url()));
    await page.goto('http://127.0.0.1:' + server.address().port + '/');
    const tool = id => page.locator('[data-file-id="' + id + '"]');
    const upload = async (id, files) => { await tool(id).locator('[name=file]').setInputFiles(files); await page.waitForTimeout(60); };
    const processTool = async (id, filename) => {
      const form = tool(id); await form.getByRole('button', { name: 'Process', exact: true }).click();
      await form.locator('.file-preview').waitFor({ state: 'visible' });
      assert.equal(await form.locator('.error').textContent(), '');
      const [download] = await Promise.all([page.waitForEvent('download'), form.getByRole('link', { name: /^Download / }).click()]);
      const target = path.join(WORK, filename); await download.saveAs(target); return target;
    };
    const reset = async id => { const form = tool(id); await form.getByRole('button', { name: 'Reset', exact: true }).click(); assert.equal(await form.locator('[name=file]').inputValue(), ''); assert.ok(await form.locator('.result').isHidden()); assert.ok(await form.locator('.file-preview').isHidden()); assert.equal(await form.locator('.file-download').getAttribute('href'), null); };

    await tool('image-resizer').getByRole('button', { name: 'Process', exact: true }).click();
    assert.match(await tool('image-resizer').locator('.error').textContent(), /Choose an image first/);
    await upload('image-resizer', fixture);
    assert.equal(await tool('image-resizer').locator('[name=width]').inputValue(), '640');
    await tool('image-resizer').locator('[name=width]').fill('320');
    assert.equal(await tool('image-resizer').locator('[name=height]').inputValue(), '240');
    let output = await processTool('image-resizer', 'resized.png'); let metadata = await sharp(output).metadata();
    assert.equal(metadata.width, 320); assert.equal(metadata.height, 240); assert.equal(metadata.format, 'png');
    const pixel = await sharp(output).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer(); assert.equal(pixel[3], 0);
    await tool('image-resizer').locator('[name=ratio]').selectOption('no'); await tool('image-resizer').locator('[name=width]').fill('200'); await tool('image-resizer').locator('[name=height]').fill('150');
    output = await processTool('image-resizer', 'resized-exact.png'); metadata = await sharp(output).metadata(); assert.equal(metadata.width, 200); assert.equal(metadata.height, 150);
    await tool('image-resizer').locator('[name=width]').fill('0'); await tool('image-resizer').getByRole('button', { name: 'Process', exact: true }).click(); await page.waitForTimeout(60); assert.match(await tool('image-resizer').locator('.error').textContent(), /Width must/);
    await tool('image-resizer').locator('[name=width]').fill('12000'); await tool('image-resizer').locator('[name=height]').fill('12000'); await tool('image-resizer').getByRole('button', { name: 'Process', exact: true }).click(); await page.waitForTimeout(60); assert.match(await tool('image-resizer').locator('.error').textContent(), /32 million/);
    await reset('image-resizer');

    await upload('image-converter', fixture); await tool('image-converter').locator('[name=format]').selectOption('image/jpeg');
    output = await processTool('image-converter', 'converted.jpg'); metadata = await sharp(output).metadata(); assert.equal(metadata.format, 'jpeg'); assert.equal(metadata.width, 640);
    const white = await sharp(output).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer(); assert.ok(white[0] >= 245 && white[1] >= 245 && white[2] >= 245, 'Transparent input becomes white in JPEG');
    await tool('image-converter').locator('[name=format]').selectOption('image/webp'); output = await processTool('image-converter', 'converted.webp'); assert.equal((await sharp(output).metadata()).format, 'webp');
    await reset('image-converter');
    await upload('image-converter', { name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('not a valid PNG') });
    await tool('image-converter').getByRole('button', { name: 'Process', exact: true }).click(); await page.waitForTimeout(60); assert.match(await tool('image-converter').locator('.error').textContent(), /could not be decoded/);
    await upload('image-converter', { name: 'vector.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') }); assert.match(await tool('image-converter').locator('.error').textContent(), /JPG, PNG, or WebP/);
    await reset('image-converter');

    await upload('image-compressor', fixture); await tool('image-compressor').locator('[name=quality]').fill('60');
    output = await processTool('image-compressor', 'compressed.jpg'); metadata = await sharp(output).metadata(); assert.equal(metadata.format, 'jpeg'); assert.equal(metadata.width, 640); assert.equal(metadata.height, 480); assert.match(await tool('image-compressor').locator('.result').textContent(), /(?:smaller|larger)/);
    await reset('image-compressor');
    assert.equal(requests.filter(url => /pdf-lib/.test(url)).length, 0, 'Image tools do not load PDF library');

    await upload('images-to-pdf', [fixture, { ...fixture, name: 'second.png' }]);
    output = await processTool('images-to-pdf', 'images.pdf'); let document = await PDFDocument.load(fs.readFileSync(output)); assert.equal(document.getPageCount(), 2); assert.ok(Math.abs(document.getPages()[0].getWidth() - 595.276) < 0.1);
    execFileSync('python3', ['-c', 'from pypdf import PdfReader; import sys; r=PdfReader(sys.argv[1]); assert len(r.pages)==2; assert len(r.pages[0].images)==1', output]);
    await reset('images-to-pdf');

    const one = await PDFDocument.create(); one.addPage([300, 200]).drawText('First input'); const two = await PDFDocument.create(); two.addPage([400, 300]).drawText('Second input page one'); two.addPage([500, 400]).drawText('Second input page two');
    await upload('pdf-merge', [{ name: 'one.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await one.save()) }, { name: 'two.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await two.save()) }]);
    output = await processTool('pdf-merge', 'merged.pdf'); document = await PDFDocument.load(fs.readFileSync(output)); assert.equal(document.getPageCount(), 3); assert.deepEqual(document.getPages().map(p => p.getWidth()), [300, 400, 500]);
    execFileSync('python3', ['-c', 'from pypdf import PdfReader; import sys; r=PdfReader(sys.argv[1]); assert len(r.pages)==3; assert "First input" in r.pages[0].extract_text(); assert "Second input page two" in r.pages[2].extract_text()', output]);
    await reset('pdf-merge');
    await upload('pdf-merge', { name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nbroken') }); await tool('pdf-merge').getByRole('button', { name: 'Process', exact: true }).click(); await page.waitForTimeout(100); assert.match(await tool('pdf-merge').locator('.error').textContent(), /Cannot read/);
    await reset('pdf-merge');
    const encrypted = path.join(WORK, 'encrypted.pdf');
    execFileSync('python3', ['-c', 'from pypdf import PdfWriter; import sys; w=PdfWriter(); w.add_blank_page(width=200,height=200); w.encrypt("test-password"); w.write(sys.argv[1])', encrypted]);
    await upload('pdf-merge', encrypted); await tool('pdf-merge').getByRole('button', { name: 'Process', exact: true }).click(); await page.waitForTimeout(100); assert.match(await tool('pdf-merge').locator('.error').textContent(), /Password-protected/); await reset('pdf-merge');

    for (const id of ids) { await tool(id).getByRole('button', { name: /^Use sample/ }).click(); await page.waitForFunction(selected => document.querySelector('[data-file-id="' + selected + '"] input[type=file]').files.length > 0, id); await tool(id).getByRole('button', { name: 'Process', exact: true }).click(); await tool(id).locator('.file-preview').waitFor({ state: 'visible' }); assert.equal(await tool(id).locator('.error').textContent(), ''); await reset(id); }
    for (const width of [360, 768, 1440]) { await page.setViewportSize({ width, height: 1000 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow at ' + width); }
    assert.deepEqual(errors, []); assert.ok(requests.every(url => url.startsWith('http://127.0.0.1:') || url.startsWith('blob:')), 'No external requests');
    console.log('File browser checks passed: dimensions, ratio, exact resize, PNG alpha, JPEG white, WebP, compression size, corrupt/unsupported files, empty inputs, Reset, samples, image PDF, PDF merge order, independent pypdf parsing, 360/768/1440px overflow, no external requests.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
