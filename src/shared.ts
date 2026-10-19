export interface Settings {
  enabled: boolean;
  englishOnly: boolean;
  clipboardFallback: boolean;
  clipboardApps: string[];
  excludedApps: string[];
  voice: string;
  rate: number;
  popupSeconds: number;
}
export interface Voice { id: string; name: string; culture: string; gender: string }
export interface SelectionSnapshot { id: number; text: string; program: string; method: string; at: string }
export interface AppState {
  settings: Settings;
  hook: 'starting' | 'running' | 'paused' | 'error';
  hookMessage: string;
  speech: 'starting' | 'ready' | 'generating' | 'speaking' | 'error';
  speechMessage: string;
  voices: Voice[];
  selection: SelectionSnapshot | null;
  version: string;
}
export interface DesktopAPI {
  getState(): Promise<AppState>;
  saveSettings(value: Settings): Promise<AppState>;
  speakSelection(id: number): Promise<void>;
  speakTest(): Promise<void>;
  stopSpeech(): Promise<void>;
  hidePopup(): Promise<void>;
  popupHover(hovered: boolean): void;
  openSettings(): Promise<void>;
  restart(): Promise<void>;
  quit(): Promise<void>;
  onState(callback: (state: AppState) => void): () => void;
}
declare global { interface Window { desktop: DesktopAPI } }
