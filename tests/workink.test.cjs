const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'workink.js'), 'utf8');
const url = 'https://work.ink/2znc/real-key-1?sr=a%2Bb%3D';

function page({store = new Map(), href = url, now = 1000, title = 'Work.ink'} = {}) {
  const timers = new Map(), intervals = new Map(), microtasks = [], destinations = [];
  let timerId = 0;
  class Socket {
    send(data) { this.sent ||= []; this.sent.push(data); }
    addEventListener(event, listener) { if (event === 'message') this.onMessage = listener; }
  }
  const originalSend = Socket.prototype.send;
  const context = vm.createContext({URL, atob, document: {title}, WebSocket: Socket,
    location: {href, assign: destination => destinations.push(destination)},
    window: {dispatchEvent: () => true}, CustomEvent: class { constructor(type, options) { this.type=type; this.detail=options.detail; } },
    sessionStorage: {getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: key => store.delete(key)},
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, {callback, delay}); return id; },
    clearTimeout: id => timers.delete(id),
    setInterval: callback => { const id = ++timerId; intervals.set(id, callback); return id; },
    clearInterval: id => intervals.delete(id),
    queueMicrotask: callback => microtasks.push(callback),
    packets: [], taskEvents: []
  });
  vm.runInContext(`Date.now = () => ${now}`, context);
  const originalAll = vm.runInContext('Promise.all', context);
  vm.runInContext(source, context);
  return {context, store, timers, intervals, destinations, Socket, originalSend, originalAll,
    flush() { while (microtasks.length) microtasks.shift()(); },
    retry() { for (const callback of intervals.values()) callback(); this.flush(); },
    expire() { const timer = [...timers.values()].find(item => item.delay > 10000); assert.ok(timer); timer.callback(); }
  };
}

async function bootstrap(p) {
  await vm.runInContext(`(async () => {
    class Session {
      constructor() { this.monetizations = []; }
      sendMessage(type, payload) { packets.push({type, payload}); }
      onLinkInfo(info) {}
      onLinkDestination(info) {}
    }
    globalThis.session = new Session();
    class Component { constructor() { this.$$ = {ctx: [session]}; } }
    const app = {nodes: [async () => ({component: Component})]};
    const kit = {start(app, target, options) { return app.nodes[0]().then(module => new module.component()); }};
    const [wrapped] = await Promise.all([kit, app]);
    await wrapped.start(app, null, {node_ids: [0]});
  })()`, p.context);
}

test('attempt survives a challenge document and the following real-page reload', async () => {
  const store = new Map([['__fuckads_attempt', JSON.stringify({url, expiresAt: 181000})]]);
  const challenge = page({store, title: 'Just a moment...'});
  assert.equal(store.get('__fuckads_work_status'), 'waiting_for_page');
  assert.equal(JSON.parse(store.get('__fuckads_attempt')).expiresAt, 181000);
  const real = page({store, href: url + '&__cf_chl_tk=challenge', now: 5000});
  await bootstrap(real);
  assert.equal(store.get('__fuckads_work_status'), 'controller_attached');
  assert.equal(JSON.parse(store.get('__fuckads_attempt')).expiresAt, 181000);
  assert.equal(challenge.destinations.length, 0);
});

test('prototype writer is hooked; hCaptcha alone does not consume delayed tasks', async () => {
  const p = page({store: new Map([['__fuckads_attempt', JSON.stringify({url, expiresAt: 181000})]])});
  await bootstrap(p);
  vm.runInContext(`session.onLinkInfo({socials: []}); session.sendMessage('c_hcaptcha_response', {token: 'site-provided'});`, p.context);
  p.flush();
  vm.runInContext(`session.monetizations.push({id:22, sendMessage(payload) {taskEvents.push(payload)}});`, p.context);
  p.retry();
  assert.equal(p.context.taskEvents.length, 0);
  vm.runInContext(`session.sendMessage('c_turnstile_response', {token:'site-provided'});`, p.context);
  p.flush(); p.retry(); p.retry();
  assert.equal(p.context.taskEvents.length, 1);
  assert.equal(p.context.taskEvents[0].event, 'read');
  assert.equal(p.context.packets.filter(packet => packet.type.startsWith('c_') && packet.type.endsWith('_response')).length, 2);
});

test('known task populated after final verification is processed once', async () => {
  const p = page({store: new Map([['__fuckads_attempt', JSON.stringify({url, expiresAt: 181000})]])});
  await bootstrap(p);
  vm.runInContext(`session.onLinkInfo({socials: []}); session.sendMessage('c_turnstile_response', {token:'site-provided'});`, p.context);
  p.flush();
  assert.equal(p.context.taskEvents.length, 0);
  vm.runInContext(`session.monetizations.push({id:22, sendMessage(payload) {taskEvents.push(payload)}});`, p.context);
  p.retry(); p.retry();
  assert.equal(p.context.taskEvents.length, 1);
});

test('timeout is bounded and restores temporary global hooks', () => {
  const p = page({store: new Map([['__fuckads_attempt', JSON.stringify({url, expiresAt: 901000})]])});
  assert.ok([...p.timers.values()].some(timer => timer.delay === 180000));
  p.expire();
  assert.equal(p.store.has('__fuckads_attempt'), false);
  assert.equal(p.store.get('__fuckads_work_status'), 'timed_out');
  assert.equal(p.Socket.prototype.send, p.originalSend);
  assert.equal(vm.runInContext('Promise.all', p.context), p.originalAll);
  assert.equal(p.intervals.size, 0);
});

test('destination validates protocol, clears attempt and stops retries', async () => {
  const p = page({store: new Map([['__fuckads_attempt', JSON.stringify({url, expiresAt: 181000})]])});
  await bootstrap(p);
  vm.runInContext(`session.onLinkDestination({url:'javascript:alert(1)'});`, p.context);
  assert.equal(p.destinations.length, 0);
  assert.equal(p.store.has('__fuckads_attempt'), true);
  vm.runInContext(`session.onLinkDestination({url:'https://example.com/final'});`, p.context);
  assert.deepEqual(p.destinations, ['https://example.com/final']);
  assert.equal(p.store.has('__fuckads_attempt'), false);
  assert.equal(p.store.get('__fuckads_work_status'), 'destination_received');
  assert.equal(p.intervals.size, 0);
});

test('a different Work.ink link does not inherit an active attempt', () => {
  const p = page({store: new Map([['__fuckads_attempt', JSON.stringify({url, expiresAt: 181000})]]), href: 'https://work.ink/other/link'});
  assert.equal(p.Socket.prototype.send, p.originalSend);
  assert.equal(vm.runInContext('Promise.all', p.context), p.originalAll);
  assert.equal(p.timers.size, 0);
});

test('session assigned inside a context object after hydration is discovered', async () => {
  const p = page({store:new Map([['__fuckads_attempt',JSON.stringify({url,expiresAt:181000})]])});
  await vm.runInContext(`(async () => {
    class Session {
      constructor() { this.monetizations = []; }
      sendMessage(type,payload) { packets.push({type,payload}); }
      onLinkInfo(info) {}
      onLinkDestination(info) {}
    }
    globalThis.session = new Session();
    class Component { constructor() { this.$$ = {ctx:[{state:{session:null}}]}; } }
    const app = {nodes:[async()=>({component:Component})]};
    const kit = {start(app,target,options) {return app.nodes[0]().then(module => {globalThis.component = new module.component();});}};
    const [wrapped] = await Promise.all([kit,app]);
    await wrapped.start(app,null,{node_ids:[0]});
  })()`,p.context);
  assert.equal(p.store.get('__fuckads_work_status'),'component_context_observed');
  vm.runInContext(`component.$$.ctx[0].state.session = session`,p.context);
  p.retry();
  assert.equal(p.store.get('__fuckads_work_status'),'controller_attached');
});

test('replacement context array is rescanned without invoking context getters', async () => {
  const p = page({store:new Map([['__fuckads_attempt',JSON.stringify({url,expiresAt:181000})]])});
  await vm.runInContext(`(async () => {
    class Session {
      constructor() {this.monetizations=[];}
      sendMessage(type,payload) {packets.push({type,payload});}
      onLinkInfo(info) {}
      onLinkDestination(info) {}
    }
    globalThis.session = new Session();
    globalThis.getterCalls = 0;
    const initial = {get session(){getterCalls++;throw new Error('must not read');}};
    class Component {constructor(){this.$$={ctx:[initial]};}}
    const app={nodes:[async()=>({component:Component})]};
    const kit={start(app,target,options){return app.nodes[0]().then(module=>{globalThis.component=new module.component();});}};
    const [wrapped]=await Promise.all([kit,app]);
    await wrapped.start(app,null,{node_ids:[0]});
    component.$$.ctx=[session];
  })()`,p.context);
  p.retry();
  assert.equal(p.store.get('__fuckads_work_status'),'controller_attached');
  assert.equal(p.context.getterCalls,0);
});

test('node hooks do not depend on the bootstrap start argument layout', async () => {
  const p=page({store:new Map([['__fuckads_attempt',JSON.stringify({url,expiresAt:181000})]])});
  await vm.runInContext(`(async()=>{
    class Session {
      constructor(){this.monetizations=[];}
      sendMessage(type,payload){packets.push({type,payload});}
      onLinkInfo(info){}
      onLinkDestination(info){}
    }
    globalThis.session=new Session();
    class Component {constructor(){this.$$={ctx:[session]};}}
    const app={nodes:{5:async()=>({component:Component})}};
    // Unlike the old fixture, start has no third argument or node_ids option.
    const kit={start(target,options){return app.nodes[5]().then(module=>new module.component());}};
    const [wrapped]=await Promise.all([kit,app]);
    await wrapped.start(null,{hydrate:{node_ids:[5]}});
  })()`,p.context);
  assert.equal(p.store.get('__fuckads_work_status'),'controller_attached');
});
