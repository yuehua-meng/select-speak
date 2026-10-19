(() => {
  type AppState = import('./shared').AppState;
  type Settings = import('./shared').Settings;
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  let current: AppState;
  let dirty = false;
  let toastTimer: ReturnType<typeof setTimeout>;
  function toast(message: string) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 5000); }
  const act = async (fn: () => Promise<unknown>) => { try { await fn(); } catch (error) { toast(String(error).replace(/^Error: Error invoking remote method '[^']+': Error: /, '')); } };
  function render(state: AppState) {
    current = state;
    $('version').textContent = `预览版 ${state.version}`;
    $('hook-status').textContent = ({ starting: '正在启动监听', running: '选区监听已开启', paused: '选区监听已暂停', error: '监听需要检查' })[state.hook];
    $('hook-message').textContent = state.hookMessage;
    $('hook-dot').className = `status-dot ${state.hook === 'running' ? 'ok' : state.hook === 'error' ? 'error' : ''}`;
    $('speech-status').textContent = ({ starting: '正在加载 Kokoro', ready: 'Kokoro 已就绪', generating: '正在生成语音', speaking: '正在朗读', error: '语音需要检查' })[state.speech];
    $('speech-message').textContent = state.speechMessage;
    $('speech-dot').className = `status-dot ${state.speech === 'ready' || state.speech === 'speaking' || state.speech === 'generating' ? 'ok' : state.speech === 'error' ? 'error' : ''}`;
    $('enable-button').classList.toggle('paused', !state.settings.enabled);
    $('enable-button').querySelector('span')!.textContent = state.settings.enabled ? '监听已开启' : '监听已暂停';
    if (state.selection) {
      $('selection-text').textContent = state.selection.text;
      $('selection-text').classList.remove('empty');
      $('selection-time').textContent = state.selection.at;
      $('selection-source').textContent = `${state.selection.program} · ${state.selection.method}`;
      $<HTMLButtonElement>('replay-button').disabled = false;
    }
    if (!dirty) {
      const voiceSelect = $<HTMLSelectElement>('voice'); voiceSelect.replaceChildren();
      for (const voice of state.voices) { const option = document.createElement('option'); option.value = voice.id; option.textContent = voice.name; voiceSelect.append(option); }
      if (!state.voices.length) { const option = document.createElement('option'); option.value = ''; option.textContent = '正在加载 Kokoro 音色…'; voiceSelect.append(option); }
      voiceSelect.value = state.settings.voice;
      $<HTMLInputElement>('rate').value = String(state.settings.rate);
      $<HTMLInputElement>('english-only').checked = state.settings.englishOnly;
      $<HTMLInputElement>('clipboard-fallback').checked = state.settings.clipboardFallback;
      $<HTMLSelectElement>('popup-seconds').value = String(state.settings.popupSeconds);
      $<HTMLTextAreaElement>('clipboard-apps').value = state.settings.clipboardApps.join('\n');
      $<HTMLTextAreaElement>('excluded-apps').value = state.settings.excludedApps.join('\n');
      rateLabel();
    }
  }
  function rateLabel() { const value = Number($<HTMLInputElement>('rate').value); $('rate-label').textContent = `${(1 + value * 0.08).toFixed(2)}×`; }
  function formSettings(): Settings {
    const list = (id: string) => $<HTMLTextAreaElement>(id).value.split(/[\n,;，；]+/).map(v => v.trim()).filter(Boolean);
    return { ...current.settings, voice: $<HTMLSelectElement>('voice').value, rate: Number($<HTMLInputElement>('rate').value), englishOnly: $<HTMLInputElement>('english-only').checked, clipboardFallback: $<HTMLInputElement>('clipboard-fallback').checked, popupSeconds: Number($<HTMLSelectElement>('popup-seconds').value), clipboardApps: list('clipboard-apps'), excludedApps: list('excluded-apps') };
  }
  async function save(showToast = true) {
    const settings = formSettings();
    for (const value of [...settings.clipboardApps, ...settings.excludedApps]) if (!/^[\w. -]+\.exe$/i.test(value)) throw new Error(`应用名称需要是 .exe 进程名称：${value}`);
    const state = await window.desktop.saveSettings(settings); dirty = false; render(state); $('save-hint').textContent = '设置已保存。关闭窗口后继续在托盘运行。'; if (showToast) toast('设置已保存');
  }
  $('settings-form').addEventListener('input', () => { dirty = true; $('save-hint').textContent = '有未保存的更改'; rateLabel(); });
  $('settings-form').addEventListener('submit', event => { event.preventDefault(); void act(() => save()); });
  $('enable-button').addEventListener('click', () => void act(async () => { if (dirty) await save(false); const state = await window.desktop.saveSettings({ ...current.settings, enabled: !current.settings.enabled }); render(state); }));
  $('voice-test-button').addEventListener('click', () => void act(async () => { if (dirty) await save(false); await window.desktop.speakTest(); }));
  $('sample-button').addEventListener('click', () => void act(() => window.desktop.speakTest()));
  $('restart-button').addEventListener('click', () => void act(() => window.desktop.restart()));
  $('replay-button').addEventListener('click', () => void act(() => window.desktop.speakSelection(current.selection!.id)));
  $('stop-button').addEventListener('click', () => void act(() => window.desktop.stopSpeech()));
  $('quit-button').addEventListener('click', () => void act(() => window.desktop.quit()));
  for (const link of document.querySelectorAll<HTMLAnchorElement>('.nav')) link.addEventListener('click', event => { event.preventDefault(); for (const item of document.querySelectorAll('.nav')) item.classList.remove('active'); link.classList.add('active'); document.querySelector(link.getAttribute('href')!)?.scrollIntoView({ behavior: 'smooth' }); });
  window.desktop.onState(render);
  void window.desktop.getState().then(render).catch(error => toast(String(error)));
})();
