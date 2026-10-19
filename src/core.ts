import type { Settings } from './shared';
import { kokoroVoice } from './speech-core';
export const defaults: Settings = {
  enabled: true, englishOnly: true, clipboardFallback: true,
  clipboardApps: ['winword.exe', 'wps.exe', 'acrobat.exe', 'acrord32.exe', 'sumatrapdf.exe', 'foxitpdfreader.exe', 'pdfxedit.exe', 'typora.exe', 'obsidian.exe', 'code.exe', 'chrome.exe', 'msedge.exe', 'firefox.exe'],
  excludedApps: ['windowsterminal.exe', 'cmd.exe', 'powershell.exe', 'pwsh.exe', 'keepass.exe', 'keepassxc.exe', '1password.exe', 'bitwarden.exe'],
  voice: 'af_heart', rate: 0, popupSeconds: 8
};
export function appList(input: unknown, fallback: string[]): string[] {
  if (!Array.isArray(input)) return [...fallback];
  return [...new Set(input.filter((v): v is string => typeof v === 'string').map(v => v.trim().toLowerCase()).filter(v => /^[\w. -]+\.exe$/.test(v)))].slice(0, 100);
}
export function sanitizeSettings(value: unknown): Settings {
  const v = value && typeof value === 'object' ? value as Partial<Settings> : {};
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : defaults.enabled,
    englishOnly: typeof v.englishOnly === 'boolean' ? v.englishOnly : defaults.englishOnly,
    clipboardFallback: typeof v.clipboardFallback === 'boolean' ? v.clipboardFallback : defaults.clipboardFallback,
    clipboardApps: appList(v.clipboardApps, defaults.clipboardApps),
    excludedApps: appList(v.excludedApps, defaults.excludedApps),
    voice: kokoroVoice(v.voice),
    rate: typeof v.rate === 'number' && Number.isFinite(v.rate) ? Math.max(-5, Math.min(5, Math.round(v.rate))) : 0,
    popupSeconds: typeof v.popupSeconds === 'number' && Number.isFinite(v.popupSeconds) ? Math.max(3, Math.min(30, Math.round(v.popupSeconds))) : 8
  };
}
export function selectedText(value: string, englishOnly: boolean): string | null {
  const text = value.replace(/\uFFFC/g, '').replace(/\r\n/g, '\n').trim();
  if (!text || text.length > 12000 || (englishOnly && !/[a-z]/i.test(text))) return null;
  return text;
}
export function popupPosition(anchor: {x: number; y: number}, work: {x: number; y: number; width: number; height: number}, width = 108, height = 54) {
  return {
    x: Math.round(Math.max(work.x + 6, Math.min(anchor.x + 10, work.x + work.width - width - 6))),
    y: Math.round(Math.max(work.y + 6, Math.min(anchor.y + 12, work.y + work.height - height - 6)))
  };
}
