#!/usr/bin/env python3
"""Build the contact workspace and Blogger iframe. No external requests or secrets."""
from hashlib import sha256
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
HOST = 'https://sajidayoub.github.io/toolpivio-blogger'


def validate_endpoint(value):
    if not isinstance(value, str):
        raise ValueError('Contact endpoint must be a string.')
    if value and not re.fullmatch(r'https://formspree\.io/f/[a-zA-Z0-9]+', value):
        raise ValueError('Use an exact public https://formspree.io/f/FORM_ID URL without credentials, query or fragment.')
    return value


def load_config(root=ROOT):
    config = json.loads((root / 'src/contact/config.json').read_text(encoding='utf-8'))
    if not isinstance(config, dict) or set(config) != {'endpoint'}:
        raise ValueError('Contact config must contain only the public endpoint field.')
    return {'endpoint': validate_endpoint(config['endpoint'])}


def build(root=ROOT):
    # Shared original artwork is supplied by the preceding page-banner phase.
    from visuals import banner_css, render_banner, render_back_panel
    endpoint = load_config(root)['endpoint']
    configured = bool(endpoint)
    css = (root / 'src/contact/contact.css').read_text(encoding='utf-8') + '\n' + banner_css()
    script = (root / 'src/contact/contact.js').read_text(encoding='utf-8')
    assets = root / 'docs/assets'
    assets.mkdir(parents=True, exist_ok=True)
    (assets / 'contact.css').write_text(css, encoding='utf-8')
    (assets / 'contact.js').write_text(script, encoding='utf-8')
    form_open = ('<form id="contact-form" data-endpoint="' + html.escape(endpoint, quote=True) + '" action="' + html.escape(endpoint, quote=True) + '" method="POST" target="_blank" rel="noopener noreferrer">') if configured else '<div id="contact-form" role="form" aria-label="Contact draft" data-endpoint="">'
    consent = '<label class="contact-consent" for="contact-consent"><input id="contact-consent" type="checkbox" name="consent" value="accepted" required><span>I agree to send my name, email, reason, message and optional URL to Formspree to process this contact request, as described in the <a href="https://toolpivio.blogspot.com/p/privacy-policy.html" target="_blank" rel="noopener noreferrer">privacy policy</a>.</span></label>' if configured else '<p class="contact-fine">Draft mode: nothing you type is submitted. Your draft stays in this page until you clear it, reload or leave. Copying puts it on your device clipboard.</p>'
    noscript = '<noscript><style>#contact-copy,#contact-clear{display:none}</style><p>JavaScript is off. The Send message button submits directly to Formspree in a new tab; complete any provider confirmation or spam check there. Sending is not a guarantee of inbox delivery.</p></noscript>' if configured else '<noscript><style>#contact-copy,#contact-clear{display:none}</style><p>Sending is not configured. You may write a draft here and copy its text manually. No message is submitted.</p></noscript>'
    replacements = {
        '@@BANNER@@': render_banner('contact', title_tag='h1'),
        '@@STATE_TITLE@@': 'Contact form configured' if configured else 'Message delivery is not set up yet',
        '@@STATE_TEXT@@': 'Choose Send message only when you are ready to share these details with Formspree. Provider acceptance is separate from inbox delivery.' if configured else 'Sending is currently unavailable. You can prepare and copy a draft on this device; ToolPivio will not receive it. Please return once message delivery is available.',
        '@@FORM_TITLE@@': 'Write your message' if configured else 'Prepare a message draft',
        '@@FORM_OPEN@@': form_open,
        '@@FORM_CLOSE@@': '</form>' if configured else '</div>',
        '@@CONSENT@@': consent,
        '@@SEND_BUTTON@@': '<button class="contact-send" id="contact-send" type="submit">Send message</button>' if configured else '',
        '@@NOSCRIPT@@': noscript,
        '@@PRIVACY_NOTE@@': 'Sending transfers these contact details to Formspree and the site owner’s configured inbox. Tool files are not attached or uploaded.' if configured else 'No contact provider is connected in this build. Draft contents are not sent to ToolPivio or Formspree.',
        '@@CSS_HASH@@': sha256(css.encode()).hexdigest()[:12],
        '@@JS_HASH@@': sha256(script.encode()).hexdigest()[:12],
    }
    document = (root / 'src/contact/template.html').read_text(encoding='utf-8')
    for token, value in replacements.items():
        assert document.count(token) == 1, f'Unexpected contact token count: {token}'
        document = document.replace(token, value)
    assert not re.search(r'@@[A-Z_]+@@', document), 'Unfilled contact template token'
    (root / 'docs/contact.html').write_text(document, encoding='utf-8')
    info_target = root / 'docs/info/contact.html'
    info_target.parent.mkdir(parents=True, exist_ok=True)
    info_target.write_text(document.replace('href="assets/contact.css', 'href="../assets/contact.css').replace('src="assets/contact.js', 'src="../assets/contact.js'), encoding='utf-8')
    state = 'Messages are handled by the configured Formspree contact form after you choose to submit.' if configured else 'Message delivery is not set up yet. You can prepare a draft on your device, but it will not reach ToolPivio.'
    blogger = '<style>' + banner_css() + '</style>' + render_banner('contact', title_tag='p')
    blogger += '<p>Have a question, a suggestion or a tool issue to report? Use the contact workspace below. ' + state + '</p>'
    blogger += '<div class="toolpivio-contact"><iframe data-toolpivio-contact="true" title="Contact ToolPivio — message and draft workspace" src="' + HOST + '/contact.html" width="100%" height="1400" style="display:block;width:100%;max-width:100%;height:1400px;border:0;background:#fff;border-radius:16px" loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div>'
    blogger += '<p>If the workspace does not load, <a href="' + HOST + '/contact.html" target="_blank" rel="noopener noreferrer">open the contact form and draft workspace directly</a>.</p><noscript><p>The workspace also opens directly without JavaScript. ' + ('Use its native form to complete any provider confirmation in a separate tab.' if configured else 'Delivery remains unavailable until a real contact endpoint is configured.') + '</p></noscript>'
    blogger += '<p>Please do not include passwords, tokens or sensitive private details. Read the <a href="https://toolpivio.blogspot.com/p/privacy-policy.html">privacy policy</a> before submitting a contact message. Replies and response times are not guaranteed.</p>'
    blogger += render_back_panel(contact=False)
    (root / 'pages/contact.html').write_text(blogger + '\n', encoding='utf-8')
    print('Built contact workspace and Blogger iframe: ' + ('provider configured; real receipt still requires owner verification' if configured else 'inactive delivery; local draft only'))


if __name__ == '__main__':
    build()
