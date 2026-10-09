// Comprehensive Procedural Web Audio Engine for ZeroBallKnowledge
// Supports realistic stadium crowd atmosphere, chants, goal roars, referee whistles,
// crossbar clangs, ball kicks, and live auction countdown buzzers & gavels.

export type WhistleType = 'kickoff' | 'foul' | 'halftime' | 'fulltime';
export type KickType = 'pass' | 'shot';

class StadiumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Stadium Ambience Nodes
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceLfo: OscillatorNode | null = null;
  private isAmbienceRunning = false;

  // Background Music
  private isMusicPlaying = false;
  private musicInterval: any = null;

  // User Settings
  private sfxEnabled: boolean = true;
  private ambienceEnabled: boolean = true;
  private masterVolume: number = 0.75;
  private isMuted: boolean = false;

  constructor() {
    // Load persisted preferences
    if (typeof window !== 'undefined') {
      const storedSfx = localStorage.getItem('zbk_sfx_enabled');
      if (storedSfx !== null) this.sfxEnabled = storedSfx === 'true';

      const storedAmb = localStorage.getItem('zbk_ambience_enabled');
      if (storedAmb !== null) this.ambienceEnabled = storedAmb === 'true';

      const storedVol = localStorage.getItem('zbk_volume');
      if (storedVol !== null) this.masterVolume = Math.max(0, Math.min(1, parseFloat(storedVol) || 0.75));

      const storedMute = localStorage.getItem('zbk_muted');
      if (storedMute !== null) this.isMuted = storedMute === 'true';

      // Attach global unlock listener for mobile & autoplay restrictions
      const unlock = () => {
        this.initCtx();
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  }

  // Initialize Web Audio Context and Gain Bus
  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime
      );
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 1 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambience Bus
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.ambienceEnabled ? 0.35 : 0, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      // Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // --- Volume & Settings Controls ---

  setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('zbk_volume', String(this.masterVolume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('zbk_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  setSfxEnabled(val: boolean) {
    this.sfxEnabled = val;
    localStorage.setItem('zbk_sfx_enabled', String(val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(val ? 1 : 0, this.ctx.currentTime, 0.05);
    }
  }

  getSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  setAmbienceEnabled(val: boolean) {
    this.ambienceEnabled = val;
    localStorage.setItem('zbk_ambience_enabled', String(val));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(val ? 0.35 : 0, this.ctx.currentTime, 0.05);
    }
    if (!val && this.isAmbienceRunning) {
      this.stopStadiumAmbiance();
    }
  }

  getAmbienceEnabled(): boolean {
    return this.ambienceEnabled;
  }

  // Helper to generate a pink/brown noise buffer for natural crowd sounds
  private createNoiseBuffer(durationSeconds: number = 4): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * durationSeconds;
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const output = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Paul Kellet's filtered pink noise algorithm
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  // ==========================================
  // 🏟️ STADIUM CROWD AMBIENCE (CONTINUOUS)
  // ==========================================

  startStadiumAmbiance() {
    try {
      if (!this.ambienceEnabled || this.isAmbienceRunning) return;
      const ctx = this.initCtx();
      if (!ctx || !this.ambienceGain) return;

      const noiseBuffer = this.createNoiseBuffer(5);
      if (!noiseBuffer) return;

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      // Bandpass filter centered at 480Hz for crowd murmur
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(480, ctx.currentTime);
      filter.Q.setValueAtTime(1.1, ctx.currentTime);

      // Low frequency oscillator (LFO) creating gentle swells of crowd murmur
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // 1 swell every 5s
      lfoGain.gain.setValueAtTime(140, ctx.currentTime); // modulate +/- 140Hz
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      // Fade-in gain
      const fadeGain = ctx.createGain();
      fadeGain.gain.setValueAtTime(0.001, ctx.currentTime);
      fadeGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.2);

      source.connect(filter);
      filter.connect(fadeGain);
      fadeGain.connect(this.ambienceGain);

      source.start();

      this.ambienceSource = source;
      this.ambienceFilter = filter;
      this.ambienceLfo = lfo;
      this.isAmbienceRunning = true;
    } catch (e) {
      // Audio autoplay catch
    }
  }

  stopStadiumAmbiance() {
    try {
      if (!this.isAmbienceRunning) return;
      if (this.ambienceSource) {
        this.ambienceSource.stop();
        this.ambienceSource.disconnect();
        this.ambienceSource = null;
      }
      if (this.ambienceLfo) {
        this.ambienceLfo.stop();
        this.ambienceLfo.disconnect();
        this.ambienceLfo = null;
      }
      this.isAmbienceRunning = false;
    } catch (e) {}
  }

  getIsAmbienceRunning(): boolean {
    return this.isAmbienceRunning;
  }

  // ==========================================
  // ⚽ MATCH SFX: GOAL ROAR, GASP & CELEBRATION
  // ==========================================

  // Massive explosive stadium crowd goal roar
  playGoalRoar() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const duration = 3.2;
      const noiseBuffer = this.createNoiseBuffer(duration);
      if (!noiseBuffer) return;

      // 1. Noise surge
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.35);
      filter.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + duration);
      filter.Q.setValueAtTime(1.8, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 0.15);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noiseSource.start(ctx.currentTime);
      noiseSource.stop(ctx.currentTime + duration);

      // 2. Vocal crowd cheering harmonic formants
      [520, 680, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ctx.currentTime + 0.4);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, ctx.currentTime + duration);

        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.08 / (idx + 1), ctx.currentTime + 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * 0.85);

        osc.connect(g);
        g.connect(this.sfxGain!);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      });

      // 3. Stadium sub-bass physical rumble
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(58, ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 1.2);
      subGain.gain.setValueAtTime(0.4, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(ctx.currentTime);
      subOsc.stop(ctx.currentTime + 1.5);
    } catch (e) {}
  }

  // Triumphant Stadium Goal Horn Blast
  playGoalHorn() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      // Two powerful detuned horn blasts (Bb3 = 233.08Hz)
      const blastTimes = [0, 0.45];
      blastTimes.forEach((startTime) => {
        const now = ctx.currentTime + startTime;
        [233.08, 235.5, 466.16].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
          gain.gain.setValueAtTime(0.18, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxGain!);

          osc.start(now);
          osc.stop(now + 0.42);
        });
      });
    } catch (e) {}
  }

  // Collective Stadium "OOHHH!" / Gasp for near misses or saves
  playCrowdGasp() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const duration = 1.1;
      const noiseBuffer = this.createNoiseBuffer(duration);
      if (!noiseBuffer) return;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + duration);
      filter.Q.setValueAtTime(2.2, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // Authentic Metallic Crossbar / Woodwork Clang
  playCrossbarSound() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const now = ctx.currentTime;

      // Heavy ball impact thud
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(190, now);
      thud.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      thudGain.gain.setValueAtTime(0.4, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      thud.connect(thudGain);
      thudGain.connect(this.sfxGain);
      thud.start(now);
      thud.stop(now + 0.11);

      // Resonant metallic ring (dual discordance creates aluminum crossbar ping)
      [1380, 2150, 3100].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now);
        osc.stop(now + 1.0);
      });
    } catch (e) {}
  }

  // Rhythmic Stadium Supporter Chant (Clap Clap, Clap-Clap-Clap!)
  playCrowdChant() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const now = ctx.currentTime;
      // Timing offsets for the classic football chant rhythm
      const clapOffsets = [0, 0.4, 0.8, 1.05, 1.3];

      clapOffsets.forEach((offset) => {
        const clapTime = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, clapTime);
        osc.frequency.exponentialRampToValueAtTime(70, clapTime + 0.06);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, clapTime);

        gain.gain.setValueAtTime(0.35, clapTime);
        gain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(clapTime);
        osc.stop(clapTime + 0.09);
      });
    } catch (e) {}
  }

  // ==========================================
  // 📢 REFEREE WHISTLE (FOX 40 ACOUSTIC MODEL)
  // ==========================================

  playWhistle(type: WhistleType = 'kickoff') {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const blast = (startOffset: number, duration: number, volume: number = 0.22) => {
        const start = ctx.currentTime + startOffset;
        // Two slightly detuned sine waves create the authentic pea-less whistle acoustic beat/trill
        [2850, 3100].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          osc.frequency.exponentialRampToValueAtTime(freq + 180, start + duration * 0.4);
          osc.frequency.exponentialRampToValueAtTime(freq - 50, start + duration);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(volume, start + 0.03);
          gain.gain.setValueAtTime(volume, start + duration - 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

          osc.connect(gain);
          gain.connect(this.sfxGain!);

          osc.start(start);
          osc.stop(start + duration + 0.02);
        });
      };

      if (type === 'kickoff') {
        // Two crisp bursts
        blast(0, 0.12, 0.22);
        blast(0.18, 0.22, 0.25);
      } else if (type === 'foul') {
        // One sharp, stern blast
        blast(0, 0.36, 0.28);
      } else if (type === 'halftime') {
        // Double whistle
        blast(0, 0.2, 0.24);
        blast(0.26, 0.38, 0.26);
      } else if (type === 'fulltime') {
        // Classic dramatic triple whistle: tweet, tweet, TWEEEEEEEEET!
        blast(0, 0.15, 0.22);
        blast(0.22, 0.18, 0.24);
        blast(0.48, 0.75, 0.32);
      }
    } catch (e) {}
  }

  // Realistic football kick / shot thud
  playKick(type: KickType = 'shot') {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const isShot = type === 'shot';

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isShot ? 190 : 140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isShot ? 38 : 50, ctx.currentTime + (isShot ? 0.1 : 0.07));

      gain.gain.setValueAtTime(isShot ? 0.38 : 0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isShot ? 0.12 : 0.08));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {}
  }

  // Goalkeeper save / parry deflection sound
  playSave() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // ==========================================
  // 🔨 AUCTION ARENA BUZZER, GAVEL & BIDDING SFX
  // ==========================================

  // Ticking buzzer that increases in pitch and urgency as seconds count down
  playAuctionCountdownBeep(secondsRemaining: number) {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      // When timer hits 0, trigger the big auction buzzer
      if (secondsRemaining <= 0) {
        this.playAuctionBuzzer();
        return;
      }

      // Pitch rises as timer drops: 5s -> 650Hz, 1s -> 1400Hz
      const pitchMap: Record<number, number> = {
        5: 650,
        4: 780,
        3: 950,
        2: 1150,
        1: 1400,
      };

      const freq = pitchMap[secondsRemaining] || 800;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = secondsRemaining <= 2 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + 0.08);

      const volume = secondsRemaining <= 2 ? 0.28 : 0.18;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  // Draft room end-of-turn buzzer
  playAuctionBuzzer() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(175, ctx.currentTime); // Low buzzer buzz

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, ctx.currentTime);

      gain.gain.setValueAtTime(0.38, ctx.currentTime);
      gain.gain.setValueAtTime(0.38, ctx.currentTime + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.68);
    } catch (e) {}
  }

  // Wooden Gavel Hammer Strike onto the podium ("SOLD!")
  playGavelHammer() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const now = ctx.currentTime;

      // 1. Initial sharp wood transient crack
      const crack = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crack.type = 'triangle';
      crack.frequency.setValueAtTime(900, now);
      crack.frequency.exponentialRampToValueAtTime(160, now + 0.04);
      crackGain.gain.setValueAtTime(0.45, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      crack.connect(crackGain);
      crackGain.connect(this.sfxGain);
      crack.start(now);
      crack.stop(now + 0.06);

      // 2. Resonant wooden sounding-block body tone
      const body = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      body.type = 'sine';
      body.frequency.setValueAtTime(240, now);
      body.frequency.exponentialRampToValueAtTime(90, now + 0.22);
      bodyGain.gain.setValueAtTime(0.35, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      body.connect(bodyGain);
      bodyGain.connect(this.sfxGain);
      body.start(now);
      body.stop(now + 0.27);
    } catch (e) {}
  }

  // Outbid Warning Alarm (alerting user that someone just outbid them)
  playOutbidWarning() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      [0, 0.1].forEach((delay, idx) => {
        const start = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx === 0 ? 820 : 620, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch (e) {}
  }

  // Bid placed sound
  playBidSound() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }

  // Legacy & General UI Audio
  playClick() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  }

  playVictorySound() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.28);
      });
    } catch (e) {}
  }

  playCountdownPulse() {
    this.playAuctionCountdownBeep(3);
  }

  playPowerUp() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.18);
      });
    } catch (e) {}
  }

  toggleMusic(): boolean {
    try {
      const ctx = this.initCtx();
      if (!ctx || !this.musicGain) return false;

      if (this.isMusicPlaying) {
        this.stopMusic();
        return false;
      }

      this.isMusicPlaying = true;
      let step = 0;
      const bassNotes = [110, 110, 130.81, 98]; // A2, A2, C3, G2

      this.musicInterval = setInterval(() => {
        if (!this.ctx || !this.isMusicPlaying || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const note = bassNotes[step % bassNotes.length];
        osc.frequency.setValueAtTime(note, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
        step++;
      }, 450);

      return true;
    } catch (e) {
      return false;
    }
  }

  // ==========================================
  // 🖥️ VAR DRAMA & ⏱️ FERGIE TIME SFX
  // ==========================================

  // Pulsing sub-bass heartbeat & broadcast tension scanner for VAR review
  playVarTensionHeartbeat() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const now = ctx.currentTime;
      // Double heartbeat thud: "lub-dub"
      [0, 0.22].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const startFreq = idx === 0 ? 85 : 70;
        osc.frequency.setValueAtTime(startFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(32, now + offset + 0.15);

        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + offset);
        osc.stop(now + offset + 0.17);
      });

      // Digital line scanning glitch beep
      const beeper = ctx.createOscillator();
      const beepGain = ctx.createGain();
      beeper.type = 'triangle';
      beeper.frequency.setValueAtTime(1600, now + 0.35);
      beeper.frequency.exponentialRampToValueAtTime(800, now + 0.45);
      beepGain.gain.setValueAtTime(0.12, now + 0.35);
      beepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      beeper.connect(beepGain);
      beepGain.connect(this.sfxGain);
      beeper.start(now + 0.35);
      beeper.stop(now + 0.46);
    } catch (e) {}
  }

  // Triumphant confirmation or dramatic disallowed buzzer
  playVarDecision(decision: 'confirmed' | 'overturned') {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const now = ctx.currentTime;
      if (decision === 'confirmed') {
        // High-pitched celebratory chime + whistle
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.25, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.28);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.3);
        });
        setTimeout(() => this.playWhistle('kickoff'), 350);
      } else {
        // Dissonant dramatic buzzer + crowd gasp
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(140, now);
        osc2.frequency.setValueAtTime(148, now); // Harsh beating frequency

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.setValueAtTime(0.35, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.56);
        osc2.stop(now + 0.56);

        setTimeout(() => {
          this.playWhistle('foul');
          this.playCrowdGasp();
        }, 300);
      }
    } catch (e) {}
  }

  // 4th Official LED stoppage board notification / Fergie Time Siren
  playStoppageBoardSiren() {
    try {
      if (!this.sfxEnabled) return;
      const ctx = this.initCtx();
      if (!ctx || !this.sfxGain) return;

      const now = ctx.currentTime;
      // Modern electronic stadium stadium chime
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.28, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.24);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.25);
      });
    } catch (e) {}
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  getIsMusicPlaying() {
    return this.isMusicPlaying;
  }
}

export const sound = new StadiumAudioEngine();
