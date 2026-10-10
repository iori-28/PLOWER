// Integration tests in a real Chromium browser, using its built-in DevTools protocol.
const { spawn } = require('node:child_process');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { createServer } = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const server = createServer((req, res) => {
  const files = { '/': ['index.html', 'text/html'], '/styles.css': ['styles.css', 'text/css'], '/script.js': ['script.js', 'text/javascript'], '/assets/bouquet.svg': ['assets/bouquet.svg', 'image/svg+xml'] };
  const file = files[req.url];
  if (!file) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': file[1] }); res.end(readFileSync(path.resolve(file[0])));
});
const browser = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const output = path.resolve('tests/artifacts');
mkdirSync(output, { recursive: true });
const child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${output}/browser-profile`, 'about:blank'], { windowsHide: true });
let ws, nextId = 0;
const pending = new Map(), errors = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function screenshot(name) {
  const result = await command('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(output, name), Buffer.from(result.data, 'base64'));
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const endpoint = await new Promise((resolve, reject) => {
    let log = '';
    const timer = setTimeout(() => reject(new Error('Browser launch timed out')), 15000);
    child.stderr.on('data', data => {
      log += data.toString();
      const match = log.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
    child.on('error', reject);
  });
  const tab = await (await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve));
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') errors.push(data.params);
    if (pending.has(data.id)) {
      const task = pending.get(data.id); pending.delete(data.id);
      data.error ? task.reject(new Error(JSON.stringify(data.error))) : task.resolve(data.result);
    }
  });
  await command('Runtime.enable'); await command('Page.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const navigation = await command('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText}`);
  for (let i = 0; i < 50; i++) {
    if (await evaluate(`!!document.querySelector('#throw') && document.readyState === 'complete'`)) break;
    await sleep(100);
  }
  assert.equal(await evaluate('document.querySelector("h1").innerText.replace(/\\s/g, "")'), 'HappyBirthday!');
  await screenshot('mobile-initial.png');
  const initial = await evaluate(`(() => {const b=document.querySelector('#throw');const r=b.getBoundingClientRect();b.click();const img=document.querySelector('.bouquet');const m=new DOMMatrix(getComputedStyle(img).transform);return {x:m.m41+img.width/2,y:m.m42+img.width/2,bx:r.x+r.width/2,by:r.y+r.height/2};})()`);
  assert.ok(Math.abs(initial.x - initial.bx) < 1 && Math.abs(initial.y - initial.by) < 1, 'launch starts at button center');
  await sleep(230);
  const raised = await evaluate(`new DOMMatrix(getComputedStyle(document.querySelector('.bouquet')).transform).m42`);
  assert.ok(raised < initial.y - 100, 'bouquet visibly rises');
  await sleep(2300);
  assert.equal(await evaluate(`document.querySelectorAll('.bouquet.landed').length`), 1, 'bouquet lands');
  await evaluate(`document.querySelector('#throw').focus()`);
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  assert.equal(await evaluate(`document.querySelector('#count').textContent`), '3', 'Enter and Space activate');
  await evaluate(`for(let i=0;i<6;i++)document.querySelector('#throw').click()`);
  assert.equal(await evaluate(`document.querySelector('#surprise').className`), 'show', 'ninth press surprise');
  await screenshot('mobile-throws.png');
  await evaluate(`for(let i=0;i<91;i++)document.querySelector('#throw').click()`);
  assert.equal(await evaluate(`document.querySelector('#count').textContent`), '100');
  assert.ok(await evaluate(`document.querySelectorAll('.bouquet').length<=56`), 'bounded DOM after 100 presses');
  assert.ok(await evaluate(`document.querySelectorAll('.bouquet:not(.landed)').length>1`), 'independent simultaneous projectiles');
  await sleep(3000);
  assert.equal(await evaluate(`document.querySelectorAll('.bouquet:not(.landed)').length`), 0, 'all projectiles settle');
  assert.ok(await evaluate(`(()=>{const r=document.querySelector('#throw').getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2).closest('button')!==null})()`), 'pile does not block button');
  await screenshot('mobile-pile.png');
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await sleep(100);
  assert.ok(await evaluate(`Array.from(document.querySelectorAll('.bouquet')).every(n=>{const r=n.getBoundingClientRect();return r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight})`), 'pile survives resize');
  await command('Page.reload'); await sleep(350); await screenshot('desktop-initial.png');
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate(`document.querySelector('#throw').click()`); await sleep(450);
  assert.equal(await evaluate(`document.querySelectorAll('.bouquet.landed').length`), 1, 'reduced motion settles promptly');
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`), true, 'no horizontal overflow');
  assert.deepEqual(errors, [], 'no browser exceptions');
  console.log('PASS: button origin, upward flight, landing, keyboard, surprise, 100 presses, concurrency, caps, hit target, resize, reduced motion, overflow, console.');
  console.log(`Screenshots: ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { if(ws) ws.close(); child.kill(); server.close(); });
