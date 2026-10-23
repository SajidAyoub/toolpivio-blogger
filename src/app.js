(function(){
'use strict';
const search=document.getElementById('tool-search');
let category='All tools';
function filter(){let count=0;document.querySelectorAll('.card').forEach(card=>{const match=(category==='All tools'||card.dataset.categories.split('|').includes(category))&&card.textContent.toLowerCase().includes(search.value.trim().toLowerCase());card.hidden=!match;if(match)count++;});document.getElementById('search-status').textContent=count+' tools found';document.getElementById('no-tools').hidden=count!==0;}
if(search){search.addEventListener('input',filter);document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter();}));filter();}
const definitions={roas:{fields:[['revenue','Attributed revenue','5000'],['spend','Advertising spend','1000']],calculate:v=>{const r=ToolPivioMath.roas(v.revenue,v.spend);return 'Return on ad spend: '+fmt(r.roas)+'×\nROAS percentage: '+fmt(r.percentage)+'%';}},margin:{fields:[['revenue','Revenue','100'],['cost','Total cost','60']],calculate:v=>{const r=ToolPivioMath.margin(v.revenue,v.cost);return 'Profit (in your input currency): '+fmt(r.profit)+'\nProfit margin: '+fmt(r.margin)+'%';}},dpi:{fields:[['width','Image width (pixels)','3000'],['height','Image height (pixels)','2400'],['printWidth','Print width','10'],['printHeight','Print height','8']],calculate:v=>{const r=ToolPivioMath.dpi(v.width,v.height,v.printWidth,v.printHeight,v.unit);return 'Horizontal resolution: '+fmt(r.horizontal)+' PPI\nVertical resolution: '+fmt(r.vertical)+' PPI';}}};
function fmt(n){return new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(n);}
document.querySelectorAll('[data-tool]').forEach((host,index)=>{
const definition=definitions[host.dataset.tool];if(!definition)return;
const form=document.createElement('form');form.className='calculator';form.noValidate=true;
form.innerHTML='<div class="fields">'+definition.fields.map(([name,label,example])=>'<div><label for="calc-'+index+'-'+name+'">'+label+'</label><input id="calc-'+index+'-'+name+'" name="'+name+'" type="number" inputmode="decimal" step="any" min="0" required placeholder="e.g. '+example+'" /></div>').join('')+(host.dataset.tool==='dpi'?'<div><label for="unit-'+index+'">Print size unit</label><select id="unit-'+index+'" name="unit"><option value="in">Inches</option><option value="cm">Centimeters</option></select></div>':'')+'</div><p class="error" role="alert"></p><div class="actions"><button class="primary" type="submit">Calculate</button><button class="secondary" type="reset">Reset</button></div><div class="result" role="status" aria-live="polite" hidden></div><p>Results rounded to two decimal places.</p>';
const result=form.querySelector('.result'),error=form.querySelector('.error');
form.addEventListener('submit',event=>{event.preventDefault();error.textContent='';result.hidden=true;try{result.textContent=definition.calculate(Object.fromEntries(new FormData(form)));result.hidden=false;}catch(e){error.textContent=e.message;}});
form.addEventListener('input',()=>{result.hidden=true;error.textContent='';});
form.addEventListener('reset',()=>{result.hidden=true;result.textContent='';error.textContent='';});host.appendChild(form);
});
})();
