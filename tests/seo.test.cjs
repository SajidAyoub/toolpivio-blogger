const test = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');

test('published guide metadata, canonical URLs, iframe sources and internal links stay consistent', () => {
  const result = spawnSync('python3', ['scripts/validate_seo.py'], {cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
