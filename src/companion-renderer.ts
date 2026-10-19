(() => {
  type State = import('./companion-core').CompanionState;
  const api = (window as any).companion as {
    getState(): Promise<State>; beginDrag(): Promise<boolean>; endDrag(): Promise<boolean>;
    menu(): Promise<void>; onState(callback: (state: State) => void): void;
  };
  const body = document.body;
  const pet = document.querySelector<HTMLDivElement>('#pet')!;
  const bubble = document.querySelector<HTMLDivElement>('#bubble')!;
  let state: State;
  let singleTimer: ReturnType<typeof setTimeout> | undefined;
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let pointerStart: { x: number; y: number } | undefined;
  let moved = false;
  let finishing: Promise<boolean> = Promise.resolve(false);
  let transient = false;
  function base() {
    if (!state) return;
    document.documentElement.style.zoom = String(state.scale);
    body.dataset.mode = state.speech === 'speaking' ? 'speaking' : state.speech === 'generating' ? 'thinking' : state.speech === 'starting' ? 'loading' : state.resting ? 'resting' : 'idle';
    body.dataset.locked = String(state.locked);
    if (!transient) {
      bubble.textContent = state.speech === 'speaking' ? '♪ 正在读给你听' : state.speech === 'generating' ? '让我想一想…' : state.speech === 'starting' ? '正在唤醒声音…' : state.speech === 'error' ? '声音需要检查，右键打开设置' : state.resting ? 'Zzz… 陪你休息' : !state.enabled ? '划词已暂停 · 右键开启' : '';
      bubble.classList.toggle('visible', !!bubble.textContent);
    }
  }
  function react(action: 'pat' | 'happy') {
    clearTimeout(feedbackTimer); transient = true;
    body.dataset.action = '';
    void pet.offsetWidth;
    body.dataset.action = action;
    bubble.textContent = action === 'pat' ? '嘿嘿，摸摸头～' : '耶！陪你一起学！';
    bubble.classList.add('visible');
    feedbackTimer = setTimeout(() => { transient = false; body.dataset.action = ''; base(); }, action === 'pat' ? 1100 : 1500);
  }
  pet.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    pointerStart = { x: event.screenX, y: event.screenY }; moved = false;
    pet.setPointerCapture(event.pointerId);
    body.classList.add('pressed');
    void api.beginDrag();
  });
  pet.addEventListener('pointermove', event => {
    if (!pointerStart) return;
    if (Math.hypot(event.screenX - pointerStart.x, event.screenY - pointerStart.y) >= 6 && !state?.locked) {
      moved = true; clearTimeout(singleTimer); body.classList.add('dragging');
    }
  });
  function release(event: PointerEvent) {
    if (!pointerStart) return;
    pointerStart = undefined;
    body.classList.remove('pressed', 'dragging');
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    finishing = api.endDrag();
  }
  pet.addEventListener('pointerup', release);
  pet.addEventListener('pointercancel', event => { moved = true; clearTimeout(singleTimer); release(event); });
  pet.addEventListener('lostpointercapture', () => { pointerStart = undefined; body.classList.remove('pressed', 'dragging'); });
  pet.addEventListener('click', async event => {
    if (moved || await finishing) return;
    clearTimeout(singleTimer);
    if (event.detail >= 2) { react('happy'); return; }
    singleTimer = setTimeout(() => react('pat'), (state?.doubleClickMs ?? 500) + 30);
  });
  pet.addEventListener('dblclick', event => { event.preventDefault(); clearTimeout(singleTimer); });
  document.addEventListener('contextmenu', event => {
    event.preventDefault(); clearTimeout(singleTimer); pointerStart = undefined;
    body.classList.remove('pressed', 'dragging'); void api.menu();
  });
  api.onState(value => { state = value; base(); });
  void api.getState().then(value => { state = value; base(); });
})();
