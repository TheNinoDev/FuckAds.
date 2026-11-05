(() => {
  let style;
  const css = [
    'div[id^="aswift_"][id$="_host"]',
    'iframe[id^="aswift_"]',
    'ins.adsbygoogle',
    'iframe[id^="google_ads_iframe_"]',
    'iframe[src*="googleads.g.doubleclick.net/pagead/ads"]'
  ].map(selector => selector + ' { display: none !important; }').join('\n');
  function update(enabled) {
    if (!enabled) { style?.remove(); style = undefined; return; }
    if (style?.isConnected) return;
    const parent = document.head || document.documentElement;
    if (!parent) return;
    style = document.createElement('style');
    style.textContent = css;
    parent.appendChild(style);
  }
  let enabled = false;
  chrome.storage.local.get('adblockEnabled').then(data => {
    enabled = data.adblockEnabled === true;
    update(enabled);
  }).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.adblockEnabled) {
      enabled = changes.adblockEnabled.newValue === true;
      update(enabled);
    }
  });
  if (!document.documentElement) document.addEventListener('DOMContentLoaded', () => update(enabled), {once:true});
})();
