const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../src/calculators.js');
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<Math.max(1e-9,Math.abs(expected)*1e-12),`${actual} ≈ ${expected}`);
test('marketing costs, zero spend/clicks, and percentage',()=>{
 assert.equal(c.cpc(1000,500).cpc,2);assert.equal(c.cpm(1000,200000).cpm,5);assert.equal(c.ctr(500,20000).ctr,2.5);assert.equal(c.cpa(1000,50).cpa,20);
 assert.equal(c.cpc(0,1).cpc,0);assert.equal(c.ctr(0,1).ctr,0);assert.equal(c.ctr(2,1).ctr,200);
 for(const f of [c.cpc,c.cpm,c.cpa])for(const v of [0,'',-1,1.5,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>f(100,v));
 assert.throws(()=>c.ctr(1.2,100));
});
test('discount bounds and markup versus margin',()=>{
 assert.deepEqual(c.discount(80,25),{savings:20,salePrice:60});assert.equal(c.discount(80,0).salePrice,80);assert.equal(c.discount(80,100).salePrice,0);
 assert.throws(()=>c.discount(80,101));assert.throws(()=>c.discount(80,-1));assert.throws(()=>c.discount(80,''));
 near(c.markup(60,100).markup,100*40/60);assert.deepEqual(c.markup(100,80),{profit:-20,markup:-20});assert.equal(c.markup(100,0).markup,-100);assert.throws(()=>c.markup(0,100));
 assert.equal(c.discount(1e308,100).salePrice,0);
});
test('break-even rounds upward and handles loss and decimal precision',()=>{
 assert.deepEqual(c.breakEven(1000,25,15),{contribution:10,exactUnits:100,units:100,revenue:2500});
 assert.equal(c.breakEven(1001,25,15).units,101);assert.equal(c.breakEven(0,25,15).units,0);assert.equal(c.breakEven(0.1,0.3,0.2).units,1);assert.equal(c.breakEven(1.0000000000000004,1,0).units,2);
 assert.equal(c.breakEven(1e-20,25,15).units,1);
 assert.throws(()=>c.breakEven(100,10,10));assert.throws(()=>c.breakEven(100,10,11));assert.throws(()=>c.breakEven(1e308,1e-308,0));
});
test('bleed per edge and print size conversion across physical and pixel units',()=>{
 assert.deepEqual(c.bleedTrim(210,297,3,'mm'),{width:216,height:303,trimWidth:210,trimHeight:297});assert.equal(c.bleedTrim(8,10,0.125,'in').width,8.25);assert.equal(c.bleedTrim(8,10,0,'in').width,8);
 near(c.printSize(3000,2400,'px','in',300).width,10);near(c.printSize(3000,2400,'px','mm',300).height,203.2);near(c.printSize(25.4,20.32,'cm','px',300).width,3000);
 for(const unit of ['mm','cm','in','px']){const a=c.printSize(3000,2400,'px',unit,300);const b=c.printSize(a.width,a.height,unit,'px',300);near(b.width,3000);near(b.height,2400);}
 assert.throws(()=>c.printSize(1.5,2,'px','in',300));assert.throws(()=>c.printSize(1,2,'pt','mm',300));assert.throws(()=>c.printSize(1,2,'in','px',0));assert.throws(()=>c.bleedTrim(1,2,3,'px'));
});
test('video decimal megabytes, binary mebibytes, silent audio and inverse budget',()=>{
 const r=c.videoSize(60,8,128);near(r.MB,60.96);near(r.MiB,60960000/1048576);near(r.bitrateMbps,8.128);near(c.videoBitrate(60,60.96,128).videoMbps,8);
 assert.equal(c.videoSize(8,1,0).MB,1);assert.equal(c.videoBitrate(8,1,0).videoMbps,1);
 assert.throws(()=>c.videoSize(0,1,0));assert.throws(()=>c.videoSize(1,0,0));assert.throws(()=>c.videoSize(1,1,-1));assert.throws(()=>c.videoBitrate(60,0.01,128));
});
test('frames and duration use constant fractional frame rates and whole output',()=>{
 assert.deepEqual(c.framesDuration(300,30,'frames'),{frames:300,seconds:10});near(c.framesDuration(300,29.97,'frames').seconds,300/29.97);
 assert.deepEqual(c.framesDuration(10,30,'duration'),{frames:300,seconds:10});assert.equal(c.framesDuration(0.05,30,'duration').frames,2);assert.deepEqual(c.framesDuration(0,30,'frames'),{frames:0,seconds:0});
 assert.throws(()=>c.framesDuration(1.5,30,'frames'));assert.throws(()=>c.framesDuration(300,0,'frames'));assert.throws(()=>c.framesDuration(300,30,'timecode'));assert.throws(()=>c.framesDuration(1e20,30,'duration'));
});
test('all numeric definitions execute their examples and correspond to metadata',()=>{
 const definitions=require('../src/tool-definitions.js');const metadata=require('../src/new-tools.json');
 for(const record of metadata){const d=definitions[record.id];assert.ok(d,record.id);const values=Object.fromEntries(d.fields.map(f=>[f.name,f.options?f.options[0][0]:f.example]));assert.ok(d.calculate(values).length>0,record.id);assert.ok(record.formula&&record.example&&record.limitations);}
 assert.throws(()=>definitions['video-size'].calculate({mode:'unknown'}));
});
