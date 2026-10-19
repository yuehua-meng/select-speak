// Capture the real companion renderer with scripted interactions.
// This is an animation preview, not an OS text-selection compatibility recording.
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'work/launch-capture');
fs.mkdirSync(path.join(output, 'frames'), { recursive: true });
fs.mkdirSync(path.join(output, 'data'), { recursive: true });
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.setPath('userData', path.join(output, 'data'));
const pause = ms => new Promise(r => setTimeout(r, ms));
const state = { speech: 'ready', enabled: true, resting: false, locked: false, scale: 1, doubleClickMs: 500 };
app.whenReady().then(async () => {
  ipcMain.handle('companion:state', () => state);
  for (const name of ['drag-start', 'drag-end', 'menu']) ipcMain.handle(`companion:${name}`, () => false);
  const win = new BrowserWindow({ width: 640, height: 480, show: false, frame: false,
    backgroundColor: '#edf5fa', webPreferences: { preload: path.join(root, 'dist/companion-preload.js'),
      sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  await win.loadFile(path.join(root, 'dist/ui/companion.html'));
  await win.webContents.insertCSS(`html,body{width:640px!important;height:480px!important;background:#edf5fa!important;color:#173c55}#pet{left:352px!important;top:160px!important;width:220px!important;height:240.73px!important}#bubble{display:none!important}#sparkles{left:340px!important;top:150px!important;width:244px!important}.launch-title{position:absolute;left:40px;top:32px;margin:0;font:700 34px/1.15 'Segoe UI',sans-serif;letter-spacing:-1px;width:560px}.launch-sub{position:absolute;left:42px;top:92px;font:14px 'Segoe UI',sans-serif;color:#557488}.launch-caption{position:absolute;left:42px;top:205px;width:265px;font:600 25px/1.3 'Segoe UI',sans-serif}.launch-note{position:absolute;left:42px;top:430px;font:11px 'Segoe UI',sans-serif;color:#557488}.launch-brand{position:absolute;left:42px;top:350px;font:700 15px 'Segoe UI',sans-serif;letter-spacing:2px}`);
  await win.webContents.executeJavaScript(`document.body.insertAdjacentHTML('beforeend','<h1 class="launch-title">Your fluffy reading companion.</h1><div class="launch-sub">A small moment of company, right on your desktop.</div><div id="launch-caption" class="launch-caption">Meet your<br>reading buddy.</div><div class="launch-brand">SELECTSPEAK / WINDOWS</div><div class="launch-note">Actual app renderer · scripted animation preview · Kokoro audio sample</div>')`);
  await pause(300);
  const frames = 120, fps = 12;
  for (let i = 0; i < frames; i++) {
    if (i === 12) await win.webContents.executeJavaScript(`document.getElementById('launch-caption').textContent='One click, a little pat.'; document.getElementById('pet').dispatchEvent(new MouseEvent('click',{detail:1}))`);
    if (i === 42) await win.webContents.executeJavaScript(`document.getElementById('launch-caption').textContent='Double click, a happy bounce.'; const p=document.getElementById('pet');p.dispatchEvent(new MouseEvent('click',{detail:1}));p.dispatchEvent(new MouseEvent('click',{detail:2}));p.dispatchEvent(new MouseEvent('dblclick',{detail:2}))`);
    if (i === 54) {
      win.webContents.send('companion:changed', { ...state, speech: 'speaking' });
      await win.webContents.executeJavaScript(`document.getElementById('launch-caption').textContent='Hear local Kokoro speech.'`);
    }
    const started = Date.now();
    fs.writeFileSync(path.join(output, 'frames', `frame${String(i).padStart(4, '0')}.png`), (await win.webContents.capturePage()).toPNG());
    await pause(Math.max(0, 1000 / fps - (Date.now() - started)));
  }
  const asset = pathToFileURL(path.join(root, 'src/ui/assets/blue-companion.png')).href;
  const banner = new BrowserWindow({ width: 1280, height: 640, show: false, frame: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:1280px;height:640px;overflow:hidden}body{background:#edf5fa;color:#143c56;font-family:'Segoe UI',sans-serif}.shape{position:absolute;width:610px;height:610px;right:-55px;top:70px;background:#dcecf9;border-radius:50%}.eyebrow{position:absolute;left:76px;top:65px;font-size:15px;letter-spacing:4px;font-weight:700}.title{position:absolute;left:72px;top:118px;font-size:76px;font-weight:750;letter-spacing:-4px;line-height:1.02}.sub{position:absolute;left:77px;top:323px;font-size:24px;line-height:1.5;width:620px;color:#44677d}.tag{position:absolute;left:77px;top:453px;font-size:16px;padding:12px 18px;border:1px solid #a8c5da;border-radius:30px}.url{position:absolute;left:77px;bottom:52px;font-size:16px;color:#44677d}img{position:absolute;right:67px;top:46px;width:454px;height:496px;object-fit:contain}.mini{position:absolute;right:116px;bottom:53px;font-size:12px;letter-spacing:2px;color:#557488}</style></head><body><div class="shape"></div><div class="eyebrow">SELECTSPEAK</div><div class="title">Read a little.<br>Hear a little.</div><div class="sub">A fluffy desktop companion<br>that reads selected English aloud.</div><div class="tag">Windows · Local Kokoro speech · Open source</div><div class="url">github.com/yuehua-meng/select-speak</div><img src="${asset}" alt="Blue fluffy companion"><div class="mini">YOUR READING BUDDY / v0.3.0 PREVIEW</div></body></html>`;
  const bannerFile = path.join(output, 'banner.html');
  fs.writeFileSync(bannerFile, html);
  await banner.loadFile(bannerFile);
  await banner.webContents.executeJavaScript('Promise.all([...document.images].map(i=>i.decode()))');
  fs.writeFileSync(path.join(root, 'docs/media/social-preview.png'), (await banner.webContents.capturePage()).toPNG());
  fs.writeFileSync(path.join(output, 'capture-report.json'), JSON.stringify({ frames, fps, renderer: 'dist/ui/companion.html', scriptedInteractions: true, nativeSelectionDemo: false, originalImageUnmodified: true }, null, 2));
  console.log('LAUNCH_CAPTURE_OK'); app.exit(0);
}).catch(e => { console.error(e); app.exit(1); });
