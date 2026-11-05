(() => {
  let enabled = false;
  let observer;
  let timer;
  let pending = false;
  let liveStyle;
  let liveSelectors = [];
  const clickedAt = new WeakMap();
  const selectors = [
    'button.ytp-ad-skip-button-modern',
    'button.ytp-ad-skip-button',
    '.ytp-ad-skip-button-container button',
    'button.ytp-skip-ad-button',
    '.ytp-ad-skip-button-slot button',
    '.ytp-skip-ad-button button',
    '.ytp-ad-skip-button-modern button'
  ].join(',');
  function check() {
    pending = false;
    if (!enabled) return;
    for (const player of document.querySelectorAll('.html5-video-player.ad-showing, .html5-video-player.ad-interrupting')) {
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
    applyLiveSelectors();
    if (!enabled) { observer?.disconnect(); observer = undefined; if (timer) clearInterval(timer); timer = undefined; return; }
    if (!observer && document.documentElement) {
      observer = new MutationObserver(schedule);
      observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class','disabled','aria-disabled','style']});
    }
    if (!timer) timer = setInterval(schedule, 750);
    schedule();
  }
  function applyLiveSelectors() {
    liveStyle?.remove(); liveStyle = undefined;
    if (!enabled || !document.documentElement || !Array.isArray(liveSelectors)) return;
    const safe = [];
    for (const selector of liveSelectors) {
      if (typeof selector !== 'string' || selector.length > 300 || /[{},;@\\]|\+js\(/i.test(selector)) continue;
      try { document.querySelector(selector); safe.push(selector); } catch { /* Unsupported CSS syntax. */ }
    }
    if (!safe.length) return;
    liveStyle = document.createElement('style');
    liveStyle.textContent = safe.map(selector => selector + ' { display:none !important; }').join('\n');
    (document.head || document.documentElement).appendChild(liveStyle);
  }
  chrome.storage.local.get(['adblockEnabled','youtubeLiveSelectors']).then(data => { liveSelectors = data.youtubeLiveSelectors || []; configure(data.adblockEnabled); }).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.adblockEnabled) configure(changes.adblockEnabled.newValue);
    if (area === 'local' && changes.youtubeLiveSelectors) { liveSelectors = changes.youtubeLiveSelectors.newValue || []; applyLiveSelectors(); }
  });
  if (!document.documentElement) document.addEventListener('DOMContentLoaded', () => configure(enabled), {once:true});
})();
