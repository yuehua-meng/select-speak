// Package only the verified application directory, never project user data.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const stage = path.join(root, 'work/portable-stage/SelectSpeak-0.3.0');
const target = path.join(root, 'release/SelectSpeak-0.3.0-windows-x64.zip');
fs.mkdirSync(stage, { recursive: true });
fs.cpSync(path.join(root, 'release/win-unpacked'), stage, { recursive: true, filter: p => !['data', '.git'].includes(path.basename(p)) && !p.endsWith('.log') });
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(stage, 'LICENSE-SelectSpeak.txt'));
fs.copyFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(stage, 'THIRD_PARTY_NOTICES.md'));
fs.writeFileSync(path.join(stage, 'QUICK_START.txt'), `SelectSpeak v0.3.0 public preview / 公开预览版\r\n\r\nWindows 10/11 x64 only. Portable and unsigned.\r\n1. Extract this entire folder to a writable location.\r\n2. Run SelectSpeak.exe. Keep resources/ next to it.\r\n3. Wait for Kokoro, then select English in another application and click the speaker.\r\nNo Node.js, Python, GPU or API key is required. Speech runs locally.\r\nUI is primarily Simplified Chinese.\r\nControls: 试听声音 = sample voice; 停止朗读 = stop; 退出程序 = quit.\r\nCompanion: click to pat, double-click to bounce, drag to move, right-click for menu.\r\nClose the workbench to keep running in the tray. Use 退出 to quit.\r\nSelection compatibility depends on the reader and document; scanned/protected content may not work.\r\nOptional clipboard fallback may leave clipboard history.\r\n\r\n中文快速开始：\r\n1. 完整解压到可写目录，双击 SelectSpeak.exe。\r\n2. 等待 Kokoro 就绪，在其他软件选中英文，点击小喇叭。\r\n3. 小蓝单击摸头、双击跳跃，拖动可移动，右键打开菜单。\r\n关闭工作台后继续在托盘运行；彻底退出请用“退出”。\r\n这是未签名的 Windows 预览版；应用与文档兼容性仍在收集测试。\r\n\r\nSource, issues and updates: https://github.com/yuehua-meng/select-speak\r\n`);
const zip = path.join(root, 'node_modules/electron-winstaller/vendor/7z-x64.exe');
if (fs.existsSync(target)) throw new Error('Release ZIP already exists; choose a versioned filename instead of updating an old archive.');
const result = spawnSync(zip, ['a', '-tzip', '-mx=5', target, 'SelectSpeak-0.3.0'], { cwd: path.dirname(stage), stdio: 'inherit', windowsHide: true });
if (result.error) console.error(result.error.message);
if (result.status !== 0) process.exit(result.status || 1);
console.log(JSON.stringify({ target, bytes: fs.statSync(target).size }));
