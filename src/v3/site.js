/* Catalog v3 protocol: retained static links continue working if this script fails. */
(function () {
'use strict';
var header=document.querySelector('.tp-header'),menu=document.querySelector('.tp-menu'),nav=document.getElementById('tp-navigation');
if(header&&menu&&nav){header.dataset.enhanced='true';menu.hidden=false;menu.addEventListener('click',function(){var open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.dataset.open=String(open);});header.addEventListener('keydown',function(e){if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');nav.dataset.open='false';menu.focus();}});nav.addEventListener('click',function(e){if(e.target.closest('a')){menu.setAttribute('aria-expanded','false');nav.dataset.open='false';}});}
var search=document.getElementById('tool-search'),category='All tools',grid=document.querySelector('.tp-cards');
function filter(){if(!search||!grid)return;var count=0,query=search.value.trim().toLocaleLowerCase();grid.querySelectorAll('.tp-card').forEach(function(card){var match=(category==='All tools'||card.dataset.categories.split('|').includes(category))&&card.textContent.toLocaleLowerCase().includes(query);card.hidden=!match;if(match)count++;});document.getElementById('search-status').textContent=count+' '+(count===1?'tool':'tools')+' found';document.getElementById('no-tools').hidden=count!==0;}
if(search){search.addEventListener('input',filter);document.querySelectorAll('[data-filter]').forEach(function(button){button.addEventListener('click',function(){category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(function(b){b.setAttribute('aria-pressed',String(b===button));});filter();});});document.getElementById('tp-clear-filters').addEventListener('click',function(){search.value='';category='All tools';document.querySelector('[data-filter="All tools"]').click();search.focus();});filter();}
function svgPath(pathData, className){
 var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox',className==='tp-card-arrow'?'0 0 20 20':'0 0 24 24');
 svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
 if(className)svg.setAttribute('class',className);
 var path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',pathData);svg.appendChild(path);return svg;
}
function illustrationUrl(value){
 if(typeof value!=='string')return null;
 var url;try{url=new URL(value,location.href);}catch(e){return null;}
 return url.origin==='https://sajidayoub.github.io'&&!url.username&&!url.password&&!url.search&&!url.hash&&/^\/toolpivio-blogger\/assets\/v4\/[a-z0-9-]+\.[a-f0-9]{12}\.svg$/.test(url.pathname)?url.href:null;
}
function updateCatalog(){
 var catalog=window.ToolPivioCatalog;
 if(!grid||!catalog||catalog.version!==3||!Array.isArray(catalog.tools))return;
 var fragment=document.createDocumentFragment(),ids=new Set();
 catalog.tools.forEach(function(t){
  if(!t||typeof t.id!=='string'||!/^[-a-z0-9]+$/.test(t.id)||ids.has(t.id)||typeof t.title!=='string'||typeof t.description!=='string'||typeof t.category!=='string')return;
  var url;try{url=new URL(t.url,location.href);}catch(e){return;}
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||!((url.hostname==='toolpivio.blogspot.com'&&/^\/p\/[a-z0-9-]+\.html$/.test(url.pathname))||(url.hostname==='sajidayoub.github.io'&&/^\/toolpivio-blogger\/tools\/[a-z0-9-]+\.html$/.test(url.pathname))))return;
  ids.add(t.id);
  var card=document.createElement('article');card.className='tp-card';card.dataset.toolId=t.id;card.dataset.categories=typeof t.categories==='string'?t.categories:t.category;
  var link=document.createElement('a');link.className='tp-card-link';link.href=url.href;link.setAttribute('aria-label','Open '+t.title);link.draggable=false;
  var artwork=illustrationUrl(t.illustration);
  if(artwork){var image=document.createElement('img');image.className='tp-card-art';image.src=artwork;image.width=360;image.height=220;image.alt='';image.setAttribute('aria-hidden','true');image.loading='lazy';image.decoding='async';image.draggable=false;link.appendChild(image);}
  var icon=document.createElement('span');icon.className='tp-icon';icon.setAttribute('aria-hidden','true');
  var paths={'Digital Marketing Calculators':'M4 17l5-6 4 3 7-10M15 4h5v5','E-commerce Calculators':'M6 5h12v15H6zM9 5V3h6v2M9 10h6m-6 4h6','Packaging & Printing Tools':'M7 8V3h10v5M7 17H4V8h16v9h-3M7 14h10v7H7zM16 11h1','Video Production Calculators':'M3 5h13v14H3zM16 9l5-3v12l-5-3','Image & PDF Tools':'M3 3h18v18H3zM4 17l5-6 4 4 4-5 4 6'};
  icon.appendChild(svgPath(paths[t.category]||paths['Digital Marketing Calculators']));
  var tag=document.createElement('p');tag.className='tp-tag';tag.textContent=t.category;
  var title=document.createElement('h3');title.textContent=t.title;
  var desc=document.createElement('p');desc.textContent=t.description;
  var cta=document.createElement('span');cta.className='tp-card-cta';
  var label=document.createElement('span');label.textContent='Open Tool';cta.append(label,svgPath('M4 10h12m-5-5 5 5-5 5','tp-card-arrow'));
  link.append(icon,tag,title,desc,cta);card.appendChild(link);fragment.appendChild(card);
 });
 if(ids.size>=3){grid.replaceChildren(fragment);filter();}
}
window.addEventListener('toolpivio:catalog',updateCatalog);updateCatalog();
/* Keep native links while allowing a pointer drag to select their readable text. */
document.addEventListener('click',function(event){var link=event.target.closest&&event.target.closest('a.tp-card-link');if(!link||event.detail===0)return;var selection=window.getSelection();if(selection&&!selection.isCollapsed&&selection.toString().trim()&&(link.contains(selection.anchorNode)||link.contains(selection.focusNode)))event.preventDefault();});
/* Trust both the hosting origin and the exact iframe window before applying a height. */
var embedOrigin='https://sajidayoub.github.io';
window.addEventListener('message',function(event){if(event.origin!==embedOrigin||!event.data||event.data.type!=='ToolPivio:resize'||!Number.isFinite(event.data.height)||event.data.height<160||event.data.height>5000)return;document.querySelectorAll('iframe').forEach(function(frame){var url;try{url=new URL(frame.src);}catch(e){return;}if(frame.contentWindow!==event.source||url.origin!==embedOrigin||!['/toolpivio-blogger/embed.html','/toolpivio-blogger/contact.html'].includes(url.pathname))return;frame.style.height=Math.ceil(event.data.height)+'px';frame.setAttribute('height',String(Math.ceil(event.data.height)));});});
document.querySelectorAll('iframe').forEach(function(frame){var url;try{url=new URL(frame.src);}catch(e){return;}if(url.origin!==embedOrigin||!['/toolpivio-blogger/embed.html','/toolpivio-blogger/contact.html'].includes(url.pathname))return;function request(){frame.contentWindow.postMessage({type:'ToolPivio:requestResize'},embedOrigin);}frame.addEventListener('load',request);request();});
})();
