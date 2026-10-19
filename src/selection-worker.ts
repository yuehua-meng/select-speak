import SelectionHook from 'selection-hook';
import type { Settings } from './shared';
import path from 'node:path';
const hook = new SelectionHook();
let gesture = 0;
const send = (type: string, data: unknown) => { if (process.connected) process.send?.({ type, data, gesture }); };
hook.on('text-selection', data => send('selection', data));
hook.on('mouse-down', data => { gesture++; send('mouse-down', data); });
hook.on('mouse-up', data => send('mouse-up', data));
hook.on('mouse-wheel', () => send('dismiss', null));
hook.on('key-down', data => { if (!data.sys) send('dismiss', null); });
hook.on('error', error => send('error', error.message));
function configure(settings: Settings) {
  hook.stop();
  hook.setClipboardMode(SelectionHook.FilterMode.INCLUDE_LIST, settings.clipboardApps);
  hook.setGlobalFilterMode(SelectionHook.FilterMode.EXCLUDE_LIST, [...settings.excludedApps, path.basename(process.execPath).toLowerCase()]);
  hook.setFineTunedList(SelectionHook.FineTunedListType.EXCLUDE_CLIPBOARD_CURSOR_DETECT, ['acrobat.exe', 'acrord32.exe', 'cajviewer.exe', 'pdfxedit.exe', 'foxitpdfreader.exe']);
  hook.setFineTunedList(SelectionHook.FineTunedListType.INCLUDE_CLIPBOARD_DELAY_READ, ['acrobat.exe', 'acrord32.exe']);
  if (settings.clipboardFallback) hook.enableClipboard(); else hook.disableClipboard();
  if (!settings.enabled) { send('status', 'paused'); return; }
  if (!hook.start()) throw new Error('Windows 选区监听启动失败');
  send('status', 'running');
}
process.on('message', (message: { type: string; settings?: Settings }) => {
  try {
    if (message.type === 'configure' && message.settings) configure(message.settings);
    if (message.type === 'quit') { hook.cleanup(); process.exit(0); }
  } catch (error) { send('error', String(error)); }
});
process.on('disconnect', () => { hook.cleanup(); process.exit(0); });
send('ready', null);
