(() => {
  let enabled = false;
  let observer;
  let pending = false;
  const clickedAt = new WeakMap();
  const selectors = [
    'button.ytp-ad-skip-button-modern',
    'button.ytp-ad-skip-button',
    '.ytp-ad-skip-button-container button',
    'button.ytp-skip-ad-button'
  ].join(',');
  function check() {
    pending = false;
    if (!enabled) return;
    for (const player of document.querySelectorAll('.html5-video-player.ad-showing')) {
      for (const button of player.querySelectorAll(selectors)) {
        if (button.disabled || button.getAttribute('aria-disabled') === 'true' || !button.getClientRects().length) continue;
        const now = Date.now();
        if (now - (clickedAt.get(button) || 0) < 1000) continue;
        clickedAt.set(button, now);
        button.click();
      }
    }
  }
  function schedule() {
    if (!enabled || pending) return;
    pending = true;
    setTimeout(check, 100);
  }
  function configure(value) {
    enabled = value === true;
    if (!enabled) { observer?.disconnect(); observer = undefined; return; }
    if (!observer && document.documentElement) {
      observer = new MutationObserver(schedule);
      observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class','disabled','aria-disabled','style']});
    }
    schedule();
  }
  chrome.storage.local.get('adblockEnabled').then(data => configure(data.adblockEnabled)).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.adblockEnabled) configure(changes.adblockEnabled.newValue);
  });
  if (!document.documentElement) document.addEventListener('DOMContentLoaded', () => configure(enabled), {once:true});
})();
