from pathlib import Path
import xml.etree.ElementTree as ET
import subprocess
root=Path(__file__).resolve().parents[1]
p=root/'dist/toolpivio.xml'
tree=ET.parse(p)
ns={'b':'http://www.google.com/2005/gml/b','h':'http://www.w3.org/1999/xhtml'}
assert len(tree.findall('.//b:skin',ns))==1
assert tree.find('.//b:widget',ns).get('type')=='Blog'
for script in tree.findall('.//h:script',ns):
 if script.get('type')=='text/javascript':
  subprocess.run(['node','--check'],input=script.text,text=True,check=True)
assert p.stat().st_size<100_000
for slug in ['roas','profit-margin','print-dpi']:
 assert (root/f'pages/{slug}.html').exists()
 assert f'/p/{slug}-calculator.html' in p.read_text()
print('XML syntax, Blogger structure, inline JS syntax, page links and theme size validated.')
