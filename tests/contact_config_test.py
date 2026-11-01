"""Public endpoint validation only; no Formspree requests or credentials."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_contact', ROOT / 'scripts/build_contact.py')
contact = importlib.util.module_from_spec(spec)
spec.loader.exec_module(contact)


class ContactConfigTests(unittest.TestCase):
    def test_empty_and_exact_public_form_url(self):
        self.assertEqual(contact.validate_endpoint(''), '')
        self.assertEqual(contact.validate_endpoint('https://formspree.io/f/mocktest1'), 'https://formspree.io/f/mocktest1')

    def test_unsafe_endpoints_are_rejected(self):
        for endpoint in [None, False, 42, 'http://formspree.io/f/abc', 'https://formspree.io.evil.test/f/abc', 'https://evil.test/f/abc', 'https://formspree.io/f/abc?x=1', 'https://formspree.io/f/abc#x', 'https://user:password@formspree.io/f/abc', 'https://formspree.io:443/f/abc', ' https://formspree.io/f/abc', 'https://formspree.io/f/abc/', 'https://formspree.io/f/a%2fb', 'https://formspree.io/anything', 'https://formspree.io/f/abc\n']:
            with self.subTest(endpoint=endpoint), self.assertRaises(ValueError):
                contact.validate_endpoint(endpoint)

    def test_only_public_endpoint_setting_is_allowed(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'src/contact').mkdir(parents=True)
            config = root / 'src/contact/config.json'
            config.write_text(json.dumps({'endpoint': ''}))
            self.assertEqual(contact.load_config(root), {'endpoint': ''})
            for value in [{'endpoint': '', 'recipient': 'not-public'}, [], {}]:
                config.write_text(json.dumps(value))
                with self.assertRaises(ValueError):
                    contact.load_config(root)


if __name__ == '__main__':
    unittest.main()
