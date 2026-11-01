"""Validate the release that is safe to review for manual Blogger installation."""
from pathlib import Path
import json
import subprocess
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ns={'b':'http://www.google.com/2005/gml/b','h':'http://www.w3.org/1999/xhtml'}
reference=ET.parse(ROOT/'ToolPivio_Restored_Design_v2.xml')
release=ROOT/'releases/ToolPivio_V3_Ready_For_Blogger.xml'
tree=ET.parse(release)
assert len(tree.findall('.//b:skin',ns))==1
assert ET.tostring(reference.find('.//b:widget[@id="Blog1"]',ns))==ET.tostring(tree.find('.//b:widget[@id="Blog1"]',ns)), 'Native Blog1 renderer changed'
assert len(tree.findall('.//b:include[@name="all-head-content"]',ns))==1
assert not tree.findall('.//h:link[@rel="canonical"]',ns), 'Blogger all-head-content owns canonical'
for script in tree.findall('.//h:script',ns):
    if script.get('type')=='text/javascript' and script.text and len(script)==0:
        subprocess.run(['node','--check'],input=script.text,text=True,check=True)
    if script.get('type')=='application/ld+json': json.loads(script.text)
assert release.stat().st_size<250_000
for slug in ['roas','profit-margin','print-dpi']:
    assert (ROOT/f'pages/{slug}.html').exists()
    assert f'/p/{slug}-calculator.html' in release.read_text()
assert 'tp-art-title' in release.read_text()
assert 'ToolPivio:resize' in release.read_text()
assert 'catalog.v3.js' in release.read_text()
print('V3 XML, unchanged native Blog1 renderer, head ownership, schema, inline JS and existing URLs validated.')
