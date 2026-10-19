import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray, screen } from 'electron';
import { fork, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { TextSelectionData, MouseEventData } from 'selection-hook';
import { defaults, popupPosition, sanitizeSettings, selectedText } from './core';
import type { AppState, Settings, Voice } from './shared';
import { Companion } from './companion';

const smoke = process.argv.includes('--smoke-test');
const projectRoot = path.resolve(path.dirname(process.execPath), '../..');
const root = app.isPackaged ? (fs.existsSync(path.join(projectRoot, 'package.json')) ? projectRoot : path.dirname(process.execPath)) : app.getAppPath();
const dataDir = path.join(root, smoke ? 'work/smoke/data' : 'data');
fs.mkdirSync(dataDir, { recursive: true });
app.setPath('userData', dataDir);
app.setAppUserModelId('org.selectspeak.desktop');
const settingsFile = path.join(dataDir, 'settings.json');
function readSettings(): Settings {
  try { return sanitizeSettings(JSON.parse(fs.readFileSync(settingsFile, 'utf8'))); } catch { return sanitizeSettings(defaults); }
}
let state: AppState = {
  settings: readSettings(), hook: 'starting', hookMessage: '正在启动选区监听…',
  speech: 'starting', speechMessage: '正在载入 Kokoro 本地模型…', voices: [], selection: null, version: app.getVersion()
};
let mainWindow: BrowserWindow;
let popup: BrowserWindow;
let audioWindow: BrowserWindow;
let companion: Companion | undefined;
let tray: Tray;
let worker: ChildProcess | null = null;
let speech: ChildProcess | null = null;
let quitting = false;
let popupTimer: NodeJS.Timeout | undefined;
let showTimer: NodeJS.Timeout | undefined;
let latestGesture = 0;
let nextSelection = 0;
let speechId = 0;
let popupHovered = false;
let workerReady = false;
let lastWorkerError = '';
let audioReady = false;
let lastSynthesis: { cacheHit: boolean; synthesisMs: number } | undefined;

function log(message: string) {
  fs.appendFileSync(path.join(dataDir, 'app.log'), `${new Date().toISOString()} ${message}\n`);
}
function publish() {
  companion?.sync();
  for (const win of [mainWindow, popup]) if (win && !win.isDestroyed() && !win.webContents.isLoading()) win.webContents.send('state:changed', state);
  if (tray) {
    tray.setToolTip(`取词朗读 · ${state.hook === 'running' ? '监听中' : state.hook === 'paused' ? '已暂停' : '启动中 / 需检查'}`);
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '打开取词朗读', click: openMain },
      { label: '显示小蓝', type: 'checkbox', checked: companion?.visible ?? true, click: () => companion?.toggle() },
      { label: '启用划词按钮', type: 'checkbox', checked: state.settings.enabled, click: () => saveSettings({ ...state.settings, enabled: !state.settings.enabled }) },
      { label: '停止朗读', click: stopSpeech },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() }
    ]));
  }
}
function hidePopup() {
  clearTimeout(showTimer); clearTimeout(popupTimer); popupHovered = false;
  if (popup && !popup.isDestroyed()) popup.hide();
}
function refreshPopupTimer() {
  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => { if (popupHovered || state.speech === 'speaking' || state.speech === 'generating') refreshPopupTimer(); else hidePopup(); }, state.settings.popupSeconds * 1000);
}
function openMain() { if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); } }
function toDip(point: {x: number; y: number}) { return screen.screenToDipPoint(point); }
function inside(win: BrowserWindow, point: {x: number; y: number}) {
  if (!win || win.isDestroyed() || !win.isVisible()) return false;
  const b = win.getBounds();
  return point.x >= b.x && point.x < b.x + b.width && point.y >= b.y && point.y < b.y + b.height;
}
function selectionReceived(data: TextSelectionData, gesture: number) {
  if (!state.settings.enabled || (gesture < latestGesture) || mainWindow.isFocused()) return;
  if (state.settings.excludedApps.includes(data.programName.toLowerCase())) return;
  const text = selectedText(data.text, state.settings.englishOnly);
  if (!text) return;
  const methods: Record<number, string> = { 1: 'UI Automation', 3: '辅助功能接口', 99: '复制兼容模式' };
  const snapshot = { id: ++nextSelection, text, program: data.programName || '未知应用', method: methods[data.method] || '系统选区', at: new Date().toLocaleTimeString('zh-CN', { hour12: false }) };
  state.selection = snapshot;
  const valid = (p: {x: number; y: number}) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x !== -99999 && p.y !== -99999;
  const anchor = data.posLevel >= 3 && valid(data.endBottom) ? toDip(data.endBottom) : valid(data.mousePosEnd) ? toDip(data.mousePosEnd) : screen.getCursorScreenPoint();
  clearTimeout(showTimer);
  showTimer = setTimeout(() => {
    if (gesture < latestGesture || state.selection?.id !== snapshot.id || mainWindow.isFocused() || !state.settings.enabled) return;
    const work = screen.getDisplayNearestPoint(anchor).workArea;
    const position = popupPosition(anchor, work);
    popup.setBounds({ ...position, width: 108, height: 54 });
    publish(); popup.showInactive(); refreshPopupTimer();
  }, 90);
  publish();
}
function configureWorker() { if (workerReady && worker?.connected) worker.send({ type: 'configure', settings: state.settings }); }
function startWorker() {
  const previous = worker;
  worker = null; workerReady = false; latestGesture = 0;
  if (previous) previous.kill();
  state.hook = 'starting'; state.hookMessage = '正在启动选区监听…'; lastWorkerError = '';
  const child = fork(path.join(__dirname, 'selection-worker.js'), [], {
    execPath: process.execPath, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true
  });
  worker = child;
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', buffer => { lastWorkerError = String(buffer).slice(-1500); log(`selection worker: ${lastWorkerError}`); });
  child.on('message', (message: { type: string; data: any; gesture: number }) => {
    if (worker !== child) return;
    if (message.type === 'ready') { workerReady = true; configureWorker(); }
    if (message.type === 'status') { state.hook = message.data; state.hookMessage = message.data === 'running' ? '已开启 · 在其他软件选中英文试试' : '已暂停 · 可在托盘或此处重新开启'; publish(); }
    if (message.type === 'error') { state.hook = 'error'; state.hookMessage = String(message.data); log(`selection: ${message.data}`); publish(); }
    if (message.type === 'selection') selectionReceived(message.data, message.gesture);
    if (message.type === 'mouse-down') {
      latestGesture = Math.max(latestGesture, message.gesture);
      if (!inside(popup, toDip(message.data as MouseEventData))) hidePopup();
    }
    if (message.type === 'dismiss') hidePopup();
    if (message.type === 'mouse-up') companion?.endDrag();
  });
  child.on('error', error => { if (worker === child) { state.hook = 'error'; state.hookMessage = error.message; log(`worker spawn: ${error.message}`); publish(); } });
  child.on('exit', code => {
    if (worker !== child || quitting) return;
    workerReady = false; state.hook = 'error'; state.hookMessage = `监听进程已退出（${code}），请点击“重新连接”。${lastWorkerError ? '详情见 data/app.log。' : ''}`; publish();
  });
  publish();
}
function speechCommand(command: object) { if (speech?.connected) speech.send(command); }
function audioCommand(command: object) { if (audioWindow && !audioWindow.isDestroyed()) audioWindow.webContents.send('audio:command', command); }
function startSpeech() {
  const previous = speech; speech = null; previous?.kill();
  audioCommand({ type: 'stop', id: ++speechId });
  state.speech = 'starting'; state.speechMessage = '正在载入 Kokoro 本地模型…';
  let bridge = path.join(__dirname, 'native', 'kokoro-worker.cjs');
  bridge = bridge.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
  const modelDir = app.isPackaged ? path.join(process.resourcesPath, 'models', 'kokoro') : path.join(root, 'models', 'kokoro');
  const child = fork(bridge, [modelDir], {
    execPath: process.execPath, serialization: 'advanced',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', ORT_DISABLE_TELEMETRY: '1' },
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });
  speech = child;
  child.stdout?.on('data', () => {});
  child.on('message', (result: any) => {
    if (speech !== child) return;
      if (result.type === 'loading') { state.speech = 'starting'; state.speechMessage = result.message; }
      if (result.type === 'ready') {
        state.voices = result.voices as Voice[];
        if (!state.voices.some(v => v.id === state.settings.voice)) state.settings.voice = 'af_heart';
        state.speech = state.voices.length ? 'ready' : 'error';
        state.speechMessage = 'Kokoro 已预热 · 本地 CPU · 完整精度';
      }
      if (result.type === 'audio' && result.id === speechId) {
        lastSynthesis = { cacheHit: result.cacheHit, synthesisMs: result.synthesisMs };
        audioCommand({ type: 'chunk', id: result.id, index: result.index, samples: result.samples, sampleRate: result.sampleRate });
      }
      if (result.type === 'generated' && result.id === speechId) audioCommand({ type: 'end', id: result.id });
      if (result.type === 'error' && (result.id === undefined || result.id === speechId)) { audioCommand({ type: 'stop', id: speechId }); state.speech = 'error'; state.speechMessage = String(result.message); log(`Kokoro: ${result.message}`); }
      publish();
  });
  child.stderr?.on('data', buffer => log(`Kokoro worker: ${String(buffer).slice(-1500)}`));
  child.on('error', error => { if (speech === child) { state.speech = 'error'; state.speechMessage = error.message; publish(); } });
  child.on('exit', code => { if (speech === child && !quitting) { audioCommand({ type: 'stop', id: ++speechId }); state.speech = 'error'; state.speechMessage = `Kokoro 进程已退出（${code}），请点击“重新连接”。`; publish(); } });
  publish();
}
function speak(text: string) {
  if (state.speech === 'starting' || !state.voices.length || !speech?.connected || !audioReady) throw new Error('Kokoro 尚未就绪，请稍候或点击“重新连接”。');
  const id = ++speechId;
  audioCommand({ type: 'start', id });
  speechCommand({ type: 'speak', id, text, rate: state.settings.rate, voice: state.settings.voice });
  state.speech = 'generating'; state.speechMessage = 'Kokoro 正在生成语音…'; publish(); refreshPopupTimer();
}
function stopSpeech() {
  speechId++; speechCommand({ type: 'stop', id: speechId }); audioCommand({ type: 'stop', id: speechId });
  if (state.speech === 'speaking' || state.speech === 'generating') { state.speech = 'ready'; state.speechMessage = '已停止朗读'; publish(); }
}
function saveSettings(value: unknown): AppState {
  state.settings = sanitizeSettings(value);
  fs.writeFileSync(settingsFile + '.tmp', JSON.stringify(state.settings, null, 2), 'utf8');
  fs.renameSync(settingsFile + '.tmp', settingsFile);
  hidePopup(); configureWorker(); publish(); return state;
}
function trayImage() {
  const size = 32, pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    if ((x - 15.5) ** 2 + (y - 15.5) ** 2 < 225) { pixels[i] = 168; pixels[i + 1] = 199; pixels[i + 2] = 51; pixels[i + 3] = 255; }
    if ((x >= 8 && x <= 11 && y >= 13 && y <= 19) || (x >= 12 && x <= 17 && Math.abs(y - 16) <= x - 8) || (x >= 21 && x <= 23 && y >= 11 && y <= 21)) { pixels[i] = 36; pixels[i + 1] = 35; pixels[i + 2] = 25; pixels[i + 3] = 255; }
  }
  return nativeImage.createFromBitmap(pixels, { width: size, height: size });
}
function registerIPC() {
  const handle = (channel: string, callback: (...args: any[]) => unknown) => ipcMain.handle(channel, (event, ...args) => {
    if (![mainWindow.webContents.id, popup.webContents.id].includes(event.sender.id)) throw new Error('未知窗口');
    return callback(...args);
  });
  handle('state:get', () => state);
  handle('settings:save', saveSettings);
  handle('speech:selection', (id: number) => { if (!state.selection || state.selection.id !== id) throw new Error('选区已更新，请重新选中。'); speak(state.selection.text); });
  handle('speech:test', () => speak('Hello! Select any English word or sentence, then click the speaker to listen.'));
  handle('speech:stop', stopSpeech);
  handle('popup:hide', hidePopup);
  handle('settings:open', () => { hidePopup(); openMain(); });
  handle('services:restart', () => { stopSpeech(); hidePopup(); startWorker(); startSpeech(); });
  handle('app:quit', () => app.quit());
  ipcMain.on('popup:hover', (event, hovered: boolean) => { if (event.sender.id === popup.webContents.id) { popupHovered = hovered; refreshPopupTimer(); } });
  ipcMain.on('audio:report', (event, value: any) => {
    if (event.sender.id !== audioWindow.webContents.id) return;
    if (value.type === 'ready') { audioReady = true; return; }
    if (value.id !== speechId) return;
    if (value.type === 'playing') { state.speech = 'speaking'; state.speechMessage = lastSynthesis?.cacheHit ? '正在播放缓存语音' : '正在朗读 · Kokoro'; }
    if (value.type === 'consumed') speechCommand({ type: 'consumed', id: value.id });
    if (value.type === 'done') { state.speech = 'ready'; state.speechMessage = '朗读完成 · Kokoro'; }
    if (value.type === 'error') { stopSpeech(); state.speech = 'error'; state.speechMessage = String(value.message); }
    publish();
  });
}
async function createWindows() {
  const webPreferences = { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true };
  mainWindow = new BrowserWindow({ width: 1120, height: 840, minWidth: 860, minHeight: 650, title: '取词朗读 · SelectSpeak', backgroundColor: '#f5f6f2', icon: trayImage(), autoHideMenuBar: true, show: false, webPreferences });
  popup = new BrowserWindow({ width: 108, height: 54, frame: false, transparent: true, resizable: false, movable: false, show: false, skipTaskbar: true, alwaysOnTop: true, focusable: false, hasShadow: false, webPreferences });
  audioWindow = new BrowserWindow({ show: false, webPreferences: { ...webPreferences, preload: path.join(__dirname, 'audio-preload.js'), backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' } });
  // Electron's non-focusable native window accepts mouse input without activating.
  for (const win of [mainWindow, popup, audioWindow]) {
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', event => event.preventDefault());
    win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    win.webContents.on('render-process-gone', (_event, details) => log(`renderer: ${details.reason}`));
  }
  mainWindow.on('close', event => { if (!quitting && !smoke) { event.preventDefault(); mainWindow.hide(); } });
  mainWindow.on('focus', hidePopup);
  registerIPC();
  await Promise.all([mainWindow.loadFile(path.join(__dirname, 'ui/index.html')), popup.loadFile(path.join(__dirname, 'ui/popup.html')), audioWindow.loadFile(path.join(__dirname, 'ui/audio.html'))]);
  tray = new Tray(trayImage()); tray.on('double-click', openMain); tray.on('click', openMain);
  companion = new Companion(path.join(dataDir, 'companion.json'), {
    state: () => state, openSettings: openMain, stop: stopSpeech,
    read: () => { if (state.selection) speak(state.selection.text); },
    toggleListening: () => saveSettings({ ...state.settings, enabled: !state.settings.enabled }),
    setVoice: voice => saveSettings({ ...state.settings, voice }), changed: publish
  });
  await companion.load();
  publish();
  if (!process.argv.includes('--background')) mainWindow.show();
}
async function smokeTest() {
  const folder = path.join(root, 'work/smoke'); fs.mkdirSync(folder, { recursive: true });
  const deadline = Date.now() + 90000;
  while ((state.hook === 'starting' || state.speech === 'starting') && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 200));
  await new Promise(resolve => setTimeout(resolve, 500));
  const ui = await mainWindow.webContents.executeJavaScript(`({title: document.title, bridge: typeof window.desktop?.getState, status: document.querySelector('#hook-status')?.textContent})`);
  fs.writeFileSync(path.join(folder, 'main.png'), (await mainWindow.webContents.capturePage()).toPNG());
  const pet = await companion!.inspect();
  fs.writeFileSync(path.join(folder, 'companion.png'), (await companion!.window.webContents.capturePage()).toPNG());
  const petInteractions = await companion!.window.webContents.executeJavaScript(`(async () => {
    const pet = document.querySelector('#pet');
    const clickDelay = (await window.companion.getState()).doubleClickMs;
    pet.dispatchEvent(new MouseEvent('click', {detail: 1}));
    await new Promise(r => setTimeout(r, clickDelay + 100));
    const single = document.body.dataset.action;
    pet.dispatchEvent(new MouseEvent('click', {detail: 1}));
    pet.dispatchEvent(new MouseEvent('click', {detail: 2}));
    pet.dispatchEvent(new MouseEvent('dblclick', {detail: 2}));
    await new Promise(r => setTimeout(r, 40));
    const double = document.body.dataset.action;
    await new Promise(r => setTimeout(r, 850));
    return {single, double, doubleStillHappy: document.body.dataset.action === 'happy'};
  })()`);
  let playback = false;
  if (state.speech === 'ready' && audioReady) {
    speak('Curiosity opens the door to learning.');
    const speechDeadline = Date.now() + 45000;
    while (['generating', 'speaking'].includes(state.speech) && Date.now() < speechDeadline) await new Promise(resolve => setTimeout(resolve, 100));
    playback = state.speech === 'ready';
  }
  const report = { hook: state.hook, hookMessage: state.hookMessage, speech: state.speech, speechMessage: state.speechMessage, engine: 'Kokoro fp32 CPU', audioReady, playback, lastSynthesis, voices: state.voices, ui, pet, petInteractions, at: new Date().toISOString() };
  fs.writeFileSync(path.join(folder, 'report.json'), JSON.stringify(report, null, 2));
  console.log('SMOKE_REPORT ' + JSON.stringify(report));
  shutdown();
  app.exit(state.hook === 'running' && state.speech === 'ready' && playback && ui.bridge === 'function' && pet.imageLoaded && pet.bodyHit && pet.transparentCorner && petInteractions.single === 'pat' && petInteractions.double === 'happy' && petInteractions.doubleStillHappy ? 0 : 1);
}
function shutdown() { quitting = true; hidePopup(); companion?.dispose(); companion = undefined; speechCommand({ type: 'quit' }); worker?.kill(); speech?.kill(); tray?.destroy(); }
if (!app.requestSingleInstanceLock({ smoke })) app.quit();
else {
  app.on('second-instance', openMain);
  app.whenReady().then(async () => {
    if (process.platform !== 'win32') throw new Error('此原型仅支持 Windows。');
    await createWindows(); startWorker(); startSpeech();
    if (smoke) await smokeTest();
  }).catch(error => { log(String(error)); console.error(error); shutdown(); app.exit(1); });
  app.on('window-all-closed', () => {});
  app.on('before-quit', shutdown);
  process.on('uncaughtException', error => { log(`uncaught: ${error.message}`); console.error(error); });
}
