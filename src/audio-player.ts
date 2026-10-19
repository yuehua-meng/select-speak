(() => {
  type Command = { type: 'start' | 'stop' | 'chunk' | 'end'; id: number; samples?: Float32Array; sampleRate?: number; index?: number };
  const bridge = (window as unknown as { audioEngine: { onCommand(callback: (command: Command) => void): void; report(value: unknown): void } }).audioEngine;
  const context = new AudioContext({ sampleRate: 24000 });
  const sources = new Set<AudioBufferSourceNode>();
  let id = -1, generated = false, scheduled = 0, started = false, pendingChunks = 0;
  function stop() { for (const source of sources) { source.onended = null; source.stop(); source.disconnect(); } sources.clear(); scheduled = 0; pendingChunks = 0; }
  function maybeDone() { if (generated && !sources.size && !pendingChunks) bridge.report({ type: 'done', id }); }
  bridge.onCommand(command => {
    try {
      if (command.type === 'start' || command.type === 'stop') { stop(); id = command.id; generated = false; started = false; return; }
      if (command.id !== id) return;
      if (command.type === 'end') { generated = true; maybeDone(); return; }
      if (command.type === 'chunk' && command.samples) {
        pendingChunks++;
        void context.resume().then(() => {
          if (command.id !== id) return;
          pendingChunks--;
          const audio = context.createBuffer(1, command.samples!.length, command.sampleRate!);
          audio.copyToChannel(new Float32Array(command.samples!), 0);
          const source = context.createBufferSource(); source.buffer = audio; source.connect(context.destination);
          const startAt = Math.max(context.currentTime + 0.015, scheduled);
          scheduled = startAt + audio.duration; sources.add(source);
          source.onended = () => { sources.delete(source); source.disconnect(); if (command.id === id) { bridge.report({ type: 'consumed', id, index: command.index }); maybeDone(); } };
          source.start(startAt);
          if (!started) { started = true; bridge.report({ type: 'playing', id }); }
        }).catch(error => bridge.report({ type: 'error', id: command.id, message: String(error) }));
      }
    } catch (error) { bridge.report({ type: 'error', id, message: String(error) }); }
  });
  bridge.report({ type: 'ready', sampleRate: context.sampleRate });
})();
