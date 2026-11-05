window.addEventListener('fuckads-work-destination',event => {
  if (typeof event.detail === 'string') chrome.runtime.sendMessage({type:'WORK_RESULT',target:event.detail}).catch(() => {});
});
