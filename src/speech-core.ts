export const kokoroVoices = [
  { id: 'af_heart', name: 'Heart · 美音女声', culture: 'en-US', gender: 'Female' },
  { id: 'af_bella', name: 'Bella · 美音女声', culture: 'en-US', gender: 'Female' },
  { id: 'am_michael', name: 'Michael · 美音男声', culture: 'en-US', gender: 'Male' },
  { id: 'bf_emma', name: 'Emma · 英音女声', culture: 'en-GB', gender: 'Female' },
  { id: 'bm_george', name: 'George · 英音男声', culture: 'en-GB', gender: 'Male' }
] as const;
export function kokoroVoice(value: unknown): string {
  return kokoroVoices.some(v => v.id === value) ? String(value) : 'af_heart';
}
export function kokoroSpeed(rate: number): number { return Math.round((1 + Math.max(-5, Math.min(5, rate)) * 0.08) * 100) / 100; }
// Split prose without dropping or rewriting words. A later token guard handles unusual number expansions.
export function speechChunks(text: string, maxChars = 240): string[] {
  const sentences = Array.from(new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text), entry => entry.segment.trim()).filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of sentences) {
    let current = '';
    for (const word of sentence.split(/\s+/)) {
      if (current && current.length + 1 + word.length > maxChars) { chunks.push(current); current = ''; }
      current += (current ? ' ' : '') + word;
    }
    if (current) chunks.push(current);
  }
  return chunks;
}
export class AudioCache {
  private entries = new Map<string, Float32Array>();
  private used = 0;
  constructor(private maxBytes = 32 * 1024 * 1024) {}
  get sizeBytes() { return this.used; }
  get(key: string): Float32Array | undefined {
    const value = this.entries.get(key);
    if (value) { this.entries.delete(key); this.entries.set(key, value); }
    return value;
  }
  set(key: string, value: Float32Array) {
    const previous = this.entries.get(key);
    if (previous) { this.used -= previous.byteLength; this.entries.delete(key); }
    if (value.byteLength > this.maxBytes) return;
    while (this.used + value.byteLength > this.maxBytes && this.entries.size) {
      const oldest = this.entries.keys().next().value!;
      this.used -= this.entries.get(oldest)!.byteLength; this.entries.delete(oldest);
    }
    this.entries.set(key, value); this.used += value.byteLength;
  }
}
