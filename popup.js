const el = id => document.getElementById(id);
let tab;
const activeTab = chrome.tabs.query({active: true, currentWindow: true}).then(([current]) => { tab = current; return current; });

(async () => {
  try {
    const current = await activeTab;
    const url = new URL(current.url);
    if (!['https:', 'http:'].includes(url.protocol)) return;
    const domains = await (await fetch(chrome.runtime.getURL('domains.json'))).json();
    const work = url.hostname === 'work.ink' || url.hostname.endsWith('.work.ink');
    if (!work && !domains.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))) return;
    tab.provider = work ? 'work' : 'city';
    el('site').textContent = url.hostname;
    el('url').textContent = current.url;
    el('status').classList.add('ready');
    el('status').lastElementChild.textContent = 'Ready';
    el('message').textContent = work ? 'Work.ink runs in a background tab.' : 'This link will be sent to bypass.city.';
    el('bypass').disabled = false;
    el('bypassSection').hidden = false;
  } catch { /* No supported page available. */ }
})();

el('bypass').addEventListener('click', async () => {
  el('bypass').disabled = true;
  el('buttonText').textContent = 'Starting…';
  try {
    const result = await chrome.runtime.sendMessage({type:'START', tabId:tab.id, url:tab.url, provider:tab.provider});
    if (!result?.ok) throw Error(result?.error || 'Could not start.');
    window.close();
  } catch (error) {
    el('message').textContent = error.message;
    el('message').classList.add('error');
    el('bypass').disabled = false;
    el('buttonText').textContent = 'Try again';
  }
});

async function reloadActiveTab() {
  const current = await activeTab;
  if (!current?.id || !/^https?:/i.test(current.url || '')) return false;
  try { await chrome.tabs.reload(current.id); return true; } catch { return false; }
}

const blocker = el('adblock'), blockerMessage = el('blocker-message');
(async () => {
  try { blocker.checked = (await chrome.declarativeNetRequest.getEnabledRulesets()).includes('adblock'); blocker.disabled = false; }
  catch { blockerMessage.textContent = 'Could not read ad blocker status.'; }
})();
blocker.addEventListener('change', async () => {
  const desired = blocker.checked;
  blocker.disabled = true; blockerMessage.textContent = '';
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets(desired ? {enableRulesetIds:['adblock']} : {disableRulesetIds:['adblock']});
    await chrome.storage.local.set({adblockEnabled: desired});
    const result = await chrome.runtime.sendMessage({type:'SYNC_DYNAMIC_FILTERS', enabled:desired});
    if (!result?.ok) blockerMessage.textContent = 'The live filter list could not be updated; bundled rules still work.';
    if (!await reloadActiveTab()) blockerMessage.textContent += ' Reload this page manually if needed.';
  } catch {
    try { blocker.checked = (await chrome.declarativeNetRequest.getEnabledRulesets()).includes('adblock'); await chrome.storage.local.set({adblockEnabled:blocker.checked}); } catch {}
    blockerMessage.textContent = 'Could not fully update ad blocker. Reload the extension and try again.';
  } finally { blocker.disabled = false; }
});

const spoof = el('browserSpoof'), spoofMessage = el('spoofMessage'), menu = el('browserMenu');
const options = el('browserOptions');
for (const option of spoof.options) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'browser-option'; button.textContent = option.textContent; button.dataset.value = option.value;
  button.addEventListener('click', () => { menu.open = false; if (!spoof.disabled && spoof.value !== option.value) { spoof.value = option.value; spoof.dispatchEvent(new Event('change')); } });
  options.append(button);
}
function renderIdentity() {
  el('browserValue').textContent = spoof.selectedOptions[0]?.textContent || 'Browser default';
  for (const button of options.children) { const selected = button.dataset.value === spoof.value; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); button.disabled = spoof.disabled; }
  menu.classList.toggle('disabled', spoof.disabled);
}
menu.addEventListener('toggle', () => { if (menu.open && spoof.disabled) menu.open = false; });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
(async () => { try { spoof.value = (await chrome.storage.local.get('browserSpoof')).browserSpoof || 'default'; spoof.disabled = false; } catch { spoofMessage.textContent = 'Could not read browser identity.'; } renderIdentity(); })();
spoof.addEventListener('change', async () => {
  spoof.disabled = true; renderIdentity();
  try {
    const result = await chrome.runtime.sendMessage({type:'SET_BROWSER_SPOOF', value:spoof.value});
    if (!result?.ok) throw Error(result?.error || 'Could not change identity.');
    spoofMessage.textContent = await reloadActiveTab() ? 'Identity updated. Sites may still detect your browser.' : 'Identity updated. Reload this page manually if needed.';
  } catch (error) { spoof.value = (await chrome.storage.local.get('browserSpoof')).browserSpoof || 'default'; spoofMessage.textContent = error.message; }
  finally { spoof.disabled = false; renderIdentity(); }
});

function newerVersion(candidate, installed) {
  if (!/^\d+(?:\.\d+){0,3}$/.test(candidate)) return false;
  const remote = candidate.split('.').map(Number), local = installed.split('.').map(Number);
  for (let i = 0; i < 4; i++) { const diff = (remote[i] || 0) - (local[i] || 0); if (diff) return diff > 0; }
  return false;
}
let updateURL;
(async () => {
  try {
    const response = await fetch('https://api.github.com/repos/TheNinoDev/FuckAds./releases/latest', {headers:{Accept:'application/vnd.github+json'}, cache:'no-store', signal:AbortSignal.timeout(10000)});
    if (!response.ok) return;
    const release = await response.json();
    const version = String(release.tag_name || '').replace(/^v/, '');
    if (!newerVersion(version, chrome.runtime.getManifest().version)) return;
    const assets = release.assets?.filter(asset => asset.name === 'FuckAds.zip') || [];
    if (assets.length !== 1) return;
    const url = new URL(assets[0].browser_download_url);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !url.pathname.startsWith('/TheNinoDev/FuckAds./releases/download/')) return;
    updateURL = url.href;
    el('updateMessage').textContent = `Version ${version} is available. Downloads a ZIP to install manually.`;
    el('updates').hidden = false;
  } catch { /* No verified update available. */ }
})();
el('update').addEventListener('click', async () => {
  const button = el('update'); button.disabled = true;
  try { await chrome.downloads.download({url:updateURL, filename:'FuckAds.zip', conflictAction:'uniquify'}); el('updateMessage').textContent = 'Download started. Extract the ZIP over the extension folder, then reload FuckAds.'; }
  catch { el('updateMessage').textContent = 'Download failed. Try again.'; }
  finally { button.disabled = false; }
});
