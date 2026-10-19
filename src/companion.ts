import { app, BrowserWindow, ipcMain, Menu, screen, type MenuItemConstructorOptions } from 'electron';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { AppState } from './shared';
import { canvasSize, clampPosition, dragMoved, hitsImage, preferences, type AlphaMask, type CompanionPreferences, type Point, type CompanionState } from './companion-core';

interface Actions {
  state(): AppState; openSettings(): void; stop(): void; read(): void;
  toggleListening(): void; setVoice(id: string): void; changed(): void;
}
export class Companion {
  readonly window: BrowserWindow;
  private config: CompanionPreferences;
  private mask: AlphaMask;
  private timer: NodeJS.Timeout;
  private ignoring = false;
  private menuOpen = false;
  private doubleClickMs = 500;
  private drag?: { start: Point; origin: Point; moved: boolean };
  private lastDrag = false;
  private displayChanged = () => { this.reposition(); };
  constructor(private file: string, private actions: Actions) {
    let raw: unknown;
    try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { raw = {}; }
    this.config = preferences(raw);
    this.mask = JSON.parse(fs.readFileSync(path.join(__dirname, 'ui/assets/blue-companion-mask.json'), 'utf8'));
    this.window = new BrowserWindow({
      ...this.size(), frame: false, transparent: true, resizable: false, movable: false,
      show: false, skipTaskbar: true, alwaysOnTop: true, focusable: false, hasShadow: false,
      title: '小蓝 · 取词朗读',
      webPreferences: { preload: path.join(__dirname, 'companion-preload.js'), contextIsolation: true,
        nodeIntegration: false, sandbox: true, backgroundThrottling: false }
    });
    this.window.setAlwaysOnTop(true, 'floating');
    this.window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    this.window.webContents.on('will-navigate', e => e.preventDefault());
    const handle = (name: string, callback: () => unknown) => ipcMain.handle(name, event => {
      if (event.sender !== this.window.webContents) throw new Error('未知窗口');
      return callback();
    });
    handle('companion:state', () => this.snapshot());
    handle('companion:drag-start', () => this.beginDrag());
    handle('companion:drag-end', () => this.endDrag());
    handle('companion:menu', () => { this.showMenu(); });
    this.reposition();
    screen.on('display-metrics-changed', this.displayChanged);
    screen.on('display-removed', this.displayChanged);
    this.timer = setInterval(() => this.tick(), 16);
    // Match the user's Windows double-click setting instead of firing a single click first.
    execFile('reg.exe', ['query', 'HKCU\\Control Panel\\Mouse', '/v', 'DoubleClickSpeed'], { windowsHide: true }, (_error, stdout) => {
      const match = stdout?.match(/DoubleClickSpeed\s+REG_SZ\s+(\d+)/i);
      if (match) this.doubleClickMs = Math.max(100, Math.min(5000, Number(match[1])));
      this.sync();
    });
  }
  private size() { return { width: Math.round(canvasSize.width * this.config.scale), height: Math.round(canvasSize.height * this.config.scale) }; }
  private write() {
    fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.config, null, 2));
    fs.renameSync(this.file + '.tmp', this.file);
  }
  private snapshot(): CompanionState {
    return { speech: this.actions.state().speech, enabled: this.actions.state().settings.enabled,
      resting: this.config.resting, locked: this.config.locked, scale: this.config.scale, doubleClickMs: this.doubleClickMs };
  }
  sync() {
    if (!this.window.isDestroyed() && !this.window.webContents.isLoading()) this.window.webContents.send('companion:changed', this.snapshot());
  }
  async load() {
    await this.window.loadFile(path.join(__dirname, 'ui/companion.html'));
    this.sync();
    if (this.config.visible) this.window.showInactive();
  }
  get visible() { return this.config.visible; }
  toggle() {
    this.endDrag(); this.config.visible = !this.config.visible;
    if (this.config.visible) { this.reposition(); this.window.showInactive(); } else this.window.hide();
    this.write(); this.actions.changed();
  }
  private reposition() {
    if (this.window.isDestroyed()) return;
    const size = this.size();
    const primary = screen.getPrimaryDisplay().workArea;
    const point = this.config.position ?? { x: primary.x + primary.width - size.width - 18, y: primary.y + primary.height - size.height - 8 };
    const work = screen.getDisplayNearestPoint(point).workArea;
    const position = clampPosition(point, size, work);
    this.window.setBounds({ ...position, ...size });
  }
  private setScale(value: number) {
    this.endDrag();
    const previous = this.window.getBounds();
    this.config.scale = value;
    const size = this.size();
    this.config.position = { x: previous.x + (previous.width - size.width) / 2, y: previous.y + previous.height - size.height };
    this.reposition();
    const [x, y] = this.window.getPosition(); this.config.position = { x, y };
    this.write(); this.sync();
  }
  private ignore(value: boolean) {
    if (this.ignoring === value) return;
    this.ignoring = value;
    this.window.setIgnoreMouseEvents(value, { forward: true });
  }
  private tick() {
    if (this.window.isDestroyed() || !this.window.isVisible()) return;
    const cursor = screen.getCursorScreenPoint();
    if (this.drag) {
      const drag = this.drag;
      drag.moved ||= dragMoved(drag.start, cursor);
      if (drag.moved) {
        const point = { x: drag.origin.x + cursor.x - drag.start.x, y: drag.origin.y + cursor.y - drag.start.y };
        const position = clampPosition(point, this.size(), screen.getDisplayNearestPoint(cursor).workArea);
        this.window.setPosition(position.x, position.y, false);
      }
      this.ignore(false); return;
    }
    if (this.menuOpen) { this.ignore(false); return; }
    const b = this.window.getBounds();
    const scale = this.config.scale;
    this.ignore(!hitsImage({ x: (cursor.x - b.x) / scale, y: (cursor.y - b.y) / scale }, this.mask));
  }
  private beginDrag() {
    this.lastDrag = false;
    if (this.config.locked) return false;
    const [x, y] = this.window.getPosition();
    this.drag = { start: screen.getCursorScreenPoint(), origin: { x, y }, moved: false };
    this.ignore(false); return true;
  }
  endDrag() {
    if (this.drag) {
      this.lastDrag = this.drag.moved;
      if (this.drag.moved) {
        const [x, y] = this.window.getPosition(); this.config.position = { x, y }; this.write();
      }
      this.drag = undefined;
    }
    return this.lastDrag;
  }
  menuTemplate(): MenuItemConstructorOptions[] {
    const state = this.actions.state();
    return [
      { label: '小蓝 · 你的朗读搭子', enabled: false },
      { label: '朗读最近选中的英文', enabled: !!state.selection && state.speech !== 'starting' && !!state.voices.length, click: () => this.actions.read() },
      { label: '停止朗读', click: () => this.actions.stop() },
      { label: '启用划词朗读', type: 'checkbox', checked: state.settings.enabled, click: () => this.actions.toggleListening() },
      { type: 'separator' },
      { label: '声音', submenu: state.voices.length ? state.voices.map(v => ({ label: `${v.name} · ${v.culture}`, type: 'radio' as const, checked: v.id === state.settings.voice, click: () => this.actions.setVoice(v.id) })) : [{ label: 'Kokoro 正在载入…', enabled: false }] },
      { label: '大小', submenu: [0.75, 1, 1.25].map(value => ({ label: `${value * 100}%`, type: 'radio' as const, checked: value === this.config.scale, click: () => this.setScale(value) })) },
      { label: '固定位置', type: 'checkbox', checked: this.config.locked, click: () => { this.endDrag(); this.config.locked = !this.config.locked; this.write(); this.sync(); } },
      { label: '休息一下', type: 'checkbox', checked: this.config.resting, click: () => { this.config.resting = !this.config.resting; this.write(); this.sync(); } },
      { type: 'separator' },
      { label: '打开朗读设置', click: () => this.actions.openSettings() },
      { label: '隐藏小蓝（可从托盘恢复）', click: () => this.toggle() },
      { label: '退出取词朗读', click: () => app.quit() }
    ];
  }
  private showMenu() {
    this.endDrag(); this.menuOpen = true; this.ignore(false);
    Menu.buildFromTemplate(this.menuTemplate()).popup({ window: this.window, callback: () => { this.menuOpen = false; } });
  }
  async inspect() {
    const ui = await this.window.webContents.executeJavaScript(`({imageLoaded: document.querySelector('img').complete, width: document.querySelector('img').naturalWidth, height: document.querySelector('img').naturalHeight, state: document.body.dataset.mode, bridge: typeof window.companion.beginDrag, background: getComputedStyle(document.body).backgroundColor})`);
    return { ...ui, bounds: this.window.getBounds(), visible: this.window.isVisible(), transparentCorner: !hitsImage({ x: 2, y: 2 }, this.mask), bodyHit: hitsImage({ x: 150, y: 180 }, this.mask), menu: this.menuTemplate().map(item => item.label).filter(Boolean) };
  }
  dispose() {
    clearInterval(this.timer);
    screen.removeListener('display-metrics-changed', this.displayChanged);
    screen.removeListener('display-removed', this.displayChanged);
    for (const name of ['state', 'drag-start', 'drag-end', 'menu']) ipcMain.removeHandler(`companion:${name}`);
    if (!this.window.isDestroyed()) this.window.destroy();
  }
}
