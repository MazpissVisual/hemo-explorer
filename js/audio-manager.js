/**
 * AUDIO MANAGER - SISTEM SUARA & NARRATOR INTERAKTIF
 * Menggunakan Web Audio API (Sintetis Detak Jantung, BGM Ceria, SFX)
 * dan Web Speech API (Narator Suara Bahasa Indonesia)
 */

class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.heartbeatTimer = null;
    this.heartRate = 72; // BPM default
    this.isHeartSoundActive = false;
    this.sfxMuted = false;
    this.bgmMuted = false;
    this.volume = 0.7;

    // Speech Synthesis
    this.synth = window.speechSynthesis || null;
    this.speechUtterance = null;
    this.isSpeaking = false;
    this.indonesianVoice = null;

    this.initSpeech();
    this.initBGMAudio();
    this.initAutoUnlock();
  }

  // Inisialisasi Audio Context saat interaksi pengguna pertama kali
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  initSpeech() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Cari suara bahasa Indonesia jika tersedia
      this.indonesianVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID')) || null;
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  // 1. TEXT-TO-SPEECH (NARATOR SUARA BAHASA INDONESIA)
  speakText(text, onStart, onEnd) {
    if (!this.synth) {
      console.warn("Speech Synthesis tidak didukung oleh browser ini.");
      return;
    }
    this.stopSpeech();

    this.speechUtterance = new SpeechSynthesisUtterance(text);
    this.speechUtterance.lang = 'id-ID';
    this.speechUtterance.rate = 0.95; // Kecepatan ramah anak
    this.speechUtterance.pitch = 1.05; // Nada ramah & ceria

    if (this.indonesianVoice) {
      this.speechUtterance.voice = this.indonesianVoice;
    }

    this.speechUtterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    this.speechUtterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.speechUtterance.onerror = (e) => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(this.speechUtterance);
  }

  stopSpeech() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  pauseSpeech() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  resumeSpeech() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  // 2. REALISTIS DETAK JANTUNG (LUB-DUB SOUND SYNTHESIS)
  playLubDub(type = 'normal') {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(this.volume * 0.9, now);
    gainNode.connect(ctx.destination);

    // Frekuensi & nada bergantung pada jenis kondisi
    let freq1 = 60; // "Lub" (Katup Trikuspid & Mitral menutup)
    let freq2 = 80; // "Dub" (Katup Aorta & Pulmonal menutup)

    if (type === 'hipertensi') {
      freq1 = 85;
      freq2 = 110;
    } else if (type === 'hipotensi') {
      freq1 = 45;
      freq2 = 60;
    }

    // Suara "LUB"
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq1, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    gain1.gain.setValueAtTime(0.8, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(gainNode);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // Suara "DUB" (terjadi ~0.15 detik setelah LUB)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq2, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(35, now + 0.25);
    gain2.gain.setValueAtTime(0.6, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc2.connect(gain2);
    gain2.connect(gainNode);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.27);
  }

  startContinuousHeartbeat(bpm = 72, type = 'normal') {
    this.stopContinuousHeartbeat();
    this.isHeartSoundActive = true;
    this.heartRate = bpm;

    const intervalMs = (60 / bpm) * 1000;
    this.playLubDub(type);

    this.heartbeatTimer = setInterval(() => {
      if (this.isHeartSoundActive) {
        this.playLubDub(type);
      }
    }, intervalMs);
  }

  stopContinuousHeartbeat() {
    this.isHeartSoundActive = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 3. SOUND EFFECTS INTERAKTIF (SFX)
  playClickSound() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

      gain.gain.setValueAtTime(0.15 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playCorrectSound() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      // Arpeggio ceria nada C5 - E5 - G5 - C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + (idx * 0.08);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25 * this.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.26);
      });
    } catch (e) {}
  }

  playWrongSound() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playFanfareSound() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [
        { f: 523.25, t: 0.0, d: 0.15 },
        { f: 659.25, t: 0.15, d: 0.15 },
        { f: 783.99, t: 0.30, d: 0.20 },
        { f: 1046.50, t: 0.50, d: 0.60 }
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.3 * this.volume, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d + 0.05);
      });
    } catch (e) {}
  }

  // --- GAME ARCADE SFX ---
  playGameCollectSound(isSpecial = false) {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isSpecial ? 'triangle' : 'sine';
      
      const startFreq = isSpecial ? 600 : 880;
      const endFreq = isSpecial ? 1400 : 1320;
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  playGameHitSound() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

      gain.gain.setValueAtTime(0.35 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  playGamePowerupSound() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const freqs = [440, 554, 659, 880, 1108];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.05;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.25 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
      });
    } catch (e) {}
  }

  playGameLaserSound() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playGameOverSound() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [
        { f: 440, t: 0.0, d: 0.2 },
        { f: 415, t: 0.2, d: 0.2 },
        { f: 392, t: 0.4, d: 0.2 },
        { f: 349, t: 0.6, d: 0.5 }
      ];
      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.22 * this.volume, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d + 0.05);
      });
    } catch (e) {}
  }

  playGameWinSound() {
    this.playFanfareSound();
  }

  // 4. BACKGROUND KIDS INSTRUMENTAL BGM (Instrumen Menarik, Ceria & Menyenangkan)
  initBGMAudio() {
    try {
      this.bgmAudio = new Audio('assets/backsound.mpeg');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = Math.max(0, Math.min(1, this.volume * 0.4));
      this.bgmAudio.preload = 'auto';

      // Fallback jika format .mpeg perlu diganti .wav
      this.bgmAudio.addEventListener('error', () => {
        console.info("Mencoba fallback ke assets/backsound.mpeg.wav");
        if (this.bgmAudio && !this.bgmAudio.src.endsWith('.wav')) {
          this.bgmAudio.src = 'assets/backsound.mpeg.wav';
          if (this.bgmPlaying) {
            this.bgmAudio.play().catch(() => this.startSynthBGM());
          }
        } else {
          this.startSynthBGM();
        }
      });
    } catch (e) {
      console.warn("Audio element initialization error:", e);
    }
  }

  initAutoUnlock() {
    // Memulai BGM secara otomatis saat ada interaksi pertama user jika tidak dimatikan
    const unlockHandler = () => {
      if (!this.bgmMuted && !this.bgmPlaying) {
        this.startBGM();
      }
      document.removeEventListener('click', unlockHandler);
      document.removeEventListener('keydown', unlockHandler);
      document.removeEventListener('touchstart', unlockHandler);
    };
    document.addEventListener('click', unlockHandler, { once: true });
    document.addEventListener('keydown', unlockHandler, { once: true });
    document.addEventListener('touchstart', unlockHandler, { once: true });
  }

  toggleBGM() {
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  startBGM() {
    if (this.bgmMuted) return;
    this.bgmPlaying = true;
    this.updateBGMButtonUI(true);

    if (this.bgmAudio) {
      this.bgmAudio.volume = Math.max(0, Math.min(1, this.volume * 0.4));
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay audio file dibatasi, mengaktifkan instrumen synth ceria:", err);
          this.startSynthBGM();
        });
      }
    } else {
      this.startSynthBGM();
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    this.updateBGMButtonUI(false);

    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
    this.stopSynthBGM();
  }

  // Fallback Polyphonic Synthesizer: Instrumen Melodi Akustik / Marimba Menyenangkan & Ceria
  startSynthBGM() {
    this.stopSynthBGM();
    if (!this.bgmPlaying || this.bgmMuted) return;

    try {
      const ctx = this.getAudioContext();
      
      // Pola Akord & Melodi Ceria Kids Education (C - G - Am - F)
      const chordPattern = [
        { root: 261.63, chord: [261.63, 329.63, 392.00, 523.25], dur: 1.6 }, // C Major
        { root: 196.00, chord: [196.00, 246.94, 293.66, 392.00], dur: 1.6 }, // G Major
        { root: 220.00, chord: [220.00, 261.63, 329.63, 440.00], dur: 1.6 }, // A Minor
        { root: 174.61, chord: [174.61, 220.00, 261.63, 349.23], dur: 1.6 }  // F Major
      ];

      let patternIdx = 0;
      const playChimeSequence = () => {
        if (!this.bgmPlaying || this.bgmMuted) return;

        const current = chordPattern[patternIdx];
        const now = ctx.currentTime;

        // 1. Arpeggio nada marimba lembut
        current.chord.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.2);

          const baseVol = 0.03 * this.volume;
          gain.gain.setValueAtTime(0.001, now + i * 0.2);
          gain.gain.linearRampToValueAtTime(baseVol, now + i * 0.2 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.2 + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.2);
          osc.stop(now + i * 0.2 + 0.65);
        });

        // 2. Bass nada dasar lembut
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(current.root / 2, now);
        bassGain.gain.setValueAtTime(0.04 * this.volume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 1.25);

        patternIdx = (patternIdx + 1) % chordPattern.length;
        this.bgmTimer = setTimeout(playChimeSequence, current.dur * 1000);
      };

      playChimeSequence();
    } catch (e) {
      console.warn("Synth BGM error:", e);
    }
  }

  stopSynthBGM() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  updateBGMButtonUI(isPlaying) {
    const btn = document.getElementById('btn-quick-bgm');
    if (btn) {
      btn.classList.toggle('bgm-active', isPlaying);
      btn.title = isPlaying ? "Hentikan Musik Latar Ceria (BGM)" : "Putar Musik Latar Ceria (BGM)";
      btn.setAttribute('aria-label', btn.title);
      if (isPlaying) {
        btn.innerHTML = `
          <span class="music-wave-bars">
            <span class="bar bar1"></span>
            <span class="bar bar2"></span>
            <span class="bar bar3"></span>
          </span>
          <span class="floating-music-label">Hentikan</span>
        `;
      } else {
        btn.innerHTML = `
          <svg class="themed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <span class="floating-music-label">Musik</span>
        `;
      }
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.bgmAudio) {
      this.bgmAudio.volume = Math.max(0, Math.min(1, this.volume * 0.4));
    }
  }
}

// Inisialisasi global audio instance
window.audioMgr = new AudioManager();
window.audioManager = window.audioMgr;
