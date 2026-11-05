if (typeof importScripts === 'function') importScripts('dynamic-filters.js');
const SPOOF_ID = 2050001, SPOOF_SCRIPT = 'fuckads-browser-spoof';
const SPOOF_UA = {"brave":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36","chrome":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36","chromium":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36","opera":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 OPR/140.0.0.0","opera_gx":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 OPR/140.0.0.0","edge":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0","vivaldi":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Vivaldi/8.3.4191.26","firefox":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:159.0) Gecko/20100101 Firefox/159.0","safari":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15","samsung":"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36"};
// Keep unpinned Chromium identities consistent with the installed engine.
const engineVersion = (navigator.userAgent.match(/(?:HeadlessChrome|Chrome|Chromium)\/(\d+(?:\.\d+){0,3})/) || [])[1];
if (engineVersion) for (const key of ['brave','chrome','chromium','edge']) {
 SPOOF_UA[key] = SPOOF_UA[key].replace('Chrome/140.0.0.0', 'Chrome/' + engineVersion);
}
if (engineVersion) {
 SPOOF_UA.edge = SPOOF_UA.edge.replace('Edg/140.0.0.0', 'Edg/' + engineVersion);
}
async function setBrowserSpoof(choice) {
 if (choice !== 'default' && !Object.hasOwn(SPOOF_UA, choice)) throw Error('Unknown browser.');
 const current=(await chrome.storage.local.get('browserSpoof')).browserSpoof || 'default';
 async function scriptsFor(value) {
  const existing=await chrome.scripting.getRegisteredContentScripts({ids:[SPOOF_SCRIPT]});
  if(existing.length) await chrome.scripting.unregisterContentScripts({ids:[SPOOF_SCRIPT]});
  if(value!=='default') await chrome.scripting.registerContentScripts([{id:SPOOF_SCRIPT,matches:['http://*/*','https://*/*'],js:['spoof/'+value+'.js'],runAt:'document_start',world:'MAIN',allFrames:true,persistAcrossSessions:true}]);
 }
 const rulesFor=value=>{
  if(value==='default')return [];
  const headers=[{header:'user-agent',operation:'set',value:SPOOF_UA[value]}];
  const noHints=['firefox','safari'].includes(value);
  const major=value==='samsung'?'117':(value==='opera'||value==='opera_gx')?'155':value==='vivaldi'?'156':(engineVersion || '140').split('.')[0], mobile=value==='samsung';
  const platform=mobile?'Android':'Windows';
  const product=value==='opera'||value==='opera_gx'?'Opera':value==='edge'?'Microsoft Edge':value==='samsung'?'Samsung Internet':value==='vivaldi'?'Vivaldi':value==='chromium'?'Chromium':'Google Chrome';
  const productVersion=value==='opera'||value==='opera_gx'?'140':value==='samsung'?'24':value==='vivaldi'?'8':major;
  const brands=product==='Chromium'?`"Chromium";v="${major}", "Not_A Brand";v="99"`:`"Chromium";v="${major}", "${product}";v="${productVersion}", "Not_A Brand";v="99"`;
  for(const [header,val] of [['sec-ch-ua',brands],['sec-ch-ua-mobile',mobile?'?1':'?0'],['sec-ch-ua-platform','"'+platform+'"']])headers.push(noHints?{header,operation:'remove'}:{header,operation:'set',value:val});
  for(const header of ['sec-ch-ua-full-version','sec-ch-ua-full-version-list','sec-ch-ua-arch','sec-ch-ua-bitness','sec-ch-ua-model','sec-ch-ua-platform-version','sec-ch-ua-wow64'])headers.push({header,operation:'remove'});
  return [{id:SPOOF_ID,priority:1000,action:{type:'modifyHeaders',requestHeaders:headers},condition:{urlFilter:'|http',resourceTypes:['main_frame','sub_frame','stylesheet','script','image','font','object','xmlhttprequest','ping','media','websocket','other']}}];
 };
 try {
  await scriptsFor(choice);
  await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:[SPOOF_ID],addRules:rulesFor(choice)});
  await chrome.storage.local.set({browserSpoof:choice});
 } catch (error) {
  try { await scriptsFor(current); await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:[SPOOF_ID],addRules:rulesFor(current)}); } catch {}
  throw error;
 }
}
async function restoreBrowserSpoof(){const saved=(await chrome.storage.local.get('browserSpoof')).browserSpoof || 'default';await setBrowserSpoof(Object.hasOwn(SPOOF_UA,saved)?saved:'default');}
chrome.runtime.onStartup?.addListener(()=>{restoreBrowserSpoof().catch(()=>{});});
const SCRIPT='fuckads-workink';
const work = url => {try {let h=new URL(url).hostname;return h==='work.ink'||h.endsWith('.work.ink')}catch{return false}};
let creatingOffscreen;
async function ensureOffscreen() {
 if (!chrome.offscreen) throw Error('This browser does not support hidden background pages.');
 if (creatingOffscreen) return creatingOffscreen;
 creatingOffscreen = (async () => {
  const exists = chrome.offscreen.hasDocument ? await chrome.offscreen.hasDocument() : (await clients.matchAll()).some(client => client.url === chrome.runtime.getURL('offscreen.html'));
  if (!exists) await chrome.offscreen.createDocument({url:'offscreen.html', reasons:['IFRAME_SCRIPTING'], justification:'Resolve supported links in a hidden provider frame.'});
 })();
 try { await creatingOffscreen; } finally { creatingOffscreen = undefined; }
}
async function closeHelper(key, job) {
 if (job.hidden) await chrome.runtime.sendMessage({target:'fuckads-offscreen',type:'CITY_CLOSE',id:key.slice(4)}).catch(()=>{});
 else if (job.helperId != null) await chrome.tabs.remove(job.helperId).catch(()=>{});
}
chrome.runtime.onInstalled.addListener(async details=>{await restoreBrowserSpoof().catch(()=>{});const saved=(await chrome.storage.local.get('adblockEnabled')).adblockEnabled;if(details.reason==='update'&&typeof saved==='boolean'){try{await chrome.declarativeNetRequest.updateEnabledRulesets(saved?{enableRulesetIds:['adblock']}:{disableRulesetIds:['adblock']});}catch{}}const enabled=(await chrome.declarativeNetRequest.getEnabledRulesets()).includes('adblock');await chrome.storage.local.set({adblockEnabled:enabled});if(typeof queueLiveFilterRefresh==='function')await queueLiveFilterRefresh().catch(()=>{});await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:[1]}).catch(()=>{});const rules=await chrome.declarativeNetRequest.getSessionRules();if(rules.length)await chrome.declarativeNetRequest.updateSessionRules({removeRuleIds:rules.map(r=>r.id)});});
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(m.type==='SET_BROWSER_SPOOF'){if(s.id!==chrome.runtime.id||!s.url?.startsWith(chrome.runtime.getURL('popup.html'))){reply({ok:false,error:'Invalid request.'});return;}setBrowserSpoof(m.value).then(()=>reply({ok:true}),e=>reply({ok:false,error:e.message}));return true;}
 if(m.type==='START') { (async()=>{
  const tab=await chrome.tabs.get(m.tabId);if(tab.url!==m.url)throw Error('The tab changed. Try again.');
  const id=crypto.randomUUID(), key='job:'+id, progress=chrome.runtime.getURL('progress.html')+'?id='+id;
  if(!['work','city'].includes(m.provider))throw Error('Unsupported provider.');
  let helper;
  if(m.provider==='work') helper=await chrome.tabs.create({active:false,url:'about:blank',windowId:tab.windowId});
  const job={tabId:tab.id,helperId:helper?.id,hidden:m.provider==='city',source:m.url,provider:m.provider,progress,state:'starting',createdAt:Date.now()};
  await chrome.storage.session.set({[key]:job});
  try {
   await chrome.alarms.create(key,{delayInMinutes:3});
   await chrome.tabs.update(tab.id,{url:progress});
   if(m.provider==='work'){
    const scripts=await chrome.scripting.getRegisteredContentScripts({ids:[SCRIPT]});if(!scripts.length)await chrome.scripting.registerContentScripts([{id:SCRIPT,matches:['https://work.ink/*','https://*.work.ink/*'],js:['workink.js'],runAt:'document_start',world:'MAIN',persistAcrossSessions:false}]);
    await chrome.tabs.update(helper.id,{url:m.url});
   } else {
    await ensureOffscreen();
    const u=new URL('https://bypass.city/bypass');u.searchParams.set('bypass',m.url);u.searchParams.set('fa_job',id);
    const result=await chrome.runtime.sendMessage({target:'fuckads-offscreen',type:'CITY_OPEN',id,url:u.href});
    if(!result?.ok)throw Error('Could not start the hidden provider page.');
   }
  } catch(error) { job.state='failed';job.error='Could not start the background provider.';await chrome.storage.session.set({[key]:job});await closeHelper(key,job);await chrome.alarms.clear(key);throw error; }
  return {ok:true};
 })().then(reply,e=>reply({ok:false,error:e.message}));return true; }
 if(m.type==='CITY_READY'||m.type==='CITY_RESULT'||m.type==='CITY_CHALLENGE'||m.type==='CITY_ERROR') { (async()=>{
  let origin;try{origin=new URL(s.url)}catch{return;}
  if(origin.origin!=='https://bypass.city'||origin.pathname!=='/bypass'||s.tab)return;
  const id=origin.searchParams.get('fa_job');if(!/^[0-9a-f-]{36}$/i.test(id||''))return;
  const key='job:'+id,j=(await chrome.storage.session.get(key))[key];if(!j||!j.hidden||j.provider!=='city'||origin.searchParams.get('bypass')!==j.source)return;
  if(m.type==='CITY_READY'){if(j.state==='starting'){j.state='working';await chrome.storage.session.set({[key]:j});}return;}
  if(m.type==='CITY_CHALLENGE'){j.state='verification';await chrome.storage.session.set({[key]:j});return;}
  if(m.type==='CITY_ERROR'){j.state='failed';await chrome.storage.session.set({[key]:j});await closeHelper(key,j);await chrome.alarms.clear(key);return;}
  await deliver(key,j,m.target);
 })().then(()=>reply({ok:true}),()=>reply({ok:false}));return true; }
 if(m.type==='PROGRESS_STATUS') { (async()=>{
  const job=(await chrome.storage.session.get('job:'+m.id))['job:'+m.id];
  if(!job)return null;
  if(job.provider==='city'&&job.state==='starting'&&Date.now()-job.createdAt>30000){job.state='failed';job.error='The hidden provider page could not load.';await chrome.storage.session.set({['job:'+m.id]:job});await closeHelper('job:'+m.id,job);await chrome.alarms.clear('job:'+m.id);return job;}
  if(job.provider!=='work'||['failed','timeout'].includes(job.state))return job;
  try {
   const [inspection]=await chrome.scripting.executeScript({target:{tabId:job.helperId},func:()=>({status:sessionStorage.getItem('__fuckads_work_status'),challenge:!!document.querySelector('iframe[src*="hcaptcha.com"],iframe[src*="challenges.cloudflare.com"],.h-captcha,[data-sitekey].cf-turnstile') || /^(just a moment|attention required)(\.\.\.|!|\s*\|.*)?$/i.test(document.title.trim())})});
   const details=inspection?.result;if(details?.challenge)return {...job,state:'verification'};
   if(details?.status==='timed_out')return {...job,state:'timeout',workStatus:details.status};
   if(details?.status)return {...job,workStatus:details.status};
  } catch {}
  return job;
 })().then(reply,()=>reply(null));return true;}
 if(m.type==='WORK_RESULT') { (async()=>{
  const all=await chrome.storage.session.get(null);const pair=Object.entries(all).find(([k,v])=>k.startsWith('job:')&&v.helperId===s.tab?.id&&v.provider==='work');
  if(!pair||s.frameId!==0||!work(s.url))return; await deliver(pair[0],pair[1],m.target);
 })().then(()=>reply({ok:true}),()=>reply({ok:false}));return true; }
});
async function deliver(key,j,target){
 let u;try{u=new URL(target)}catch{};if(!u||!['http:','https:'].includes(u.protocol)||u.href===j.source||work(u.href)||u.hostname==='bypass.city'){j.state='failed';await chrome.storage.session.set({[key]:j});await closeHelper(key,j);await chrome.alarms.clear(key);return;}
 const tab=await chrome.tabs.get(j.tabId).catch(()=>null);if(tab?.url===j.progress)await chrome.tabs.update(j.tabId,{url:u.href});
 await chrome.storage.session.remove(key);await chrome.alarms.clear(key);await closeHelper(key,j);
}
chrome.tabs.onUpdated.addListener(async(id,change,tab)=>{
 const all=await chrome.storage.session.get(null);const pair=Object.entries(all).find(([k,v])=>k.startsWith('job:')&&v.helperId===id&&v.provider==='work');if(!pair)return;
 const [key,j]=pair;
 if(change.status==='complete'&&work(tab.url)&&!j.initialized){j.initialized=true;j.state='working';await chrome.storage.session.set({[key]:j});try{await chrome.scripting.executeScript({target:{tabId:id},world:'MAIN',func:()=>{sessionStorage.setItem('__fuckads_attempt',JSON.stringify({url:location.href,expiresAt:Date.now()+180000}));}});await chrome.tabs.reload(id);}catch{j.state='failed';await chrome.storage.session.set({[key]:j});}}
});
chrome.tabs.onRemoved.addListener(async id=>{const all=await chrome.storage.session.get(null);for(const [key,j] of Object.entries(all))if(key.startsWith('job:')&&j.tabId===id){await closeHelper(key,j);await chrome.storage.session.remove(key);await chrome.alarms.clear(key);}});
chrome.alarms.onAlarm.addListener(async alarm=>{if(!alarm.name.startsWith('job:'))return;const j=(await chrome.storage.session.get(alarm.name))[alarm.name];if(!j)return;j.state='timeout';await chrome.storage.session.set({[alarm.name]:j});await closeHelper(alarm.name,j);});

// Only close newly created tabs whose first real navigation was blocked.
const pendingNewTabs = new Map();
chrome.tabs.onCreated?.addListener(tab => {
 pendingNewTabs.set(tab.id, Date.now());
});
chrome.webNavigation?.onCommitted.addListener(details => {
 if (details.frameId === 0 && details.url !== 'about:blank') pendingNewTabs.delete(details.tabId);
});
chrome.webNavigation?.onErrorOccurred.addListener(async details => {
 if (details.frameId !== 0 || details.error !== 'net::ERR_BLOCKED_BY_CLIENT') return;
 const created = pendingNewTabs.get(details.tabId);
 if (created === undefined || Date.now() - created > 60000) return;
 pendingNewTabs.delete(details.tabId);
 try {
  const all = await chrome.storage.session.get(null);
  if (Object.entries(all).some(([key,value]) => key.startsWith('job:') && (value.helperId === details.tabId || value.tabId === details.tabId))) return;
  await chrome.tabs.remove(details.tabId);
 } catch {}
});
chrome.tabs.onRemoved.addListener(id => pendingNewTabs.delete(id));
