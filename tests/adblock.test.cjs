const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('bundled domain rules are valid and do not block bypass providers', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
  const resource = manifest.declarative_net_request.rule_resources.find(r => r.id === 'adblock');
  assert.equal(resource.enabled, false);
  const rules = JSON.parse(fs.readFileSync(path.join(root, resource.path)));
  const ids = new Set(), domains = new Set();
  for (const rule of rules) {
    assert(!ids.has(rule.id)); ids.add(rule.id);
    assert(['block', 'allow', 'allowAllRequests'].includes(rule.action.type));
    for (const domain of (rule.condition.requestDomains || [])) {
      assert.match(domain, /^[a-z0-9._-]+$/);
      domains.add(domain);
      if (domain !== 'opera-download.work.ink' && rule.action.type === 'block' && !rule.condition.initiatorDomains && !rule.condition.urlFilter) assert(!['work.ink', 'bypass.city'].some(d => domain === d || domain.endsWith('.' + d)));
    }
  }
  assert(domains.size > 1000);
});
