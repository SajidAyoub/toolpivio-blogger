/* Shared by the theme and Node tests. No network requests. */
(function(root) {
'use strict';
function number(value, positive=false) {
 if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') throw new Error('Enter every required value.');
 const n=Number(value);
 if (!Number.isFinite(n) || n<0 || (positive && n===0)) throw new Error(positive?'Enter a number greater than zero.':'Enter a number of zero or more.');
 return n;
}
function finite(values) { if(Object.values(values).some(v=>!Number.isFinite(v))) throw new Error('These values are too large or too small. Use a smaller range.'); return values; }
const api={
 roas(revenue,spend) { revenue=number(revenue);spend=number(spend,true);return finite({roas:revenue/spend,percentage:revenue/spend*100}); },
 margin(revenue,cost) { revenue=number(revenue,true);cost=number(cost);return finite({profit:revenue-cost,margin:(revenue-cost)/revenue*100}); },
 dpi(width,height,printWidth,printHeight,unit) {
 width=number(width,true);height=number(height,true);printWidth=number(printWidth,true);printHeight=number(printHeight,true);
 if(!Number.isInteger(width)||!Number.isInteger(height)) throw new Error('Pixel dimensions must be whole numbers.');
 if(!['in','cm'].includes(unit)) throw new Error('Choose inches or centimeters.');
 const factor=unit==='cm'?2.54:1;
 return finite({horizontal:width/printWidth*factor,vertical:height/printHeight*factor});
 }
};
if(typeof module!=='undefined' && module.exports) module.exports=api;
root.ToolPivioMath=api;
})(typeof window!=='undefined'?window:globalThis);
