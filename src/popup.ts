(() => {
  type AppState = import('./shared').AppState;
  let state: AppState;
  const play = document.getElementById('play') as HTMLButtonElement;
  const render = (value: AppState) => {
    state = value;
    const speaking = value.speech === 'speaking' || value.speech === 'generating';
    play.classList.toggle('playing', speaking);
    document.getElementById('speaker')!.classList.toggle('hidden', speaking);
    document.getElementById('stop')!.classList.toggle('hidden', !speaking);
    play.title = speaking ? '停止朗读' : value.selection ? `朗读：${value.selection.text.slice(0, 90)}` : '朗读选区';
    play.setAttribute('aria-label', speaking ? '停止朗读' : '朗读选中的英文');
  };
  play.addEventListener('click', () => {
    const task = state.speech === 'speaking' || state.speech === 'generating' ? window.desktop.stopSpeech() : state.selection ? window.desktop.speakSelection(state.selection.id) : Promise.resolve();
    void task.catch(() => window.desktop.openSettings());
  });
  document.getElementById('settings')!.addEventListener('click', () => void window.desktop.openSettings());
  document.getElementById('dismiss')!.addEventListener('click', () => void window.desktop.hidePopup());
  document.body.addEventListener('mouseenter', () => window.desktop.popupHover(true));
  document.body.addEventListener('mouseleave', () => window.desktop.popupHover(false));
  window.desktop.onState(render); void window.desktop.getState().then(render);
})();
