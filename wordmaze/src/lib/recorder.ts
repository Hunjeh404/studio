// Hold-to-talk microphone capture that produces a 16 kHz mono 16-bit WAV, the format Azure pronunciation assessment takes.
export const RATE = 16000;
export function downsample(input: Float32Array, from: number, to = RATE): Float32Array {
 if (from === to) return input;
 const ratio = from / to, out = new Float32Array(Math.floor(input.length / ratio));
 for (let i = 0; i < out.length; i++) {
  const start = Math.floor(i * ratio), end = Math.min(input.length, Math.floor((i + 1) * ratio));
  let sum = 0; for (let j = start; j < end; j++) sum += input[j];
  out[i] = end > start ? sum / (end - start) : 0;
 }
 return out;
}
export function encodeWav(samples: Float32Array, rate = RATE): Uint8Array {
 const bytes = new Uint8Array(44 + samples.length * 2), view = new DataView(bytes.buffer);
 const text = (at: number, s: string) => { for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i); };
 text(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
 view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true);
 view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, samples.length * 2, true);
 for (let i = 0; i < samples.length; i++) { const s = Math.max(-1, Math.min(1, samples[i])); view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
 return bytes;
}
export function toBase64(bytes: Uint8Array): string { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); }
export const recordingSupported = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext);
export function micError(e: unknown): string {
 const name = e instanceof DOMException ? e.name : '';
 if (name === 'NotAllowedError' || name === 'SecurityError') return '마이크 사용을 허용해 주세요. 권한을 차단하셨다면 브라우저 설정에서 변경해 주세요.';
 if (name === 'NotFoundError' || name === 'NotReadableError') return '마이크를 사용할 수 없습니다. 다른 앱의 마이크 사용을 확인해 주세요.';
 return '마이크를 시작하지 못했습니다. 버튼을 다시 눌러 주세요.';
}
// Starts recording right away; stop() resolves with base64 WAV (or '' when nothing was captured), cancel() discards.
export async function startRecording() {
 const stream = await navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, echoCancellation: true, noiseSuppression: true}});
 const Ctx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
 const ctx = new Ctx(), source = ctx.createMediaStreamSource(stream), node = ctx.createScriptProcessor(4096, 1, 1), chunks: Float32Array[] = [];
 node.onaudioprocess = e => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
 source.connect(node); node.connect(ctx.destination); await ctx.resume().catch(() => {});
 let closed = false;
 const close = () => { if (closed) return; closed = true; node.onaudioprocess = null; try { source.disconnect(); node.disconnect(); } catch {} stream.getTracks().forEach(t => t.stop()); void ctx.close().catch(() => {}); };
 return {
  async stop() { await new Promise(r => setTimeout(r, 250)); const rate = ctx.sampleRate; close(); const total = chunks.reduce((n, c) => n + c.length, 0); if (total < rate * .25) return ''; const all = new Float32Array(total); let at = 0; for (const c of chunks) { all.set(c, at); at += c.length; } return toBase64(encodeWav(downsample(all, rate).subarray(0, RATE * 8))); },
  cancel: close,
 };
}
