/* ToolPivio file tools. User files stay in this browser. Original code; PDF support uses bundled MIT pdf-lib. */
(function (root) {
  'use strict';
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE = 20 * 1024 * 1024, MAX_TOTAL = 60 * 1024 * 1024, MAX_PIXELS = 32000000;
  const FILE_IDS = ['image-resizer', 'image-compressor', 'image-converter', 'images-to-pdf', 'pdf-merge'];
  let sequence = 0, pdfPromise;

  function positive(value, label, max = 12000) {
    const n = Number(value);
    if (String(value).trim() === '' || !Number.isInteger(n) || n < 1 || n > max) throw Error(label + ' must be a whole number from 1 to ' + max + '.');
    return n;
  }
  function dimensions(width, height) {
    positive(width, 'Width'); positive(height, 'Height');
    if (width * height > MAX_PIXELS) throw Error('Choose dimensions totaling at most 32 million pixels.');
  }
  function bytes(n) { return n < 1024 * 1024 ? (n / 1024).toFixed(1) + ' KB' : (n / 1024 / 1024).toFixed(2) + ' MB'; }
  function checkFiles(files, type, multiple) {
    if (!files.length) throw Error('Choose ' + (type === 'pdf' ? 'PDF files' : 'an image') + ' first.');
    if (files.length > (multiple ? 10 : 1)) throw Error('Choose at most ' + (multiple ? 10 : 1) + ' files.');
    if (files.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL) throw Error('Keep the combined input below 60 MB.');
    files.forEach(file => {
      if (file.size === 0 || file.size > MAX_FILE) throw Error('Each file must contain data and be no larger than 20 MB.');
      if (type === 'pdf' ? file.type !== 'application/pdf' : !IMAGE_TYPES.includes(file.type)) throw Error(type === 'pdf' ? 'Choose PDF files only.' : 'Choose JPG, PNG, or WebP images only. Animated formats and SVG are not supported.');
    });
  }
  async function readImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      try { await img.decode(); } catch (_) { throw Error('This image could not be decoded. Choose an undamaged JPG, PNG, or WebP file.'); }
      dimensions(img.naturalWidth, img.naturalHeight);
      return img;
    } finally { URL.revokeObjectURL(url); }
  }
  function canvasFor(image, width, height, mime) {
    dimensions(width, height);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw Error('Your browser could not create an image canvas.');
    if (mime === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); }
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  }
  function encode(canvas, mime, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (!blob) return reject(Error('The browser could not encode this image. Try smaller dimensions.'));
      if (blob.type !== mime) return reject(Error('Your browser cannot encode this format. Choose JPG or PNG.'));
      resolve(blob);
    }, mime, quality));
  }
  function pdfLibrary() {
    if (root.PDFLib) return Promise.resolve(root.PDFLib);
    if (!pdfPromise) pdfPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(location.pathname.includes('/tools/') ? '../assets/pdf-lib.min.js' : 'assets/pdf-lib.min.js', location.href).href;
      script.onload = () => root.PDFLib ? resolve(root.PDFLib) : reject(Error('PDF support could not load. Reload and try again.'));
      script.onerror = () => { pdfPromise = null; script.remove(); reject(Error('PDF support could not load. Reload and try again.')); };
      document.head.appendChild(script);
    });
    return pdfPromise;
  }
  const field = (prefix, name, label, markup) => '<div><label for="' + prefix + '-' + name + '">' + label + '</label>' + markup.replace(/@@ID@@/g, prefix + '-' + name) + '</div>';
  function mount(host, id) {
    if (!FILE_IDS.includes(id)) return false;
    const pdf = id === 'pdf-merge' || id === 'images-to-pdf', merge = id === 'pdf-merge', resize = id === 'image-resizer';
    const prefix = 'files-' + sequence++;
    const form = document.createElement('form'); form.className = 'calculator file-tool'; form.noValidate = true;
    let markup = field(prefix, 'file', merge ? 'PDF files (in merge order)' : pdf ? 'Images (one per PDF page, in selected order)' : 'Image file', '<input id="@@ID@@" name="file" type="file" accept="' + (merge ? 'application/pdf' : 'image/jpeg,image/png,image/webp') + '"' + (pdf ? ' multiple' : '') + ' required>');
    if (!pdf) {
      if (resize) markup += field(prefix, 'width', 'Output width (pixels)', '<input id="@@ID@@" name="width" type="number" min="1" max="12000" step="1" value="1024" required>') + field(prefix, 'height', 'Output height (pixels)', '<input id="@@ID@@" name="height" type="number" min="1" max="12000" step="1" value="768" required>') + field(prefix, 'ratio', 'Keep original proportions', '<select id="@@ID@@" name="ratio"><option value="yes">Yes — height follows width</option><option value="no">No — use both dimensions</option></select>');
      markup += field(prefix, 'format', 'Output format', '<select id="@@ID@@" name="format">' + (id === 'image-compressor' ? '' : '<option value="image/png">PNG (lossless)</option>') + '<option value="image/jpeg"' + (id === 'image-compressor' ? ' selected' : '') + '>JPG (white background)</option><option value="image/webp">WebP</option></select>') + field(prefix, 'quality', 'JPG / WebP quality (1–100)', '<input id="@@ID@@" name="quality" type="number" min="1" max="100" step="1" value="80" required>');
    } else if (!merge) {
      markup += field(prefix, 'paper', 'PDF paper size', '<select id="@@ID@@" name="paper"><option value="a4">A4 (210 × 297 mm)</option><option value="letter">US Letter (8.5 × 11 inches)</option></select>') + field(prefix, 'orientation', 'Page orientation', '<select id="@@ID@@" name="orientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>') + field(prefix, 'margin', 'Page margin (mm)', '<input id="@@ID@@" name="margin" type="number" min="0" max="50" step="1" value="10" required>') + field(prefix, 'quality', 'Embedded image quality (1–100)', '<input id="@@ID@@" name="quality" type="number" min="1" max="100" step="1" value="85" required>');
    }
    form.innerHTML = '<div class="fields">' + markup + '</div><p class="file-details" role="status">' + (pdf ? 'Up to 10 files; 20 MB per file, 60 MB total. Selection order is output order.' : 'JPG, PNG, or WebP; up to 20 MB and 32 million pixels. Your file stays on this device.') + '</p><p class="error" role="alert"></p><div class="actions"><button type="submit" class="primary">Process</button><button type="reset" class="secondary">Reset</button><button type="button" class="secondary sample-file">Use sample ' + (merge ? 'PDFs' : 'image') + '</button></div><div class="result" role="status" aria-live="polite" hidden></div><div class="file-preview" hidden><img alt="Processed image preview" style="max-width:100%;height:auto;display:block;margin:12px 0;border:1px solid #dae4e9"><a class="file-download" download>Download result</a></div><p class="file-limitations">' + (merge ? 'Merge up to 200 pages. Password-protected or damaged files are unsupported. Page content is copied; signatures, bookmarks, document-level forms and metadata are not preserved. Review the output before sharing.' : pdf ? 'Each image is fitted inside one page without cropping. Images are converted to JPG with a white background. The PDF contains pictures, not searchable text.' : 'PNG quality is lossless; quality applies only to JPG and WebP. JPG replaces transparency with white. Re-encoding removes most metadata; animation is not preserved. A smaller file is not guaranteed.') + '</p>';
    form.querySelector('.actions').style.flexWrap = 'wrap';
    form.querySelectorAll('.fields > div').forEach(element => { element.style.minWidth = '0'; });
    form.style.overflowWrap = 'anywhere';
    if (resize) form.elements.height.disabled = true;
    const input = form.elements.file, error = form.querySelector('.error'), result = form.querySelector('.result'), preview = form.querySelector('.file-preview'), previewImage = preview.querySelector('img'), download = preview.querySelector('a'), processButton = form.querySelector('[type=submit]'), sample = form.querySelector('.sample-file');
    let generation = 0, outputURL = '', originalWidth = 0, originalHeight = 0;
    function clean() {
      generation++; error.textContent = ''; result.textContent = ''; result.hidden = true; preview.hidden = true; previewImage.removeAttribute('src'); download.removeAttribute('href'); processButton.disabled = false; sample.disabled = false;
      if (outputURL) URL.revokeObjectURL(outputURL); outputURL = '';
    }
    function output(blob, name, summary, showImage) {
      outputURL = URL.createObjectURL(blob); download.href = outputURL; download.download = name; download.textContent = 'Download ' + name + ' (' + bytes(blob.size) + ')';
      previewImage.hidden = !showImage; if (showImage) previewImage.src = outputURL;
      result.textContent = summary; result.hidden = false; preview.hidden = false;
    }
    async function describeInput() {
      clean(); originalWidth = 0; originalHeight = 0;
      const version = generation, files = Array.from(input.files);
      if (!files.length) return;
      try {
        checkFiles(files, merge ? 'pdf' : 'image', pdf);
        if (!pdf) {
          const image = await readImage(files[0]); if (version !== generation) return;
          originalWidth = image.naturalWidth; originalHeight = image.naturalHeight;
          form.querySelector('.file-details').textContent = files[0].name + ': ' + originalWidth + ' × ' + originalHeight + ' pixels, ' + bytes(files[0].size) + '.';
          if (resize) { form.elements.width.value = originalWidth; form.elements.height.value = originalHeight; }
        } else form.querySelector('.file-details').textContent = 'Output order: ' + files.map((f, i) => (i + 1) + '. ' + f.name).join(' → ');
      } catch (e) { if (version === generation) error.textContent = e.message; }
    }
    input.addEventListener('change', describeInput);
    form.addEventListener('input', event => {
      if (event.target === input) return;
      clean();
      if (resize) form.elements.height.disabled = form.elements.ratio.value === 'yes';
      if (resize && originalWidth && form.elements.ratio.value === 'yes' && (event.target.name === 'width' || event.target.name === 'ratio')) {
        const w = Number(form.elements.width.value); if (w > 0) form.elements.height.value = Math.max(1, Math.round(w * originalHeight / originalWidth));
      }
    });
    form.addEventListener('change', event => { if (event.target !== input) clean(); });
    form.addEventListener('reset', () => { clean(); originalWidth = 0; originalHeight = 0; if (resize) form.elements.height.disabled = true; form.querySelector('.file-details').textContent = 'Choose new files or use the sample to begin.'; });
    sample.addEventListener('click', async () => {
      clean(); const version = generation; sample.disabled = true;
      try {
        const transfer = new DataTransfer();
        if (merge) {
          const lib = await pdfLibrary();
          for (let i = 0; i < 2; i++) { const doc = await lib.PDFDocument.create(); const page = doc.addPage([300, 200]); page.drawText('ToolPivio sample page ' + (i + 1)); transfer.items.add(new File([await doc.save()], 'sample-' + (i + 1) + '.pdf', { type: 'application/pdf' })); }
        } else {
          const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
          const c = canvas.getContext('2d'); const gradient = c.createLinearGradient(0, 0, 640, 480); gradient.addColorStop(0, '#12283e'); gradient.addColorStop(1, '#087f75'); c.fillStyle = gradient; c.fillRect(0, 0, 640, 480); c.fillStyle = '#ffffff'; c.font = 'bold 36px sans-serif'; c.fillText('ToolPivio', 40, 240);
          transfer.items.add(new File([await encode(canvas, 'image/png', 1)], 'toolpivio-sample.png', { type: 'image/png' }));
        }
        if (version !== generation) return; input.files = transfer.files; await describeInput();
      } catch (e) { if (version === generation) error.textContent = e.message; }
      finally { if (version === generation || !input.files.length) sample.disabled = false; }
    });
    form.addEventListener('submit', async event => {
      event.preventDefault(); clean(); const version = generation; processButton.disabled = true;
      try {
        const files = Array.from(input.files); checkFiles(files, merge ? 'pdf' : 'image', pdf);
        if (pdf) {
          const lib = await pdfLibrary(), doc = await lib.PDFDocument.create(); let pages = 0;
          if (merge) {
            for (const file of files) {
              let source; try { source = await lib.PDFDocument.load(await file.arrayBuffer()); } catch (_) { throw Error('Cannot read ' + file.name + '. Password-protected and damaged PDFs are unsupported.'); }
              pages += source.getPageCount(); if (pages > 200) throw Error('Merge at most 200 PDF pages at a time.');
              const copied = await doc.copyPages(source, source.getPageIndices()); copied.forEach(page => doc.addPage(page));
            }
          } else {
            const quality = positive(form.elements.quality.value, 'Quality', 100) / 100;
            const margin = Number(form.elements.margin.value);
            if (!Number.isInteger(margin) || margin < 0 || margin > 50 || form.elements.margin.value.trim() === '') throw Error('Margin must be a whole number from 0 to 50 mm.');
            if (!['a4', 'letter'].includes(form.elements.paper.value) || !['portrait', 'landscape'].includes(form.elements.orientation.value)) throw Error('Choose a supported paper size and orientation.');
            let size = form.elements.paper.value === 'letter' ? [612, 792] : [595.276, 841.89]; if (form.elements.orientation.value === 'landscape') size.reverse();
            const inset = margin * 72 / 25.4;
            for (const file of files) {
              const image = await readImage(file), canvas = canvasFor(image, image.naturalWidth, image.naturalHeight, 'image/jpeg'), blob = await encode(canvas, 'image/jpeg', quality), embedded = await doc.embedJpg(await blob.arrayBuffer()), page = doc.addPage(size);
              const scale = Math.min((size[0] - inset * 2) / embedded.width, (size[1] - inset * 2) / embedded.height), width = embedded.width * scale, height = embedded.height * scale;
              page.drawImage(embedded, { x: (size[0] - width) / 2, y: (size[1] - height) / 2, width, height }); pages++; canvas.width = canvas.height = 0;
            }
          }
          const saved = await doc.save(); if (version !== generation) return;
          output(new Blob([saved], { type: 'application/pdf' }), merge ? 'toolpivio-merged.pdf' : 'toolpivio-images.pdf', pages + ' PDF page' + (pages === 1 ? '' : 's') + ' created from ' + files.length + ' file' + (files.length === 1 ? '' : 's') + '. Review the downloaded PDF before sharing.', false);
        } else {
          const mime = form.elements.format.value; if (!IMAGE_TYPES.includes(mime)) throw Error('Choose JPG, PNG, or WebP.');
          const quality = positive(form.elements.quality.value, 'Quality', 100) / 100, image = await readImage(files[0]);
          const width = resize ? positive(form.elements.width.value, 'Width') : image.naturalWidth;
          const height = resize ? (form.elements.ratio.value === 'yes' ? Math.max(1, Math.round(width * image.naturalHeight / image.naturalWidth)) : positive(form.elements.height.value, 'Height')) : image.naturalHeight;
          if (resize) form.elements.height.value = height;
          const canvas = canvasFor(image, width, height, mime), blob = await encode(canvas, mime, quality); canvas.width = canvas.height = 0;
          if (version !== generation) return;
          const change = (1 - blob.size / files[0].size) * 100, name = 'toolpivio-' + (resize ? 'resized' : id === 'image-compressor' ? 'compressed' : 'converted') + '.' + ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' })[mime];
          output(blob, name, width + ' × ' + height + ' pixels. Input: ' + bytes(files[0].size) + '; output: ' + bytes(blob.size) + '. ' + Math.abs(change).toFixed(1) + '% ' + (change >= 0 ? 'smaller' : 'larger') + '.', true);
        }
      } catch (e) { if (version === generation) error.textContent = e.message || 'Processing failed. Try a smaller file.'; }
      finally { if (version === generation) processButton.disabled = false; }
    });
    host.appendChild(form); return true;
  }
  root.ToolPivioFiles = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
