/* Pure client-side calculations, shared by browser tools and Node tests. */
(function(root) {
'use strict';
function number(value, positive=false) {
 if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') throw new Error('Enter every required value.');
 const n=Number(value);
 if (!Number.isFinite(n) || n<0 || (positive && n===0)) throw new Error(positive?'Enter a number greater than zero.':'Enter a number of zero or more.');
 return n;
}
function count(value,positive=false) { const n=number(value,positive);if(!Number.isSafeInteger(n))throw new Error('Counts and pixel dimensions must be safe whole numbers.');return n; }
function finite(values) { if(Object.values(values).some(v=>!Number.isFinite(v))) throw new Error('These values are too large or too small. Use a smaller range.'); return values; }
function choice(value,choices) { if(!choices.includes(value))throw new Error('Choose a supported unit or conversion.');return value; }
const inches={in:1,cm:1/2.54,mm:1/25.4};
// Exact decimal scaling avoids rounding 0.3 - 0.2 below 0.1 before ceil.
// It also preserves a legitimate amount just above an integer boundary.
function decimalParts(n) {const [mantissa,exponent='0']=String(n).split('e');const fraction=(mantissa.split('.')[1]||'').length;return {digits:BigInt(mantissa.replace('.','')),power:Number(exponent)-fraction};}
function breakEvenWhole(fixed,price,cost) {const parts=[fixed,price,cost].map(decimalParts);const scale=Math.min(...parts.map(p=>p.power));const [f,p,c]=parts.map(part=>part.digits*10n**BigInt(part.power-scale));const contribution=p-c;return Number((f+contribution-1n)/contribution);}
const api={
 roas(revenue,spend) { revenue=number(revenue);spend=number(spend,true);return finite({roas:revenue/spend,percentage:revenue/spend*100}); },
 margin(revenue,cost) { revenue=number(revenue,true);cost=number(cost);return finite({profit:revenue-cost,margin:(revenue-cost)/revenue*100}); },
 dpi(width,height,printWidth,printHeight,unit) {
 width=count(width,true);height=count(height,true);printWidth=number(printWidth,true);printHeight=number(printHeight,true);
 choice(unit,['in','cm']);const factor=unit==='cm'?2.54:1;
 return finite({horizontal:width/printWidth*factor,vertical:height/printHeight*factor});
 },
 cpc(spend,clicks) { return finite({cpc:number(spend)/count(clicks,true)}); },
 cpm(spend,impressions) { return finite({cpm:number(spend)/count(impressions,true)*1000}); },
 ctr(clicks,impressions) { return finite({ctr:count(clicks)/count(impressions,true)*100}); },
 cpa(spend,acquisitions) { return finite({cpa:number(spend)/count(acquisitions,true)}); },
 discount(price,percentage) { price=number(price);percentage=number(percentage);if(percentage>100)throw new Error('Discount must be between 0 and 100%.');const savings=price*(percentage/100);return finite({savings,salePrice:price-savings}); },
 markup(cost,sellingPrice) { cost=number(cost,true);sellingPrice=number(sellingPrice);const profit=sellingPrice-cost;return finite({profit,markup:profit/cost*100}); },
 breakEven(fixedCost,price,variableCost) { fixedCost=number(fixedCost);price=number(price,true);variableCost=number(variableCost);const contribution=price-variableCost;if(contribution<=0)throw new Error('Selling price must exceed variable cost; otherwise there is no finite break-even point.');const exactUnits=fixedCost/contribution;const units=breakEvenWhole(fixedCost,price,variableCost);if(!Number.isSafeInteger(units))throw new Error('Break-even unit count is too large.');return finite({contribution,exactUnits,units,revenue:units*price}); },
 bleedTrim(width,height,bleed,unit) { width=number(width,true);height=number(height,true);bleed=number(bleed);choice(unit,['mm','cm','in']);return finite({width:width+2*bleed,height:height+2*bleed,trimWidth:width,trimHeight:height}); },
 printSize(width,height,from,to,ppi) { choice(from,['mm','cm','in','px']);choice(to,['mm','cm','in','px']);width=number(width,true);height=number(height,true);ppi=number(ppi,true);if(from==='px'){width=count(width,true);height=count(height,true);}const source=from==='px'?1/ppi:inches[from];const target=to==='px'?ppi:1/inches[to];return finite({width:width*source*target,height:height*source*target}); },
 videoSize(seconds,videoMbps,audioKbps) { seconds=number(seconds,true);videoMbps=number(videoMbps,true);audioKbps=number(audioKbps);const bitrateMbps=videoMbps+audioKbps/1000;const bytes=seconds*bitrateMbps*1000000/8;return finite({bitrateMbps,bytes,MB:bytes/1e6,MiB:bytes/1048576,GB:bytes/1e9}); },
 videoBitrate(seconds,fileMB,audioKbps) { seconds=number(seconds,true);fileMB=number(fileMB,true);audioKbps=number(audioKbps);const totalMbps=fileMB*8/seconds;const videoMbps=totalMbps-audioKbps/1000;if(videoMbps<=0)throw new Error('File size is too small for the selected audio bitrate and duration.');return finite({totalMbps,videoMbps}); },
 framesDuration(value,fps,mode) { fps=number(fps,true);choice(mode,['frames','duration']);if(mode==='frames'){const frames=count(value);return finite({frames,seconds:frames/fps});}const seconds=number(value);const frames=Math.round(seconds*fps);if(!Number.isSafeInteger(frames))throw new Error('Frame count is too large.');return finite({frames,seconds:frames/fps}); }
};
if(typeof module!=='undefined' && module.exports) module.exports=api;
root.ToolPivioMath=api;
})(typeof window!=='undefined'?window:globalThis);
