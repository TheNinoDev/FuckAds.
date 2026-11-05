// HaGeZi Multi LIGHT: domain data only. Executable filtering code remains bundled.
const LIVE_FILTER_URL = 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/light-onlydomains.txt';
const YOUTUBE_FILTER_URL = 'https://easylist.to/easylist/easylist.txt';
const LIVE_FILTER_ALARM = 'fuckads-live-filters';
const LIVE_FILTER_FIRST_ID = 3000000;
const LIVE_FILTER_LAST_ID = 3000099;
const LIVE_FILTER_TTL = 12 * 60 * 60 * 1000;
const LIVE_FILTER_PROTECTED = ['work.ink', 'bypass.city', 'youtube.com', 'googlevideo.com'];
let liveFilterQueue = Promise.resolve();

function parseLiveDomains(text) {
  const domains = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const domain = raw.trim().toLowerCase();
    if (!domain || domain.startsWith('#')) continue;
    if (domain.length > 253 || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) continue;
    if (LIVE_FILTER_PROTECTED.some(protectedDomain => domain === protectedDomain || protectedDomain.endsWith('.' + domain) || domain.endsWith('.' + protectedDomain))) continue;
    domains.add(domain);
    if (domains.size > 180000) throw Error('Filter list is too large.');
  }
  if (domains.size < 1000) throw Error('Filter list is incomplete.');
  return [...domains];
}

async function applyLiveDomains(domains) {
  const old = (await chrome.declarativeNetRequest.getDynamicRules()).filter(rule => rule.id >= LIVE_FILTER_FIRST_ID && rule.id <= LIVE_FILTER_LAST_ID).map(rule => rule.id);
  const enabled = (await chrome.declarativeNetRequest.getEnabledRulesets()).includes('adblock');
  const rules = [];
  if (enabled && domains) for (let start = 0; start < domains.length; start += 2000) {
    const id = LIVE_FILTER_FIRST_ID + rules.length;
    if (id > LIVE_FILTER_LAST_ID) throw Error('Filter list exceeds the rule budget.');
    rules.push({id, priority:1, action:{type:'block'}, condition:{requestDomains:domains.slice(start, start + 2000), domainType:'thirdParty', excludedInitiatorDomains:['work.ink','bypass.city'], resourceTypes:['sub_frame','stylesheet','script','image','font','object','xmlhttprequest','ping','media','websocket','other']}});
  }
  await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:old, addRules:rules});
}

async function refreshLiveFilters() {
  const enabled = (await chrome.declarativeNetRequest.getEnabledRulesets()).includes('adblock');
  if (!enabled) { await applyLiveDomains(null); return; }
  const cached = await chrome.storage.local.get(['liveFilterDomains', 'liveFilterUpdatedAt']);
  if (Array.isArray(cached.liveFilterDomains) && cached.liveFilterDomains.length >= 1000) await applyLiveDomains(cached.liveFilterDomains);
  if (cached.liveFilterUpdatedAt && Date.now() - cached.liveFilterUpdatedAt < LIVE_FILTER_TTL && cached.liveFilterDomains?.length >= 1000) return;
  const response = await fetch(LIVE_FILTER_URL, {cache:'no-store', signal:AbortSignal.timeout(25000)});
  if (!response.ok || Number(response.headers.get('content-length') || 0) > 8000000) throw Error('Filter list download failed.');
  const text = await response.text();
  if (text.length > 8000000) throw Error('Filter list is too large.');
  const domains = parseLiveDomains(text);
  await applyLiveDomains(domains);
  await chrome.storage.local.set({liveFilterDomains:domains, liveFilterUpdatedAt:Date.now()});
}
function parseYouTubeSelectors(text) {
  const selectors = new Set();
  for (const line of text.split(/\r?\n/)) {
    const match = /^(?:www\.)?youtube\.com##(.+)$/.exec(line.trim());
    if (!match) continue;
    const selector = match[1].trim();
    // Only simple CSS filter data, never scriptlets, declarations or procedural filters.
    if (selector.length > 300 || /[{},;@\\]|\+js\(|:(?:style|remove|has-text|matches-css|xpath|upward)\(/i.test(selector)) continue;
    if (!/^[a-zA-Z0-9_#.*\-\s>+~:[\]()="'^$|]+$/.test(selector)) continue;
    selectors.add(selector);
    if (selectors.size > 500) throw Error('YouTube list is too large.');
  }
  if (!selectors.size) throw Error('YouTube list has no supported filters.');
  return [...selectors];
}
async function refreshYouTubeFilters() {
  if (!(await chrome.declarativeNetRequest.getEnabledRulesets()).includes('adblock')) return;
  const cached = await chrome.storage.local.get(['youtubeLiveSelectors','youtubeLiveUpdatedAt']);
  if (cached.youtubeLiveUpdatedAt && Date.now() - cached.youtubeLiveUpdatedAt < LIVE_FILTER_TTL && cached.youtubeLiveSelectors?.length) return;
  const response = await fetch(YOUTUBE_FILTER_URL, {cache:'no-store', signal:AbortSignal.timeout(25000)});
  if (!response.ok || Number(response.headers.get('content-length') || 0) > 8000000) throw Error('YouTube filter download failed.');
  const text = await response.text();
  if (text.length > 8000000) throw Error('YouTube list is too large.');
  await chrome.storage.local.set({youtubeLiveSelectors:parseYouTubeSelectors(text), youtubeLiveUpdatedAt:Date.now()});
}
function queueLiveFilterRefresh() {
  const next = liveFilterQueue.catch(() => {}).then(async () => {
    const results = await Promise.allSettled([refreshLiveFilters(), refreshYouTubeFilters()]);
    if (results.some(result => result.status === 'rejected')) throw Error('Some live filters could not be refreshed.');
  });
  liveFilterQueue = next;
  return next;
}

chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create(LIVE_FILTER_ALARM, {periodInMinutes:720}); queueLiveFilterRefresh().catch(() => {}); });
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create(LIVE_FILTER_ALARM, {periodInMinutes:720}); queueLiveFilterRefresh().catch(() => {}); });
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === LIVE_FILTER_ALARM) queueLiveFilterRefresh().catch(() => {}); });
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.type !== 'SYNC_DYNAMIC_FILTERS') return;
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL('popup.html'))) { reply({ok:false}); return; }
  queueLiveFilterRefresh().then(() => reply({ok:true}), () => reply({ok:false}));
  return true;
});
