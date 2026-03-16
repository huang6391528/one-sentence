// 极低频地层轰鸣声
export const playTectonicShift = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const oscBass = ctx.createOscillator();
  const gainBass = ctx.createGain();
  
  oscBass.type = 'sine';
  oscBass.frequency.setValueAtTime(40, ctx.currentTime);
  oscBass.frequency.exponentialRampToValueAtTime(5, ctx.currentTime + 2.5);
  
  gainBass.gain.setValueAtTime(0, ctx.currentTime);
  gainBass.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.1);
  gainBass.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);
  
  oscBass.connect(gainBass);
  gainBass.connect(ctx.destination);
  oscBass.start();
  oscBass.stop(ctx.currentTime + 2.5);
};