// Utilidad de audio para beep profesional usando Web Audio API
// No depende de archivos externos, siempre funciona

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playBeep = () => {
  try {
    const ctx = getAudioContext();
    
    // Crear oscilador para tono puro
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configurar tono (1000Hz = beep clásico de escáner)
    oscillator.frequency.value = 1000;
    oscillator.type = "sine";
    
    // Envelope: ataque rápido, decay corto
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Ataque
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Decay
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
    
  } catch (e) {
    console.error("Error al reproducir beep:", e);
  }
};

// Beep de error (tono más grave)
export const playErrorBeep = () => {
  try {
    const ctx = getAudioContext();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 400; // Más grave para error
    oscillator.type = "sawtooth";
    
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    
  } catch (e) {
    console.error("Error al reproducir beep de error:", e);
  }
};
