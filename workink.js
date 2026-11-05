(() => {
  const attemptKey = '__fuckads_attempt';
  const statusKey = '__fuckads_work_status';
  let attempt;
  try {
    const stored = sessionStorage.getItem(attemptKey);
    if (!stored) return;
    try { attempt = JSON.parse(stored); } catch { attempt = {url:stored, expiresAt:Date.now() + 180000}; }
    const original = new URL(attempt.url), current = new URL(location.href);
    original.hash = ''; current.hash = '';
    for (const key of [...current.searchParams.keys()]) if (key.startsWith('__cf_chl_')) current.searchParams.delete(key);
    if (original.origin !== current.origin || original.pathname !== current.pathname || original.searchParams.toString() !== current.searchParams.toString() || !Number.isFinite(attempt.expiresAt)) return;
    if (attempt.expiresAt <= Date.now()) { sessionStorage.removeItem(attemptKey); sessionStorage.setItem(statusKey,'timed_out'); return; }
    sessionStorage.setItem(attemptKey,JSON.stringify(attempt));
  } catch { return; }
  let active = true;
  const cleanups = [];
  const status = state => { try { sessionStorage.setItem(statusKey,state); } catch {} };
  status(typeof document !== 'undefined' && document.title === 'Just a moment...' ? 'waiting_for_page' : 'waiting_for_bootstrap');
  function finish(state) {
    if (!active) return;
    active = false;
    try { sessionStorage.removeItem(attemptKey); } catch {}
    status(state);
    for (const cleanup of cleanups) { try { cleanup(); } catch {} }
  }
  const deadline = setTimeout(() => finish('timed_out'), Math.min(180000,attempt.expiresAt - Date.now()));
  cleanups.push(() => clearTimeout(deadline));
  // Session-controller approach adapted from IHaxU/work.ink-bypass (MIT).
  // Work.ink must supply a real verification response; this never fabricates one.
  (() => {
    const originalAll = Promise.all;
    let hooked = false, controller, info, sendMessage, finalVerificationSent = false;
    const componentInstances = new Set();
    cleanups.push(() => componentInstances.clear());
    const processedTasks = new WeakSet(), processedSocials = new Set();
    function trySteps() {
      if (!active || !finalVerificationSent || !controller || !info || !sendMessage) return;
      for (const social of Array.isArray(info.socials) ? info.socials : []) {
        if (typeof social.url === 'string' && !processedSocials.has(social.url)) try { sendMessage.call(controller,'c_social_started',{url:social.url}); processedSocials.add(social.url); } catch {}
      }
      for (const task of Array.isArray(controller.monetizations) ? controller.monetizations : []) {
        if (!task || typeof task !== 'object' || processedTasks.has(task) || typeof task.sendMessage !== 'function') continue;
        if (![22,25,34,71,45,57].includes(task.id)) continue;
        try {
          if (task.id === 22) task.sendMessage({event:'read'});
          if ([25,34,71].includes(task.id)) { task.sendMessage({event:'start'}); task.sendMessage({event:'installClicked'}); }
          if ([45,57].includes(task.id)) task.sendMessage({event:'installed'});
          processedTasks.add(task); status('processing_known_steps');
        } catch {}
      }
    }
    function findWriter(value) {
      const candidates = new Map();
      for (let proto = value; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
        for (const [name,descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
          if (!candidates.has(name) && name !== 'constructor' && !/^on[A-Z]/.test(name) && typeof descriptor.value === 'function' && descriptor.value.length === 2) candidates.set(name,descriptor.value);
        }
      }
      for (const name of ['sendMessage','send']) if (candidates.has(name)) return name;
      return candidates.size === 1 ? candidates.keys().next().value : null;
    }
    function attach(value) {
      if (!active || controller || !value || typeof value !== 'object' || typeof value.onLinkInfo !== 'function' || typeof value.onLinkDestination !== 'function') return;
      const entry = findWriter(value);
      if (!entry) return;
      controller = value;
      const originalSendMessage = value[entry]; sendMessage = originalSendMessage;
      const onInfo = value.onLinkInfo, onDestination = value.onLinkDestination;
      const restores = [];
      function replace(name, wrapper) {
        const descriptor = Object.getOwnPropertyDescriptor(value,name);
        if (!Reflect.set(value,name,wrapper) || value[name] !== wrapper) throw new Error('Session method is not writable.');
        const restore = () => {
          if (value[name] !== wrapper) return;
          if (descriptor) Object.defineProperty(value,name,descriptor); else delete value[name];
        };
        restores.push(restore); cleanups.push(restore);
      }
      try {
        replace(entry, function(type, payload) {
          const result = originalSendMessage.apply(this, arguments);
          if (['c_hcaptcha_response','c_recaptcha_response','c_turnstile_response'].includes(type)) status('verification_submitted');
          // The upstream flow has several verification stages. An hCaptcha token
          // alone must not trigger later steps or consume their retry state.
          if (type === 'c_turnstile_response') { finalVerificationSent = true; queueMicrotask(trySteps); }
          return result;
        });
        replace('onLinkInfo', function(linkInfo) { info = linkInfo; const result = onInfo.apply(this, arguments); queueMicrotask(trySteps); return result; });
        replace('onLinkDestination', function(payload) { if (typeof payload?.url === 'string') go(payload.url); return onDestination.apply(this, arguments); });
        status('controller_attached');
      } catch { for (const restore of restores) { try { restore(); } catch {} } controller = null; status('controller_patch_failed'); }
    }
    function inspectContext(context) {
      if (!active || controller || !Array.isArray(context)) return;
      const seen = new WeakSet(), pending = context.map(value => [value,0]);
      let visited = 0;
      while (pending.length && !controller && visited++ < 120) {
        const [value,depth] = pending.shift();
        if (!value || typeof value !== 'object' || seen.has(value)) continue;
        seen.add(value); attach(value);
        if (controller || depth >= 3) continue;
        // Follow only data already stored in this component's context. Reading
        // getters or walking browser globals would change page behavior.
        const prototype = Object.getPrototypeOf(value);
        if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) continue;
        for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
          if ('value' in descriptor && descriptor.value && typeof descriptor.value === 'object') pending.push([descriptor.value,depth+1]);
        }
      }
    }
    function discoverSession() {
      if (!active || controller) return;
      for (const instance of componentInstances) inspectContext(instance?.$$?.ctx);
    }
    function wrapNode(loader) {
      return async function(...args) {
        const module = await loader.apply(this,args);
        if (!active || typeof module?.component !== 'function') return module;
        if (!controller) status('component_module_loaded');
        return new Proxy(module,{get(target,key,receiver) {
          if (key !== 'component') return Reflect.get(target,key,receiver);
          return new Proxy(target.component,{construct(component,params) {
            const instance = Reflect.construct(component,params);
            if (!active) return instance;
            componentInstances.add(instance);
            const ctx = instance?.$$?.ctx;
            if (Array.isArray(ctx)) {
              if (!controller) status('component_context_observed');
              inspectContext(ctx);
              instance.$$.ctx = new Proxy(ctx,{set(target,key,value,receiver) { const result = Reflect.set(target,key,value,receiver); inspectContext(target); return result; }});
            }
            return instance;
          }});
        }});
      };
    }
    Promise.all = function(iterable) {
      return originalAll.call(this,iterable).then(values => {
        if (!active || hooked || !Array.isArray(values) || typeof values[0]?.start !== 'function' || !values[1]?.nodes || typeof values[1].nodes !== 'object') return values;
        const app = values[1];
        hooked = true; Promise.all = originalAll; status('bootstrap_detected');
        // The bootstrap's start arguments and hydrate options vary by version.
        // Wrap its node loaders directly before start runs instead of requiring
        // one specific args[2].node_ids shape.
        for (const [id,originalLoader] of Object.entries(app.nodes)) {
          if (typeof originalLoader !== 'function') continue;
          const wrappedLoader = wrapNode(originalLoader);
          if (!Reflect.set(app.nodes,id,wrappedLoader) || app.nodes[id] !== wrappedLoader) continue;
          cleanups.push(() => { if (app.nodes[id] === wrappedLoader) app.nodes[id] = originalLoader; });
        }
        return values;
      });
    };
    const wrappedAll = Promise.all;
    cleanups.push(() => { if (Promise.all === wrappedAll) Promise.all = originalAll; });
    // Monetization handlers may be populated after link info / verification.
    const retry = setInterval(() => { discoverSession(); trySteps(); },500);
    cleanups.push(() => clearInterval(retry));
  })();
  const originalSend = WebSocket.prototype.send;
  const sessions = new WeakMap();
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const send = (socket, type, payload) => { if (active) return originalSend.call(socket, JSON.stringify({type, payload})); };
  function go(value) {
    try {
      let url = new URL(value);
      if (url.searchParams.has('duf')) url = new URL(atob(url.searchParams.get('duf').split('').reverse().join('')));
      if (active && ['https:', 'http:'].includes(url.protocol)) {
        window.dispatchEvent(new CustomEvent('fuckads-work-destination',{detail:url.href}));
        finish('destination_received'); location.assign(url.href);
      }
    } catch { /* Ignore invalid destinations. */ }
  }
  WebSocket.prototype.send = function(data) {
    if (!sessions.has(this)) {
      const state = {socials: [], types: [], started: false};
      sessions.set(this, state);
      this.addEventListener('message', async event => {
        if (!active) return;
        let message; try { message = JSON.parse(event.data); } catch { return; }
        const p = message.payload || {};
        try {
          switch (message.type) {
            case 's_link_info':
              state.socials = Array.isArray(p.socials) ? p.socials : [];
              state.types = typeof p.monetizationScript === 'string' ? ['readArticles','browserExtension'].filter(t => p.monetizationScript.includes(t)) : [];
              break;
            // Verification tokens must come from the site's own challenge flow.
            // Let the original page handle it instead of submitting a fake token.
            case 's_start_recaptcha_check': break;
            case 's_recaptcha_okay':
              if (state.started) break; state.started = true;
              for (const social of state.socials) { if (typeof social.url === 'string') send(this, 'c_social_started', {url:social.url}); await sleep(3000); }
              if (state.types.includes('readArticles')) {
                send(this, 'c_monetization', {type:'readArticles',payload:{event:'start'}});
                send(this, 'c_monetization', {type:'readArticles',payload:{event:'closeClicked'}});
              }
              if (state.types.includes('browserExtension')) {
                if (state.types.includes('readArticles')) await sleep(11000);
                send(this, 'c_monetization', {type:'browserExtension',payload:{event:'start'}});
              }
              break;
            case 's_monetization': if (p.type === 'browserExtension' && p.payload?.token) send(this,'c_monetization',{type:'browserExtension',payload:{event:'confirm',token:p.payload.token}}); break;
            case 's_link_destination': if (typeof p.url === 'string') go(p.url); break;
          }
        } catch { /* The server may have closed the session. */ }
      });
    }
    return originalSend.call(this, data);
  };
  const wrappedSend = WebSocket.prototype.send;
  cleanups.push(() => { if (WebSocket.prototype.send === wrappedSend) WebSocket.prototype.send = originalSend; });
})();
