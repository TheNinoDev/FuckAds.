const frames = new Map();
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.target !== 'fuckads-offscreen' || sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('background.js')) return;
  if (!/^[0-9a-f-]{36}$/i.test(message.id || '')) { reply({ok:false}); return; }
  if (message.type === 'CITY_CLOSE') {
    frames.get(message.id)?.remove();
    frames.delete(message.id);
    reply({ok:true});
  } else if (message.type === 'CITY_OPEN') {
    let url;
    try { url = new URL(message.url); } catch { reply({ok:false}); return; }
    if (url.origin !== 'https://bypass.city' || url.pathname !== '/bypass' || url.searchParams.get('fa_job') !== message.id) { reply({ok:false}); return; }
    frames.get(message.id)?.remove();
    const frame = document.createElement('iframe');
    frame.src = url.href;
    frames.set(message.id, frame);
    document.body.append(frame);
    reply({ok:true});
  }
});
