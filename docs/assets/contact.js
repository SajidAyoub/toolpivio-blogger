/* ToolPivio contact. No storage, analytics, PII logging, or automatic POST retries. */
(function () {
  'use strict';
  if (parent !== window) document.documentElement.classList.add('embedded');
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('contact-status');
  const error = document.getElementById('contact-error');
  const send = document.getElementById('contact-send');
  const clear = document.getElementById('contact-clear');
  const copy = document.getElementById('contact-copy');
  const draft = document.getElementById('contact-draft');
  const draftText = document.getElementById('contact-draft-text');
  const fields = Object.fromEntries(['name', 'email', 'reason', 'message', 'tool_url', '_gotcha', 'consent'].map(name => [name, form.querySelector('[name="' + name + '"]')]));
  const reasons = ['Tool issue', 'Suggestion', 'General question', 'Business inquiry'];
  let busy = false;
  let lastAccepted = '';
  function validEndpoint(value) {
    return typeof value === 'string' && /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(value);
  }
  const endpoint = validEndpoint(form.dataset.endpoint) ? form.dataset.endpoint : '';
  function values() {
    const result = {};
    for (const name of ['name', 'email', 'reason', 'message', 'tool_url']) result[name] = fields[name].value.trim();
    return result;
  }
  function signature(data) { return JSON.stringify(data); }
  function updateSend() {
    if (send) {
      send.disabled = busy || !endpoint || signature(values()) === lastAccepted;
      send.textContent = busy ? 'Submitting…' : signature(values()) === lastAccepted ? 'Message accepted' : 'Send message';
    }
  }
  function setBusy(value) {
    busy = value;
    form.setAttribute('aria-busy', String(value));
    clear.disabled = value;
    for (const field of Object.values(fields)) {
      if (!field) continue;
      if (field.tagName === 'SELECT' || field.type === 'checkbox') field.disabled = value;
      else field.readOnly = value;
    }
    updateSend();
  }
  function validate(data) {
    const failures = [];
    function reject(name, message) { fields[name].setAttribute('aria-invalid', 'true'); failures.push({name, message}); }
    for (const field of Object.values(fields)) if (field) field.removeAttribute('aria-invalid');
    if (data.name.length < 2 || data.name.length > 100 || /[\x00-\x1f\x7f]/.test(data.name)) reject('name', 'Enter a full name between 2 and 100 characters.');
    if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !fields.email.validity.valid) reject('email', 'Enter a valid email address of up to 254 characters.');
    if (!reasons.includes(data.reason)) reject('reason', 'Choose a reason for your message.');
    if (data.message.length < 20 || data.message.length > 4000 || data.message.includes('\u0000')) reject('message', 'Enter a message between 20 and 4,000 characters.');
    if (data.tool_url) {
      let url;
      try { url = new URL(data.tool_url); } catch (_) { /* Invalid URL is handled below. */ }
      if (!url || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || data.tool_url.length > 500 || /[\x00-\x20\x7f]/.test(data.tool_url)) reject('tool_url', 'Use a public http:// or https:// page URL of up to 500 characters.');
    }
    if (!fields.consent || !fields.consent.checked) reject('consent', 'Please confirm the privacy consent before sending.');
    if (failures.length) {
      error.textContent = failures.map(failure => failure.message).join(' ');
      fields[failures[0].name].focus();
      return false;
    }
    return true;
  }
  form.addEventListener('input', event => {
    if (event.target.matches('input,select,textarea')) event.target.removeAttribute('aria-invalid');
    if (!busy) { status.textContent = ''; error.textContent = ''; }
    if (!draft.hidden) { draft.hidden = true; draftText.value = ''; }
    updateSend();
  });
  form.addEventListener('change', updateSend);
  if (form.tagName === 'FORM') form.noValidate = true;
  if (form.tagName === 'FORM') form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    error.textContent = '';
    status.textContent = '';
    if (!endpoint) { error.textContent = 'Sending is unavailable. You can keep or copy your draft.'; return; }
    if (fields._gotcha.value.trim()) { error.textContent = 'This submission could not be accepted. Clear the form and try again.'; return; }
    const data = values();
    if (!validate(data)) return;
    const sentSignature = signature(data);
    if (sentSignature === lastAccepted) { status.textContent = 'This message was already accepted. Change the message to start a different submission.'; return; }
    const payload = new FormData();
    for (const [name, value] of Object.entries(data)) payload.set(name, value);
    payload.set('subject', 'ToolPivio contact: ' + data.reason);
    payload.set('consent', 'I consent to Formspree processing this contact message as explained in the privacy notice.');
    payload.set('_gotcha', '');
    setBusy(true);
    status.textContent = 'Submitting your message to Formspree…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, {method:'POST', body:payload, headers:{Accept:'application/json'}, credentials:'omit', redirect:'error', referrerPolicy:'no-referrer', signal:controller.signal});
      let result;
      try { result = await response.json(); } catch (_) { result = null; }
      status.textContent = '';
      if (response.ok && result && result.ok === true && (result.errors == null || (Array.isArray(result.errors) && result.errors.length === 0))) {
        lastAccepted = sentSignature;
        status.textContent = 'Formspree accepted your message. Inbox delivery and a reply are not confirmed here. Your draft is still available to copy or clear.';
      } else if (response.status === 429) {
        error.textContent = 'The form provider is receiving too many requests. Please wait before trying again. Your draft is kept; nothing will be retried automatically.';
      } else if (response.status === 400 || response.status === 422) {
        error.textContent = 'The form provider could not accept this message. Review your details and the form setup, then try again when ready. Your draft is kept.';
      } else {
        error.textContent = 'We could not confirm that the form provider accepted your message. Your draft is kept. Copy it before trying again; repeating an uncertain submission may create a duplicate.';
      }
    } catch (_) {
      status.textContent = '';
      error.textContent = 'We could not confirm whether your message was accepted. Check your connection and copy your draft before deciding to try again. Nothing will be retried automatically.';
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  });
  copy.addEventListener('click', async () => {
    const data = values();
    const text = 'ToolPivio contact draft\n\nName: ' + data.name + '\nEmail: ' + data.email + '\nReason: ' + data.reason + '\nTool or page URL: ' + data.tool_url + '\n\nMessage:\n' + data.message;
    error.textContent = '';
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      status.textContent = 'Draft copied to your clipboard. No message was submitted. Clear the clipboard when finished on a shared device.';
    } catch (_) {
      draft.hidden = false;
      draftText.value = text;
      draftText.focus();
      draftText.select();
      status.textContent = 'Select and copy the draft below. No message was submitted.';
    }
  });
  clear.addEventListener('click', () => {
    if (busy) return;
    for (const field of Object.values(fields)) {
      if (!field) continue;
      if (field.type === 'checkbox') field.checked = false;
      else field.value = '';
      field.removeAttribute('aria-invalid');
    }
    lastAccepted = '';
    status.textContent = 'Draft cleared from this page. A previously copied clipboard draft is not changed.';
    error.textContent = '';
    draft.hidden = true;
    draftText.value = '';
    updateSend();
    fields.name.focus();
  });
  updateSend();
  if (parent !== window) {
    let parentOrigin = 'https://toolpivio.blogspot.com';
    function resize() {
      const main = document.querySelector('main');
      const height = Math.max(180, Math.ceil(main.getBoundingClientRect().height) + 2);
      parent.postMessage({type:'ToolPivio:resize', height}, parentOrigin);
    }
    window.addEventListener('message', event => {
      if (event.source !== parent || !['https://toolpivio.blogspot.com', location.origin].includes(event.origin) || !event.data || event.data.type !== 'ToolPivio:requestResize') return;
      parentOrigin = event.origin;
      resize();
    });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(document.querySelector('main'));
    window.addEventListener('load', resize);
    window.addEventListener('resize', resize);
    resize();
  }
})();
