(() => {
  if (!location.pathname.startsWith('/bypass')) return;
  const jobId = new URL(location.href).searchParams.get('fa_job');
  if (window.top !== window && !/^[0-9a-f-]{36}$/i.test(jobId || '')) return;
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
    if (!challengeReported && (/please solve the captcha to continue/i.test(text) || /^(just a moment|attention required)/i.test(document.title) || !!document.querySelector('iframe[src*="hcaptcha.com"], iframe[src*="challenges.cloudflare.com"], .h-captcha, [data-sitekey].cf-turnstile'))) {
      challengeReported = true; chrome.runtime.sendMessage({type:'CITY_CHALLENGE'}).catch(() => {});
    }
    if (/site not supported|link not found|bypass temporarily disabled|too many requests/i.test(text)) {
      delivered = true; chrome.runtime.sendMessage({type:'CITY_ERROR'}).catch(() => {});
    }
  }
  chrome.runtime.sendMessage({type:'CITY_READY'}).catch(() => {}).finally(() => {
    new MutationObserver(inspect).observe(document.documentElement,{childList:true,subtree:true,attributes:true});
    inspect();
  });
})();
