/* UI definitions: IDs are stable public embed identifiers. */
(function(root){
'use strict';
const m=root.ToolPivioMath;
const fmt=n=>new Intl.NumberFormat('en',{maximumFractionDigits:4}).format(n);
const amount=n=>fmt(n)+' (in your input currency)';
const field=(name,label,example,extra={})=>({name,label,example,...extra});
const select=(name,label,options,extra={})=>({name,label,options,...extra});
const spend=field('spend','Advertising spend','1000');
const definitions={
 roas:{fields:[field('revenue','Attributed revenue','5000'),spend],calculate:v=>{const r=m.roas(v.revenue,v.spend);return 'Return on ad spend: '+fmt(r.roas)+'×\nROAS percentage: '+fmt(r.percentage)+'%';}},
 margin:{fields:[field('revenue','Revenue','100'),field('cost','Total cost','60')],calculate:v=>{const r=m.margin(v.revenue,v.cost);return 'Profit (in your input currency): '+fmt(r.profit)+'\nProfit margin: '+fmt(r.margin)+'%';}},
 dpi:{fields:[field('width','Image width (pixels)','3000',{whole:true}),field('height','Image height (pixels)','2400',{whole:true}),field('printWidth','Print width','10'),field('printHeight','Print height','8'),select('unit','Print size unit',[['in','Inches'],['cm','Centimeters']])],calculate:v=>{const r=m.dpi(v.width,v.height,v.printWidth,v.printHeight,v.unit);return 'Horizontal resolution: '+fmt(r.horizontal)+' PPI\nVertical resolution: '+fmt(r.vertical)+' PPI';}},
 cpc:{fields:[spend,field('clicks','Total clicks','500',{whole:true})],calculate:v=>'Cost per click: '+amount(m.cpc(v.spend,v.clicks).cpc)},
 cpm:{fields:[spend,field('impressions','Total impressions','200000',{whole:true})],calculate:v=>'Cost per 1,000 impressions: '+amount(m.cpm(v.spend,v.impressions).cpm)},
 ctr:{fields:[field('clicks','Total clicks','500',{whole:true}),field('impressions','Total impressions','20000',{whole:true})],calculate:v=>'Click-through rate: '+fmt(m.ctr(v.clicks,v.impressions).ctr)+'%'},
 cpa:{fields:[spend,field('acquisitions','Total acquisitions / conversions','50',{whole:true})],calculate:v=>'Cost per acquisition: '+amount(m.cpa(v.spend,v.acquisitions).cpa)},
 discount:{fields:[field('price','Original price','80'),field('percentage','Discount (%)','25',{max:100})],calculate:v=>{const r=m.discount(v.price,v.percentage);return 'Sale price: '+amount(r.salePrice)+'\nYou save: '+amount(r.savings);}},
 markup:{fields:[field('cost','Unit cost','60'),field('sellingPrice','Unit selling price','100')],calculate:v=>{const r=m.markup(v.cost,v.sellingPrice);return 'Markup on cost: '+fmt(r.markup)+'%\nUnit profit: '+amount(r.profit);}},
 'break-even':{fields:[field('fixedCost','Fixed costs for the period','1000'),field('price','Selling price per unit','25'),field('variableCost','Variable cost per unit','15')],calculate:v=>{const r=m.breakEven(v.fixedCost,v.price,v.variableCost);return 'Whole units to break even: '+fmt(r.units)+'\nExact break-even units: '+fmt(r.exactUnits)+'\nContribution per unit: '+amount(r.contribution)+'\nRevenue at whole-unit break-even: '+amount(r.revenue);}},
 'bleed-trim':{fields:[field('width','Trim width','210'),field('height','Trim height','297'),field('bleed','Bleed on each edge','3'),select('unit','Size unit',[['mm','Millimeters'],['cm','Centimeters'],['in','Inches']])],calculate:v=>{const r=m.bleedTrim(v.width,v.height,v.bleed,v.unit);return 'Artwork with bleed: '+fmt(r.width)+' × '+fmt(r.height)+' '+v.unit+'\nFinal trim: '+fmt(r.trimWidth)+' × '+fmt(r.trimHeight)+' '+v.unit;}},
 'print-size':{fields:[field('width','Width','3000'),field('height','Height','2400'),select('from','Convert from',[['px','Pixels'],['mm','Millimeters'],['cm','Centimeters'],['in','Inches']]),select('to','Convert to',[['in','Inches'],['mm','Millimeters'],['cm','Centimeters'],['px','Pixels']]),field('ppi','Resolution (pixels per inch)','300')],calculate:v=>{const r=m.printSize(v.width,v.height,v.from,v.to,v.ppi);return 'Converted size: '+fmt(r.width)+' × '+fmt(r.height)+' '+v.to+(v.to==='px'?'\nNearest whole pixels: '+Math.round(r.width)+' × '+Math.round(r.height):'')+'\nResolution: '+fmt(Number(v.ppi))+' PPI';}},
 'video-size':{fields:[select('mode','Calculate',[['size','File size from bitrate'],['bitrate','Video bitrate from target size']]),field('seconds','Duration (seconds)','60'),field('videoMbps','Video bitrate (Mbps)','8',{when:['mode','size']}),field('fileMB','Target file size (MB, decimal)','60.96',{when:['mode','bitrate']}),field('audioKbps','Audio bitrate (kbps; 0 for silent)','128')],calculate:v=>{if(v.mode==='bitrate'){const r=m.videoBitrate(v.seconds,v.fileMB,v.audioKbps);return 'Video bitrate budget: '+fmt(r.videoMbps)+' Mbps\nCombined bitrate: '+fmt(r.totalMbps)+' Mbps';}if(v.mode!=='size')throw Error('Choose a supported calculation.');const r=m.videoSize(v.seconds,v.videoMbps,v.audioKbps);return 'Estimated file size: '+fmt(r.MB)+' MB\nBinary file size: '+fmt(r.MiB)+' MiB\nCombined bitrate: '+fmt(r.bitrateMbps)+' Mbps';}},
 'frames-duration':{fields:[select('mode','Convert',[['frames','Frames to duration'],['duration','Duration to frames']]),field('value','Total frames or seconds (according to mode)','300'),field('fps','Frame rate (frames per second)','30')],calculate:v=>{const r=m.framesDuration(v.value,v.fps,v.mode);return 'Frames: '+fmt(r.frames)+'\nDuration: '+fmt(r.seconds)+' seconds'+(v.mode==='duration'?'\nRounded to the nearest whole frame.':'');}}
};
root.ToolPivioDefinitions=definitions;
if(typeof module!=='undefined'&&module.exports)module.exports=definitions;
})(typeof window!=='undefined'?window:globalThis);
