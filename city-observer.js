(() => {
  if (window.top !== window || !location.pathname.startsWith('/bypass')) return;
  let delivered = false, challengeReported = false;
  function inspect() {
    if (delivered) return;
    const link = document.querySelector('#open-bypassed-link');
    if (link instanceof HTMLAnchorElement && link.href) {
      let target; try { target = new URL(link.href); } catch { return; }
      if (target.protocol !== 'https:' && target.protocol !== 'http:') return;
      delivered = true; chrome.runtime.sendMessage({type:'CITY_RESULT',target:target.href}).catch(() => {}); return;
    }
    const text = document.body?.innerText || '';
    if (!challengeReported && /please solve the captcha to continue/i.test(text)) {
      challengeReported = true; chrome.runtime.sendMessage({type:'CITY_CHALLENGE'}).catch(() => {});
    }
    if (/site not supported|link not found|bypass temporarily disabled|too many requests/i.test(text)) {
      delivered = true; chrome.runtime.sendMessage({type:'CITY_ERROR'}).catch(() => {});
    }
  }
  new MutationObserver(inspect).observe(document.documentElement,{childList:true,subtree:true,attributes:true});
  inspect();
})();
