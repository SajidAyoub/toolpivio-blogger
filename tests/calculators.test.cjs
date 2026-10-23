const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../src/calculators.js');
test('ROAS example and zero revenue',()=>{assert.deepEqual(c.roas(5000,1000),{roas:5,percentage:500});assert.equal(c.roas(0,20).roas,0);});
test('margin, break-even and loss',()=>{assert.deepEqual(c.margin(100,60),{profit:40,margin:40});assert.equal(c.margin(100,100).margin,0);assert.equal(c.margin(100,120).margin,-20);assert.equal(c.margin(100,0).margin,100);});
test('print inches, centimeters, unequal axes',()=>{assert.deepEqual(c.dpi(3000,2400,10,8,'in'),{horizontal:300,vertical:300});assert.ok(Math.abs(c.dpi(3000,2400,25.4,20.32,'cm').horizontal-300)<1e-9);assert.equal(c.dpi(100,200,1,1,'in').vertical,200);});
test('reject missing, negative, nonnumeric and infinite values',()=>{for(const v of ['', '  ',null,undefined,NaN,Infinity,-1,'abc',true]){assert.throws(()=>c.roas(v,1));assert.throws(()=>c.margin(1,v));assert.throws(()=>c.dpi(v,100,1,1,'in'));}});
test('reject zero divisors, fractional pixels, invalid units and overflow',()=>{assert.throws(()=>c.roas(1,0));assert.throws(()=>c.margin(0,1));assert.throws(()=>c.dpi(1,1,0,1,'in'));assert.throws(()=>c.dpi(1.5,1,1,1,'in'));assert.throws(()=>c.dpi(1,1,1,1,'mm'));assert.throws(()=>c.roas(1e308,1e-308));});
test('decimal amounts and numeric strings',()=>{assert.equal(c.roas('12.5','2.5').roas,5);assert.equal(c.margin('10','2.5').margin,75);});
