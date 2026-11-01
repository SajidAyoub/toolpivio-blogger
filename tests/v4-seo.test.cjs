const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
test('V4 preserves canonical ownership, social metadata and useful category links',()=>{
 const result=spawnSync('python3',['scripts/validate_v4_seo.py'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
});
