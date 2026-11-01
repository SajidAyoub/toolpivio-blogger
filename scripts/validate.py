"""Validate the release that is safe to review for manual Blogger installation."""
from pathlib import Path
import json
import hashlib
import re
from html.parser import HTMLParser
from urllib.parse import urlparse
import subprocess
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ns={'b':'http://www.google.com/2005/gml/b','h':'http://www.w3.org/1999/xhtml'}
reference=ET.parse(ROOT/'ToolPivio_Restored_Design_v2.xml')
release=ROOT/'releases/ToolPivio_V4_Ready_For_Blogger.xml'
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
assert 'tp-page-heading' in release.read_text(), 'Static Blogger Pages need a semantic main heading'
for slug in ['roas','profit-margin','print-dpi']:
    assert f'canonicalUrl == &quot;https://toolpivio.blogspot.com/p/{slug}-calculator.html&quot;' in release.read_text()
# Historical installable backups are immutable in the V4 build.
backups = {
    'ToolPivio_Restored_Design_v2.xml': 'b45807941593514ede59de431f31eb432025a65ec2b1774624538680e38d56dc',
    'releases/ToolPivio_V3_Ready_For_Blogger.xml': '1ec1501008843226f2f04f10ba31d84d90968b7a08ec4b4dc3f8d873385e4428',
    'dist/toolpivio.xml': 'eae426ec489d535a73a9011966572d985c71f7a1fe2b607a0b9f2bfef7e44eb9',
}
for filename, expected in backups.items():
    assert hashlib.sha256((ROOT/filename).read_bytes()).hexdigest() == expected, 'Historical theme backup changed: '+filename

manifest = json.loads((ROOT/'docs/assets/v4/manifest.json').read_text())
assert manifest['version'] == 4 and len(manifest['visuals']) == 23
artwork_hashes=set()
for visual_id, item in manifest['visuals'].items():
    url=urlparse(item['artwork'])
    assert url.scheme=='https' and url.netloc=='sajidayoub.github.io'
    assert re.fullmatch(r'/toolpivio-blogger/assets/v4/'+re.escape(visual_id)+r'\.[a-f0-9]{12}\.svg',url.path)
    asset=ROOT/'docs'/url.path.removeprefix('/toolpivio-blogger/')
    content=asset.read_bytes()
    assert len(content)<20_000
    digest=hashlib.sha256(content).hexdigest()
    assert digest[:12] in asset.name
    artwork_hashes.add(digest)
    svg=ET.fromstring(content)
    assert svg.get('viewBox')=='0 0 360 220'
    assert (svg.find('{http://www.w3.org/2000/svg}title').text or '').strip()
    assert (svg.find('{http://www.w3.org/2000/svg}desc').text or '').strip()
    for node in svg.iter():
        assert node.tag.rsplit('}',1)[-1] not in {'script','foreignObject','image'}
        for key,value in node.attrib.items():
            assert not key.lower().startswith('on')
            assert not key.endswith('href') or value.startswith('#')
            assert 'http:' not in value and 'https:' not in value
assert len(artwork_hashes)==23, 'Every original visual must be distinct'

class Cards(HTMLParser):
    def __init__(self,source):
        super().__init__();self.cards=[];self.current=None;self.depth=0;self.feed(source)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='article' and attrs.get('class')=='tp-card':
            self.current={'attrs':attrs,'links':[],'images':[],'arrows':0};self.cards.append(self.current)
        if self.current is not None:
            if tag=='a':self.current['links'].append(attrs)
            if tag=='img':self.current['images'].append(attrs)
            if tag=='svg' and attrs.get('class')=='tp-card-arrow':self.current['arrows']+=1
    def handle_endtag(self,tag):
        if tag=='article':self.current=None

for filename in ['docs/index.html','dist/preview.html']:
    source=(ROOT/filename).read_text()
    cards=Cards(source).cards
    assert len(cards)==19
    ids=set()
    for card in cards:
        tool_id=card['attrs']['data-tool-id'];ids.add(tool_id)
        assert len(card['links'])==1 and card['links'][0]['class']=='tp-card-link'
        assert card['links'][0].get('draggable')=='false'
        assert card['arrows']==1
        assert len(card['images'])==1
        image=card['images'][0]
        assert image['src']==manifest['visuals'][tool_id]['artwork']
        assert image['width']=='360' and image['height']=='220' and image['alt']=='' and image['aria-hidden']=='true'
    assert len(ids)==19
    assert '&#8594;' not in source and '&amp;#8594;' not in source
print('V4 XML, immutable V2/V3 backups, unchanged Blog1, head ownership, schema, JS, 19 semantic cards and 23 safe cache-addressed original SVGs validated.')
