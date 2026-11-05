const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
function setup() {
  let listener;
  const children = [];
  const document = {createElement: () => ({remove() { const i=children.indexOf(this); if(i>=0) children.splice(i,1); }}), body:{append(frame) { children.push(frame); }}};
  const chrome = {runtime:{id:'test', getURL:path=>'chrome-extension://test/'+path, onMessage:{addListener(fn){listener=fn;}}}};
  vm.runInNewContext(fs.readFileSync('offscreen.js','utf8'), {document,chrome,URL,Map});
  return {children, send: (message, sender={id:'test',url:'chrome-extension://test/background.js'}) => { let response; listener(message,sender,value=>response=value); return response; }};
}
test('hidden provider frames are created and removed, and messages are restricted', () => {
  const h=setup(), id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const message={target:'fuckads-offscreen',type:'CITY_OPEN',id,url:'https://bypass.city/bypass?fa_job='+id};
  assert.equal(h.send(message,{id:'test',url:'https://example.com/'}),undefined);
  assert.equal(h.children.length,0);
  assert.equal(h.send({...message,url:'https://example.com/'}).ok,false);
  assert.equal(h.send(message).ok,true);
  assert.equal(h.children.length,1);
  assert.equal(h.send({target:'fuckads-offscreen',type:'CITY_CLOSE',id}).ok,true);
  assert.equal(h.children.length,0);
});
