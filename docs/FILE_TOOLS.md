# Browser image and PDF tools

These tools process user-selected files on the device. No upload, paid API, CDN, account, or server processing is used. Large files can still exhaust a device’s memory; conservative limits reject inputs above 20 MB per file, 60 MB total, 10 files, 32 million image pixels, 12,000 pixels per image dimension, or 200 merged PDF pages.

- **Image Resizer** supports exact dimensions and a width-driven aspect-ratio lock. Height is rounded to a whole pixel. Enlarging does not create new detail.
- **Image Compressor** preserves dimensions and re-encodes to JPG or WebP. The preview and byte comparison report larger outputs honestly. There is no target-byte-size guarantee.
- **Image Format Converter** supports JPG, PNG, and WebP. PNG is lossless. JPG and WebP use quality from 1 to 100. JPEG flattens transparency onto white.
- **Images to PDF** fits one image per A4 or Letter page, with portrait/landscape and 0–50 mm margins. Images become JPEG on white; no OCR or searchable text is produced.
- **PDF Merger** appends pages in the displayed selected-file order. It rejects unreadable/password-protected PDFs. It does not promise preservation of digital signatures, bookmarks, document-level forms, or metadata; inspect the output before use.

JPG, PNG, and WebP inputs are decoded by the browser. Animated images, SVG, GIF, HEIC, and RAW are outside the supported subset. Browser support for WebP encoding varies; an unsupported encoder produces a clear error rather than a mislabeled PNG. Re-encoding removes most metadata. Inputs and output previews are cleared by Reset; generated object URLs are revoked when replaced or cleared.

Each tool has a local sample generator, validation, Process, Reset, and a real download. PDFs use the bundled **pdf-lib 1.17.1** browser build under its MIT license. The site build must copy `src/vendor/pdf-lib.min.js` and `src/vendor/pdf-lib.LICENSE.txt` to `docs/assets/`, preserving filenames. The PDF library loads only when a PDF operation or PDF sample is requested.

Run `CHROMIUM_PATH=/usr/bin/chromium node tests/image-browser.cjs` to verify resize dimensions, PNG transparency, JPEG white background, WebP output, compression, validation, Reset, PDF creation and merging, and responsive overflow. The test creates original fixtures locally and parses downloaded PDFs with pdf-lib.
