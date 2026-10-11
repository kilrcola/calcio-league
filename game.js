/**
 * game.js
 * CALCIO SERIE A 2026/27 — Game Logic
 * Depends on players.js (provides window.availablePlayers, window.serieAClubs, window.availableBadges)
 */

// ---------------------------------------------------------------------------
// Web Audio API Synthesizer & Chiptune Engine
// ---------------------------------------------------------------------------
const AudioFX = {
  ctx: null,
  musicInterval: null,
  isMusicPlaying: false,
  currentTrack: 0,

  tracks: {
    1: {
      name: "1",
      tempoMs: 140,
      melody: [
        261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 392.00,
        349.23, 440.00, 523.25, 659.25, 587.33, 523.25, 440.00, 392.00
      ],
      bass: [
        130.81, 130.81, 196.00, 196.00, 110.00, 110.00, 164.81, 164.81,
        87.31, 87.31, 130.81, 130.81, 98.00, 98.00, 146.83, 146.83
      ]
    },
    2: {
      name: "2",
      tempoMs: 145,
      bassPerStep: true,
      // Freestyler vibe: syncopated stabs with gaps (0 = rest). Am -> Am -> F -> G
      melody: [
        440.00, 0, 440.00, 523.25, 0, 440.00, 0, 659.25,
        587.33, 0, 587.33, 698.46, 0, 659.25, 523.25, 0
      ],
      bass: [
        110.00, 0, 220.00, 110.00, 110.00, 0, 220.00, 110.00,
        87.31, 0, 174.61, 87.31, 98.00, 0, 196.00, 98.00
      ]
    },
    3: {
      name: "3",
      tempoMs: 110,
      bassPerStep: true,
      // The hook: hammering B4 with little jumps, like the Sandstorm riff
      melody: [
        493.88, 493.88, 493.88, 493.88, 493.88, 493.88, 587.33, 493.88,
        493.88, 493.88, 493.88, 493.88, 659.25, 587.33, 493.88, 440.00
      ],
      // Bm -> G -> A
      bass: [
        123.47, 123.47, 123.47, 123.47, 123.47, 123.47, 123.47, 123.47,
        98.00, 98.00, 98.00, 98.00, 110.00, 110.00, 110.00, 110.00
      ]
    },
    4: {
      name: "4",
      tempoMs: 110,
      bassPerStep: true,
      // The build: rising arpeggio lead over a Bm -> Em -> G -> A progression
      melody: [
        493.88, 587.33, 739.99, 987.77, 880.00, 739.99, 659.25, 587.33,
        493.88, 587.33, 739.99, 880.00, 783.99, 659.25, 587.33, 493.88
      ],
      bass: [
        123.47, 123.47, 123.47, 123.47, 82.41, 82.41, 82.41, 82.41,
        98.00, 98.00, 98.00, 98.00, 110.00, 110.00, 110.00, 110.00
      ]
    },
    5: {
      name: "5",
      tempoMs: 105,
      bassPerStep: true,
      // Firestarter vibe: aggressive stuttering E riff (0 = rest), then a chromatic crawl down B -> Bb -> G -> F
      melody: [
        329.63, 329.63, 0, 329.63, 349.23, 329.63, 0, 392.00,
        329.63, 329.63, 0, 329.63, 493.88, 466.16, 392.00, 349.23
      ],
      bass: [
        164.81, 0, 164.81, 164.81, 164.81, 0, 164.81, 174.61,
        164.81, 0, 164.81, 164.81, 164.81, 0, 196.00, 174.61
      ]
    }
  },

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  playClick() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.05);
  },

  playGoalCheer() {
    this.init();
    const now = this.ctx.currentTime;
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    whistle.type = 'triangle';
    whistle.frequency.setValueAtTime(2600, now);
    whistleGain.gain.setValueAtTime(0.18, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    whistle.connect(whistleGain); whistleGain.connect(this.ctx.destination);
    whistle.start(now); whistle.stop(now + 0.22);

    const bufSize = this.ctx.sampleRate * 1.0;
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(1.2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.25);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(this.ctx.destination);
    noise.start(now); noise.stop(now + 1.0);
  },

  playWhistle() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.16].forEach(off => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(2400, now + off);
      g.gain.setValueAtTime(0.12, now + off);
      g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.13);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(now + off); o.stop(now + off + 0.14);
    });
  },

  playConcede() {
    this.init();
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(260, now);
    o.frequency.exponentialRampToValueAtTime(90, now + 0.45);
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(now); o.stop(now + 0.46);
  },

  playCard() {
    this.init();
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(880, now);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(now); o.stop(now + 0.13);
  },

  toggleMusic() {
    this.init();
    const order = [0, 1, 2, 3, 4, 5];
    const idx = order.indexOf(this.currentTrack);
    this.currentTrack = order[(idx + 1) % order.length];
    this.isMusicPlaying = this.currentTrack !== 0;

    this.updateMusicButtons();

    if (this.isMusicPlaying) {
      this.startChiptuneLoop();
    } else if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  },

  updateMusicButtons() {
    const btns = document.querySelectorAll(
      '#music-toggle-btn, #music-toggle-btn-2, #music-toggle-btn-3, #music-toggle-btn-4'
    );
    const label = this.currentTrack === 0
      ? "🎵 MUSIC: OFF"
      : `🎵 SONG ${this.currentTrack}/5`;
    btns.forEach(el => el.innerText = label);
  },

  startChiptuneLoop() {
    if (this.musicInterval) clearInterval(this.musicInterval);

    const track = this.tracks[this.currentTrack];
    if (!track) return;

    const { melody, bass, tempoMs } = track;
    const perStep = !!track.bassPerStep;
    let step = 0;

    this.musicInterval = setInterval(() => {
      if (!this.isMusicPlaying) return;
      const now = this.ctx.currentTime;

      const lead = melody[step % melody.length];
      if (lead > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(lead, now);
        leadGain.gain.setValueAtTime(0.035, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + 0.16);
      }

      let bassNote = 0;
      if (perStep) bassNote = bass[step % bass.length];
      else if (step % 2 === 0) bassNote = bass[Math.floor(step / 2) % bass.length];
      if (bassNote > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassNote, now);
        bassGain.gain.setValueAtTime(0.06, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, perStep ? 0.2 + now : now + 0.28);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + (perStep ? 0.2 : 0.28));
      }
      step++;
    }, tempoMs);
  }
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden && AudioFX.isMusicPlaying) {
    if (AudioFX.musicInterval) clearInterval(AudioFX.musicInterval);
	AudioFX.musicInterval = null;
  } else if (!document.hidden && AudioFX.isMusicPlaying) {
    AudioFX.startChiptuneLoop();
  }
});

// ---------------------------------------------------------------------------
// Keyboard shortcuts (Space = pause/resume)
// ---------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
  const simActive = document.getElementById('screen-sim') &&
                    document.getElementById('screen-sim').classList.contains('active');
  if (!simActive) return;

  if (e.code === 'Space') {
    e.preventDefault();
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.click();
  }
});

// ---------------------------------------------------------------------------
// Formation System
// ---------------------------------------------------------------------------
const FORMATIONS = {
  '4-3-3': {
    label: '4-3-3', desc: 'Balanced attacking',
    atk: 3, mid: 0, def: -3,
    slots: ['LW','ST','RW','CM1','CM2','CM3','LB','CB1','CB2','RB','GK'],
    rows: [['LW','ST','RW'],['CM1','CM2','CM3'],['LB','CB1','CB2','RB'],['GK']]
  },
  '4-4-2': {
    label: '4-4-2', desc: 'Traditional width',
    atk: 0, mid: 2, def: -2,
    slots: ['ST1','ST2','LW','RW','CM1','CM2','LB','CB1','CB2','RB','GK'],
    rows: [['ST1','ST2'],['LW','CM1','CM2','RW'],['LB','CB1','CB2','RB'],['GK']]
  },
  '3-5-2': {
    label: '3-5-2', desc: 'Midfield dominance',
    atk: 1, mid: 4, def: -4,
    slots: ['ST1','ST2','LW','RW','CM1','CM2','CM3','CB1','CB2','CB3','GK'],
    rows: [['ST1','ST2'],['LW','CM1','CM2','CM3','RW'],['CB1','CB2','CB3'],['GK']]
  },
  '5-3-2': {
    label: '5-3-2', desc: 'Defensive wall',
    atk: -4, mid: 0, def: 4,
    slots: ['ST1','ST2','CM1','CM2','CM3','LB','CB1','CB2','CB3','RB','GK'],
    rows: [['ST1','ST2'],['CM1','CM2','CM3'],['LB','CB1','CB2','CB3','RB'],['GK']]
  }
};

let currentFormation = '4-3-3';

function buildEmptySquad(formationKey) {
  const out = {};
  FORMATIONS[formationKey].slots.forEach(slot => out[slot] = null);
  return out;
}

// ---------------------------------------------------------------------------
// Game State
// ---------------------------------------------------------------------------
let squad = buildEmptySquad('4-3-3');

// ===========================================================================
// PLAYER TRAITS: each player may carry one trait that pays off in the right setup
// ===========================================================================
const AI_TRAIT_SCALE = 0.5;          // AI clubs get half-strength traits (they can't adapt like you)
const TRAIT_MOD_CAP = 3.5;           // max rating points traits can add to one line

const TRAITS = {
  poacher:   { id: 'poacher',   icon: '🎯', name: 'Poacher',          desc: '+2.5% finishing vs a high press, +1% otherwise',
               conv: (c, x) => x.oppPress === 'high' ? 0.025 : 0.010 },
  target:    { id: 'target',    icon: '💪', name: 'Target Man',       desc: '+2.5% finishing when you play Wide, +1% otherwise',
               conv: (c) => c.width === 'wide' ? 0.025 : 0.010 },
  pacey:     { id: 'pacey',     icon: '⚡', name: 'Pace Merchant',    desc: '+2% finishing when Attacking or pressing Low (counters), +1% otherwise',
               conv: (c) => (c.tactic === 'attacking' || c.press === 'low') ? 0.020 : 0.010 },
  clutch:    { id: 'clutch',    icon: '🧊', name: 'Clutch',           desc: '+3% finishing after minute 70 when level or behind',
               conv: (c, x) => (x.minute >= 70 && x.diff <= 0) ? 0.030 : 0 },
  spot:      { id: 'spot',      icon: '🥅', name: 'Penalty Ace',      desc: 'Takes your penalties; +10% to score them', pen: 0.10 },
  playmaker: { id: 'playmaker', icon: '🧠', name: 'Playmaker',        desc: '+1.5 MID when you play Narrow, +0.75 otherwise',
               mod: (c) => ({ mid: c.width === 'narrow' ? 1.5 : 0.75 }) },
  destroyer: { id: 'destroyer', icon: '🪓', name: 'Destroyer',        desc: '+1 MID +1 DEF when you press High, +0.5 DEF otherwise',
               mod: (c) => c.press === 'high' ? { mid: 1, def: 1 } : { def: 0.5 } },
  engine:    { id: 'engine',    icon: '🔋', name: 'Engine',           desc: '+1 MID, plus +1 ATK when you play Attacking',
               mod: (c) => ({ mid: 1, atk: c.tactic === 'attacking' ? 1 : 0 }) },
  ballcb:    { id: 'ballcb',    icon: '🎼', name: 'Ball-Playing CB',  desc: '+0.75 MID and +0.5 DEF from the back',
               mod: () => ({ mid: 0.75, def: 0.5 }) },
  stopper:   { id: 'stopper',   icon: '🪨', name: 'Stopper',          desc: '+1.5 DEF when Defensive or pressing Low, +0.5 otherwise',
               mod: (c) => (c.tactic === 'defensive' || c.press === 'low') ? { def: 1.5 } : { def: 0.5 } },
  overlap:   { id: 'overlap',   icon: '🏃', name: 'Overlapping Back', desc: '+1.2 ATK when Wide or Attacking (but -0.8 DEF when Attacking), +0.4 ATK otherwise',
               mod: (c) => (c.width === 'wide' || c.tactic === 'attacking') ? { atk: 1.2, def: c.tactic === 'attacking' ? -0.8 : 0 } : { atk: 0.4 } },
  twoway:    { id: 'twoway',    icon: '⚙️', name: 'Two-Way Back',     desc: '+0.5 ATK and +0.5 DEF, always',
               mod: () => ({ atk: 0.5, def: 0.5 }) },
  sweeper:   { id: 'sweeper',   icon: '🧹', name: 'Sweeper-Keeper',   desc: '+1.5 DEF when you press High, +0.5 MID otherwise',
               mod: (c) => c.press === 'high' ? { def: 1.5 } : { mid: 0.5 } },
  shotstop:  { id: 'shotstop',  icon: '🧤', name: 'Shot-Stopper',     desc: '+2 keeping when Defensive or pressing Low, +1 otherwise',
               mod: (c) => (c.tactic === 'defensive' || c.press === 'low') ? { gk: 2 } : { gk: 1 } }
};

const TRAIT_BY_POS = {
  ST: ['poacher', 'target', 'clutch', 'spot'],
  LW: ['pacey', 'clutch', 'pacey'],
  RW: ['pacey', 'clutch', 'pacey'],
  CM: ['playmaker', 'destroyer', 'engine'],
  CB: ['ballcb', 'stopper'],
  LB: ['overlap', 'twoway'],
  RB: ['overlap', 'twoway'],
  GK: ['sweeper', 'shotstop']
};

function hashId(id) {
  let h = (Math.imul((id | 0) + 12345, 2654435761)) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15;
  return h >>> 0;
}

function traitOf(p) {
  if (!p || !p.pos) return null;
  const list = TRAIT_BY_POS[p.pos];
  if (!list) return null;
  const h = hashId(p.id);
  const chance = p.ovr >= 80 ? 0.9 : (p.ovr >= 74 ? 0.65 : 0.35);
  if ((h % 1000) / 1000 >= chance) return null;
  return TRAITS[list[(h >>> 10) % list.length]];
}

function traitChip(p) {
  const t = traitOf(p);
  return t ? `<span class="trait-chip" title="${t.desc}">${t.icon} ${t.name}</span>` : '';
}

function userCtx() { return { press: currentPress, width: currentWidth, tactic: currentTactic }; }

function sideCtx(side) {
  if (side.isUser) return userCtx();
  const st = side.team && side.team.style;
  const c = { press: 'mid', width: 'normal', tactic: 'balanced' };
  if (st === 'pressing') c.press = 'high';
  else if (st === 'counter') c.press = 'low';
  else if (st === 'physical') c.width = 'wide';
  else if (st === 'possession') c.width = 'narrow';
  if (side.shift) { if (side.shift.atk > 0) c.tactic = 'attacking'; else if (side.shift.atk < 0) c.tactic = 'defensive'; }
  return c;
}

function traitMods(xi, opts) {
  const out = { atk: 0, mid: 0, def: 0, gk: 0 };
  const ctx = opts.ctx || (opts.isUser ? userCtx() : null);
  if (!ctx) return out;
  for (const [slot, p] of Object.entries(xi)) {
    if (!p) continue;
    if (baseOf(slot) !== p.pos) continue;                       // traits only work in the natural position
    if (opts.playOn && opts.playOn.has(p.id)) continue;
    const t = traitOf(p);
    if (!t || !t.mod) continue;
    const r = t.mod(ctx);
    for (const k in r) out[k] += r[k];
  }
  const sc = opts.isUser ? 1 : AI_TRAIT_SCALE;
  out.atk = clamp(out.atk, -TRAIT_MOD_CAP, TRAIT_MOD_CAP) * sc;
  out.mid = clamp(out.mid, -TRAIT_MOD_CAP, TRAIT_MOD_CAP) * sc;
  out.def = clamp(out.def, -TRAIT_MOD_CAP, TRAIT_MOD_CAP) * sc;
  out.gk  = clamp(out.gk, 0, 3) * sc;
  return out;
}

// finishing bonus for the player taking this shot
function traitConv(sh, atk, def, m, k) {
  const t = traitOf(sh.p);
  if (!t || !t.conv || baseOf(sh.slot) !== sh.p.pos) return 0;
  const x = { oppPress: sideCtx(def).press, minute: matchMinute(m), diff: m.score[k] - m.score[otherKey(k)] };
  return t.conv(sideCtx(atk), x) * (atk.isUser ? 1 : AI_TRAIT_SCALE);
}

function traitPenaltyBonus(cand, atk) {
  const t = traitOf(cand.p);
  if (!t || t.id !== 'spot' || baseOf(cand.slot) !== cand.p.pos) return 0;
  return t.pen * (atk.isUser ? 1 : AI_TRAIT_SCALE);
}

// ===========================================================================
// BOARD OBJECTIVES + BOARD TRUST (persistent budget bonus)
// ===========================================================================
let objectives = null;
const TRUST_PER_LEVEL = 4, TRUST_MAX_LEVEL = 4, TRUST_CAP_PER_LEVEL = 5;

function getTrustPoints() { try { return parseInt(localStorage.getItem('calcio_trust'), 10) || 0; } catch (e) { return 0; } }
function trustLevel() { return Math.min(TRUST_MAX_LEVEL, Math.floor(getTrustPoints() / TRUST_PER_LEVEL)); }
function trustCapBonus() { return trustLevel() * TRUST_CAP_PER_LEVEL; }
function trustLine() {
  const pts = getTrustPoints(), lv = trustLevel();
  const next = lv >= TRUST_MAX_LEVEL ? 'max level' : `${(lv + 1) * TRUST_PER_LEVEL - pts} pts to next level`;
  return `🏛 Board trust: ${'★'.repeat(lv)}${'☆'.repeat(TRUST_MAX_LEVEL - lv)} · +€${trustCapBonus()}M budget · ${pts} pts (${next})`;
}
function refreshTrustUI() {
  const el = document.getElementById('trust-line');
  if (el) el.innerText = trustLine();
}

const OBJ_POOL = [
  { id: 'goals',      icon: '⚽', label: n => `Score ${n} league goals`,                  n: 55, nFor: ex => Math.round(clamp(0.9 * (62 + (ex.avg - 76) * 7), 45, 85)), have: (u) => u.gf, kind: 'min' },
  { id: 'clean',      icon: '🧤', label: n => `Keep ${n} clean sheets`,                   n: 7,  have: () => seasonStats.cleanTotal || 0, kind: 'min' },
  { id: 'defence',    icon: '🧱', label: n => `Concede ${n} goals or fewer`,              n: 58, nFor: ex => clamp(Math.round(60 - (ex.defAvg - 74) * 2.5), 38, 66), have: (u) => u.ga, kind: 'max' },
  { id: 'derby',      icon: '🔥', label: n => `Win ${n === 1 ? 'a derby' : n + ' derbies'}`, n: 1,  have: () => seasonStats.derbyWins || 0, kind: 'min' },
  { id: 'big',        icon: '👑', label: n => `Beat ${n} top-5 clubs`,                    n: 3,  have: () => seasonStats.bigWins || 0, kind: 'min' },
  { id: 'away',       icon: '🚌', label: n => `Win ${n} away games`,                      n: 8,  have: () => seasonStats.awayWins || 0, kind: 'min' },
  { id: 'unbeaten',   icon: '🛡️', label: n => `Go ${n} matches unbeaten`,                 n: 9,  have: () => seasonStats.maxUnbeaten || 0, kind: 'min' },
  { id: 'streak',     icon: '📈', label: n => `Win ${n} in a row`,                        n: 5, nFor: ex => clamp(Math.round(3 + (ex.avg - 74) * 0.5), 3, 7), have: () => seasonStats.maxWin || 0, kind: 'min' },
  { id: 'discipline', icon: '🟥', label: n => `Finish with ${n} or fewer red cards`,      n: 3,  have: () => seasonStats.reds || 0, kind: 'max' },
  { id: 'captain',    icon: '©',  label: n => `Your captain scores ${n} goals`,           n: 12, nFor: ex => ex.capPos === 'ST' ? 18 : (ex.capPos === 'CM' ? 9 : 12), have: () => userSquadGoals[captainName()] || 0, kind: 'min', needs: 'captain' }
];

function teamStrength(t) { return (t.attack + t.midfield + t.defense) / 3; }

function expectedRankFromSquad() {
  const xi = Object.values(squad).filter(Boolean);
  const avg = xi.length ? xi.reduce((s, p) => s + p.ovr, 0) / xi.length : 76;
  const dl = xi.filter(p => ['CB', 'LB', 'RB', 'GK'].includes(p.pos));
  const defAvg = dl.length ? dl.reduce((s, p) => s + p.ovr, 0) / dl.length : 74;
  const cp = xi.find(p => p.id === captainId);
  return { avg, defAvg, capPos: cp ? cp.pos : null, rank: clamp(Math.round(11 - (avg - 76) * 1.3), 2, 16) };
}

function makeObjectives(userTeam, aiTeams) {
  const all = [userTeam, ...aiTeams].sort((a, b) => teamStrength(b) - teamStrength(a));
  const ex = expectedRankFromSquad();
  const predicted = ex.rank;
  const target = clamp(predicted - 1, 1, 14);
  const bigClubs = all.filter(t => !t.isUser).slice(0, 5).map(t => t.name);
  const capPlayer = Object.values(squad).find(p => p && p.id === captainId);
  const capOk = capPlayer && ['ST', 'LW', 'RW', 'CM'].includes(capPlayer.pos);
  const pool = OBJ_POOL.filter(o => o.needs !== 'captain' || capOk);
  const extras = [];
  while (extras.length < 3 && pool.length) {
    const o = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    extras.push({ id: o.id, n: o.nFor ? o.nFor(ex) : o.n });
  }
  objectives = { predicted, target, bigClubs, extras, awarded: false, announced: {} };
}

function boardTargetLabel(t) {
  if (t === 1) return 'Win the Scudetto';
  if (t === 2) return 'Finish in the top 2';
  if (t <= 4) return `Finish in the top ${t} (Champions League)`;
  if (t <= 6) return `Finish in the top ${t} (Europe)`;
  return `Finish in the top ${t}`;
}

function currentUserRow() { return leagueTeams.find(t => t.isUser); }
function currentUserRank() {
  const sorted = [...leagueTeams].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  return sorted.findIndex(t => t.isUser) + 1;
}

// returns [{icon,text,have,need,kind,done,failed,onTrack,id}] ; first entry is the board's main target
function objectiveStatus(final) {
  if (!objectives) return [];
  const u = currentUserRow();
  if (!u) return [];
  const played = u.p || 0, frac = played / 38;
  const rank = currentUserRank();
  const out = [];
  out.push({
    id: 'board', icon: '🏛', text: boardTargetLabel(objectives.target), main: true,
    have: `#${rank}`, need: `#${objectives.target}`,
    done: final ? rank <= objectives.target : false,
    failed: final ? rank > objectives.target : false,
    onTrack: rank <= objectives.target + (final ? 0 : 2),
    pending: !final
  });
  for (const ex of objectives.extras) {
    const def = OBJ_POOL.find(o => o.id === ex.id);
    if (!def) continue;
    const have = def.have(u);
    let done, failed, onTrack;
    if (def.kind === 'min') {
      done = have >= ex.n; failed = final && !done; onTrack = done || have >= Math.floor(ex.n * frac * 0.9);
    } else {
      failed = have > ex.n; done = final && !failed; onTrack = !failed && have <= ex.n * Math.max(frac, 0.15) + 1;
    }
    out.push({ id: ex.id, icon: def.icon, text: def.label(ex.n), have, need: ex.n, kind: def.kind, done, failed, onTrack });
  }
  return out;
}

function objectiveRowHtml(o, final) {
  let mark = '⏳', cls = '';
  if (o.main) {
    if (final) { mark = o.done ? '✅' : '❌'; cls = o.done ? 'rc-ok' : 'rc-bad'; }
    else { mark = o.onTrack ? '🟢' : '🟠'; }
  } else {
    if (o.done && o.kind === 'min') { mark = '✅'; cls = 'rc-ok'; }
    else if (o.failed) { mark = '❌'; cls = 'rc-bad'; }
    else if (final && o.done) { mark = '✅'; cls = 'rc-ok'; }
    else mark = o.onTrack ? '🟢' : '🟠';
  }
  const prog = o.main ? `now ${o.have}` : (o.kind === 'max' ? `${o.have} / max ${o.need}` : `${o.have} / ${o.need}`);
  return `<div class="player-card ${cls}" style="padding:8px 10px;"><div class="player-info"><div class="player-ovr-badge" style="min-width:34px;">${o.icon}</div><div class="player-meta"><span class="name">${mark} ${o.text}${o.main ? ' <span style="color:var(--text-muted);font-weight:600;">(+2 trust)</span>' : ' <span style="color:var(--text-muted);font-weight:600;">(+1 trust)</span>'}</span><span class="club-pos">${prog}</span></div></div></div>`;
}

function openObjectives() {
  AudioFX.playClick();
  if (!objectives) { showToast('No season in progress'); return; }
  const st = objectiveStatus(false);
  const body = `<div class="ht-subs-remaining">Hit the targets to earn Board Trust. More trust = bigger transfer budget next time you draft.</div>` +
    st.map(o => objectiveRowHtml(o, false)).join('') +
    `<div class="picker-hint" style="margin-top:8px;">${trustLine()}</div>`;
  openOverlay('obj-modal', '🎯 Board Objectives', body);
}

function openBoardIntro() {
  if (!objectives) { runAutoSimLoop(); return; }
  AudioFX.playClick && AudioFX.playClick();
  const st = objectiveStatus(false);
  const body = `<div class="ht-subs-remaining">The board expects a lot. They had you tipped for #${objectives.predicted} on squad strength.</div>` +
    st.map(o => objectiveRowHtml(o, false)).join('') +
    `<div class="picker-hint" style="margin:8px 0;">${trustLine()}</div>` +
    `<button class="btn-select" style="width:100%;margin-top:6px;padding:12px;font-size:0.9rem;" onclick="closeBoardIntro()">KICK OFF SEASON ▶</button>`;
  closeOverlay('board-intro');
  openOverlay('board-intro', '🏛 Board Meeting', body);
  // hide the close X: the player must press the kick-off button so the sim doesn't start behind the popup
  const x = document.querySelector('#board-intro .close-modal');
  if (x) x.style.display = 'none';
}
function closeBoardIntro() {
  closeOverlay('board-intro');
  if (!isSimPaused) runAutoSimLoop();
  maybeStartTour();
}

function checkObjectiveToasts() {
  if (!objectives) return;
  const st = objectiveStatus(false);
  for (const o of st) {
    if (o.main) continue;
    if (o.kind === 'min' && o.done && !objectives.announced[o.id]) {
      objectives.announced[o.id] = true;
      showToast(`🎯 Objective complete: ${o.text} (+1 trust)`);
    }
  }
}

function objectiveReportRow() {
  if (!objectives) return '';
  const u0 = currentUserRow();
  if (u0 && u0.p < 6) return `<div>🎯 <b>Board:</b> targets set — tap 🎯 BOARD to review them</div>`;
  const st = objectiveStatus(false);
  const good = st.filter(o => o.main ? o.onTrack : (o.done || o.onTrack) && !o.failed).length;
  const failed = st.filter(o => !o.main && o.failed).length;
  return `<div>🎯 <b>Board:</b> ${good} of ${st.length} on track${failed ? `, ${failed} failed` : ''} · tap 🎯 BOARD for detail</div>`;
}

// awards trust once, returns html block for the season summary
function finalizeObjectives() {
  if (!objectives) return '';
  const st = objectiveStatus(true);
  const rank = currentUserRank();
  let pts = 0;
  const lines = st.map(o => {
    const ok = o.main ? o.done : (o.done && !o.failed);
    if (ok) pts += o.main ? 2 : 1;
    return `<div class="summary-row"><div class="summary-cell"><span class="cell-val" style="font-size:0.78rem;">${ok ? '✅' : '❌'} ${o.text}</span></div></div>`;
  }).join('');
  let bonus = '';
  if (rank <= objectives.target - 3) { pts += 1; bonus = `<div class="summary-row"><div class="summary-cell"><span class="cell-val" style="font-size:0.78rem;">⭐ Overachiever bonus +1</span></div></div>`; }
  let tail = '';
  if (!objectives.awarded) {
    const beforeLv = trustLevel();
    try { localStorage.setItem('calcio_trust', String(getTrustPoints() + pts)); } catch (e) {}
    objectives.awarded = true;
    objectives.awardedPts = pts;
    refreshCapFromTrust();
    const afterLv = trustLevel();
    if (afterLv > beforeLv) unlockAchievementSafe('board_favourite');
    tail = `<div class="summary-row"><div class="summary-cell"><span class="cell-val" style="color:var(--accent-gold);">+${pts} Board Trust${afterLv > beforeLv ? ' · LEVEL UP!' : ''}</span></div></div>`;
  } else {
    tail = `<div class="summary-row"><div class="summary-cell"><span class="cell-val" style="color:var(--accent-gold);">+${objectives.awardedPts || 0} Board Trust</span></div></div>`;
  }
  return `<div class="summary-row" style="border-top:1px solid #1e293b; padding-top:8px; margin-top:4px;"><div class="summary-cell"><span class="cell-lbl">🎯 BOARD OBJECTIVES</span></div></div>${lines}${bonus}${tail}
    <div class="summary-row"><div class="summary-cell"><span class="cell-lbl">${trustLine()}</span></div></div>`;
}

function unlockAchievementSafe(id) { try { unlockAchievement(id); } catch (e) {} }

function refreshCapFromTrust() {
  MAX_CAP = (CHALLENGES[challengeMode].cap || 500) + trustCapBonus();
  refreshTrustUI();
}

let MAX_CAP = 500;
let activeSlotKey = null;
let currentTactic = 'balanced';

const BENCH_SIZE = 3;
let bench = new Array(BENCH_SIZE).fill(null);
let activeBenchIdx = null;

let userClub = { name: "Campobasso Calcio", badge: "🦁" };

let leagueTeams = [];
let fixtures = [];
let currentRoundIdx = 0;

let simInterval = null;
let isSimPaused = false;

// Updated to 2 cleaner presets (5s and 15s)
let currentPaceIdx = 1;   // 0 Fast, 1 Normal, 2 Slow
const paceOptions = [
  { label: "FAST: 5s ⚡",     ms: 5000 },
  { label: "NORMAL: 9s ▶️",   ms: 9000 },
  { label: "SLOW: 15s ⏱️",   ms: 15000 }
];
const paceShortLabels = ["Fast ⚡", "Normal ▶️", "Slow ⏱️"];

let userSquadGoals = {};
let userMatchGoals = {};
let latestShareData = {};

let countdownRAF = null;
let revealTimers = [];
let isRevealing = false;


// ---------------------------------------------------------------------------
// Form Rating Constants
// ---------------------------------------------------------------------------
const FORM_WINDOW = 5;
const RATING_BASE = 6.5;
const FORM_MODIFIER_RANGE = 3.0;
const FORM_SLOPE = 1.5;

function ensureFormData(player) {
  if (!player) return player;
  if (!Array.isArray(player.formHistory)) player.formHistory = [];
  return player;
}


function getPlayerForm(player) {
  if (!player || !Array.isArray(player.formHistory) || player.formHistory.length === 0) return null;
  const recent = player.formHistory.slice(-FORM_WINDOW);
  const sum = recent.reduce((a, b) => a + b, 0);
  return sum / recent.length;
}

function getFormModifier(player) {
  const avg = getPlayerForm(player);
  if (avg === null) return 0;
  const raw = (avg - RATING_BASE) * FORM_SLOPE;
  return Math.max(-FORM_MODIFIER_RANGE, Math.min(FORM_MODIFIER_RANGE, raw));
}

function effectiveOvr(player) {
  if (!player) return 0;
  return (player.ovr || 0) + getFormModifier(player);
}

function getFormBadge(player) {
  const avg = getPlayerForm(player);
  if (avg === null) return '⬜';
  if (avg >= 8.0) return '🟩🟩';
  if (avg >= 7.2) return '🟩';
  if (avg >= 6.4) return '⬜';
  if (avg >= 5.6) return '🟥';
  return '🟥🟥';
}



// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  renderPitchForFormation();
  renderBenchBar();
  updateFormationButtons();
  loadChallenge();
  updateStyleButtons();
  checkSavedGame();
});

// ---------------------------------------------------------------------------
// Save / Resume
// ---------------------------------------------------------------------------
function checkSavedGame() {
  const resumeBtn = document.getElementById('resume-save-btn');
  try {
    const raw = localStorage.getItem('calcio_active_campaign');
    if (!raw) {
      if (resumeBtn) resumeBtn.style.display = 'none';
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.leagueTeams || !Array.isArray(parsed.leagueTeams) || parsed.leagueTeams.length !== 20 || !parsed.squad) {
      localStorage.removeItem('calcio_active_campaign');
      if (resumeBtn) resumeBtn.style.display = 'none';
      return;
    }
    if (resumeBtn) resumeBtn.style.display = 'block';
  } catch(e) {
    try { localStorage.removeItem('calcio_active_campaign'); } catch(_) {}
    if (resumeBtn) resumeBtn.style.display = 'none';
  }
}

function saveActiveCampaignState() {
  try {
    const state = {
      squad: Object.fromEntries(Object.entries(squad).map(([k, v]) => [k, v ? { ...v } : null])),
      bench: bench.map(p => p ? { ...p } : null),
      userClub: { ...userClub },
      leagueTeams: leagueTeams.map(t => ({ ...t })),
      currentRoundIdx,
      userSquadGoals: { ...userSquadGoals },
      currentTactic,
      currentFormation,
      harmonyBonus: window.__lastHarmonyBonus || 1.0,
      paceIdx: currentPaceIdx,
      userMotm: { ...userMotm },
      captainId, press: currentPress, width: currentWidth, challengeMode,
      seasonStats: { ...seasonStats }, userRivalName, objectives
    };
    localStorage.setItem('calcio_active_campaign', JSON.stringify(state));
  } catch(e) {}
}

function resumeActiveCampaign() {
  awaitingContinue = false;
  try {
    const saved = JSON.parse(localStorage.getItem('calcio_active_campaign'));
    if (!saved) return;
    squad = saved.squad;
    bench = (saved.bench || new Array(BENCH_SIZE).fill(null)).map(p => p ? { ...p } : null);
    userClub = saved.userClub;
    leagueTeams = saved.leagueTeams;
    currentRoundIdx = saved.currentRoundIdx;
    userSquadGoals = saved.userSquadGoals;
    userMotm = saved.userMotm || {};
    setChallenge(saved.challengeMode || 'standard');
    captainId = saved.captainId || null;
    currentPress = saved.press || 'mid';
    currentWidth = saved.width || 'normal';
    seasonStats = Object.assign(newSeasonStats(), saved.seasonStats || {});
    objectives = saved.objectives || null;
    userRivalName = saved.userRivalName || null;
    cup = null; pendingEurope = null; prematchRound = -1;
    leagueTeams.forEach(ensureAiXI);
    liveMatch = null;
    pendingFormation = null;
    currentTactic = saved.currentTactic || 'balanced';
    currentFormation = saved.currentFormation || '4-3-3';
    window.__lastHarmonyBonus = saved.harmonyBonus || 1.0;
    if (typeof saved.paceIdx === 'number' && saved.paceIdx < paceOptions.length) currentPaceIdx = saved.paceIdx;

    renderPitchForFormation();
    updateFormationButtons();
    generateDoubleRoundRobin();

    document.getElementById('screen-start').classList.remove('active');
    document.getElementById('screen-sim').classList.add('active');

    document.querySelectorAll('#screen-sim .tactic-btn').forEach(b => b.classList.remove('active'));
    const simTacticBtn = document.getElementById(`sim-tactic-${currentTactic}`);
    if (simTacticBtn) simTacticBtn.classList.add('active');

    document.getElementById('sim-title').innerText = `MATCHDAY ${currentRoundIdx + 1} / 38`;
    document.getElementById('sim-progress-fill').style.width = `${Math.round((currentRoundIdx / 38) * 100)}%`;
    updateStandingsTable();
    updateSimBenchStrip();

    syncPaceLabels();
    resetPauseButton();
    updateStyleButtons();
    applyIronUI();
    showCupBox(false);
    updateSubsButton();
    runAutoSimLoop();
  } catch(e) {
    alert("Could not load saved campaign.");
  }
}

// ---------------------------------------------------------------------------
// Screen Transitions
// ---------------------------------------------------------------------------
function goToDraftScreen() {
  AudioFX.playClick();
  try {
    if (localStorage.getItem('calcio_active_campaign')) {
      if (!confirm("An active saved campaign already exists. Starting a new game will overwrite your save. Continue?")) {
        return;
      }
      localStorage.removeItem('calcio_active_campaign');
    }
  } catch(e) {}

  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-draft').classList.add('active');
  renderPitchForFormation();
  updateFormationButtons();
  updateDraftUI();
}

function toggleBackgroundMusic() {
  AudioFX.toggleMusic();
}

// ---------------------------------------------------------------------------
// Formation Rendering
// ---------------------------------------------------------------------------
function renderPitchForFormation() {
  const pitch = document.getElementById('pitch');
  if (!pitch) return;
  const formation = FORMATIONS[currentFormation];

  let html = '';
  formation.rows.forEach(row => {
    html += '<div class="pitch-row">';
    row.forEach(slotKey => {
      const basePos = slotKey.replace(/[0-9]/g, '');
      html += `
        <div class="slot" data-pos="${slotKey}" onclick="handleSlotClick('${slotKey}')">
          <span id="pos-${slotKey}" class="pos-label">${basePos}</span>
          <span id="slot-${slotKey}" class="slot-text">Pick</span>
        </div>
      `;
    });
    html += '</div>';
  });
  pitch.innerHTML = html;
}

function renderBenchBar() {
  const container = document.getElementById('bench-slots');
  if (!container) return;

  let html = '';
  for (let i = 0; i < BENCH_SIZE; i++) {
    const player = bench[i];
    if (player) {
      const basePos = player.pos;
      const badge = getFormBadge(player);
      html += `
        <div class="bench-slot filled" onclick="handleBenchSlotClick(${i})">
          <span class="bs-pos">${badge} ${basePos}</span>
          <span class="bs-name">${player.name}</span>
        </div>
      `;
    } else {
      html += `
        <div class="bench-slot" onclick="handleBenchSlotClick(${i})">
          <span class="bs-name">Empty</span>
          <span class="bs-pos">Tap</span>
        </div>
      `;
    }
  }
  container.innerHTML = html;
}


function remapSquadToFormation(oldSquad, newKey, allowOutOfPosition) {
  const ns = buildEmptySquad(newKey);
  const slots = FORMATIONS[newKey].slots;
  const placed = new Set();
  for (const s of slots) {
    const p = oldSquad[s];
    if (p && !placed.has(p.id)) { ns[s] = p; placed.add(p.id); }
  }
  for (const s of slots) {
    if (ns[s]) continue;
    const b = baseOf(s);
    const cand = Object.values(oldSquad).find(p => p && !placed.has(p.id) && p.pos === b);
    if (cand) { ns[s] = cand; placed.add(cand.id); }
  }
  const left = Object.values(oldSquad).filter(p => p && !placed.has(p.id));
  if (allowOutOfPosition) {
    for (const s of slots) {
      if (ns[s] || !left.length) continue;
      const b = baseOf(s);
      left.sort((x, y) => fitPenalty(x.pos, b) - fitPenalty(y.pos, b) || y.ovr - x.ovr);
      ns[s] = left.shift();
    }
  } else {
    // Draft: anyone who no longer fits goes to a free bench slot (otherwise returns to the pool)
    for (const p of left) {
      const free = bench.findIndex(x => !x);
      if (free >= 0) bench[free] = p;
    }
  }
  return ns;
}

function applyFormation(formationKey) {
  const simActive = document.getElementById('screen-sim').classList.contains('active');
  currentFormation = formationKey;
  squad = remapSquadToFormation(squad, formationKey, simActive);
  renderPitchForFormation();
  updateFormationButtons();
  updateDraftUI();
  if (simActive) {
    recalcUserTeamWithFormation();
    saveActiveCampaignState();
  }
}

function applyPendingFormation() {
  if (pendingFormation && FORMATIONS[pendingFormation] && pendingFormation !== currentFormation) {
    const key = pendingFormation;
    pendingFormation = null;
    applyFormation(key);
    addLogLine(`📋 Formation changed to ${key}`, 'log-line log-info');
  }
  pendingFormation = null;
}

function setFormation(formationKey) {
  if (!FORMATIONS[formationKey]) return;
  const simActive = document.getElementById('screen-sim').classList.contains('active');
  if (simActive && pendingFormation === null && formationKey === currentFormation) return;
  if (!simActive && formationKey === currentFormation) return;

  AudioFX.playClick();

  if (simActive) {
    if (ironLocked()) { ironToast(); return; }
    if (!confirm("Change formation? Players keep their spot where they can; others may play out of position.")) return;
    if (liveMatch) {
      pendingFormation = formationKey;
      addLogLine(`📋 ${formationKey} queued — it takes effect at full time`, 'log-line log-info');
      document.querySelectorAll('#screen-sim .formation-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.formation === formationKey);
      });
      return;
    }
  }
  applyFormation(formationKey);
}

function updateFormationButtons() {
  document.querySelectorAll('#screen-draft .formation-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.formation === currentFormation);
  });
  document.querySelectorAll('#screen-sim .formation-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.formation === currentFormation);
  });
}



// ---------------------------------------------------------------------------
// Tactics
// ---------------------------------------------------------------------------
function setTactics(tactic) {
  AudioFX.playClick();
  currentTactic = tactic;
  document.querySelectorAll('#screen-draft .tactic-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`tactic-${tactic}`);
  if (btn) btn.classList.add('active');

  const hints = {
    attacking: "⚡ Attacking: +4 ATK / -4 DEF bonus swing",
    balanced: "⚖️ Balanced: Standard performance modifiers (+0 ATK / +0 DEF)",
    defensive: "🛡️ Defensive: -4 ATK / +4 DEF solid block"
  };
  document.getElementById('tactic-hint-label').innerText = hints[tactic];
}

function setSimTactics(tactic) {
  if (ironLocked()) { ironToast(); return; }
  AudioFX.playClick();
  currentTactic = tactic;
  document.querySelectorAll('#screen-sim .tactic-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`sim-tactic-${tactic}`);
  if (btn) btn.classList.add('active');

  recalcUserTeamWithFormation();
  if (liveMatch && liveMatch.userKey) liveMatch.sides[liveMatch.userKey].dirty = true;
  saveActiveCampaignState();
}

// ---------------------------------------------------------------------------
// Club Identity
// ---------------------------------------------------------------------------
function renderBadgePicker() {
  const grid = document.getElementById('badge-picker-grid');
  grid.innerHTML = '';
  availableBadges.forEach(b => {
    const btn = document.createElement('button');
    btn.className = `emoji-btn ${b === userClub.badge ? 'selected' : ''}`;
    btn.innerText = b;
    btn.onclick = () => {
      AudioFX.playClick();
      userClub.badge = b;
      document.querySelectorAll('.emoji-btn').forEach(el => el.classList.remove('selected'));
      btn.classList.add('selected');
    };
    grid.appendChild(btn);
  });
}

const CITY_PREFIXES = [
  "Campobasso", "Benevento", "Avellino", "Salerno", "Foggia", "Bari",
  "Taranto", "Lecce", "Brindisi", "Crotone", "Catanzaro", "Reggio",
  "Potenza", "Matera", "Andria", "Barletta", "Trani", "Molfetta",
  "Monopoli", "Fasano", "Ostuni", "Gallipoli", "Nardò", "Maglie"
];

const CLUB_SUFFIXES = [
  "Calcio", "FC", "United", "Sporting", "Athletic", "Rovers", "Town",
  "City", "Wanderers", "Rangers", "Albion", "County", "Celtic",
  "Union", "Dynamo", "Inter", "Real", "Atlético", "Maritime",
  "Sportiva", "Virtus", "Fortitudo", "Olympia", "Pegasus"
];

const NAME_STYLES = [
  (c, s) => `${c} ${s}`,
  (c, s) => `${s} ${c}`,
  (c, s) => `${c} ${s} FC`,
  (c, s) => `AS ${c}`,
  (c, s) => `AC ${c}`,
  (c, s) => `SV ${c}`,
  (c, s) => `SC ${c} ${s}`,
  (c, s) => `${c} ${s} 1908`,
  (c, s) => `${c} Calcio ${Math.floor(Math.random() * 30) + 1900}`,
];

function generateClubName() {
  const city = CITY_PREFIXES[Math.floor(Math.random() * CITY_PREFIXES.length)];
  const suffix = CLUB_SUFFIXES[Math.floor(Math.random() * CLUB_SUFFIXES.length)];
  const style = NAME_STYLES[Math.floor(Math.random() * NAME_STYLES.length)];
  let name = style(city, suffix);
  if (name.length > 20) name = name.slice(0, 20).trim();
  return name;
}

function randomizeClubName() {
  AudioFX.playClick();
  const input = document.getElementById('custom-club-name');
  if (!input) return;
  input.value = generateClubName();
  input.style.transition = 'background 0.2s';
  input.style.background = 'rgba(56, 189, 248, 0.15)';
  setTimeout(() => input.style.background = '', 250);

  const randomBadge = availableBadges[Math.floor(Math.random() * availableBadges.length)];
  userClub.badge = randomBadge;
  renderBadgePicker();
}

function openIdentityModal() {
  AudioFX.playClick();
  const filledCount = Object.values(squad).filter(Boolean).length;
  const totalValue = Object.values(squad).filter(Boolean).reduce((acc, p) => acc + p.value, 0);

  if (filledCount < 11) {
    alert("Please fill all 11 starting positions before finalizing your club!");
    return;
  }
  if (totalValue > MAX_CAP) {
    alert("Squad transfer value exceeds the €500M budget cap!");
    return;
  }

  document.getElementById('custom-club-name').value = userClub.name;
  renderBadgePicker();
  document.getElementById('identity-modal').classList.add('active');
}

function closeIdentityModal() {
  AudioFX.playClick();
  document.getElementById('identity-modal').classList.remove('active');
}

function confirmIdentityAndPlay() {
  AudioFX.playClick();
  const filledCount = Object.values(squad).filter(Boolean).length;
  const totalValue = Object.values(squad).filter(Boolean).reduce((acc, p) => acc + p.value, 0);
  if (filledCount < 11 || totalValue > MAX_CAP) {
    closeIdentityModal();
    alert("Squad is no longer valid. Please re-check your draft.");
    return;
  }
  const nameInput = document.getElementById('custom-club-name').value.trim();
  if (nameInput) userClub.name = nameInput;
  closeIdentityModal();
  startSeason();
}

// ---------------------------------------------------------------------------
// Draft / Player Picker
// ---------------------------------------------------------------------------





// Drafted players are copies with a fresh form history, so form never leaks between seasons.
function draftClone(p) {
  return { ...p, formHistory: [] };
}

function clearSquad() {
  AudioFX.playClick();
  const filledXI = Object.values(squad).filter(Boolean).length;
  const filledBench = bench.filter(Boolean).length;
  const filled = filledXI + filledBench;
  if (filled === 0) return;
  if (filled >= 5 && !confirm(`Clear all ${filled} players (XI + bench)?`)) return;

  squad = buildEmptySquad(currentFormation);
  bench = new Array(BENCH_SIZE).fill(null);
  renderPitchForFormation();
  updateDraftUI();
}

function autoFillSquad() {
  AudioFX.playClick();

  const formation = FORMATIONS[currentFormation];
  const slots = formation.slots;
  const slotPos = {};
  slots.forEach(s => { slotPos[s] = s.replace(/[0-9]/g, ''); });

  let bestSquad = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = buildCandidateSquad(slots, slotPos, attempt);
    if (!candidate) continue;

    const { penalty } = scoreFriction(candidate);
    const total = Object.values(candidate).reduce((s, p) => s + p.value, 0);

    const avgOvr = Object.values(candidate).reduce((s, p) => s + p.ovr, 0) / slots.length;
    const effectiveAvg = avgOvr * penalty;
    const budgetPenalty = Math.max(0, total - MAX_CAP) * 0.5;
    const score = effectiveAvg - budgetPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestSquad = candidate;
    }

    if (penalty === 1.0 && total <= MAX_CAP) {
      bestSquad = candidate;
      bestScore = score;
      break;
    }
  }

  if (!bestSquad) {
    bestSquad = {};
    const usedIds = new Set();
    for (const slot of slots) {
      const pos = slotPos[slot];
      const pick = availablePlayers.filter(p => p.pos === pos && !usedIds.has(p.id) && !challengeBlockReason(p, Object.values(bestSquad))).sort((a, b) => a.value - b.value)[0];
      if (pick) { bestSquad[slot] = pick; usedIds.add(pick.id); }
    }
  }

  squad = buildEmptySquad(currentFormation);
  for (const [slot, p] of Object.entries(bestSquad)) squad[slot] = draftClone(p);

  bench = new Array(BENCH_SIZE).fill(null);
  const usedIds = new Set();
  for (const p of Object.values(squad)) if (p) usedIds.add(p.id);

  let runningTotal = Object.values(squad).filter(Boolean).reduce((s, p) => s + p.value, 0);
  const benchPool = availablePlayers.filter(p => !usedIds.has(p.id)).sort((a, b) => b.ovr - a.ovr);
  const benchSoFar = () => [...Object.values(squad).filter(Boolean), ...bench.filter(Boolean)];

  for (let i = 0; i < BENCH_SIZE; i++) {
    const budgetPerSlot = (MAX_CAP - runningTotal) / (BENCH_SIZE - i);
    const pick = benchPool.find(p => p.value <= budgetPerSlot && !usedIds.has(p.id) && !challengeBlockReason(p, benchSoFar()));
    if (!pick) break;
    bench[i] = draftClone(pick);
    usedIds.add(pick.id);
    runningTotal += pick.value;
  }

  updateDraftUI();
}

function buildCandidateSquad(slots, slotPos, attemptSeed) {
  const anchorPool = ["Inter", "AC Milan", "Juventus", "Napoli", "Atalanta",
                      "Roma", "Lazio", "Fiorentina", "Bologna", "Torino"];
  const anchorClub = attemptSeed < 5 ? anchorPool[Math.floor(Math.random() * anchorPool.length)] : null;

  const rivalOf = {
    "Juventus": ["Inter", "Torino"],
    "Inter": ["Juventus"],
    "Torino": ["Juventus"],
    "Roma": ["Lazio"],
    "Lazio": ["Roma"]
  };

  const pool = [...availablePlayers];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const picked = {};
  const usedIds = new Set();
  const usedClubs = new Set();
  let total = 0;

  for (const slot of slots) {
    const pos = slotPos[slot];
    let candidates = pool.filter(p => p.pos === pos && !usedIds.has(p.id) && !challengeBlockReason(p, Object.values(picked)));
    if (candidates.length === 0) return null;

    let ordered = candidates;
    if (anchorClub) {
      const anchorCount = Object.values(picked).filter(p => p.club === anchorClub).length;
      if (anchorCount < 3) {
        ordered = [
          ...candidates.filter(p => p.club === anchorClub),
          ...candidates.filter(p => p.club !== anchorClub)
        ];
      }
    }

    const clean = ordered.filter(p => {
      const rivals = rivalOf[p.club] || [];
      return !rivals.some(r => usedClubs.has(r));
    });

    const finalList = clean.length > 0 ? clean : ordered;
    const choice = finalList[0];
    if (!choice) return null;

    picked[slot] = choice;
    usedIds.add(choice.id);
    usedClubs.add(choice.club);
    total += choice.value;
  }

  if (total > MAX_CAP) {
    const swapOrder = slots.filter(s => slotPos[s] !== 'GK')
      .map(s => ({ slot: s, pos: slotPos[s], value: picked[s].value }))
      .sort((a, b) => b.value - a.value);

    for (const cand of swapOrder) {
      if (total <= MAX_CAP) break;
      const current = picked[cand.slot];
      const cheaper = availablePlayers.filter(p => p.pos === cand.pos && !usedIds.has(p.id) && p.value < current.value && !challengeBlockReason(p, Object.values(picked).filter(x => x !== current)))
        .sort((a, b) => a.value - b.value)[0];
      if (!cheaper) continue;

      total += cheaper.value - current.value;
      usedIds.delete(current.id);
      usedIds.add(cheaper.id);
      picked[cand.slot] = cheaper;
    }
  }

  return total <= MAX_CAP ? picked : null;
}

function scoreFriction(squadCandidate) {
  const players = Object.values(squadCandidate).filter(Boolean);
  if (players.length === 0) return { penalty: 1.0, reasons: [] };

  const clubCounts = {};
  for (const p of players) clubCounts[p.club] = (clubCounts[p.club] || 0) + 1;

  const clubs = players.map(p => p.club);
  const hasJuve = clubs.includes("Juventus");
  const hasInter = clubs.includes("Inter");
  const hasTorino = clubs.includes("Torino");
  const hasRoma = clubs.includes("Roma");
  const hasLazio = clubs.includes("Lazio");

  const reasons = [];
  if (hasJuve && hasInter)  reasons.push("Juve+Inter");
  if (hasJuve && hasTorino) reasons.push("Juve+Torino");
  if (hasRoma && hasLazio)  reasons.push("Roma+Lazio");

  for (const [club, count] of Object.entries(clubCounts)) {
    if (count >= 4) reasons.push(`${club}x${count}`);
  }

  return { penalty: reasons.length > 0 ? 0.88 : 1.0, reasons };
}

function updateChemistry() {
  const clubCounts = {};
  for (const [slotKey, player] of Object.entries(squad)) {
    if (!player) continue;
    clubCounts[player.club] = (clubCounts[player.club] || 0) + 1;
  }

  let totalBonus = 0;
  let badgeHtml = '';

  for (const [club, count] of Object.entries(clubCounts)) {
    let bonus = 0;
    if (count >= 5) bonus = 7;
    else if (count >= 4) bonus = 5;
    else if (count >= 3) bonus = 3;
    if (bonus > 0) {
      totalBonus += bonus;
      badgeHtml += `<span class="badge-pill">🛡️ ${club} x${count} (+${bonus}%)</span>`;
    }
  }

  const container = document.getElementById('chemistry-badges');
  if (container) {
    container.innerHTML = badgeHtml === '' ? `<span style="color:var(--text-muted); font-size: 0.65rem;">Stack 3+ same club for a bonus</span>` : badgeHtml;
  }

  window.__lastChemistryBonus = totalBonus / 100;
  return totalBonus;
}

function calculateEfficiencyBonus() {
  const totalValue = Object.values(squad).filter(Boolean).reduce((sum, p) => sum + p.value, 0)
                   + bench.filter(Boolean).reduce((sum, p) => sum + p.value, 0);
  const savings = Math.max(0, MAX_CAP - totalValue);
  const savingsPct = savings / MAX_CAP;
  const bonus = Math.min(0.08, savingsPct * 0.15);
  window.__lastEfficiencyBonus = bonus;
  return bonus;
}

function updateDraftUI() {
  if (captainId !== null && !Object.values(squad).some(p => p && p.id === captainId)) captainId = null;
  const formation = FORMATIONS[currentFormation];
  const slots = formation.slots;

  let totalValue = 0;
  let filledCount = 0;

  for (const slotKey of slots) {
    const player = squad[slotKey];
    const slotEl = document.querySelector(`[data-pos="${slotKey}"]`);
    const textEl = document.getElementById(`slot-${slotKey}`);
    if (!slotEl || !textEl) continue;

    const posEl = document.getElementById(`pos-${slotKey}`);
    const basePos = slotKey.replace(/[0-9]/g, '');

    if (player) {
      slotEl.className = 'slot filled';
      const badge = getFormBadge(player);
      if (posEl) posEl.innerHTML = `${badge} ${basePos}${captainId === player.id ? ' ©' : ''}${traitOf(player) ? ' ' + traitOf(player).icon : ''}`;
      textEl.innerHTML = `<span class="slot-text">${player.name}</span><span class="player-ovr">€${player.value}M</span>`;
      totalValue += player.value;
      filledCount++;
    } else {
      slotEl.className = 'slot';
      if (posEl) posEl.innerHTML = basePos;
      textEl.innerHTML = `Pick`;
    }
  }

  const chemBar = document.getElementById('chemistry-bar');
  const clubCounts = {};
  for (const player of Object.values(squad)) {
    if (player) clubCounts[player.club] = (clubCounts[player.club] || 0) + 1;
  }
  const hasStack = Object.values(clubCounts).some(c => c >= 3);
  if (hasStack) {
    chemBar.style.display = 'flex';
    updateChemistry();
  } else {
    chemBar.style.display = 'none';
  }

  const capEl = document.getElementById('cap-counter');
  const countEl = document.getElementById('player-count');
  const startBtn = document.getElementById('start-season-btn');
  if (countEl) countEl.innerText = `${filledCount} / 11`;
  const effEl = document.getElementById('efficiency-counter');

  let benchValue = 0;
  for (let i = 0; i < BENCH_SIZE; i++) {
    if (bench[i]) benchValue += bench[i].value;
  }
  const totalWithBench = totalValue + benchValue;

  const savings = Math.max(0, MAX_CAP - totalWithBench);
  const savingsPct = savings / MAX_CAP;
  const effBonus = Math.min(0.08, savingsPct * 0.15);

  if (effEl) {
    if (effBonus > 0.001) {
      effEl.style.display = 'block';
      effEl.innerHTML = `💰 +${(effBonus * 100).toFixed(1)}% EFFICIENCY BONUS <span class="saved">(saved €${savings}M)</span>`;
    } else {
      effEl.style.display = 'none';
    }
  }

  capEl.innerText = `€${totalWithBench}M / €${MAX_CAP}M`;
  if (totalWithBench > MAX_CAP) capEl.classList.add('invalid');
  else capEl.classList.remove('invalid');

  if (filledCount === 11 && totalWithBench <= MAX_CAP) startBtn.classList.add('active');
  else startBtn.classList.remove('active');

  renderBenchBar();

  const simBenchList = document.getElementById('sim-bench-list');
  if (simBenchList) {
    const names = [];
    for (let i = 0; i < BENCH_SIZE; i++) if (bench[i]) names.push(bench[i].name);
    simBenchList.innerText = names.length === 0 ? "Empty" : names.join(" · ");
  }
}


// ===========================================================================
// MATCH ENGINE v2 — minute-by-minute simulation
// ===========================================================================
// All tuning numbers live here so balance can be adjusted in one place.
const MAX_SUBS = 3;
const HT_POPUP_GOALS_DOWN = 2;         // auto half-time popup when losing by this many or more
const HT_POPUP_BAD_FORM_PLAYERS = 3;   // ...or when this many starters show 🟥🟥 form
const FORM_RED_RED_BELOW = 5.6;        // average rating under this = 🟥🟥 (same as the badge)
const HOME_ADVANTAGE = 1.5;           // rating points added to the home side
const TACTIC_SWING = 4;               // attacking: +4 ATK / -4 DEF (matches the hint text)
const CHANCE_RATE = 0.115;            // chances per side per minute (~11 per match)
const POSSESSION_PER_MID_POINT = 0.015;
const ATK_DEF_CHANCE_SLOPE = 0.02;   // each ATK-vs-DEF point = +2.5% chances
const CONV_BASE = 0.10;              // base chance -> goal probability
const CONV_SHOOTER_PER_OVR = 0.004;  // shooter quality vs 80
const CONV_GK_PER_OVR = 0.004;       // opposing goalkeeper vs 80
const CONV_DEF_PER_OVR = 0.0015;      // opposing defence vs 80
const CONV_MIN = 0.04;
const CONV_MAX = 0.30;
const PENALTY_SHARE = 0.025;           // share of chances that are penalties
const PENALTY_BASE = 0.78;
const VAR_GOAL_REVIEW = 0.06;
const VAR_OVERTURN = 0.35;
const YELLOW_RATE = 0.020;            // per side per minute
const DIRECT_RED_RATE = 0.0002;
const CARDED_CAUTION = 0.2;          // a booked player is this much as likely to be booked again (cuts 2nd-yellow reds)
const INJURY_RATE = 0.0011;
const RED_CARD_PENALTY = 0.07;        // each red = -7% on all lines for that side
const INJURED_PLAY_ON_PENALTY = 12;   // OVR loss if an injured player stays on
const SCORER_OVR_WEIGHT = 0.04;       // 0 = scorer odds depend on position only
const AI_FILL_FLOOR = 68;
const MATCH_RATING_BASE = 6.3;

const SCORE_POS_WEIGHT = { ST: 45, LW: 20, RW: 20, CM: 8, LB: 3, RB: 3, CB: 3, GK: 0 };
const FOUL_POS_WEIGHT  = { CB: 3, LB: 3, RB: 3, CM: 3, ST: 1.2, LW: 1.2, RW: 1.2, GK: 0.1 };
const FIT_ADJACENT = { ST: ['LW','RW'], LW: ['RW','ST'], RW: ['LW','ST'], LB: ['RB','CB'], RB: ['LB','CB'], CB: ['LB','RB'], CM: [], GK: [] };

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function baseOf(slot) { return slot.replace(/[0-9]/g, ''); }
function rpick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function fitPenalty(playerPos, slotBase) {
  if (playerPos === slotBase) return 0;
  if (playerPos === 'GK' || slotBase === 'GK') return 30;
  if ((FIT_ADJACENT[slotBase] || []).includes(playerPos)) return 4;
  return 10;
}

function safeRemove(key) { try { localStorage.removeItem(key); } catch (e) {} }

function buzz(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

// ---------------------------------------------------------------------------
// AI clubs built from real rosters in players.js
// ---------------------------------------------------------------------------
const AI_SLOTS = ['LW','ST','RW','CM1','CM2','CM3','LB','CB1','CB2','RB','GK'];
const ROSTER_FALLBACKS = {
  GK: ['GK'], CB: ['CB','LB','RB'], LB: ['LB','RB','CB'], RB: ['RB','LB','CB'],
  CM: ['CM'], LW: ['LW','RW','ST'], RW: ['RW','LW','ST'], ST: ['ST','LW','RW']
};
const FILLER_SURNAMES = ["Rossi","Bianchi","Romano","Colombo","Ricci","Marino","Greco","Bruno","Gallo","Conti","De Luca","Costa","Giordano","Mancini","Rizzo","Lombardi","Moretti","Barbieri"];
const FILLER_INITIALS = ["A.","M.","L.","G.","F.","D.","S.","P.","R.","E."];

function fillerPlayer(clubName, slot, ovr, n) {
  const seed = clubName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + n * 7;
  return {
    id: `F_${clubName}_${n}_${slot}`,
    name: `${FILLER_INITIALS[seed % FILLER_INITIALS.length]} ${FILLER_SURNAMES[(seed * 3) % FILLER_SURNAMES.length]}`,
    pos: baseOf(slot), ovr, slot, filler: true
  };
}

function buildClubXI(clubName, formationKey) {
  const SLOTS = (FORMATIONS[formationKey || '4-3-3'] || FORMATIONS['4-3-3']).slots;
  const pool = availablePlayers.filter(p => p.club === clubName).sort((a, b) => b.ovr - a.ovr);
  const used = new Set();
  const chosen = {};
  SLOTS.forEach(slot => {
    const b = baseOf(slot);
    const p = pool.find(x => x.pos === b && !used.has(x.id));
    if (p) { used.add(p.id); chosen[slot] = p; }
  });
  SLOTS.forEach(slot => {
    if (chosen[slot]) return;
    for (const alt of ROSTER_FALLBACKS[baseOf(slot)]) {
      const p = pool.find(x => x.pos === alt && !used.has(x.id));
      if (p) { used.add(p.id); chosen[slot] = p; break; }
    }
  });
  const avgOvr = pool.length ? pool.reduce((s, p) => s + p.ovr, 0) / pool.length : 72;
  const fillOvr = Math.max(AI_FILL_FLOOR, Math.round(avgOvr - 3));
  let n = 0;
  return SLOTS.map(slot => {
    const p = chosen[slot];
    if (p) return { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, slot };
    n++;
    return fillerPlayer(clubName, slot, fillOvr, n);
  });
}

function xiArrayToMap(arr) {
  const m = {};
  arr.forEach(p => { m[p.slot] = p; });
  return m;
}

function refreshAiRatings(team) {
  const r = computeRatingsFromXI(xiArrayToMap(team.xi), { isUser: false, formation: team.formation });
  team.attack = r.attack; team.midfield = r.midfield; team.defense = r.defense; team.gk = r.gk;
}

function buildAiTeam(club) {
  const jitter = Math.round((Math.random() - 0.5) * 4) + (currentChallenge().aiBoost || 0);   // season variation -2..+2, plus challenge boost
  const style = styleForClub(club.name);
  const formation = pickFormationForStyle(style);
  const xi = buildClubXI(club.name, formation).map(p => ({ ...p, ovr: p.ovr + jitter }));
  const team = {
    id: `ai_${club.name}`, name: club.name, badge: club.badge, xi, style, formation,
    p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, isUser: false
  };
  refreshAiRatings(team);
  return team;
}

function ensureAiXI(team) {
  if (team.isUser) return;
  if (!Array.isArray(team.xi) || team.xi.length !== 11) {
    team.xi = buildClubXI(team.name, team.formation || '4-3-3');
    refreshAiRatings(team);
  }
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------
function computeChemBonusPct(xi) {
  const counts = {};
  for (const p of Object.values(xi)) if (p) counts[p.club] = (counts[p.club] || 0) + 1;
  let total = 0;
  for (const c of Object.values(counts)) {
    if (c >= 5) total += 7; else if (c >= 4) total += 5; else if (c >= 3) total += 3;
  }
  return total;
}

function computeRatingsFromXI(xi, opts) {
  opts = opts || {};
  const att = [], mid = [], def = [];
  let gk = null, capOn = false;
  for (const [slot, p] of Object.entries(xi)) {
    if (!p) continue;
    const b = baseOf(slot);
    let e = opts.isUser ? effectiveOvr(p) : p.ovr;
    if (opts.isUser && captainId !== null && p.id === captainId) { e += CAPTAIN_OWN_BONUS; capOn = true; }
    e -= fitPenalty(p.pos, b);
    if (opts.playOn && opts.playOn.has(p.id)) e -= INJURED_PLAY_ON_PENALTY;
    if (b === 'GK') gk = e;
    if (b === 'ST' || b === 'LW' || b === 'RW') att.push(e);
    else if (b === 'CM') mid.push(e);
    else def.push(e);
  }
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 70;
  let mult = 1, aMod = 0, mMod = 0, dMod = 0;
  if (opts.isUser) {
    mult = (1 + computeChemBonusPct(xi) / 100) * (1 + calculateEfficiencyBonus());
    const fm = formationMods(currentFormation);
    aMod = fm.atk; mMod = fm.mid; dMod = fm.def;
    if (capOn) mult *= (1 + CAPTAIN_TEAM_BONUS);
    if (currentPress === 'high') dMod -= 1.5; else if (currentPress === 'low') dMod += 1.5;
    if (currentWidth === 'narrow') mMod += 1; else if (currentWidth === 'wide') mMod -= 1;
    if (currentTactic === 'attacking') { aMod += TACTIC_SWING; dMod -= TACTIC_SWING; }
    else if (currentTactic === 'defensive') { aMod -= TACTIC_SWING; dMod += TACTIC_SWING; }
  }
  if (!opts.isUser) {
    const fm = formationMods(opts.formation || '4-3-3');
    aMod += fm.atk; mMod += fm.mid; dMod += fm.def;
    if (opts.shift) { aMod += opts.shift.atk; dMod += opts.shift.def; }
  }
  const redMult = 1 - RED_CARD_PENALTY * (opts.reds || 0);
  const tm = traitMods(xi, opts);
  return {
    attack:   (avg(att) * mult + aMod + tm.atk) * redMult,
    midfield: (avg(mid) * mult + mMod + tm.mid) * redMult,
    defense:  (avg(def) * mult + dMod + tm.def) * redMult,
    gk: gk === null ? 55 : (gk * mult + tm.gk) * redMult
  };
}

function recalcUserTeamWithFormation() {
  const userTeam = leagueTeams.find(t => t.isUser);
  if (!userTeam) return;
  const r = computeRatingsFromXI(squad, { isUser: true });
  userTeam.attack = Math.round(r.attack);
  userTeam.midfield = Math.round(r.midfield);
  userTeam.defense = Math.round(r.defense);
  window.__lastHarmonyBonus = 1 + computeChemBonusPct(squad) / 100;
}

// ---------------------------------------------------------------------------
// Match object
// ---------------------------------------------------------------------------
function newApp(p, slot, from) {
  return { p, slot, from, to: null, goals: 0, yellow: 0, red: false, injured: false, saves: 0, concededOn: 0 };
}

function sideOpts(side) {
  return { isUser: side.isUser, playOn: side.playOn, reds: side.reds, formation: side.isUser ? undefined : side.team.formation, shift: side.shift, ctx: sideCtx(side) };
}

function makeSide(team, isUser) {
  const side = {
    team, isUser, xi: {}, benchList: [], apps: {}, reds: 0, yellows: 0, subsMade: 0,
    sentOff: {}, usedOff: new Set(), playOn: new Set(), fillerN: 0, dirty: false,
    stats: { chances: 0, goals: 0, possAcc: 0 }
  };
  if (isUser) {
    for (const [s, p] of Object.entries(squad)) side.xi[s] = p || null;
    side.benchList = bench.slice();
    side.unavailableIds = new Set();
    for (const p of [...Object.values(side.xi), ...side.benchList]) if (p && isUnavailable(p)) side.unavailableIds.add(p.id);
    for (const [sl, p] of Object.entries(side.xi)) {
      if (!p) continue;
      if (isBanned(p)) { side.sentOff[sl] = p; side.xi[sl] = null; }      // banned, nobody to replace him: sits out
      else if (isInjuredPlayer(p)) side.playOn.add(p.id);                  // injured, no cover: plays on at a penalty
    }
  } else {
    ensureAiIdentity(team);
    ensureAiXI(team);
    team.xi.forEach(p => { side.xi[p.slot] = { ...p }; });
  }
  for (const [s, p] of Object.entries(side.xi)) if (p) side.apps[p.id] = newApp(p, s, 0);
  side.ratings = computeRatingsFromXI(side.xi, sideOpts(side));
  return side;
}

function createMatch(home, away, live) {
  const m = {
    home, away, live: !!live,
    sides: { home: makeSide(home, !!home.isUser), away: makeSide(away, !!away.isUser) },
    half: 1, phase: 'first', tickInHalf: 0, ticks: 0,
    added: { 1: 1 + Math.floor(Math.random() * 4), 2: 1 + Math.floor(Math.random() * 5) },
    score: { home: 0, away: 0 }, log: [], finished: false, pendingForced: null,
    htShown: false, onEvent: null
  };
  m.userKey = home.isUser ? 'home' : (away.isUser ? 'away' : null);
  m.derby = isDerbyPair(home, away);
  m.neutral = false;
  m.maxDeficit = 0;
  return m;
}

function otherKey(k) { return k === 'home' ? 'away' : 'home'; }

function matchMinute(m) {
  const t = m.tickInHalf;
  return m.half === 1 ? Math.min(t, 45) : 45 + Math.min(t, 45);
}

function matchLabel(m) {
  const t = m.tickInHalf;
  const base = m.half === 1 ? 45 : 90;
  const reg = m.half === 1 ? t : 45 + t;
  return reg > base ? `${base}+${reg - base}'` : `${Math.max(1, reg)}'`;
}

function emit(m, ev) {
  ev.label = ev.label || matchLabel(m);
  m.log.push(ev);
  if (m.live && m.onEvent) m.onEvent(ev, m);
}

function slotEff(side, p, slot) {
  let e = side.isUser ? effectiveOvr(p) : p.ovr;
  e -= fitPenalty(p.pos, baseOf(slot));
  if (side.playOn.has(p.id)) e -= INJURED_PLAY_ON_PENALTY;
  return e;
}

function gkNameOf(side) {
  const g = side.xi['GK'];
  return g ? g.name : 'the goalkeeper';
}

function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const it of items) { r -= it.w; if (r <= 0) return it; }
  return items[items.length - 1];
}

function shooterCandidates(side) {
  const out = [];
  for (const [slot, p] of Object.entries(side.xi)) {
    if (!p) continue;
    const bp = baseOf(slot);
    let w0 = SCORE_POS_WEIGHT[bp];
    if (!w0) continue;
    if (side.isUser) {
      if (currentWidth === 'wide') { if (bp === 'LW' || bp === 'RW') w0 *= 1.3; else if (bp === 'ST') w0 *= 0.9; }
      else if (currentWidth === 'narrow') { if (bp === 'CM') w0 *= 1.4; else if (bp === 'ST') w0 *= 1.1; }
    }
    const e = slotEff(side, p, slot);
    out.push({ slot, p, e, w: w0 * Math.max(0.3, 1 + (e - 78) * SCORER_OVR_WEIGHT) });
  }
  return out;
}

function goalProbability(shooterEff, oppRatings) {
  const p = CONV_BASE
    + (shooterEff - 80) * CONV_SHOOTER_PER_OVR
    - (oppRatings.gk - 80) * CONV_GK_PER_OVR
    - (oppRatings.defense - 80) * CONV_DEF_PER_OVR;
  return clamp(p, CONV_MIN, CONV_MAX);
}

function computeRates(m) {
  let H = m.sides.home.ratings, A = m.sides.away.ratings;
  const mu = matchupFor(m);
  if (m.userKey && (mu.adj.atk || mu.adj.mid || mu.adj.def)) {
    const adj = r => ({ attack: r.attack + mu.adj.atk, midfield: r.midfield + mu.adj.mid, defense: r.defense + mu.adj.def, gk: r.gk });
    if (m.userKey === 'home') H = adj(H); else A = adj(A);
  }
  if (m.derby) {
    // derbies are tighter: rating gaps shrink by 25%
    const mix = (x, y) => x * 0.75 + (x + y) / 2 * 0.25;
    const h2 = { attack: mix(H.attack, A.attack), midfield: mix(H.midfield, A.midfield), defense: mix(H.defense, A.defense), gk: H.gk };
    const a2 = { attack: mix(A.attack, H.attack), midfield: mix(A.midfield, H.midfield), defense: mix(A.defense, H.defense), gk: A.gk };
    H = h2; A = a2;
  }
  const ha = m.neutral ? 0 : HOME_ADVANTAGE;
  const hAtk = H.attack + ha, hMid = H.midfield + ha, hDef = H.defense + ha;
  const sh = styleMods(m.sides.home), sa = styleMods(m.sides.away);
  if (m.userKey === 'home') { sh.own *= mu.own; sh.opp *= mu.opp; sh.pos += mu.pos; }
  else if (m.userKey === 'away') { sa.own *= mu.own; sa.opp *= mu.opp; sa.pos += mu.pos; }
  const pHome = clamp(0.5 + (hMid - A.midfield) * POSSESSION_PER_MID_POINT + sh.pos - sa.pos, 0.3, 0.7);
  const minute = matchMinute(m);
  const diff = m.score.home - m.score.away;
  const late = minute >= 60 ? 1 : (minute >= 30 ? 0.4 : 0);
  const stateH = 1 + late * (diff < 0 ? Math.min(2, -diff) * 0.08 : (diff > 0 ? -0.05 : 0));
  const stateA = 1 + late * (diff > 0 ? Math.min(2, diff) * 0.08 : (diff < 0 ? -0.05 : 0));
  const dm = m.derby ? 1.08 : 1;
  const rH = CHANCE_RATE * (1 + (pHome - 0.5) * 1.2) * clamp(1 + (hAtk - A.defense) * ATK_DEF_CHANCE_SLOPE, 0.5, 1.7) * stateH * sh.own * sa.opp * dm;
  const rA = CHANCE_RATE * (1 + (0.5 - pHome) * 1.2) * clamp(1 + (A.attack - hDef) * ATK_DEF_CHANCE_SLOPE, 0.5, 1.7) * stateA * sa.own * sh.opp * dm;
  return { home: rH, away: rA, pHome };
}

function refreshSideRatings(m) {
  for (const k of ['home', 'away']) {
    const s = m.sides[k];
    if (s.dirty) { s.ratings = computeRatingsFromXI(s.xi, sideOpts(s)); s.dirty = false; }
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
function registerGoal(m, k, player, penalty) {
  const atk = m.sides[k], def = m.sides[otherKey(k)];
  m.score[k]++;
  atk.stats.goals++;
  const app = atk.apps[player.id];
  if (app) app.goals++;
  for (const a of Object.values(def.apps)) if (a.to === null) a.concededOn++;
  if (m.userKey) m.maxDeficit = Math.max(m.maxDeficit || 0, m.score[otherKey(m.userKey)] - m.score[m.userKey]);
  const cTag = (atk.isUser && captainId !== null && player.id === captainId) ? ' ©' : '';
  emit(m, {
    type: 'goal', side: k, scorer: player.name + cTag, penalty: !!penalty,
    text: `⚽ ${matchLabel(m)} GOAL! ${player.name}${cTag} (${atk.team.name})${penalty ? ' — penalty' : ''}`
  });
}

function confirmGoal(m, k, player) {
  const atk = m.sides[k];
  if (Math.random() < VAR_GOAL_REVIEW) {
    const reason = rpick(['offside', 'a handball in the build-up', 'a foul in the build-up']);
    emit(m, { type: 'var', text: `📺 ${matchLabel(m)} VAR is checking ${player.name}'s goal…` });
    if (Math.random() < VAR_OVERTURN) {
      emit(m, { type: 'var', side: k, disallowed: true, text: `❌ ${matchLabel(m)} GOAL DISALLOWED — ${reason} (${atk.team.name})` });
      return;
    }
    emit(m, { type: 'var', text: `✅ ${matchLabel(m)} VAR: the goal stands` });
  }
  registerGoal(m, k, player, false);
}

function resolvePenalty(m, k) {
  const atk = m.sides[k], def = m.sides[otherKey(k)];
  const cands = shooterCandidates(atk);
  if (!cands.length) return;
  let taker = cands.reduce((a, b) => (b.e > a.e ? b : a));
  if (atk.isUser && captainId !== null) {
    const cap = cands.find(c => c.p.id === captainId);
    if (cap && cap.e >= taker.e - 3) taker = cap;
  }
  const spotMan = cands.find(c => traitPenaltyBonus(c, atk) > 0);
  if (spotMan && spotMan.e >= taker.e - 4) taker = spotMan;
  emit(m, { type: 'pen', side: k, text: `🎯 ${matchLabel(m)} PENALTY to ${atk.team.name}! ${taker.p.name} steps up…` });
  if (Math.random() < 0.10) {
    emit(m, { type: 'var', text: `📺 ${matchLabel(m)} VAR overturns it — no penalty after all` });
    return;
  }
  const p = clamp(PENALTY_BASE + (taker.e - 80) * 0.004 - (def.ratings.gk - 80) * 0.004 + traitPenaltyBonus(taker, atk), 0.6, 0.95);
  if (Math.random() < p) {
    registerGoal(m, k, taker.p, true);
  } else if (Math.random() < 0.6) {
    const g = def.xi['GK'];
    if (g && def.apps[g.id]) def.apps[g.id].saves++;
    emit(m, { type: 'chance', side: k, text: `🧤 ${matchLabel(m)} ${gkNameOf(def)} saves the penalty from ${taker.p.name}!` });
    if (m.live && m.onChance) m.onChance(m, k, 'save', taker.p.name);
  } else {
    emit(m, { type: 'chance', side: k, text: `😬 ${matchLabel(m)} ${taker.p.name} puts the penalty wide!` });
    if (m.live && m.onChance) m.onChance(m, k, 'miss', taker.p.name);
  }
}

function resolveChance(m, k) {
  const atk = m.sides[k], def = m.sides[otherKey(k)];
  atk.stats.chances++;
  if (Math.random() < PENALTY_SHARE) { resolvePenalty(m, k); return; }
  const sh = weightedPick(shooterCandidates(atk));
  if (!sh) return;
  const tcb = traitConv(sh, atk, def, m, k);
  if (Math.random() < clamp(goalProbability(sh.e, def.ratings) + tcb, CONV_MIN, CONV_MAX + 0.03)) {
    if (tcb >= 0.02) { (atk.traitGoals = atk.traitGoals || []).push(sh.p.name + ' ' + (traitOf(sh.p) || {}).icon); }
    confirmGoal(m, k, sh.p);
    return;
  }
  const r = Math.random();
  let text = null;
  if (m.live && m.onChance) m.onChance(m, k, r < 0.55 ? 'save' : (r < 0.85 ? 'miss' : 'block'), sh.p.name);
  if (r < 0.55) {
    const g = def.xi['GK'];
    if (g && def.apps[g.id]) def.apps[g.id].saves++;
    text = `🧤 ${matchLabel(m)} ${gkNameOf(def)} denies ${sh.p.name}`;
  } else if (r < 0.85) {
    text = `💨 ${matchLabel(m)} ${sh.p.name} drags it wide`;
  } else {
    text = `🧱 ${matchLabel(m)} ${sh.p.name}'s effort is blocked`;
  }
  if (m.live && Math.random() < 0.4) emit(m, { type: 'chance', side: k, text });
}

function closeApp(m, app) {
  if (app && app.to === null) app.to = matchMinute(m);
}

function sendOff(m, k, slot, reason) {
  const s = m.sides[k];
  const p = s.xi[slot];
  if (!p) return;
  const app = s.apps[p.id];
  if (app) { app.red = true; closeApp(m, app); }
  s.sentOff[slot] = p;
  s.xi[slot] = null;
  s.reds++;
  s.dirty = true;
  if (m.pendingForced && m.pendingForced.slot === slot && m.pendingForced.key === k) m.pendingForced = null;
  emit(m, { type: 'red', side: k, text: `🟥 ${matchLabel(m)} RED CARD! ${p.name} (${s.team.name}) is sent off — ${reason}` });
}

function discipline(m, k) {
  const s = m.sides[k];
  const dMult = m.derby ? 1 : 0;
  const rollDirect = Math.random() < DIRECT_RED_RATE * (1 + dMult);
  const rollYellow = !rollDirect && Math.random() < YELLOW_RATE * styleMods(s).yellow * (1 + dMult * 0.6);
  if (!rollDirect && !rollYellow) return;
  const items = [];
  for (const [slot, p] of Object.entries(s.xi)) if (p) items.push({ slot, p, w: (FOUL_POS_WEIGHT[baseOf(slot)] || 1) * (((s.apps[p.id] && s.apps[p.id].yellow) || 0) >= 1 ? CARDED_CAUTION : 1) });
  const v = weightedPick(items);
  if (!v) return;
  if (rollDirect) { sendOff(m, k, v.slot, 'straight red'); return; }
  const app = s.apps[v.p.id];
  if (!app) return;
  app.yellow++;
  s.yellows++;
  if (app.yellow >= 2) {
    emit(m, { type: 'card', side: k, text: `🟨 ${matchLabel(m)} Second yellow for ${v.p.name} (${s.team.name})` });
    sendOff(m, k, v.slot, 'second yellow');
  } else {
    emit(m, { type: 'card', side: k, text: `🟨 ${matchLabel(m)} Yellow card — ${v.p.name} (${s.team.name})` });
  }
}

function doSubstitution(m, k, slot, benchIdx) {
  const s = m.sides[k];
  const off = s.xi[slot];
  const on = s.benchList[benchIdx];
  if (!off || !on || s.usedOff.has(on.id)) return false;
  if (s.isUser && isUnavailable(on)) return false;
  closeApp(m, s.apps[off.id]);
  s.xi[slot] = on;
  s.benchList[benchIdx] = off;
  s.usedOff.add(off.id);
  s.playOn.delete(off.id);
  s.subsMade++;
  s.apps[on.id] = newApp(on, slot, matchMinute(m));
  s.dirty = true;
  if (m.pendingForced && m.pendingForced.slot === slot && m.pendingForced.key === k) m.pendingForced = null;
  emit(m, { type: 'sub', side: k, text: `🔄 ${matchLabel(m)} Sub (${s.team.name}): ${on.name} on for ${off.name}` });
  return true;
}

function autoReplaceInjured(m, k, slot) {
  const s = m.sides[k];
  const p = s.xi[slot];
  if (!p) return;
  if (s.subsMade < MAX_SUBS) {
    const b = baseOf(slot);
    let bestIdx = -1, bestScore = -Infinity;
    s.benchList.forEach((c, i) => {
      if (!c || s.usedOff.has(c.id) || isUnavailable(c)) return;
      const pen = fitPenalty(c.pos, b);
      if (pen >= 30) return;
      const score = effectiveOvr(c) - pen;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    if (bestIdx >= 0) { doSubstitution(m, otherSideKeyOf(m, s), slot, bestIdx); return; }
  }
  s.playOn.add(p.id);
  s.dirty = true;
  emit(m, { type: 'info', text: `⚠️ ${matchLabel(m)} ${p.name} plays on despite the knock` });
}

function otherSideKeyOf(m, side) { return m.sides.home === side ? 'home' : 'away'; }

function aiReplaceInjured(m, k, slot) {
  const s = m.sides[k];
  const p = s.xi[slot];
  if (!p) return;
  s.fillerN++;
  const sub = fillerPlayer(s.team.name, baseOf(slot), Math.max(AI_FILL_FLOOR, p.ovr - 6), 20 + s.fillerN);
  closeApp(m, s.apps[p.id]);
  s.xi[slot] = sub;
  s.apps[sub.id] = newApp(sub, slot, matchMinute(m));
  s.dirty = true;
  emit(m, { type: 'sub', side: k, text: `🔄 ${matchLabel(m)} ${sub.name} replaces injured ${p.name} (${s.team.name})` });
}

function injuries(m, k) {
  if (Math.random() >= INJURY_RATE) return;
  const s = m.sides[k];
  const list = Object.entries(s.xi).filter(([sl, p]) => p && !s.playOn.has(p.id));
  if (!list.length) return;
  const [slot, p] = rpick(list);
  const app = s.apps[p.id];
  if (app) app.injured = true;
  emit(m, { type: 'injury', side: k, text: `🚑 ${matchLabel(m)} ${p.name} (${s.team.name}) goes down injured` });
  if (s.isUser) {
    if (m.live) { if (!m.pendingForced) m.pendingForced = { slot, key: k }; }
    else autoReplaceInjured(m, k, slot);
  } else {
    aiReplaceInjured(m, k, slot);
  }
}

function advanceTick(m) {
  if (m.finished) return;
  m.tickInHalf++;
  m.ticks++;
  refreshSideRatings(m);
  const rates = computeRates(m);
  const order = Math.random() < 0.5 ? ['home', 'away'] : ['away', 'home'];
  for (const k of order) {
    if (Math.random() < rates[k]) resolveChance(m, k);
    discipline(m, k);
    injuries(m, k);
  }
  m.lastPHome = rates.pHome;
  m.sides.home.stats.possAcc += rates.pHome;
  m.sides.away.stats.possAcc += 1 - rates.pHome;
  if (m.tickInHalf >= 45 + m.added[m.half]) {
    if (m.half === 1) {
      m.phase = 'ht';
      aiHalftimeAdapt(m);
    } else {
      m.phase = 'ft';
      m.finished = true;
      for (const k of ['home', 'away']) for (const a of Object.values(m.sides[k].apps)) if (a.to === null) a.to = 90;
    }
  }
}

function startSecondHalfState(m) {
  m.phase = 'second';
  m.half = 2;
  m.tickInHalf = 0;
}

function runToEnd(m) {
  let guard = 0;
  while (!m.finished && guard++ < 400) {
    if (m.phase === 'ht') startSecondHalfState(m);
    if (m.pendingForced) { autoReplaceInjured(m, m.pendingForced.key, m.pendingForced.slot); m.pendingForced = null; }
    advanceTick(m);
  }
  if (m.pendingForced) { autoReplaceInjured(m, m.pendingForced.key, m.pendingForced.slot); m.pendingForced = null; }
}

// ---------------------------------------------------------------------------
// Ratings, Man of the Match, round finalisation
// ---------------------------------------------------------------------------
function computeMatchReport(m) {
  const entries = [];
  for (const k of ['home', 'away']) {
    const side = m.sides[k];
    const gf = m.score[k], ga = m.score[otherKey(k)];
    const result = gf > ga ? 1 : (gf < ga ? -1 : 0);
    for (const app of Object.values(side.apps)) {
      const mins = (app.to === null ? 90 : app.to) - app.from;
      if (mins <= 0 && !app.red) continue;
      const b = baseOf(app.slot);
      let r = MATCH_RATING_BASE + result * 0.4 + app.goals * 0.9;
      if (b === 'GK') r += app.saves * 0.12;
      const isDef = b === 'GK' || b === 'CB' || b === 'LB' || b === 'RB';
      if (app.concededOn === 0 && mins >= 60) r += b === 'GK' ? 0.9 : (isDef ? 0.5 : (b === 'CM' ? 0.15 : 0));
      else if (isDef) r -= Math.min(4, app.concededOn) * 0.2;
      r -= app.yellow * 0.15;
      if (app.red) r -= 1.2;
      r += (Math.random() - 0.5) * 0.7;
      const w = clamp(mins / 60, 0.4, 1);
      r = MATCH_RATING_BASE + (r - MATCH_RATING_BASE) * w;
      entries.push({ k, app, rating: clamp(r, 3, 10), mins });
    }
  }
  let motm = null;
  for (const e of entries) {
    if (!motm || e.rating > motm.rating + 1e-9 || (Math.abs(e.rating - motm.rating) < 1e-9 && e.app.goals > motm.app.goals)) motm = e;
  }
  return { entries, motm };
}

function applyResultToTable(h, a, hg, ag) {
  h.p++; a.p++;
  h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
  if (hg > ag) { h.w++; h.pts += 3; a.l++; }
  else if (hg < ag) { a.w++; a.pts += 3; h.l++; }
  else { h.d++; h.pts++; a.d++; a.pts++; }
}

function prepareMatchday(live) {
  const round = fixtures[currentRoundIdx];
  const aiResults = [];
  let userMatch = null;
  round.forEach(f => {
    if (f.home.isUser || f.away.isUser) {
      userMatch = createMatch(f.home, f.away, live);
    } else {
      const m = createMatch(f.home, f.away, false);
      runToEnd(m);
      aiResults.push({ home: f.home, away: f.away, homeGoals: m.score.home, awayGoals: m.score.away });
    }
  });
  if (userMatch) userMatch.aiResults = aiResults;
  return userMatch;
}


function runSilentMatchday() {
  if (currentRoundIdx >= fixtures.length) return;
  const m = prepareMatchday(false);
  runToEnd(m);
  finalizeMatchday(m);
}

// ===========================================================================
// Season start
// ===========================================================================
function startSeason() {
  awaitingContinue = false;
  userSquadGoals = {};
  userMotm = {};
  seasonStats = newSeasonStats();
  prematchRound = -1;
  cup = null; pendingEurope = null;
  ensureCaptain();
  for (const player of Object.values(squad)) if (player) userSquadGoals[player.name] = 0;

  const chemPct = computeChemBonusPct(squad);
  const effPct = calculateEfficiencyBonus();
  window.__lastHarmonyBonus = 1 + chemPct / 100;
  window.__lastChemistryBonusPct = chemPct / 100;
  window.__lastEfficiencyBonusPct = effPct;

  const r = computeRatingsFromXI(squad, { isUser: true });
  const userTeamProfile = {
    id: 'user_team', name: userClub.name, badge: userClub.badge,
    attack: Math.round(r.attack), midfield: Math.round(r.midfield), defense: Math.round(r.defense),
    p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, isUser: true,
    chemBonus: chemPct, effBonus: effPct * 100,
    squadValue: Object.values(squad).filter(Boolean).reduce((s, p) => s + p.value, 0)
              + bench.filter(Boolean).reduce((s, p) => s + p.value, 0),
    formation: currentFormation
  };

  const userKey = userClub.name.trim().toLowerCase();
  let aiTeams = serieAClubs
    .filter(c => c.name.trim().toLowerCase() !== userKey)
    .map(buildAiTeam);

  // The league has 20 slots: the user takes one. Drop one of the weaker real clubs at random.
  while (aiTeams.length > 19) {
    const ranked = [...aiTeams].sort((a, b) => (a.attack + a.midfield + a.defense) - (b.attack + b.midfield + b.defense));
    const victim = ranked[Math.floor(Math.random() * Math.min(6, ranked.length))];
    aiTeams = aiTeams.filter(t => t !== victim);
  }
  let fillerIdx = 0;
  while (aiTeams.length < 19) {
    fillerIdx++;
    aiTeams.push(buildAiTeam({ name: `Filler FC ${fillerIdx}`, badge: "⚪" }));
  }

  userRivalName = pickUserRival(userTeamProfile, aiTeams);
  setTimeout(() => showToast(`🔥 Your derby rival this season: ${userRivalName}`), 800);
  leagueTeams = [userTeamProfile, ...aiTeams];
  makeObjectives(userTeamProfile, aiTeams);

  generateDoubleRoundRobin();
  currentRoundIdx = 0;
  isSimPaused = false;
  liveMatch = null;
  pendingFormation = null;

  saveActiveCampaignState();

  document.getElementById('screen-draft').classList.remove('active');
  document.getElementById('screen-sim').classList.add('active');

  document.querySelectorAll('#screen-sim .tactic-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`sim-tactic-${currentTactic}`).classList.add('active');
  updateFormationButtons();

  document.getElementById('sim-title').innerText = `MATCHDAY 1 / 38`;
  document.getElementById('sim-progress-fill').style.width = `0%`;
  updateStandingsTable();
  updateSimBenchStrip();
  syncPaceLabels();
  resetPauseButton();
  showCupBox(false);
  updateStyleButtons();
  applyIronUI();
  updateSubsButton();
  openBoardIntro();
}

function syncPaceLabels() {
  const paceBtn = document.getElementById('pace-btn');
  if (paceBtn) paceBtn.innerText = paceShortLabels[currentPaceIdx];
  const indicator = document.getElementById('sim-pace-indicator');
  if (indicator) indicator.innerText = paceOptions[currentPaceIdx].label.split(":")[0];
}

function resetPauseButton() {
  isSimPaused = false;
  const btn = document.getElementById('pause-btn');
  if (btn) { btn.innerText = "PAUSE ⏸️"; btn.style.background = "#1e293b"; }
}

function generateDoubleRoundRobin() {
  let teams = [...leagueTeams];
  const n = teams.length;
  const roundsCount = n - 1;
  const halfSize = n / 2;
  let firstHalf = [];

  for (let round = 0; round < roundsCount; round++) {
    let roundMatches = [];
    for (let i = 0; i < halfSize; i++) {
      const home = (round % 2 === 0) ? teams[i] : teams[n - 1 - i];
      const away = (round % 2 === 0) ? teams[n - 1 - i] : teams[i];
      roundMatches.push({ home, away });
    }
    firstHalf.push(roundMatches);
    const last = teams.pop();
    teams.splice(1, 0, last);
  }

  const secondHalf = firstHalf.map(round => round.map(m => ({ home: m.away, away: m.home })));
  fixtures = [...firstHalf, ...secondHalf];
}

function triggerScreenShake() {
  const card = document.querySelector('#screen-sim .broadcast-card');
  if (!card) return;
  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 400);
}

function triggerTickerTape() {
  const container = document.getElementById('post-season-container');
  if (!container) return;
  container.style.position = 'relative';

  const COLORS = ['#fbbf24', '#22c55e', '#38bdf8', '#ef4444', '#ec4899', '#8b5cf6', '#fff'];
  const PIECES = 40;

  for (let i = 0; i < PIECES; i++) {
    const piece = document.createElement('div');
    piece.style.position = 'absolute';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${-Math.random() * 20 - 10}px`;
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = `${6 + Math.random() * 8}px`;
    piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
    piece.style.pointerEvents = 'none';
    piece.style.zIndex = '5';
    piece.style.animation = `confettiFall ${1.6 + Math.random() * 1.4}s ease-in forwards`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    container.appendChild(piece);
    setTimeout(() => {
      if (piece.parentNode) piece.parentNode.removeChild(piece);
    }, 4000);
  }
}

function startCountdown(durationMs) {
  if (countdownRAF) cancelAnimationFrame(countdownRAF);
  const bar = document.getElementById('sim-countdown-fill');
  if (!bar) return;

  bar.style.width = '0%';
  const start = performance.now();

  function tick(now) {
    if (isSimPaused) return;
    const elapsed = now - start;
    const pct = Math.min(100, (elapsed / durationMs) * 100);
    bar.style.width = pct + '%';
    if (pct < 100) {
      countdownRAF = requestAnimationFrame(tick);
    }
  }
  countdownRAF = requestAnimationFrame(tick);
}

function stopCountdown() {
  if (countdownRAF) {
    cancelAnimationFrame(countdownRAF);
    countdownRAF = null;
  }
  const bar = document.getElementById('sim-countdown-fill');
  if (bar) bar.style.width = '0%';
}

// ===========================================================================
// Live match flow (clock, half-time, events, subs)
// ===========================================================================
let liveMatch = null;
let matchTimer = null;
let htTimer = null;
let gapTimer = null;
let subsModalOpen = false;
let pendingFormation = null;
let userMotm = {};
let _subsMode = 'manual';
let _pendingSlot = null;
let _bannerTimer = null;

function tickMs()    { return Math.max(25, Math.round(paceOptions[currentPaceIdx].ms * 0.9 / 95)); }
function htPauseMs() { return Math.max(900, Math.round(paceOptions[currentPaceIdx].ms * 0.12)); }
function gapMs()     { return Math.round(paceOptions[currentPaceIdx].ms * 0.35); }

function showGoalBanner(txt, type = 'goal') {
  const banner = document.getElementById('goal-banner');
  if (!banner) return;
  banner.classList.remove('final', 'concede', 'card');
  const small = 'font-size:0.78rem; font-weight:800;';
  if (type === 'final')        { banner.innerHTML = `⏱ FULL TIME<br><span style="${small}">${txt}</span>`; banner.classList.add('final'); }
  else if (type === 'concede') { banner.innerHTML = `😬 GOAL CONCEDED<br><span style="${small}">${txt}</span>`; banner.classList.add('concede'); }
  else if (type === 'card')    { banner.innerHTML = `🟥 RED CARD<br><span style="${small}">${txt}</span>`; banner.classList.add('card'); }
  else if (type === 'ht')      { banner.innerHTML = `⏸ HALF TIME<br><span style="${small}">${txt}</span>`; banner.classList.add('final'); }
  else                         { banner.innerHTML = `⚽ GOAL!<br><span style="${small}">${txt}</span>`; }
  banner.classList.add('show');
  clearTimeout(_bannerTimer);
  _bannerTimer = setTimeout(() => banner.classList.remove('show'), type === 'final' ? 2000 : 1600);
}

function addLogLine(text, cls) {
  const box = document.getElementById('match-event-log');
  if (!box) return;
  const line = document.createElement('div');
  line.className = cls;
  line.innerText = text;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function setStatus(txt, color) {
  const el = document.getElementById('broadcast-status-tag');
  if (!el) return;
  el.innerText = txt;
  el.style.color = color || 'var(--accent-green)';
}

function updateSubsButton() {
  const btn = document.getElementById('subs-btn');
  if (!btn) return;
  if (challengeMode === 'iron') btn.innerText = 'IRON 🔒';
  else if (liveMatch && liveMatch.userKey) {
    const left = MAX_SUBS - liveMatch.sides[liveMatch.userKey].subsMade;
    btn.innerText = `SUBS 🔄 ${left}`;
  } else {
    btn.innerText = 'LINEUP 🔄';
  }
  updateLineupAlert();
}

function renderLiveStats(m) {
  if (!m) return;
  const H = m.sides.home, A = m.sides.away;
  const t = Math.max(1, m.ticks);
  const hp = Math.round(H.stats.possAcc / t * 100);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
  set('stat-home-pos', `${hp}%`);
  set('stat-away-pos', `${100 - hp}%`);
  set('stat-home-chc', H.stats.chances);
  set('stat-away-chc', A.stats.chances);
  set('stat-home-conv', H.stats.chances ? `${Math.round(H.stats.goals / H.stats.chances * 100)}%` : '0%');
  set('stat-away-conv', A.stats.chances ? `${Math.round(A.stats.goals / A.stats.chances * 100)}%` : '0%');
  set('stat-home-cards', `🟨${H.yellows} 🟥${H.reds}`);
  set('stat-away-cards', `🟨${A.yellows} 🟥${A.reds}`);
}

function updateLiveHeader(m) {
  const clock = document.getElementById('match-clock');
  if (clock) clock.innerText = matchLabel(m);
  const fill = document.getElementById('sim-progress-fill');
  if (fill) fill.style.width = `${Math.min(100, matchMinute(m) / 90 * 100)}%`;
}

function handleLiveEvent(ev, m) {
  const uk = m.userKey;
  const mine = ev.side === uk;
  if (ev.type === 'goal') {
    addLogLine(ev.text, 'goal-event-line big ' + (mine ? 'user-goal' : 'opp-goal'));
    try { PitchViz.onEvent(ev, m); } catch (e) {}
    document.getElementById('live-score').innerText = `${m.score.home} - ${m.score.away}`;
    if (mine) {
      AudioFX.playGoalCheer(); triggerScreenShake(); buzz([80, 50, 160]);
      showGoalBanner(`${ev.scorer} ${ev.label}`, 'goal');
    } else {
      AudioFX.playConcede(); buzz(250);
      showGoalBanner(`${ev.scorer} ${ev.label}`, 'concede');
    }
    return;
  }
  addLogLine(ev.text, 'log-line log-' + ev.type);
  try { PitchViz.onEvent(ev, m); } catch (e) {}
  if (ev.type === 'red') {
    AudioFX.playCard();
    if (mine) { buzz([120, 60, 120, 60, 120]); showGoalBanner(ev.text.replace(/^🟥\s*/, ''), 'card'); }
  } else if (ev.type === 'card' && mine) {
    AudioFX.playCard(); buzz(40);
  } else if (ev.type === 'injury' && mine) {
    buzz(150);
  } else if (ev.type === 'pen') {
    buzz(60);
  }
}

function stopMatchTimer() {
  if (matchTimer) { clearInterval(matchTimer); matchTimer = null; }
}

function stopAllSimTimers() {
  stopMatchTimer();
  clearTimeout(htTimer); htTimer = null;
  clearTimeout(gapTimer); gapTimer = null;
  stopCountdown();
}

function updateRunState() {
  stopMatchTimer();
  clearTimeout(htTimer); htTimer = null;
  const m = liveMatch;
  if (!m || m.finished) return;
  if (isSimPaused || subsModalOpen) return;
  if (m.phase === 'ht') { htTimer = setTimeout(startSecondHalf, htPauseMs()); return; }
  matchTimer = setInterval(liveTick, tickMs());
}

function liveTick() {
  const m = liveMatch;
  if (!m || m.finished) return;
  advanceTick(m);
  try { PitchViz.onTick(m); } catch (e) {}
  updateLiveHeader(m);
  renderLiveStats(m);
  if (m.pendingForced) { openSubsModal('injury'); return; }
  if (m.phase === 'ht' && !m.htShown) { m.htShown = true; onHalfTime(m); return; }
  if (m.finished) onLiveMatchFinished(m);
}

function onHalfTime(m) {
  stopMatchTimer();
  AudioFX.playWhistle();
  const sc = `${m.home.name} ${m.score.home}–${m.score.away} ${m.away.name}`;
  addLogLine(`⏸ HALF TIME · ${sc}`, 'log-line log-info');
  setStatus('HALF TIME', 'var(--accent-gold)');
  const clock = document.getElementById('match-clock');
  if (clock) clock.innerText = 'HT';
  try { PitchViz.setPhase('ht'); } catch (e) {}
  const s = m.sides[m.userKey];
  const mine = m.score[m.userKey], theirs = m.score[otherKey(m.userKey)];
  const benchAvail = s.benchList.some(p => p && !s.usedOff.has(p.id));
  // Auto-popup is rare: only when 2+ goals down, or several starters are in terrible form (🟥🟥).
  // A red card also opens it. Everything else is up to the player via the SUBS button. Injuries still force their own popup.
  const terribleForm = Object.values(s.xi).filter(p => p && getPlayerForm(p) !== null && getPlayerForm(p) < FORM_RED_RED_BELOW).length;
  const needs = s.subsMade < MAX_SUBS && benchAvail &&
                (theirs - mine >= HT_POPUP_GOALS_DOWN || terribleForm >= HT_POPUP_BAD_FORM_PLAYERS || s.reds > 0);
  if (needs && !isSimPaused) setTimeout(() => { if (liveMatch === m && m.phase === 'ht' && !subsModalOpen) openSubsModal('ht'); }, 900);
  else updateRunState();
}

function startSecondHalf() {
  const m = liveMatch;
  htTimer = null;
  if (!m || m.phase !== 'ht') return;
  startSecondHalfState(m);
  try { PitchViz.setPhase('live'); } catch (e) {}
  AudioFX.playWhistle();
  addLogLine('▶️ Second half underway', 'log-line log-info');
  setStatus('LIVE · 2ND HALF');
  updateRunState();
}

function runAutoSimLoop() {
  stopAllSimTimers();
  liveMatch = null;
  gapTimer = setTimeout(startMatchday, 600);
}

let awaitingContinue = false;

function scheduleNextMatch() {
  updateScoutLine();
  clearTimeout(gapTimer); gapTimer = null;
  stopCountdown();
  if (isSimPaused || subsModalOpen || awaitingContinue) return;
  if (currentRoundIdx >= fixtures.length) {
    safeRemove('calcio_active_campaign');
    gapTimer = setTimeout(showPostSeason, 1500);
    return;
  }
  const d = gapMs();
  startCountdown(d);
  gapTimer = setTimeout(startMatchday, d);
}

function startMatchday() {
  gapTimer = null;
  if (isSimPaused || subsModalOpen || awaitingContinue) return;
  if (currentRoundIdx >= fixtures.length) { scheduleNextMatch(); return; }
  stopCountdown();

  // Squad news: only interrupt if a banned/injured player is in the XI (never in Iron Manager)
  if (unavailableStarters().length && prematchRound !== currentRoundIdx && !ironLocked()) {
    prematchRound = currentRoundIdx;
    openSubsModal('prematch');
    return;
  }
  const swaps = autoSwapUnavailable();

  const m = prepareMatchday(true);
  if (!m) { currentRoundIdx++; scheduleNextMatch(); return; }
  m.onEvent = handleLiveEvent; m.onChance = pitchOnChance;
  liveMatch = m;
  beginLiveUI(m, `MATCHDAY ${currentRoundIdx + 1} OF 38`, swaps);
}

function beginLiveUI(m, tag, swaps) {
  document.getElementById('sim-title').innerText = tag.replace(' OF ', ' / ');
  const oppT = m.userKey ? m.sides[otherKey(m.userKey)].team : null;
  document.getElementById('broadcast-round-tag').innerText = tag + (m.derby ? ' · 🔥 DERBY' : '') + (oppT && oppT.style ? ' · ' + styleLabel(oppT).toUpperCase() : '');
  updateScoutLine();
  document.getElementById('home-badge').innerText = m.home.badge;
  document.getElementById('home-name').innerText = m.home.name;
  document.getElementById('away-badge').innerText = m.away.badge;
  document.getElementById('away-name').innerText = m.away.name;
  document.getElementById('live-score').innerText = '0 - 0';
  document.getElementById('match-event-log').innerHTML = '';
  hideResultBanner();
  try { PitchViz.beginMatch(m); } catch (e) {}
  document.getElementById('sim-progress-fill').style.width = '0%';
  hideReportCard();
  setStatus('LIVE · 1ST HALF');
  const clock = document.getElementById('match-clock');
  if (clock) clock.innerText = "0'";
  (swaps || []).forEach(w => addLogLine(`🔄 Auto-swap: ${w.on.name} starts for ${availabilityTag(w.off)} ${w.off.name}`, 'log-line log-sub'));
  if (m.derby) addLogLine('🔥 DERBY! Tempers are running high.', 'log-line log-pen');
  addLogLine('▶️ Kick-off!', 'log-line log-info');
  AudioFX.playWhistle();
  renderLiveStats(m);
  updateSubsButton();
  updateRunState();
}

function onLiveMatchFinished(m) {
  stopMatchTimer();
  if (m.cup) { onCupMatchFinished(m); return; }
  const report = finalizeMatchday(m);
  liveMatch = null;

  AudioFX.playWhistle();
  updateStandingsTable();
  updateSimBenchStrip();
  updateFormationButtons();
  renderLiveStats(m);
  updateSubsButton();
  setStatus('FULL TIME', 'var(--accent-blue)');
  const clock = document.getElementById('match-clock');
  if (clock) clock.innerText = 'FT';
  document.getElementById('sim-progress-fill').style.width = '100%';

  const sc = `${m.home.name} ${m.score.home} - ${m.score.away} ${m.away.name}`;
  addLogLine(`⏱ FULL TIME · ${sc}`, 'log-line log-info');
  if (report.motm) {
    const side = m.sides[report.motm.k];
    addLogLine(`⭐ Man of the Match: ${report.motm.app.p.name} (${side.team.name}) — ${report.motm.rating.toFixed(1)}`, 'log-line log-motm');
  }
  renderReportCard(m, report);
  try { PitchViz.setPhase('ft'); showResultBanner(m); } catch (e) {}
  const mine = m.score[m.userKey], theirs = m.score[otherKey(m.userKey)];
  if (mine > theirs) buzz([60, 40, 60, 40, 200]);
  awaitingContinue = true;
  attachContinueButton();
}

function nextFixtureLine() {
  if (currentRoundIdx >= fixtures.length) return null;
  const f = (fixtures[currentRoundIdx] || []).find(x => x.home.isUser || x.away.isUser);
  if (!f) return null;
  const home = f.home.isUser;
  const opp = home ? f.away : f.home;
  const derby = isDerbyPair(f.home, f.away);
  ensureAiIdentity(opp);
  return `${derby ? '🔥 DERBY · ' : ''}${home ? 'Home' : 'Away'} vs ${opp.badge || ''} ${opp.name} · ${styleLabel(opp)}`;
}

function attachContinueButton() {
  updateScoutLine();
  const el = document.getElementById('report-card');
  if (!el) return;
  const last = currentRoundIdx >= fixtures.length;
  const nxt = nextFixtureLine();
  if (nxt) {
    const row = document.createElement('div');
    row.innerHTML = `➡️ <b>Next:</b> ${nxt}`;
    el.appendChild(row);
  }
  const btn = document.createElement('button');
  btn.className = 'rc-continue';
  btn.innerText = last ? 'SEASON SUMMARY ▶' : 'CONTINUE ▶';
  btn.onclick = continueAfterReport;
  el.appendChild(btn);
  el.style.display = 'flex';
  el.scrollTop = 0;
  const log = document.getElementById('match-event-log');
  if (log) log.scrollTop = log.scrollHeight;
  stopCountdown();
}

function continueAfterReport() {
  AudioFX.playClick();
  if (!awaitingContinue) return;
  awaitingContinue = false;
  if (currentRoundIdx >= fixtures.length) {
    safeRemove('calcio_active_campaign');
    showPostSeason();
    return;
  }
  hideReportCard();
  if (!isSimPaused) startMatchday();
}

function cyclePace() {
  AudioFX.playClick();
  currentPaceIdx = (currentPaceIdx + 1) % paceOptions.length;
  syncPaceLabels();
  if (liveMatch) updateRunState();
  else if (!isSimPaused && !subsModalOpen && gapTimer) scheduleNext();
}

function toggleSimPause(evt) {
  if (challengeMode === 'iron') { ironToast(); return; }
  AudioFX.playClick();
  isSimPaused = !isSimPaused;
  const btn = (evt && evt.currentTarget) || document.getElementById('pause-btn');
  if (isSimPaused) {
    btn.innerText = "RESUME ▶️";
    btn.style.background = "var(--accent-blue)";
    stopMatchTimer();
    clearTimeout(htTimer); htTimer = null;
    clearTimeout(gapTimer); gapTimer = null;
    stopCountdown();
  } else {
    btn.innerText = "PAUSE ⏸️";
    btn.style.background = "#1e293b";
    if (liveMatch) updateRunState();
    else scheduleNext();
  }
}

function fastForwardSeason() {
  AudioFX.playClick();
  awaitingContinue = false;
  if (cup && cup.active) { fastForwardCup(); return; }
  stopAllSimTimers();
  const modal = document.getElementById('halftime-modal');
  if (modal) modal.classList.remove('active');
  subsModalOpen = false;
  _pendingSlot = null;

  if (liveMatch) {
    const m = liveMatch;
    m.live = false;
    m.onEvent = null;
    liveMatch = null;
    runToEnd(m);
    finalizeMatchday(m);
  }
  while (currentRoundIdx < fixtures.length) runSilentMatchday();
  safeRemove('calcio_active_campaign');
  updateStandingsTable();
  setTimeout(showPostSeason, 400);
}

// ---------------------------------------------------------------------------
// Substitutions / lineup modal (live subs during a match, free lineup changes between matches)
// ---------------------------------------------------------------------------
function subsContext() {
  if (liveMatch) {
    const m = liveMatch;
    const s = m.sides[m.userKey];
    return { live: true, m, s, xi: s.xi, benchArr: s.benchList, subsLeft: MAX_SUBS - s.subsMade };
  }
  return { live: false, xi: squad, benchArr: bench, subsLeft: Infinity };
}

function manualOpenSubs() {
  if (ironLocked()) { ironToast(); return; }
  AudioFX.playClick();
  const ctx = subsContext();
  if (!ctx.benchArr.some(Boolean)) {
    alert("You have no bench players. Draft some first.");
    return;
  }
  openSubsModal('manual');
}

function openSubsModal(mode) {
  _subsMode = mode;
  _pendingSlot = null;
  if (mode === 'injury' && liveMatch && liveMatch.pendingForced) _pendingSlot = liveMatch.pendingForced.slot;
  subsModalOpen = true;
  stopMatchTimer();
  clearTimeout(htTimer); htTimer = null;
  if (!liveMatch) { clearTimeout(gapTimer); gapTimer = null; stopCountdown(); }
  renderHalftimeModal();
  document.getElementById('halftime-modal').classList.add('active');
}

function renderHalftimeModal() {
  const body = document.getElementById('ht-modal-body');
  const title = document.getElementById('ht-modal-title');
  if (!body) return;
  const ctx = subsContext();
  const m = ctx.m;

  if (_subsMode === 'injury' && m && m.pendingForced) {
    const inj = ctx.xi[m.pendingForced.slot];
    title.innerText = `🚑 Injury — ${inj ? inj.name : 'player'} must come off`;
  } else if (_subsMode === 'ht' && m) {
    title.innerText = `Half-time · ${m.home.name} ${m.score.home}–${m.score.away} ${m.away.name}`;
  } else if (_subsMode === 'prematch') {
    title.innerText = '📰 Squad news — unavailable starters';
  } else if (ctx.live) {
    title.innerText = `Substitutions (${ctx.subsLeft}/${MAX_SUBS} left)`;
  } else {
    title.innerText = 'Lineup — free changes between matches';
  }

  const forcedSlot = (_subsMode === 'injury' && m && m.pendingForced) ? m.pendingForced.slot : null;
  const benchOk = ctx.benchArr.some((p, i) => p && !(ctx.live && ctx.s.usedOff.has(p.id)));
  const canSub = ctx.subsLeft > 0 && benchOk;

  let html = '';
  if (ctx.live) html += `<div class="ht-subs-remaining">Subs remaining: ${ctx.subsLeft} / ${MAX_SUBS}</div>`;
  html += `<div class="ht-section-title">On Pitch</div>`;
  for (const [slotKey, player] of Object.entries(ctx.xi)) {
    if (!player) continue;
    const isPending = _pendingSlot === slotKey;
    const injured = ctx.live && ctx.s.playOn.has(player.id);
    const cls = isPending ? 'pending' : 'on-pitch';
    html += `
      <div class="ht-player-row ${cls}">
        <div class="ht-player-meta">
          <span class="ht-name">${forcedSlot === slotKey ? '🚑 ' : ''}${player.name}</span>
          <span class="ht-sub">${slotKey} · ${player.ovr} OVR ${getFormBadge(player)}${injured ? ' · injured (−' + INJURED_PLAY_ON_PENALTY + ')' : ''}${isUnavailable(player) ? ' · <b style="color:var(--accent-red)">' + availabilityTag(player) + '</b>' : ''}</span>
        </div>
        <button class="ht-btn ${canSub ? '' : 'disabled'}" ${canSub ? `onclick="htSelectPitchPlayer('${slotKey}')"` : 'disabled'}>
          ${isPending ? 'Selected' : 'Sub Off'}
        </button>
      </div>`;
  }

  html += `<div class="ht-section-title">Bench</div>`;
  ctx.benchArr.forEach((p, i) => {
    if (!p) return;
    const usedOff = ctx.live && ctx.s.usedOff.has(p.id);
    const unavail = isUnavailable(p);
    const enabled = !!_pendingSlot && !usedOff && !unavail && ctx.subsLeft > 0;
    let warn = '';
    if (_pendingSlot) {
      const pen = fitPenalty(p.pos, baseOf(_pendingSlot));
      if (pen > 0) warn = ` · ⚠ out of position (−${pen})`;
    }
    html += `
      <div class="ht-player-row ${usedOff ? 'subbed' : 'on-bench'}">
        <div class="ht-player-meta">
          <span class="ht-name">${p.name}</span>
          <span class="ht-sub">${p.pos} · ${p.ovr} OVR ${getFormBadge(p)}${usedOff ? ' · already subbed off' : (unavail ? ' · <b style="color:var(--accent-red)">' + availabilityTag(p) + '</b>' : warn)}</span>
        </div>
        <button class="ht-btn ${enabled ? '' : 'disabled'}" ${enabled ? `onclick="htApplySub(${i})"` : 'disabled'}>
          ${usedOff ? 'Off' : (unavail ? 'Out' : (enabled ? 'Sub On' : 'Pick XI first'))}
        </button>
      </div>`;
  });

  const label = forcedSlot ? 'PLAY ON (INJURED) ▶' : (ctx.live ? 'CONTINUE MATCH ▶' : (_subsMode === 'prematch' ? 'KICK OFF ▶ (auto-swaps anyone left out)' : 'DONE ✓'));
  html += `<button class="ht-continue" onclick="closeHalftimeModal()">${label}</button>`;
  body.innerHTML = html;
}

function htSelectPitchPlayer(slotKey) {
  AudioFX.playClick();
  _pendingSlot = slotKey;
  renderHalftimeModal();
}

function htApplySub(benchIdx) {
  if (!_pendingSlot) return;
  const ctx = subsContext();
  const slot = _pendingSlot;
  if (ctx.live) {
    if (!doSubstitution(ctx.m, ctx.m.userKey, slot, benchIdx)) return;
    updateSubsButton();
  } else {
    const off = squad[slot], on = bench[benchIdx];
    if (!off || !on || isUnavailable(on)) return;
    squad[slot] = on;
    bench[benchIdx] = off;
    saveActiveCampaignState();
  }
  AudioFX.playClick();
  _pendingSlot = null;
  updateSimBenchStrip();
  if (_subsMode === 'injury' && !(liveMatch && liveMatch.pendingForced)) { closeHalftimeModal(); return; }
  renderHalftimeModal();
}

function closeHalftimeModal() {
  const m = liveMatch;
  if (m && m.pendingForced) {
    const s = m.sides[m.pendingForced.key];
    const p = s.xi[m.pendingForced.slot];
    if (p) {
      s.playOn.add(p.id);
      s.dirty = true;
      emit(m, { type: 'info', text: `⚠️ ${matchLabel(m)} ${p.name} plays on despite the injury` });
    }
    m.pendingForced = null;
  }
  document.getElementById('halftime-modal').classList.remove('active');
  subsModalOpen = false;
  _pendingSlot = null;
  updateSubsButton();
  updateSimBenchStrip();
  if (m) {
    if (m.phase === 'ht') startSecondHalf(); else updateRunState();
  } else if (!isSimPaused) {
    if (_subsMode === 'prematch') { if (cup && cup.active) startCupMatch(); else startMatchday(); }
    else scheduleNext();
  }
}

function updateSimBenchStrip() {
  const el = document.getElementById('sim-bench-list');
  if (!el) return;
  const list = liveMatch && liveMatch.userKey ? liveMatch.sides[liveMatch.userKey].benchList : bench;
  const names = list.filter(Boolean).map(p => p.name);
  el.innerText = names.length === 0 ? "Empty" : names.join(" · ");
}

function setStatsToPlaceholder() {}

function clearRevealTimers() {}
function updateStandingsTable() {
  const sorted = [...leagueTeams].sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });

  let tbodyHtml = '';
  sorted.forEach((t, idx) => {
    let zoneClass = '';
    if (idx < 4) zoneClass = 'ucl-zone';
    else if (idx < 6) zoneClass = 'uel-zone';
    else if (idx >= sorted.length - 3) zoneClass = 'rel-zone';

    tbodyHtml += `
      <tr class="${t.isUser ? 'user-row' : ''} ${zoneClass}">
        <td>${idx + 1}</td>
        <td>${t.badge} ${t.name}</td>
        <td>${t.p}</td>
        <td>${t.w}</td>
        <td>${t.d}</td>
        <td>${t.l}</td>
        <td><strong>${t.pts}</strong></td>
      </tr>
    `;
  });
  document.getElementById('standings-body').innerHTML = tbodyHtml;
  const ui = sorted.findIndex(t => t.isUser), tp = document.getElementById('tab-pos');
  if (tp && ui >= 0) tp.innerText = `#${ui + 1} · ${sorted[ui].pts} pts`;
}

function calculateSeasonRating(u, rank) {
  let score = (u.pts / 114) * 55;
  const gd = u.gf - u.ga;
  score += Math.max(-10, Math.min(20, gd * 0.4));

  if (rank === 1) score += 20;
  else if (rank <= 4) score += 14;
  else if (rank <= 6) score += 8;
  else if (rank > 17) score -= 15;

  score += (u.chemBonus || 0) * 1.5;
  if ((window.__lastHarmonyBonus || 1.0) > 1.0) score += 5;

  const finalRating = Math.max(10, Math.min(99, Math.round(score)));

  let grade = 'D';
  if (finalRating >= 90) grade = 'S+';
  else if (finalRating >= 84) grade = 'S';
  else if (finalRating >= 75) grade = 'A';
  else if (finalRating >= 65) grade = 'B';
  else if (finalRating >= 50) grade = 'C';

  return { finalRating, grade };
}

function calculateValueRating(squadValue) {
  const savings = Math.max(0, MAX_CAP - squadValue);
  const savingsPct = savings / MAX_CAP;

  let grade = 'D';
  if (savingsPct >= 0.40) grade = 'S+';
  else if (savingsPct >= 0.30) grade = 'S';
  else if (savingsPct >= 0.20) grade = 'A';
  else if (savingsPct >= 0.10) grade = 'B';
  else if (savingsPct >= 0.05) grade = 'C';

  return { grade, savingsPct, savings };
}

function showPostSeason() {
  stopAllSimTimers();
  liveMatch = null;

  const sorted = [...leagueTeams].sort((a,b) => b.pts - a.pts);
  const userRank = sorted.findIndex(t => t.isUser) + 1;

  document.getElementById('screen-sim').classList.remove('active');
  document.getElementById('screen-post').classList.add('active');

  const trophyEl = document.getElementById('trophy-symbol');
  let cupEmoji = "🏆";
  let cupColor = "#fbbf24";
  let titleText = "CAMPIONI D'ITALIA!";

  if (userRank === 1) {
    cupEmoji = "🏆"; cupColor = "#fbbf24"; titleText = "SCUDETTO CHAMPIONS! 🥇";
  } else if (userRank === 2) {
    cupEmoji = "🥈"; cupColor = "#e2e8f0"; titleText = "SERIE A RUNNERS-UP 🥈";
  } else if (userRank === 3) {
    cupEmoji = "🥉"; cupColor = "#d97706"; titleText = "TOP 3 PODIUM FINISH! 🥉";
  } else if (userRank <= 6) {
    cupEmoji = "🎖️"; cupColor = "#38bdf8"; titleText = `EUROPEAN QUALIFICATION · #${userRank}`;
  } else {
    cupEmoji = "🏅"; cupColor = "#94a3b8"; titleText = `FINISHED #${userRank} IN SERIE A`;
  }

  trophyEl.innerText = cupEmoji;
  trophyEl.style.color = cupColor;
  document.getElementById('season-result-title').innerText = titleText;

  if (userRank <= 3) triggerTickerTape();
  hideReportCard();
  showCupBox(false);

  const u = leagueTeams.find(t => t.isUser);
  const { finalRating, grade } = calculateSeasonRating(u, userRank);

  let topScorer = { name: "None", goals: 0 };
  for (const [name, goals] of Object.entries(userSquadGoals)) {
    if (goals > topScorer.goals) topScorer = { name, goals };
  }

  let topMotm = { name: "None", n: 0 };
  for (const [name, n] of Object.entries(userMotm)) if (n > topMotm.n) topMotm = { name, n };

  const squadValue = Object.values(squad).filter(Boolean).reduce((s, p) => s + p.value, 0)
                   + bench.filter(Boolean).reduce((s, p) => s + p.value, 0);
  const valueRating = calculateValueRating(squadValue);

  document.getElementById('season-rating-score').innerText = finalRating;
  document.getElementById('season-rating-grade').innerText = grade;

  const gd = u.gf - u.ga;
  const pointsPerGame = (u.pts / (u.p || 1)).toFixed(2);
  const winPct = u.p > 0 ? Math.round((u.w / u.p) * 100) : 0;
  const gdString = gd >= 0 ? `+${gd}` : `${gd}`;

  document.getElementById('season-summary-stats').innerHTML = `
    <div class="summary-row">
      <div class="summary-cell"><span class="cell-lbl">CLUB</span><span class="cell-val">${userClub.badge} ${userClub.name}</span></div>
    </div>
    <div class="summary-grid">
      <div class="summary-cell"><span class="cell-lbl">POSITION</span><span class="cell-val">#${userRank}</span></div>
      <div class="summary-cell"><span class="cell-lbl">POINTS</span><span class="cell-val">${u.pts}</span></div>
      <div class="summary-cell"><span class="cell-lbl">WIN %</span><span class="cell-val">${winPct}%</span></div>
      <div class="summary-cell"><span class="cell-lbl">RECORD</span><span class="cell-val">${u.w}W-${u.d}D-${u.l}L</span></div>
      <div class="summary-cell"><span class="cell-lbl">GOALS FOR</span><span class="cell-val">${u.gf}</span></div>
      <div class="summary-cell"><span class="cell-lbl">GOALS AGAINST</span><span class="cell-val">${u.ga}</span></div>
      <div class="summary-cell"><span class="cell-lbl">GOAL DIFF</span><span class="cell-val" style="color:${gd >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${gdString}</span></div>
      <div class="summary-cell"><span class="cell-lbl">PPG</span><span class="cell-val">${pointsPerGame}</span></div>
    </div>
    <div class="summary-row" style="border-top:1px solid #1e293b; padding-top:8px; margin-top:4px;">
      <div class="summary-cell"><span class="cell-lbl">💰 BUDGET REPORT</span></div>
    </div>
    <div class="summary-grid">
      <div class="summary-cell"><span class="cell-lbl">SPENT</span><span class="cell-val">€${squadValue}M / €${MAX_CAP}M</span></div>
      <div class="summary-cell"><span class="cell-lbl">SAVED</span><span class="cell-val">€${Math.round(valueRating.savings)}M</span></div>
      <div class="summary-cell"><span class="cell-lbl">VALUE RATING</span><span class="cell-val" style="color:var(--accent-gold)">${valueRating.grade}</span></div>
      <div class="summary-cell"><span class="cell-lbl">EFFICIENCY BONUS</span><span class="cell-val" style="color:var(--accent-green)">+${Math.min(8, valueRating.savingsPct * 15).toFixed(1)}%</span></div>
    </div>
    <div class="summary-row">
      <div class="summary-cell"><span class="cell-lbl">TOP SCORER</span><span class="cell-val">${topScorer.name} — ${topScorer.goals} goals</span></div>
    </div>
    <div class="summary-row">
      <div class="summary-cell"><span class="cell-lbl">© CAPTAIN</span><span class="cell-val">${captainName() || 'None'} — ${userSquadGoals[captainName()] || 0} goals</span></div>
    </div>
    ${finalizeObjectives()}
    <div class="summary-row">
      <div class="summary-cell"><span class="cell-lbl">🎮 MODE</span><span class="cell-val">${currentChallenge().icon} ${currentChallenge().name}</span></div>
    </div>
    <div class="summary-row">
      <div class="summary-cell"><span class="cell-lbl">⭐ MOST MAN OF THE MATCH</span><span class="cell-val">${topMotm.name} — ${topMotm.n}×</span></div>
    </div>
  `;

  latestShareData = {
    name: userClub.name,
    badge: userClub.badge,
    rank: `#${userRank}`,
    pts: u.pts,
    record: `${u.w}W-${u.d}D-${u.l}L`,
    topScorer: `${topScorer.name} (${topScorer.goals}G)`,
    grade: grade,
    rating: finalRating,
    valueGrade: valueRating.grade,
    valueSavings: Math.round(valueRating.savings),
    squadValue: squadValue,
    squad: Object.values(squad).map(p => p ? `${p.pos}: ${p.name} (${p.ovr})` : ''),
    gf: u.gf, ga: u.ga, gd: u.gf - u.ga, ppg: pointsPerGame, winPct: winPct,
    title: titleText, rankNum: userRank,
    captain: captainName() || '', captainGoals: userSquadGoals[captainName()] || 0,
    motm: topMotm.n ? `${topMotm.name} (${topMotm.n}x)` : '',
    mode: currentChallenge().icon + ' ' + currentChallenge().name,
    formation: currentFormation,
    xi: (FORMATIONS[currentFormation] || FORMATIONS['4-3-3']).rows.map(row => row.map(k => {
      const p = squad[k]; if (!p) return null;
      const t = traitOf(p);
      return { name: p.name, pos: p.pos, ovr: p.ovr, trait: t ? t.icon : '' };
    })),
    objDone: objectives ? objectiveStatus(true).filter(o => o.main ? o.done : (o.done && !o.failed)).length : 0,
    objTotal: objectives ? objectives.extras.length + 1 : 0
  };

  let seasonCount = 1;
  try {
    const h = JSON.parse(localStorage.getItem('calcio_career_history')) || [];
    seasonCount = h.length + 1;
  } catch(e) {}

  let seasonsDone = 1;
  try { seasonsDone = (JSON.parse(localStorage.getItem('calcio_career_history')) || []).length + 1; } catch (e) {}
  checkSeasonAchievements(u, userRank, squadValue, seasonsDone);
  setupEuropeCard(userRank);

  saveAndRenderCareerHistory({
    season: seasonCount,
    finish: `#${userRank}`,
    pts: u.pts,
    rating: finalRating,
    grade: grade,
    w: u.w, d: u.d, l: u.l,
    gf: u.gf, ga: u.ga,
    valueGrade: valueRating.grade
  });

  if (userRank === 1) AudioFX.playGoalCheer();
}

function saveAndRenderCareerHistory(newEntry) {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('calcio_career_history')) || [];
  } catch(e) { history = []; }

  history.push(newEntry);
  try {
    localStorage.setItem('calcio_career_history', JSON.stringify(history));
  } catch(e) {}

  const listEl = document.getElementById('career-history-list');
  listEl.innerHTML = '';

  let sumRating = 0;
  let sumPts = 0;
  history.forEach(h => {
    sumRating += h.rating || 0;
    sumPts += h.pts || 0;
  });
  const avgRating = Math.round(sumRating / history.length);
  const recent = history.slice().reverse().slice(0, 5);

  recent.forEach(h => {
    const row = document.createElement('div');
    row.className = 'career-row';
    row.innerHTML = `
      <span class="career-season">S${h.season}</span>
      <span class="career-finish">${h.finish}</span>
      <span class="career-pts">${h.pts} pts</span>
      <span class="career-rating">${h.rating} <span class="career-grade">(${h.grade})</span></span>
      <span class="career-value">${h.valueGrade || '—'}</span>
    `;
    listEl.appendChild(row);
  });

  if (history.length > 0) {
    const totalsRow = document.createElement('div');
    totalsRow.className = 'career-row career-totals';
    totalsRow.innerHTML = `
      <span class="career-season">TOTAL</span>
      <span class="career-finish">${history.length} seasons</span>
      <span class="career-pts">${sumPts} pts</span>
      <span class="career-rating">${avgRating} avg</span>
      <span class="career-value">—</span>
    `;
    listEl.appendChild(totalsRow);
  }

  document.getElementById('career-avg-score').innerText = avgRating;
  document.getElementById('career-season-count').innerText = `${history.length} SEASON${history.length !== 1 ? 'S' : ''}`;
}

function isMobileDevice() {
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
}

function shareText(d) {
  return `⚽ CALCIO LEAGUE 2026/27 ⚽\n${d.badge} ${d.name}\nFinished ${d.rank} · ${d.pts} pts · ${d.record}\n` +
    `⭐ Season Rating: ${d.rating} (${d.grade})\n🥇 Top Scorer: ${d.topScorer}\n#CalcioGame #SerieA`;
}

function europeLineForShare() {
  if (!cup || !cup.finished) return '';
  const name = cup.comp === 'UCL' ? 'Champions League' : 'Europa League';
  if (cup.champion) return `🏆 ${name.toUpperCase()} WINNERS`;
  return `🌍 ${name}: out in the ${cup.eliminatedIn || 'knockouts'}`;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Draws a 1080x1920 story-format card. Keeps key content inside the Instagram/Snapchat safe zone (y 230..1690).
function renderShareCanvas(d) {
  const W = 1080, H = 1920;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const font = (w, px) => `${w} ${px}px -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  const gold = d.rankNum === 1 ? '#fbbf24' : (d.rankNum <= 4 ? '#38bdf8' : '#94a3b8');

  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1220'); bg.addColorStop(0.5, '#0f2a1d'); bg.addColorStop(1, '#070b14');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // pitch lines
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 6;
  g.strokeRect(60, 300, W - 120, H - 600);
  g.beginPath(); g.moveTo(60, H / 2); g.lineTo(W - 60, H / 2); g.stroke();
  g.beginPath(); g.arc(W / 2, H / 2, 150, 0, Math.PI * 2); g.stroke();

  g.textAlign = 'center';
  g.fillStyle = '#38bdf8'; g.font = font('900', 44); g.fillText('CALCIO LEAGUE 2026/27', W / 2, 290);

  g.font = font('400', 150); g.fillStyle = '#fff';
  const cupEmoji = d.rankNum === 1 ? '🏆' : d.rankNum === 2 ? '🥈' : d.rankNum === 3 ? '🥉' : '🏅';
  g.fillText(cupEmoji, W / 2, 450);
  g.fillStyle = gold; g.font = font('900', 58);
  const title = (d.title || '').replace(/[🥇🥈🥉🏆🎖️🏅]/gu, '').trim();
  g.fillText(title, W / 2, 540);

  g.fillStyle = '#fff'; g.font = font('800', 56); g.fillText(`${d.badge} ${d.name}`, W / 2, 630);

  // grade strip
  rr(g, 90, 680, W - 180, 190, 28); g.fillStyle = 'rgba(15,23,42,0.85)'; g.fill(); g.lineWidth = 5; g.strokeStyle = gold; g.stroke();
  const cols = [['SEASON RATING', String(d.rating)], ['TIER GRADE', String(d.grade)], ['VALUE', String(d.valueGrade)]];
  cols.forEach((col, i) => {
    const x = 90 + (W - 180) * (i + 0.5) / 3;
    g.fillStyle = '#38bdf8'; g.font = font('900', 80); g.fillText(col[1], x, 790);
    g.fillStyle = '#94a3b8'; g.font = font('800', 24); g.fillText(col[0], x, 835);
  });

  // stat grid
  const stats = [['POSITION', d.rank], ['POINTS', String(d.pts)], ['RECORD', d.record],
                 ['GOALS FOR', String(d.gf)], ['GOALS AGAINST', String(d.ga)], ['GOAL DIFF', (d.gd >= 0 ? '+' : '') + d.gd]];
  stats.forEach((st, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 90 + (W - 180) * (col + 0.5) / 3, y = 940 + row * 125;
    g.fillStyle = '#fff'; g.font = font('900', 50); g.fillText(st[1], x, y + 40);
    g.fillStyle = '#94a3b8'; g.font = font('800', 22); g.fillText(st[0], x, y + 76);
  });

  // lines of text
  let y = 1215;
  const line = (txt, color) => { g.fillStyle = color || '#e2e8f0'; g.font = font('800', 34); g.fillText(txt, W / 2, y); y += 52; };
  line(`🥇 Top scorer: ${d.topScorer}`);
  if (d.captain && d.captainGoals > 0) line(`© Captain ${d.captain}: ${d.captainGoals} goals`);
  if (d.objTotal) line(`🎯 Board objectives: ${d.objDone} of ${d.objTotal}`, '#fbbf24');
  const eu = europeLineForShare(); if (eu) line(eu, '#38bdf8');

  // XI by line (attack at top)
  y = Math.max(y + 20, 1420);
  g.fillStyle = '#94a3b8'; g.font = font('900', 24); g.fillText(`STARTING XI · ${d.formation}`, W / 2, y); y += 48;
  (d.xi || []).forEach(row => {
    const names = row.filter(Boolean);
    g.font = font('800', 30); g.fillStyle = '#e2e8f0';
    const txt = names.map(p => `${p.trait ? p.trait + ' ' : ''}${p.name}`).join('   ·   ');
    let size = 30; while (g.measureText(txt).width > W - 140 && size > 20) { size--; g.font = font('800', size); }
    g.fillText(txt, W / 2, y); y += 46;
  });

  g.fillStyle = '#fbbf24'; g.font = font('900', 36); g.fillText('Think you can beat it?', W / 2, 1745);
  g.fillStyle = '#64748b'; g.font = font('700', 26);
  g.fillText((location.protocol.startsWith('http') ? location.host + location.pathname.replace(/index\.html$/, '') : 'Calcio League'), W / 2, 1790);
  return c;
}

let _shareBlob = null, _shareUrl = null;

function shareToStory() {
  AudioFX.playClick();
  const d = latestShareData;
  if (!d || !d.name) { alert("No season data to share yet."); return; }
  let canvas;
  try { canvas = renderShareCanvas(d); } catch (e) { openShareModal(shareText(d)); return; }
  const finish = (blob) => {
    if (!blob) { openShareModal(shareText(d)); return; }
    if (_shareUrl) URL.revokeObjectURL(_shareUrl);
    _shareBlob = blob; _shareUrl = URL.createObjectURL(blob);
    openShareImageModal(d);
  };
  try { canvas.toBlob(finish, 'image/png'); } catch (e) { openShareModal(shareText(d)); }
}

function openShareImageModal(d) {
  closeOverlay('share-img-modal');
  const canNative = isMobileDevice() && navigator.share && navigator.canShare &&
    navigator.canShare({ files: [new File([_shareBlob], 'calcio-season.png', { type: 'image/png' })] });
  const body = `
    <div style="text-align:center;">
      <img src="${_shareUrl}" alt="Season card" style="max-width:100%;max-height:52vh;border-radius:12px;border:1px solid #1e293b;">
      <div class="picker-hint" style="margin:8px 0;">${canNative ? 'Tap Share, then pick Instagram or Snapchat Stories.' : 'Save the image, then post it to your story or send it to a mate.'}</div>
      <div style="display:flex;gap:8px;">
        ${canNative ? `<button class="btn-select" style="flex:1;padding:12px;" onclick="shareImageNative()">📤 SHARE</button>` : ''}
        <button class="btn-select" style="flex:1;padding:12px;background:${canNative ? '#334155' : 'var(--accent-green)'};" onclick="downloadShareImage()">⬇ SAVE IMAGE</button>
      </div>
      <button class="btn-select" style="width:100%;margin-top:8px;padding:10px;background:#1e293b;color:#fff;" onclick="openShareModal(shareText(latestShareData))">📋 Share as text instead</button>
    </div>`;
  openOverlay('share-img-modal', '📸 Share Your Season', body);
}

function shareImageNative() {
  AudioFX.playClick();
  const file = new File([_shareBlob], 'calcio-season.png', { type: 'image/png' });
  navigator.share({ files: [file], title: 'My Calcio Season', text: shareText(latestShareData) })
    .catch(err => { if (err && err.name !== 'AbortError') downloadShareImage(); });
}

function downloadShareImage() {
  AudioFX.playClick();
  const a = document.createElement('a');
  a.href = _shareUrl; a.download = 'calcio-season.png';
  document.body.appendChild(a); a.click(); a.remove();
}

function openShareModal(text, note) {
  const existing = document.getElementById('share-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'share-modal';
  overlay.style.cssText = `
    position: absolute; inset: 0; background: rgba(3, 7, 18, 0.94);
    backdrop-filter: blur(4px); display: flex; flex-direction: column;
    z-index: 300; padding: 16px; gap: 12px;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    background: #0d1527; border: 1px solid #1e293b; border-radius: 12px;
    padding: 14px; display: flex; flex-direction: column; gap: 10px;
    width: 100%; max-width: 360px; margin: auto;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  `;

  const title = document.createElement('div');
  title.innerText = "📸 SHARE YOUR SEASON";
  title.style.cssText = "font-weight: 900; color: var(--accent-blue); font-size: 0.85rem; letter-spacing: 1px; text-align: center;";

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.readOnly = true;
  ta.style.cssText = `
    width: 100%; min-height: 160px; background: #090e1a; color: #e2e8f0;
    border: 1px solid #1e293b; border-radius: 8px; padding: 10px;
    font-size: 0.75rem; font-family: monospace; resize: none; outline: none;
    user-select: text; -webkit-user-select: text;
  `;

  const noteEl = document.createElement('div');
  if (note) {
    noteEl.innerText = note;
    noteEl.style.cssText = "color: var(--accent-green); font-size: 0.68rem; font-weight: 800; text-align: center;";
  }

  const btnRow = document.createElement('div');
  btnRow.style.cssText = "display: flex; gap: 8px;";

  const copyBtn = document.createElement('button');
  copyBtn.innerText = "📋 COPY TEXT";
  copyBtn.style.cssText = `
    flex: 1; background: var(--accent-green); color: #020409; border: none;
    padding: 10px; border-radius: 8px; font-weight: 900; font-size: 0.8rem;
    cursor: pointer;
  `;
  copyBtn.onclick = () => {
    AudioFX.playClick();
    ta.select();
    ta.setSelectionRange(0, 99999);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch(e) {}
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        noteEl.innerText = "Copied to clipboard!";
      }).catch(() => {
        noteEl.innerText = ok ? "Copied!" : "Select the text and copy manually.";
      });
    } else {
      noteEl.innerText = ok ? "Copied!" : "Select the text and copy manually.";
    }
    noteEl.style.color = "var(--accent-green)";
  };

  const closeBtn = document.createElement('button');
  closeBtn.innerText = "CLOSE";
  closeBtn.style.cssText = `
    flex: 1; background: #1e293b; color: #fff; border: none;
    padding: 10px; border-radius: 8px; font-weight: 900; font-size: 0.8rem;
    cursor: pointer;
  `;
  closeBtn.onclick = () => {
    AudioFX.playClick();
    overlay.remove();
  };

  btnRow.appendChild(copyBtn);
  btnRow.appendChild(closeBtn);

  card.appendChild(title);
  card.appendChild(ta);
  if (note) card.appendChild(noteEl);
  card.appendChild(btnRow);
  overlay.appendChild(card);

  const app = document.getElementById('game-app') || document.body;
  app.appendChild(overlay);
}

function resetGame() {
  AudioFX.playClick();
  awaitingContinue = false;

  if (!confirm("Start a new season? Your current squad will be cleared (career history is kept).")) {
    return;
  }

  safeRemove('calcio_active_campaign');
  objectives = null;
  stopAllSimTimers();
  liveMatch = null;
  pendingFormation = null;
  userMotm = {};
  captainId = null;
  cup = null; pendingEurope = null;
  seasonStats = newSeasonStats();
  showCupBox(false);
  hideReportCard();

  squad = buildEmptySquad(currentFormation);
  bench = new Array(BENCH_SIZE).fill(null);
  userSquadGoals = {};
  leagueTeams = [];
  fixtures = [];
  currentRoundIdx = 0;
  isSimPaused = false;

  currentTactic = 'balanced';
  currentPress = 'mid';
  currentWidth = 'normal';
  updateStyleButtons();
  document.querySelectorAll('#screen-draft .tactic-btn').forEach(b => b.classList.remove('active'));
  const draftTacticBtn = document.getElementById('tactic-balanced');
  if (draftTacticBtn) draftTacticBtn.classList.add('active');

  document.querySelectorAll('#screen-sim .tactic-btn').forEach(b => b.classList.remove('active'));
  const simTacticBtn = document.getElementById('sim-tactic-balanced');
  if (simTacticBtn) simTacticBtn.classList.add('active');

  document.getElementById('screen-post').classList.remove('active');
  document.getElementById('screen-sim').classList.remove('active');
  document.getElementById('screen-draft').classList.add('active');

  renderPitchForFormation();
  updateFormationButtons();
  updateDraftUI();
  checkSavedGame();
}
// ===========================================================================
// FEATURES v3
// ===========================================================================

// ---------------------------------------------------------------------------
// Globals for the new systems
// ---------------------------------------------------------------------------
const YELLOWS_FOR_BAN = 5;
const CAPTAIN_OWN_BONUS = 2;      // captain's own OVR while on the pitch
const CAPTAIN_TEAM_BONUS = 0.01;  // +1% on all lines while the captain is on the pitch

let captainId = null;
let currentPress = 'mid';     // low | mid | high
let currentWidth = 'normal';  // narrow | normal | wide
let challengeMode = 'standard';
let userRivalName = null;
let prematchRound = -1;
let cup = null;
let pendingEurope = null;

function newSeasonStats() {
  return { curWin: 0, maxWin: 0, curClean: 0, maxClean: 0, derbyWins: 0, comebackWins: 0, tenMenWins: 0, hatTricks: 0,
    cleanTotal: 0, reds: 0, awayWins: 0, bigWins: 0, curUnbeaten: 0, maxUnbeaten: 0 };
}
let seasonStats = newSeasonStats();

// ---------------------------------------------------------------------------
// Challenge modes
// ---------------------------------------------------------------------------
const CHALLENGES = {
  standard: { name: 'Standard', icon: '⚽', desc: 'The normal game. €500M budget, no extra rules.' },
  tight:    { name: 'Tight Budget', icon: '💸', desc: 'Budget cap cut to €400M. Spend wisely.', cap: 400 },
  loyalty:  { name: 'Mixed XI', icon: '🌍', desc: 'No more than 2 players from the same club across your squad.', maxPerClub: 2 },
  bargain:  { name: 'Bargain Bin', icon: '🏷️', desc: 'Every player must cost €30M or less.', maxValue: 30 },
  iron:     { name: 'Iron Manager', icon: '🔒', desc: 'No pausing, no manual subs, no tactic or formation changes once the season starts. Forced injury subs still happen.' },
  titan:    { name: 'Titan League', icon: '👹', desc: 'Every AI club is +3 OVR stronger. A real fight for the title.', aiBoost: 3 }
};

function currentChallenge() { return CHALLENGES[challengeMode] || CHALLENGES.standard; }

function setChallenge(key) {
  if (!CHALLENGES[key]) key = 'standard';
  challengeMode = key;
  MAX_CAP = (CHALLENGES[key].cap || 500) + trustCapBonus();
  try { localStorage.setItem('calcio_mode', key); } catch (e) {}
  updateModeButton();
}

function loadChallenge() {
  let k = 'standard';
  try { k = localStorage.getItem('calcio_mode') || 'standard'; } catch (e) {}
  setChallenge(k);
}

function updateModeButton() {
  const b = document.getElementById('mode-btn');
  if (b) b.innerText = `🎮 MODE: ${currentChallenge().name.toUpperCase()}`;
  refreshTrustUI();
}

// Is this player allowed given the challenge, considering the other players already in `others`?
function challengeBlockReason(p, others) {
  const ch = currentChallenge();
  if (ch.maxValue && p.value > ch.maxValue) return `Over the €${ch.maxValue}M limit`;
  if (ch.maxPerClub) {
    const n = others.filter(x => x && x.club === p.club).length;
    if (n >= ch.maxPerClub) return `Max ${ch.maxPerClub} from ${p.club}`;
  }
  return null;
}

function draftedPlayers(excludeId) {
  const out = [];
  for (const p of Object.values(squad)) if (p && p.id !== excludeId) out.push(p);
  for (const p of bench) if (p && p.id !== excludeId) out.push(p);
  return out;
}

function ironLocked() {
  const sim = document.getElementById('screen-sim');
  return challengeMode === 'iron' && sim && sim.classList.contains('active');
}

function applyIronUI() {
  const lock = challengeMode === 'iron';
  ['pause-btn', 'subs-btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('locked', lock);
  });
  document.querySelectorAll('#screen-sim .tactic-btn, #screen-sim .formation-btn, #screen-sim .style-btn')
    .forEach(el => el.classList.toggle('locked', lock));
}

function ironToast() { showToast('🔒 Iron Manager: locked once the season starts'); }

// ---------------------------------------------------------------------------
// Rivals / derbies
// ---------------------------------------------------------------------------
const RIVALS = {
  "Juventus": ["Inter", "Torino"], "Inter": ["Juventus", "AC Milan"], "AC Milan": ["Inter"],
  "Torino": ["Juventus"], "Roma": ["Lazio"], "Lazio": ["Roma"]
};

function isDerbyPair(a, b) {
  if ((RIVALS[a.name] || []).includes(b.name)) return true;
  if (a.isUser && b.name === userRivalName) return true;
  if (b.isUser && a.name === userRivalName) return true;
  return false;
}

function pickUserRival(userTeam, aiTeams) {
  const score = t => t.attack + t.midfield + t.defense;
  const u = score(userTeam);
  const sorted = [...aiTeams].sort((a, b) => Math.abs(score(a) - u) - Math.abs(score(b) - u));
  return rpick(sorted.slice(0, 3)).name;
}

// ---------------------------------------------------------------------------
// Press / width style
// ---------------------------------------------------------------------------
const STYLE_HINTS = {
  press: {
    low:  'Low block: −3% possession, +1.5 DEF, fewer cards, slightly fewer chances for you.',
    mid:  'Mid block: standard.',
    high: 'High press: +2% possession and −3% chances against you, but −1.5 DEF and more cards.'
  },
  width: {
    narrow: 'Narrow: central play. Midfielders and strikers shoot more, +1 MID, −2% chances.',
    normal: 'Normal width: standard.',
    wide:   'Wide: wingers shoot more, +2% chances, but −1 MID.'
  }
};

function updateStyleButtons() {
  document.querySelectorAll('.style-btn').forEach(b => {
    const cur = b.dataset.kind === 'press' ? currentPress : currentWidth;
    b.classList.toggle('active', b.dataset.val === cur);
  });
}

function setStyle(kind, val) {
  const sim = document.getElementById('screen-sim').classList.contains('active');
  if (sim && ironLocked()) { ironToast(); return; }
  AudioFX.playClick();
  if (kind === 'press') currentPress = val; else currentWidth = val;
  updateStyleButtons();
  const hint = document.getElementById('style-hint-label');
  if (hint) hint.innerText = (kind === 'press' ? '🏃 ' : '↔️ ') + STYLE_HINTS[kind][val];
  if (sim) {
    recalcUserTeamWithFormation();
    if (liveMatch && liveMatch.userKey) liveMatch.sides[liveMatch.userKey].dirty = true;
    saveActiveCampaignState();
  }
}
function setPress(v) { setStyle('press', v); }
function setWidth(v) { setStyle('width', v); }

function styleMods(side) {
  if (!side.isUser) return { pos: 0, own: 1, opp: 1, yellow: 1 };
  let pos = 0, own = 1, opp = 1, yellow = 1;
  if (currentPress === 'high') { pos += 0.02; opp *= 0.97; yellow *= 1.25; }
  else if (currentPress === 'low') { pos -= 0.03; own *= 0.97; yellow *= 0.85; }
  if (currentWidth === 'wide') own *= 1.02;
  else if (currentWidth === 'narrow') own *= 0.98;
  return { pos, own, opp, yellow };
}

// ---------------------------------------------------------------------------
// Captain
// ---------------------------------------------------------------------------
function toggleCaptain(playerId) {
  AudioFX.playClick();
  captainId = (captainId === playerId) ? null : playerId;
  closePlayerPicker();
  updateDraftUI();
}

function ensureCaptain() {
  const xi = Object.values(squad).filter(Boolean);
  if (captainId !== null && xi.some(p => p.id === captainId)) return;
  const best = xi.sort((a, b) => b.ovr - a.ovr)[0];
  captainId = best ? best.id : null;
}

function captainName() {
  const all = [...Object.values(squad), ...bench].filter(Boolean);
  const c = all.find(p => p.id === captainId);
  return c ? c.name : null;
}

// ---------------------------------------------------------------------------
// Availability: bans + injuries that carry over
// ---------------------------------------------------------------------------
function isBanned(p) { return !!p && (p.suspended || 0) > 0; }
function isInjuredPlayer(p) { return !!p && (p.injuredFor || 0) > 0; }
function isUnavailable(p) { return isBanned(p) || isInjuredPlayer(p); }
function availabilityTag(p) {
  if (isBanned(p)) return `⛔ banned (${p.suspended})`;
  if (isInjuredPlayer(p)) return `🚑 out ${p.injuredFor}`;
  return '';
}
function unavailableStarters() {
  return Object.entries(squad).filter(([s, p]) => p && isUnavailable(p)).map(([slot, player]) => ({ slot, player }));
}
function rollInjuryLength() {
  const r = Math.random();
  return r < 0.35 ? 1 : r < 0.65 ? 2 : r < 0.85 ? 3 : r < 0.95 ? 4 : 5;
}

function autoSwapUnavailable() {
  const swaps = [];
  for (const [slot, p] of Object.entries(squad)) {
    if (!p || !isUnavailable(p)) continue;
    const b = baseOf(slot);
    let bi = -1, bs = -Infinity;
    bench.forEach((c, i) => {
      if (!c || isUnavailable(c)) return;
      const pen = fitPenalty(c.pos, b);
      if (pen >= 30) return;
      const sc = effectiveOvr(c) - pen;
      if (sc > bs) { bs = sc; bi = i; }
    });
    if (bi < 0 && isBanned(p)) {
      // nobody fully fit: a banned starter must still be replaced, so use an injured bench player
      bench.forEach((c, i) => {
        if (!c || isBanned(c)) return;
        const pen = fitPenalty(c.pos, b);
        if (pen >= 30) return;
        const sc = effectiveOvr(c) - pen - INJURED_PLAY_ON_PENALTY;
        if (sc > bs) { bs = sc; bi = i; }
      });
    }
    if (bi >= 0) {
      const c = bench[bi];
      squad[slot] = c;
      bench[bi] = p;
      swaps.push({ off: p, on: c, slot });
    }
  }
  return swaps;
}

// Bans served, injuries healed, new cards/injuries recorded. Returns a summary for the report card.
function applyPostMatchStatus(m, s, report) {
  const sum = { cards: [], injuries: [], bans: [], formMoves: [], out: [] };
  const all = new Map();
  [...Object.values(s.xi), ...s.benchList, ...Object.values(s.sentOff)].forEach(p => { if (p) all.set(p.id, p); });
  Object.values(s.apps).forEach(a => all.set(a.p.id, a.p));
  const played = new Set(Object.values(s.apps)
    .filter(a => ((a.to === null ? 90 : a.to) - a.from) > 0 || a.red).map(a => a.p.id));

  for (const id of (s.unavailableIds || [])) {
    const p = all.get(id);
    if (!p) continue;
    if ((p.suspended || 0) > 0) p.suspended--;
    if ((p.injuredFor || 0) > 0 && !played.has(id)) p.injuredFor--;
  }

  for (const app of Object.values(s.apps)) {
    const p = app.p;
    if (app.yellow > 0 || app.red) sum.cards.push({ name: p.name, y: app.yellow, r: app.red });
    if (app.yellow > 0) {
      p.yellowsSeason = (p.yellowsSeason || 0) + app.yellow;
      if (p.yellowsSeason >= YELLOWS_FOR_BAN) {
        p.yellowsSeason -= YELLOWS_FOR_BAN;
        p.suspended = Math.max(p.suspended || 0, 1);
        sum.bans.push({ name: p.name, why: `${YELLOWS_FOR_BAN} yellow cards` });
      }
    }
    if (app.red) {
      p.suspended = Math.max(p.suspended || 0, 1);
      if (!sum.bans.find(b => b.name === p.name)) sum.bans.push({ name: p.name, why: 'red card' });
    }
    if (app.injured) {
      const n = rollInjuryLength();
      p.injuredFor = Math.max(p.injuredFor || 0, n);
      sum.injuries.push({ name: p.name, n });
    }
  }
  return sum;
}

function finalizeUserSide(m, countGoals) {
  const report = computeMatchReport(m);
  const uk = m.userKey;
  const s = m.sides[uk];
  const sum = applyPostMatchStatus(m, s, report);

  for (const e of report.entries) {
    if (e.k !== uk) continue;
    const p = e.app.p;
    ensureFormData(p);
    const before = getPlayerForm(p);
    const b0 = before === null ? RATING_BASE : before;
    p.formHistory.push(e.rating);
    if (p.formHistory.length > FORM_WINDOW) p.formHistory = p.formHistory.slice(-FORM_WINDOW);
    const after = getPlayerForm(p);
    sum.formMoves.push({ name: p.name, delta: after - b0, after });
    if (countGoals && e.app.goals > 0) userSquadGoals[p.name] = (userSquadGoals[p.name] || 0) + e.app.goals;
  }
  if (report.motm && report.motm.k === uk) {
    const n = report.motm.app.p.name;
    userMotm[n] = (userMotm[n] || 0) + 1;
  }

  const ns = buildEmptySquad(currentFormation);
  for (const slot of Object.keys(ns)) ns[slot] = s.xi[slot] || s.sentOff[slot] || null;
  squad = ns;
  const nb = s.benchList.slice(0, BENCH_SIZE);
  while (nb.length < BENCH_SIZE) nb.push(null);
  bench = nb;

  sum.out = [...Object.values(squad), ...bench].filter(p => p && isUnavailable(p))
    .map(p => ({ name: p.name, tag: availabilityTag(p) }));
  report.user = sum;
  m.report = report;
  return report;
}

function updateSeasonStats(m, report) {
  const uk = m.userKey;
  const mine = m.score[uk], theirs = m.score[otherKey(uk)];
  const ss = seasonStats;
  if (mine > theirs) { ss.curWin++; ss.maxWin = Math.max(ss.maxWin, ss.curWin); } else ss.curWin = 0;
  if (theirs === 0) { ss.curClean++; ss.maxClean = Math.max(ss.maxClean, ss.curClean); } else ss.curClean = 0;
  if (m.derby && mine > theirs) ss.derbyWins++;
  if (mine > theirs && (m.maxDeficit || 0) >= 2) ss.comebackWins++;
  if (mine > theirs && m.sides[uk].reds > 0) ss.tenMenWins++;
  if (report.entries.some(e => e.k === uk && e.app.goals >= 3)) ss.hatTricks++;
  if (theirs === 0) ss.cleanTotal = (ss.cleanTotal || 0) + 1;
  ss.reds = (ss.reds || 0) + (m.sides[uk].reds || 0);
  if (mine > theirs && uk === 'away') ss.awayWins = (ss.awayWins || 0) + 1;
  const oppName = m.sides[otherKey(uk)].team.name;
  if (mine > theirs && objectives && objectives.bigClubs.includes(oppName)) ss.bigWins = (ss.bigWins || 0) + 1;
  if (mine >= theirs) { ss.curUnbeaten = (ss.curUnbeaten || 0) + 1; ss.maxUnbeaten = Math.max(ss.maxUnbeaten || 0, ss.curUnbeaten); } else ss.curUnbeaten = 0;
}

function finalizeMatchday(m) {
  (m.aiResults || []).forEach(r => applyResultToTable(r.home, r.away, r.homeGoals, r.awayGoals));
  applyResultToTable(m.home, m.away, m.score.home, m.score.away);
  const report = finalizeUserSide(m, true);
  updateSeasonStats(m, report);
  checkMatchAchievements();
  checkObjectiveToasts();
  currentRoundIdx++;
  applyPendingFormation();
  saveActiveCampaignState();
  return report;
}

// ---------------------------------------------------------------------------
// Report card + lineup alert dot
// ---------------------------------------------------------------------------
function hideReportCard() {
  const el = document.getElementById('report-card');
  if (el) el.style.display = 'none';
}

function renderReportCard(m, report) {
  const el = document.getElementById('report-card');
  if (!el || !report || !report.user) return;
  const u = report.user;
  const uk = m.userKey;
  const mine = m.score[uk], theirs = m.score[otherKey(uk)];
  const res = mine > theirs ? 'WIN' : (mine < theirs ? 'LOSS' : 'DRAW');
  const rows = [];
  rows.push(`<div class="rc-title">📋 MATCH REPORT · ${res} ${mine}-${theirs}</div>`);
  if (report.motm) {
    const mm = report.motm;
    rows.push(`<div>⭐ <b>MOTM:</b> ${mm.app.p.name} (${m.sides[mm.k].team.name}) ${mm.rating.toFixed(1)}</div>`);
  }
  if (u.cards.length) {
    const txt = u.cards.map(c => `${'🟨'.repeat(Math.min(c.y, 2))}${c.r ? '🟥' : ''} ${c.name}`).join(' · ');
    rows.push(`<div>🟨🟥 <b>Cards:</b> ${txt}</div>`);
  }
  if (u.bans.length) rows.push(`<div class="rc-bad">⛔ <b>Banned next match:</b> ${u.bans.map(b => `${b.name} (${b.why})`).join(', ')}</div>`);
  if (u.injuries.length) rows.push(`<div class="rc-bad">🚑 <b>Injured:</b> ${u.injuries.map(i => `${i.name} (${i.n} match${i.n > 1 ? 'es' : ''})`).join(', ')}</div>`);
  const ups = u.formMoves.filter(f => f.delta >= 0.3).sort((a, b) => b.delta - a.delta).slice(0, 2);
  const downs = u.formMoves.filter(f => f.delta <= -0.3).sort((a, b) => a.delta - b.delta).slice(0, 2);
  if (ups.length || downs.length) {
    const parts = [];
    ups.forEach(f => parts.push(`<span class="rc-up">▲ ${f.name} +${f.delta.toFixed(1)}</span>`));
    downs.forEach(f => parts.push(`<span class="rc-down">▼ ${f.name} ${f.delta.toFixed(1)}</span>`));
    rows.push(`<div>📈 <b>Form:</b> ${parts.join(' · ')}</div>`);
  }
  const oppSide = m.sides[otherKey(uk)], opp = oppSide && oppSide.team;
  if (opp && opp.formation) {
    const ad = oppSide.adapt === 'attack' ? ' · pushed forward after the break' : (oppSide.adapt === 'defend' ? ' · shut up shop after the break' : '');
    rows.push(`<div>🧭 <b>${opp.name}</b> lined up <b>${opp.formation}</b> · ${styleLabel(opp)}${ad}</div>`);
  }
  const mu = matchupFor(m);
  if (mu.notes.length) rows.push(`<div>🧩 <b>Matchup:</b> ${mu.notes.map(n => (n.good ? '✅ ' : '⚠️ ') + n.text).join(' · ')}</div>`);
  const tg = (m.sides[uk].traitGoals || []);
  if (tg.length) rows.push(`<div>🧬 <b>Trait goals:</b> ${tg.join(' · ')}</div>`);
  const orow = objectiveReportRow();
  if (orow) rows.push(orow);
  const stillOut = u.out.filter(o => !u.injuries.find(i => i.name === o.name) && !u.bans.find(b => b.name === o.name));
  if (stillOut.length) rows.push(`<div class="rc-bad">🩹 <b>Still out:</b> ${stillOut.map(o => `${o.name} ${o.tag}`).join(', ')}</div>`);
  if (!u.cards.length && !u.injuries.length) rows.push(`<div class="rc-ok">✅ Clean game: no cards, no injuries.</div>`);
  el.innerHTML = rows.join('');
  el.style.display = 'block';
}

function updateLineupAlert() {
  const btn = document.getElementById('subs-btn');
  if (!btn) return;
  const bad = unavailableStarters().length > 0;
  const form = Object.values(squad).filter(p => p && getPlayerForm(p) !== null && getPlayerForm(p) < FORM_RED_RED_BELOW).length >= HT_POPUP_BAD_FORM_PLAYERS;
  btn.classList.toggle('alert', !liveMatch && (bad || form));
}

// ---------------------------------------------------------------------------
// Best-value model (OVR above what the price predicts)
// ---------------------------------------------------------------------------
const VALUE_MODEL = (() => {
  const n = availablePlayers.length;
  const xs = availablePlayers.map(p => Math.log(p.value));
  const ys = availablePlayers.map(p => p.ovr);
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0, vr = 0;
  for (let i = 0; i < n; i++) { cov += (xs[i] - mx) * (ys[i] - my); vr += (xs[i] - mx) ** 2; }
  const b = cov / vr;
  return { a: my - b * mx, b };
})();

function valueScore(p) { return p.ovr - (VALUE_MODEL.a + VALUE_MODEL.b * Math.log(p.value)); }

const VALUE_THRESHOLD = (() => {
  const s = availablePlayers.map(valueScore).sort((a, b) => a - b);
  return s[Math.floor(s.length * 0.88)];
})();

function isBestValue(p) { return valueScore(p) >= VALUE_THRESHOLD; }

// ---------------------------------------------------------------------------
// Draft picker: search / sort / filter / best value / compare / captain
// ---------------------------------------------------------------------------
let pickerState = null;

function handleSlotClick(slotKey) { AudioFX.playClick(); openPicker('slot', slotKey); }
function handleBenchSlotClick(idx) { AudioFX.playClick(); openPicker('bench', idx); }

function openPicker(kind, key) {
  const occupant = kind === 'slot' ? squad[key] : bench[key];
  pickerState = { kind, key, occupant: occupant || null, search: '', sort: 'ovr', club: '', affordable: false, valueOnly: false, compareA: null };
  activeSlotKey = kind === 'slot' ? key : null;
  activeBenchIdx = kind === 'bench' ? key : null;

  const title = document.getElementById('modal-title');
  if (kind === 'slot') {
    title.innerText = occupant ? `${key}: ${occupant.name}` : `Select ${baseOf(key)} for ${key}`;
  } else {
    title.innerText = occupant ? `Bench ${key + 1}: ${occupant.name}` : `Bench Slot ${key + 1} — Pick Any Player`;
  }
  buildPickerControls();
  renderPickerList();
  document.getElementById('player-modal').classList.add('active');
}

function buildPickerControls() {
  const box = document.getElementById('picker-controls');
  if (!box) return;
  const pos = pickerState.kind === 'slot' ? baseOf(pickerState.key) : null;
  const clubs = [...new Set(availablePlayers.filter(p => !pos || p.pos === pos).map(p => p.club))].sort();
  box.innerHTML = `
    <input type="text" id="picker-search" class="picker-input" placeholder="🔎 Search name or club" oninput="pickerChanged()">
    <div class="picker-row">
      <select id="picker-sort" class="picker-select" onchange="pickerChanged()">
        <option value="ovr">Sort: OVR</option>
        <option value="value">Sort: Best value 💎</option>
        <option value="priceAsc">Sort: Price (low)</option>
        <option value="priceDesc">Sort: Price (high)</option>
        <option value="name">Sort: Name</option>
      </select>
      <select id="picker-club" class="picker-select" onchange="pickerChanged()">
        <option value="">All clubs</option>
        ${clubs.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>
    <div class="picker-row">
      <button class="picker-chip" id="chip-afford" onclick="pickerToggle('affordable')">💰 Affordable</button>
      <button class="picker-chip" id="chip-value" onclick="pickerToggle('valueOnly')">💎 Best value only</button>
    </div>
    <div class="picker-hint">⚖ <b>Compare:</b> tap ⚖ on one player, then ⚖ on a second. &nbsp;💎 = great OVR for the price. &nbsp;🧬 Chips = traits: they only work when he plays in his natural position.</div>`;
}

function pickerChanged() {
  if (!pickerState) return;
  pickerState.search = (document.getElementById('picker-search').value || '').trim().toLowerCase();
  pickerState.sort = document.getElementById('picker-sort').value;
  pickerState.club = document.getElementById('picker-club').value;
  renderPickerList();
}

function pickerToggle(key) {
  pickerState[key] = !pickerState[key];
  document.getElementById('chip-afford').classList.toggle('on', pickerState.affordable);
  document.getElementById('chip-value').classList.toggle('on', pickerState.valueOnly);
  renderPickerList();
}

function renderPickerList() {
  const st = pickerState;
  if (!st) return;
  const listEl = document.getElementById('modal-player-list');
  listEl.innerHTML = '';
  const occ = st.occupant;
  const isSlot = st.kind === 'slot';

  if (occ) {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.innerText = `Remove ${occ.name} (€${occ.value}M)`;
    removeBtn.onclick = () => {
      AudioFX.playClick();
      if (isSlot) squad[st.key] = null; else bench[st.key] = null;
      closePlayerPicker();
      updateDraftUI();
    };
    listEl.appendChild(removeBtn);
    if (isSlot) {
      const capBtn = document.createElement('button');
      capBtn.className = 'btn-remove';
      capBtn.style.background = '#b45309';
      capBtn.innerText = captainId === occ.id ? '© Captain — tap to unset' : '© Make captain (+2 OVR, +1% team while on pitch)';
      capBtn.onclick = () => toggleCaptain(occ.id);
      listEl.appendChild(capBtn);
    }
    const header = document.createElement('div');
    header.style.cssText = "font-size: 0.7rem; color: var(--text-muted); font-weight: 800; margin: 4px 0; text-transform: uppercase;";
    header.innerText = "Or Swap With:";
    listEl.appendChild(header);
  }

  const drafted = new Set(draftedPlayers(occ ? occ.id : null).map(p => p.id));
  const others = draftedPlayers(occ ? occ.id : null);
  const used = others.reduce((s, p) => s + p.value, 0);
  const remaining = MAX_CAP - used;
  const pos = isSlot ? baseOf(st.key) : null;

  let list = availablePlayers.filter(p => !drafted.has(p.id) && (!pos || p.pos === pos));
  if (st.search) list = list.filter(p => p.name.toLowerCase().includes(st.search) || p.club.toLowerCase().includes(st.search));
  if (st.club) list = list.filter(p => p.club === st.club);
  if (st.affordable) list = list.filter(p => p.value <= remaining);
  if (st.valueOnly) list = list.filter(isBestValue);

  const sorters = {
    ovr: (a, b) => b.ovr - a.ovr || a.value - b.value,
    value: (a, b) => valueScore(b) - valueScore(a),
    priceAsc: (a, b) => a.value - b.value || b.ovr - a.ovr,
    priceDesc: (a, b) => b.value - a.value || b.ovr - a.ovr,
    name: (a, b) => a.name.localeCompare(b.name)
  };
  list.sort(sorters[st.sort] || sorters.ovr);

  if (!list.length) {
    listEl.insertAdjacentHTML('beforeend', `<div style="text-align:center; color: var(--text-muted); padding: 20px; font-size: 0.8rem;">No players match these filters.</div>`);
    return;
  }

  list.forEach(player => {
    const block = challengeBlockReason(player, others);
    const vs = valueScore(player);
    const gem = isBestValue(player) ? `<span class="gem">💎 +${vs.toFixed(1)}</span>` : '';
    const isA = st.compareA === player.id;
    const card = document.createElement('div');
    card.className = 'player-card' + (block ? ' blocked' : '') + (isA ? ' compare-a' : '');
    const pickFn = isSlot ? 'selectPlayer' : 'selectBenchPlayer';
    card.innerHTML = `
      <div class="player-info">
        <div class="player-ovr-badge">€${player.value}M</div>
        <div class="player-meta">
          <span class="name"><span style="font-size:1rem;">${player.badge}</span> ${player.name} ${gem}</span>
          <span class="club-pos">${player.club} • ${player.pos} • ${player.ovr} OVR</span>
          ${traitOf(player) ? `<span class="trait-line">${traitChip(player)} <span class="trait-desc">${traitOf(player).desc}</span></span>` : ''}
          ${block ? `<span class="block-reason">🚫 ${block}</span>` : ''}
        </div>
      </div>
      <div class="card-btns">
        <button class="btn-compare ${isA ? 'on' : ''}" onclick="pickerCompare(${player.id})" title="Compare">⚖ ${isA ? '1/2' : 'Cmp'}</button>
        <button class="btn-select" ${block ? 'disabled style="opacity:0.35"' : ''} onclick="${pickFn}(${player.id})">Pick</button>
      </div>`;
    listEl.appendChild(card);
  });
}

function pickerCompare(id) {
  const st = pickerState;
  if (!st) return;
  AudioFX.playClick();
  if (st.compareA === null) { st.compareA = id; renderPickerList(); return; }
  if (st.compareA === id) { st.compareA = null; renderPickerList(); return; }
  const a = availablePlayers.find(p => p.id === st.compareA);
  const b = availablePlayers.find(p => p.id === id);
  st.compareA = null;
  renderPickerList();
  if (a && b) openCompare(a, b);
}

function openCompare(a, b) {
  const others = draftedPlayers(pickerState && pickerState.occupant ? pickerState.occupant.id : null);
  const mates = p => others.filter(x => x.club === p.club).length;
  const row = (label, va, vb, better) => {
    const wa = better === 'high' ? (va > vb) : better === 'low' ? (va < vb) : false;
    const wb = better === 'high' ? (vb > va) : better === 'low' ? (vb < va) : false;
    return `<tr><td class="cmp-l">${label}</td><td class="${wa ? 'cmp-win' : ''}">${va}</td><td class="${wb ? 'cmp-win' : ''}">${vb}</td></tr>`;
  };
  const fn = pickerState && pickerState.kind === 'slot' ? 'selectPlayer' : 'selectBenchPlayer';
  const body = `
    <table class="cmp-table">
      <tr><th></th><th>${a.badge} ${a.name}</th><th>${b.badge} ${b.name}</th></tr>
      ${row('Position', a.pos, b.pos)}
      ${row('Trait', traitOf(a) ? traitOf(a).icon + ' ' + traitOf(a).name : '—', traitOf(b) ? traitOf(b).icon + ' ' + traitOf(b).name : '—')}
      ${row('Club', a.club, b.club)}
      ${row('OVR', a.ovr, b.ovr, 'high')}
      ${row('Price', '€' + a.value + 'M', '€' + b.value + 'M', null)}
      ${row('Cheaper by', a.value < b.value ? '€' + (b.value - a.value) + 'M' : '—', b.value < a.value ? '€' + (a.value - b.value) + 'M' : '—')}
      ${row('Value score', (valueScore(a) >= 0 ? '+' : '') + valueScore(a).toFixed(1), (valueScore(b) >= 0 ? '+' : '') + valueScore(b).toFixed(1), null)}
      ${row('Club mates in squad', mates(a), mates(b), 'high')}
    </table>
    <div style="display:flex; gap:8px; margin-top:10px;">
      <button class="btn-select" style="flex:1; padding:10px;" onclick="closeOverlay('compare-modal'); ${fn}(${a.id})">Pick ${a.name}</button>
      <button class="btn-select" style="flex:1; padding:10px;" onclick="closeOverlay('compare-modal'); ${fn}(${b.id})">Pick ${b.name}</button>
    </div>
    <div style="font-size:0.62rem; color:var(--text-muted); margin-top:8px;">Value score = OVR above what the price normally buys. Higher is better.</div>`;
  openOverlay('compare-modal', '⚖ Compare players', body);
}

function closePlayerPicker() {
  AudioFX.playClick();
  document.getElementById('player-modal').classList.remove('active');
  closeOverlay('compare-modal');
  activeSlotKey = null;
  activeBenchIdx = null;
  pickerState = null;
}

function selectPlayer(playerId) {
  AudioFX.playClick();
  const player = availablePlayers.find(p => p.id === playerId);
  if (!player || !activeSlotKey) return;
  if (bench.some(b => b && b.id === playerId)) {
    alert("That player is already on the bench. Remove them from the bench first.");
    return;
  }
  const block = challengeBlockReason(player, draftedPlayers(squad[activeSlotKey] ? squad[activeSlotKey].id : null));
  if (block) { alert(block); return; }
  const wasCaptain = squad[activeSlotKey] && squad[activeSlotKey].id === captainId;
  squad[activeSlotKey] = draftClone(player);
  if (wasCaptain) captainId = null;
  closePlayerPicker();
  updateDraftUI();
}

function selectBenchPlayer(playerId) {
  AudioFX.playClick();
  const player = availablePlayers.find(p => p.id === playerId);
  if (!player || activeBenchIdx === null) return;
  const block = challengeBlockReason(player, draftedPlayers(bench[activeBenchIdx] ? bench[activeBenchIdx].id : null));
  if (block) { alert(block); return; }
  bench[activeBenchIdx] = draftClone(player);
  closePlayerPicker();
  updateDraftUI();
}

// ---------------------------------------------------------------------------
// Generic overlay + toast helpers
// ---------------------------------------------------------------------------
function openOverlay(id, title, bodyHtml) {
  closeOverlay(id);
  const o = document.createElement('div');
  o.id = id;
  o.className = 'modal-overlay active';
  o.style.zIndex = 250;
  o.innerHTML = `
    <div class="modal-header"><h3>${title}</h3><button class="close-modal" onclick="closeOverlay('${id}')">✕</button></div>
    <div class="modal-body">${bodyHtml}</div>`;
  (document.getElementById('game-app') || document.body).appendChild(o);
}
function closeOverlay(id) { const o = document.getElementById(id); if (o) o.remove(); }

let _toastQueue = [];
let _toastBusy = false;
function showToast(text) {
  _toastQueue.push(text);
  if (!_toastBusy) nextToast();
}
function nextToast() {
  const text = _toastQueue.shift();
  if (!text) { _toastBusy = false; return; }
  _toastBusy = true;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = text;
  (document.getElementById('game-app') || document.body).appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => { t.remove(); nextToast(); }, 300); }, 2200);
}

function openModeModal() {
  AudioFX.playClick();
  const body = Object.entries(CHALLENGES).map(([k, c]) => `
    <div class="player-card ${k === challengeMode ? 'compare-a' : ''}" onclick="chooseChallenge('${k}')">
      <div class="player-info">
        <div class="player-ovr-badge" style="background:var(--accent-gold);">${c.icon}</div>
        <div class="player-meta"><span class="name">${c.name}${k === challengeMode ? ' ✓' : ''}</span><span class="club-pos" style="white-space:normal;">${c.desc}</span></div>
      </div>
    </div>`).join('');
  openOverlay('mode-modal', '🎮 Choose game mode', body);
}

function chooseChallenge(k) {
  AudioFX.playClick();
  setChallenge(k);
  closeOverlay('mode-modal');
  showToast(`${CHALLENGES[k].icon} ${CHALLENGES[k].name} selected`);
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
const ACHIEVEMENTS = [
  { id: 'debut',        icon: '🎬', name: 'Debut Season',      desc: 'Complete a full 38-match season.' },
  { id: 'veteran',      icon: '🎖️', name: 'Veteran',           desc: 'Complete 5 seasons.' },
  { id: 'scudetto',     icon: '🏆', name: 'Scudetto',          desc: 'Win Serie A.' },
  { id: 'invincibles',  icon: '🛡️', name: 'Invincibles',       desc: 'Finish a season without losing a league match.' },
  { id: 'centurion',    icon: '💯', name: 'Centurion',         desc: 'Reach 100 points in a season.' },
  { id: 'goal_machine', icon: '⚽', name: 'Goal Machine',      desc: 'Score 100 league goals in a season.' },
  { id: 'fortress',     icon: '🧱', name: 'Fortress',          desc: 'Concede 25 or fewer league goals in a season.' },
  { id: 'bargain_title',icon: '💰', name: 'Bargain Scudetto',  desc: 'Win the title with a squad worth €350M or less.' },
  { id: 'comeback',     icon: '🔄', name: 'Comeback Kings',    desc: 'Win a league match after trailing by 2 goals.' },
  { id: 'hat_trick',    icon: '🎩', name: 'Hat-trick Hero',    desc: 'Have one player score 3 in a league match.' },
  { id: 'derby_king',   icon: '🔥', name: 'Derby King',        desc: 'Win 3 derbies or rivalry matches in one season.' },
  { id: 'ten_men',      icon: '🟥', name: 'Ten Men, No Problem', desc: 'Win a league match after one of your players is sent off.' },
  { id: 'wall',         icon: '🚧', name: 'The Wall',          desc: 'Keep 5 clean sheets in a row.' },
  { id: 'unstoppable',  icon: '🚀', name: 'Unstoppable',       desc: 'Win 8 league matches in a row.' },
  { id: 'captain_fantastic', icon: '©️', name: 'Captain Fantastic', desc: 'Your captain scores 15+ league goals in a season.' },
  { id: 'euro_champion',icon: '⭐', name: 'Champions of Europe', desc: 'Win the Champions League.' },
  { id: 'europa_winner',icon: '🥈', name: 'Europa Winners',    desc: 'Win the Europa League.' },
  { id: 'shootout_hero',icon: '🎯', name: 'Shootout Heroes',   desc: 'Win a European tie on penalties.' },
  { id: 'iron_champion',icon: '🔒', name: 'Iron Champion',     desc: 'Win the title in Iron Manager mode.' },
  { id: 'titan_slayer', icon: '👹', name: 'Titan Slayer',      desc: 'Finish in the top 4 in Titan League mode.' },
  { id: 'board_favourite', icon: '🏛', name: 'Board Favourite', desc: 'Earn your first Board Trust level.' }
];

let achUnlocked = (() => {
  try { return JSON.parse(localStorage.getItem('calcio_achievements')) || {}; } catch (e) { return {}; }
})();

function unlockAchievement(id) {
  if (achUnlocked[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  achUnlocked[id] = Date.now();
  try { localStorage.setItem('calcio_achievements', JSON.stringify(achUnlocked)); } catch (e) {}
  showToast(`${a.icon} Achievement: ${a.name}`);
  AudioFX.playGoalCheer();
}

function checkMatchAchievements() {
  const ss = seasonStats;
  if (ss.comebackWins >= 1) unlockAchievement('comeback');
  if (ss.hatTricks >= 1) unlockAchievement('hat_trick');
  if (ss.tenMenWins >= 1) unlockAchievement('ten_men');
  if (ss.maxClean >= 5) unlockAchievement('wall');
  if (ss.maxWin >= 8) unlockAchievement('unstoppable');
  if (ss.derbyWins >= 3) unlockAchievement('derby_king');
}

function checkSeasonAchievements(u, rank, squadValue, seasonsCompleted) {
  unlockAchievement('debut');
  if (seasonsCompleted >= 5) unlockAchievement('veteran');
  if (rank === 1) unlockAchievement('scudetto');
  if (u.l === 0) unlockAchievement('invincibles');
  if (u.pts >= 100) unlockAchievement('centurion');
  if (u.gf >= 100) unlockAchievement('goal_machine');
  if (u.ga <= 25) unlockAchievement('fortress');
  if (rank === 1 && squadValue <= 350) unlockAchievement('bargain_title');
  const cn = captainName();
  if (cn && (userSquadGoals[cn] || 0) >= 15) unlockAchievement('captain_fantastic');
  if (rank === 1 && challengeMode === 'iron') unlockAchievement('iron_champion');
  if (rank <= 4 && challengeMode === 'titan') unlockAchievement('titan_slayer');
  checkMatchAchievements();
}

function openAchievements() {
  AudioFX.playClick();
  const got = ACHIEVEMENTS.filter(a => achUnlocked[a.id]).length;
  const body = `<div class="ht-subs-remaining">${got} / ${ACHIEVEMENTS.length} unlocked</div>` +
    ACHIEVEMENTS.map(a => {
      const on = !!achUnlocked[a.id];
      return `<div class="player-card ach ${on ? 'on' : 'off'}">
        <div class="player-info">
          <div class="player-ovr-badge" style="background:${on ? 'var(--accent-gold)' : '#334155'}">${on ? a.icon : '🔒'}</div>
          <div class="player-meta"><span class="name">${a.name}</span><span class="club-pos" style="white-space:normal;">${a.desc}</span></div>
        </div></div>`;
    }).join('');
  openOverlay('ach-modal', '🏆 Achievements', body);
}

// ---------------------------------------------------------------------------
// Europe (post-season knockout for top-6 finishers)
// ---------------------------------------------------------------------------
const UCL_POOL = [
  { name: "Real Madrid", badge: "👑" }, { name: "Barcelona", badge: "🔵" }, { name: "Bayern Munich", badge: "🔴" },
  { name: "PSG", badge: "🗼" }, { name: "Man City", badge: "🩵" }, { name: "Liverpool", badge: "🔥" },
  { name: "Arsenal", badge: "🏹" }, { name: "Atlético Madrid", badge: "🐻" }, { name: "Dortmund", badge: "🐝" },
  { name: "Benfica", badge: "🦅" }, { name: "Porto", badge: "🐉" }, { name: "Ajax", badge: "🛡️" }
];
const UEL_POOL = [
  { name: "Villarreal", badge: "🟡" }, { name: "Sevilla", badge: "⚪" }, { name: "Lyon", badge: "🦁" },
  { name: "Marseille", badge: "🩵" }, { name: "Tottenham", badge: "🐓" }, { name: "Braga", badge: "🔴" },
  { name: "PSV", badge: "💡" }, { name: "Feyenoord", badge: "⚫" }, { name: "Fenerbahçe", badge: "🟨" },
  { name: "Olympiacos", badge: "🔺" }, { name: "AZ", badge: "🟥" }, { name: "Rangers", badge: "🟦" }
];
const UCL_ROUNDS = [['Round of 16', 79], ['Quarter-final', 81], ['Semi-final', 83], ['Final', 84]];
const UEL_ROUNDS = [['Quarter-final', 76], ['Semi-final', 78], ['Final', 79]];
const EURO_NAMES = ["Silva", "Müller", "Fernández", "Jansen", "Dubois", "Kovač", "Santos", "Larsen", "Moreau", "Petrov", "Costa", "Weber", "Alves", "Novak", "Hansen", "Ruiz"];
const EURO_INITIALS = ["J.", "M.", "L.", "K.", "A.", "D.", "P.", "R."];

function buildEuroTeam(club, ovr) {
  const xi = AI_SLOTS.map((slot, i) => ({
    id: `E_${club.name}_${slot}`,
    name: `${EURO_INITIALS[(i + club.name.length) % EURO_INITIALS.length]} ${EURO_NAMES[(i * 5 + club.name.length) % EURO_NAMES.length]}`,
    pos: baseOf(slot), ovr: ovr + Math.round((Math.random() - 0.5) * 4), slot, filler: true
  }));
  const team = { id: `eu_${club.name}`, name: club.name, badge: club.badge, xi, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, isUser: false };
  refreshAiRatings(team);
  return team;
}

function userTeamObj() { return leagueTeams.find(t => t.isUser); }

function setupEuropeCard(rank) {
  cup = null;
  pendingEurope = null;
  if (rank <= 4) pendingEurope = { comp: 'UCL', title: 'Champions League' };
  else if (rank <= 6) pendingEurope = { comp: 'UEL', title: 'Europa League' };
  renderEuroCard();
}

function renderEuroCard() {
  const el = document.getElementById('euro-card');
  if (!el) return;
  if (!pendingEurope) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  const pe = pendingEurope;
  if (!cup) {
    el.innerHTML = `
      <div class="summary-cell"><span class="cell-lbl">🌍 EUROPEAN QUALIFICATION</span>
      <span class="cell-val">You qualified for the ${pe.title}!</span></div>
      <button class="next-season-btn" style="background:var(--accent-blue);" onclick="startEurope()">▶ PLAY ${pe.title.toUpperCase()}</button>`;
    return;
  }
  const rows = cup.rounds.map(r => {
    let res = 'not played';
    if (r.played) res = `${r.userGoals}-${r.oppGoals}${r.pens ? ` (pens ${r.pens.user}-${r.pens.opp})` : ''} ${r.won ? '✅' : '❌'}`;
    return `<div style="display:flex; justify-content:space-between;"><span>${r.name} · ${r.opp.badge} ${r.opp.name}</span><span>${res}</span></div>`;
  }).join('');
  let head = cup.champion ? `🏆 ${pe.title.toUpperCase()} WINNERS!` : `Knocked out in the ${cup.eliminatedIn}`;
  el.innerHTML = `<div class="summary-cell"><span class="cell-lbl">🌍 ${pe.title.toUpperCase()}</span><span class="cell-val">${head}</span></div>
    <div style="font-size:0.66rem; color:var(--text-muted); display:flex; flex-direction:column; gap:3px;">${rows}</div>`;
}

function renderCupBox() {
  const box = document.getElementById('cup-box');
  if (!box || !cup) return;
  const rows = cup.rounds.map((r, i) => {
    const cur = cup.active && i === cup.idx;
    let res = cur ? '▶ next' : '—';
    if (r.played) res = `${r.userGoals}-${r.oppGoals}${r.pens ? ' p' : ''} ${r.won ? '✅' : '❌'}`;
    return `<tr class="${cur ? 'user-row' : ''}"><td>${r.name}</td><td>${r.opp.badge} ${r.opp.name}</td><td>${res}</td></tr>`;
  }).join('');
  box.innerHTML = `
    <div class="table-header-title"><span>🌍 ${pendingEurope.title.toUpperCase()} · KNOCKOUT</span></div>
    <div class="table-scroll"><table><thead><tr><th>Round</th><th>Opponent</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function showCupBox(on) {
  const league = document.getElementById('league-box');
  const box = document.getElementById('cup-box');
  if (league) league.style.display = on ? 'none' : '';
  if (box) box.style.display = on ? 'flex' : 'none';
}

function startEurope() {
  AudioFX.playClick();
  if (!pendingEurope || cup) return;
  const isUcl = pendingEurope.comp === 'UCL';
  const roundsDef = isUcl ? UCL_ROUNDS : UEL_ROUNDS;
  const pool = [...(isUcl ? UCL_POOL : UEL_POOL)].sort(() => Math.random() - 0.5);
  const rounds = roundsDef.map(([name, ovr], i) => ({
    name, opp: buildEuroTeam(pool[i], ovr), played: false, userGoals: 0, oppGoals: 0, pens: null, won: false
  }));
  cup = { comp: pendingEurope.comp, rounds, idx: 0, active: true, finished: false, champion: false, eliminatedIn: null, prematch: -1 };

  stopAllSimTimers();
  liveMatch = null;
  resetPauseButton();
  document.getElementById('screen-post').classList.remove('active');
  document.getElementById('screen-sim').classList.add('active');
  document.getElementById('sim-title').innerText = `${pendingEurope.title.toUpperCase()}`;
  document.getElementById('sim-progress-fill').style.width = '0%';
  showCupBox(true);
  renderCupBox();
  applyIronUI();
  updateSubsButton();
  scheduleNextCup();
}

function scheduleNextCup() {
  updateScoutLine();
  clearTimeout(gapTimer); gapTimer = null;
  stopCountdown();
  if (!cup || !cup.active || isSimPaused || subsModalOpen) return;
  const d = gapMs();
  startCountdown(d);
  gapTimer = setTimeout(startCupMatch, d);
}

function scheduleNext() {
  if (cup && cup.active) scheduleNextCup(); else scheduleNextMatch();
}

function startCupMatch() {
  gapTimer = null;
  if (!cup || !cup.active || isSimPaused || subsModalOpen) return;
  stopCountdown();
  if (unavailableStarters().length && cup.prematch !== cup.idx && !ironLocked()) {
    cup.prematch = cup.idx;
    openSubsModal('prematch');
    return;
  }
  const swaps = autoSwapUnavailable();
  const m = createCupMatch(true);
  m.onEvent = handleLiveEvent; m.onChance = pitchOnChance;
  liveMatch = m;
  const r = cup.rounds[cup.idx];
  beginLiveUI(m, `${pendingEurope.title.toUpperCase()} · ${r.name.toUpperCase()}`, swaps);
}

function createCupMatch(live) {
  const r = cup.rounds[cup.idx];
  const user = userTeamObj();
  const userHome = cup.idx % 2 === 0;
  const m = createMatch(userHome ? user : r.opp, userHome ? r.opp : user, live);
  m.cup = true;
  m.neutral = cup.idx === cup.rounds.length - 1;
  m.aiResults = [];
  return m;
}

function penaltyShootout(m) {
  const uk = m.userKey, ok = otherKey(uk);
  const pu = clamp(0.76 - (m.sides[ok].ratings.gk - 80) * 0.004, 0.6, 0.88);
  const po = clamp(0.76 - (m.sides[uk].ratings.gk - 80) * 0.004, 0.6, 0.88);
  let u = 0, o = 0;
  for (let i = 0; i < 5; i++) { if (Math.random() < pu) u++; if (Math.random() < po) o++; }
  let guard = 0;
  while (u === o && guard++ < 20) { const a = Math.random() < pu, b = Math.random() < po; if (a) u++; if (b) o++; }
  if (u === o) u++;
  return { user: u, opp: o, userWon: u > o };
}

// Shared by live and silent cup matches. Returns a short result text.
function resolveCupMatch(m) {
  const report = finalizeUserSide(m, false);
  applyPendingFormation();
  const r = cup.rounds[cup.idx];
  const uk = m.userKey;
  r.userGoals = m.score[uk];
  r.oppGoals = m.score[otherKey(uk)];
  r.played = true;
  if (r.userGoals === r.oppGoals) {
    r.pens = penaltyShootout(m);
    r.won = r.pens.userWon;
    if (r.won) unlockAchievement('shootout_hero');
  } else {
    r.won = r.userGoals > r.oppGoals;
  }
  if (!r.won) {
    cup.active = false; cup.finished = true; cup.eliminatedIn = r.name;
  } else if (cup.idx === cup.rounds.length - 1) {
    cup.active = false; cup.finished = true; cup.champion = true;
    unlockAchievement(cup.comp === 'UCL' ? 'euro_champion' : 'europa_winner');
  } else {
    cup.idx++;
  }
  return report;
}

function onCupMatchFinished(m) {
  const r = cup.rounds[cup.idx];
  const report = resolveCupMatch(m);
  liveMatch = null;
  AudioFX.playWhistle();
  updateSimBenchStrip();
  renderLiveStats(m);
  updateSubsButton();
  setStatus('FULL TIME', 'var(--accent-blue)');
  const clock = document.getElementById('match-clock');
  if (clock) clock.innerText = 'FT';
  document.getElementById('sim-progress-fill').style.width = '100%';
  const sc = `${m.home.name} ${m.score.home} - ${m.score.away} ${m.away.name}`;
  addLogLine(`⏱ FULL TIME · ${sc}`, 'log-line log-info');
  if (r.pens) addLogLine(`🎯 Penalty shootout: ${r.pens.user}-${r.pens.opp} — ${r.won ? 'you win!' : 'you lose.'}`, 'log-line log-pen');
  if (report.motm) addLogLine(`⭐ Man of the Match: ${report.motm.app.p.name} (${m.sides[report.motm.k].team.name}) — ${report.motm.rating.toFixed(1)}`, 'log-line log-motm');
  try { PitchViz.setPhase('ft'); showResultBanner(m); } catch (e) {}
  renderReportCard(m, report);
  renderCupBox();
  if (cup.active) scheduleNextCup();
  else setTimeout(finishEurope, 3200);
}

function runSilentCupMatch() {
  if (!cup || !cup.active) return;
  autoSwapUnavailable();
  const m = createCupMatch(false);
  runToEnd(m);
  resolveCupMatch(m);
}

function fastForwardCup() {
  stopAllSimTimers();
  const modal = document.getElementById('halftime-modal');
  if (modal) modal.classList.remove('active');
  subsModalOpen = false;
  _pendingSlot = null;
  if (liveMatch) {
    const m = liveMatch;
    m.live = false; m.onEvent = null; liveMatch = null;
    runToEnd(m);
    resolveCupMatch(m);
  }
  while (cup && cup.active) runSilentCupMatch();
  renderCupBox();
  setTimeout(finishEurope, 400);
}

function finishEurope() {
  stopAllSimTimers();
  liveMatch = null;
  showCupBox(false);
  hideReportCard();
  document.getElementById('screen-sim').classList.remove('active');
  document.getElementById('screen-post').classList.add('active');
  if (cup && cup.champion) { triggerTickerTape(); AudioFX.playGoalCheer(); }
  renderEuroCard();
  const c = document.getElementById('euro-card');
  if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' });
}

// ===========================================================================
// Opponent styles, formation weighting, matchups, AI half-time adaptation
// ===========================================================================
const STYLES = {
  possession: { label: '🎯 Possession',   tip: 'High press and midfield-heavy shapes (4-4-2, 3-5-2) work. Sitting deep hands them the ball.' },
  counter:    { label: '⚡ Counter-attack', tip: 'A low block or 5-3-2 frustrates them. A high press or all-out attack gets punished.' },
  physical:   { label: '💪 Physical',      tip: 'Go wide to stretch them. Narrow play runs into their defenders. Back-fives and 3-5-2 hold up.' },
  pressing:   { label: '🔥 High press',    tip: 'Go wide and use a 4-3-3 to beat the press. Sitting deep gives them the stage.' }
};

const CLUB_STYLE = {
  "Inter": 'possession', "AC Milan": 'pressing', "Juventus": 'counter', "Napoli": 'possession', "Atalanta": 'pressing',
  "Roma": 'physical', "Lazio": 'possession', "Fiorentina": 'possession', "Bologna": 'pressing', "Torino": 'physical',
  "Monza": 'counter', "Genoa": 'physical', "Lecce": 'counter', "Udinese": 'physical', "Cagliari": 'counter',
  "Parma": 'possession', "Como": 'possession', "Venezia": 'pressing', "Sassuolo": 'possession', "Frosinone": 'counter'
};

const STYLE_FORMS = {
  possession: ['4-3-3', '3-5-2', '4-4-2'],
  counter:    ['5-3-2', '4-4-2', '4-3-3'],
  physical:   ['4-4-2', '5-3-2', '3-5-2'],
  pressing:   ['4-3-3', '4-4-2', '3-5-2']
};

// Formation weighting: a line with more players than a 4-3-3 gets stronger, a line with fewer gets weaker.
const FORM_K = { att: 3, mid: 2.5, def: 3 };
function formationMods(key) {
  const fm = FORMATIONS[key] || FORMATIONS['4-3-3'];
  const n = [fm.rows[0].length, fm.rows[1].length, fm.rows[2].length];
  return { atk: FORM_K.att * (n[0] - 3), mid: FORM_K.mid * (n[1] - 3), def: FORM_K.def * (n[2] - 4) };
}

function pickFormationForStyle(style) {
  const prefs = STYLE_FORMS[style] || ['4-3-3'];
  const r = Math.random();
  return r < 0.5 ? prefs[0] : (r < 0.8 ? prefs[1] : prefs[2]);
}

function styleForClub(name) {
  if (CLUB_STYLE[name]) return CLUB_STYLE[name];
  const keys = Object.keys(STYLES);
  return keys[Math.floor(Math.random() * keys.length)];
}

// Old saves and Europe sides: make sure every AI team has a style and a formation that matches its XI
function ensureAiIdentity(team) {
  if (team.isUser) return;
  if (!team.style) team.style = styleForClub(team.name);
  if (!team.formation) team.formation = '4-3-3';
}

// User setup vs the opponent's style: small, readable effects (chance multipliers, possession, rating points)
const MATCHUP = {
  possession: {
    press: { high: { pos: 0.03, opp: 0.95, good: 'Your high press disrupted their build-up' },
             low:  { pos: -0.03, opp: 1.05, bad: 'Sitting deep handed them the ball' } },
    width: { narrow: { opp: 0.96, good: 'A narrow shape clogged the middle' } }
  },
  counter: {
    press: { high: { pos: 0.02, opp: 1.08, bad: 'Your high press left space for their counters' },
             low:  { opp: 0.90, own: 0.98, good: 'Your low block gave their counters no room' } },
    tactic: { attacking: { opp: 1.05, bad: 'Going all-out left you open to the counter' },
              defensive: { opp: 0.95, good: 'Your defensive shape blunted their counters' } }
  },
  physical: {
    width: { wide: { own: 1.05, good: 'Width stretched their compact defence' },
             narrow: { own: 0.93, bad: 'Narrow play ran into their physical defenders' } },
    press: { high: { opp: 1.03, bad: 'They bypassed your press with long balls' } }
  },
  pressing: {
    width: { wide: { own: 1.05, good: 'Wide play beat their press' },
             narrow: { own: 0.93, bad: 'Narrow play got swallowed by their press' } },
    press: { low: { opp: 1.04, bad: 'Sitting deep gave their press the stage' } }
  }
};

const FORM_MATCH = {
  possession: { '4-4-2': { mid: 1.5 }, '3-5-2': { mid: 1.5 }, '5-3-2': { mid: -1 } },
  counter:    { '5-3-2': { def: 2 }, '4-4-2': { def: 0.5 }, '4-3-3': { def: -1.5 } },
  physical:   { '5-3-2': { def: 1.5 }, '3-5-2': { def: 1.5 }, '4-3-3': { def: -1 } },
  pressing:   { '4-3-3': { atk: 1.5 }, '3-5-2': { mid: 1 }, '5-3-2': { atk: -1 } }
};

const NEUTRAL_MATCHUP = { own: 1, opp: 1, pos: 0, adj: { atk: 0, mid: 0, def: 0 }, notes: [] };

function matchupFor(m) {
  if (!m || !m.userKey) return NEUTRAL_MATCHUP;
  const opp = m.sides[otherKey(m.userKey)];
  const style = opp && opp.team && opp.team.style;
  const T = style && MATCHUP[style];
  if (!T) return NEUTRAL_MATCHUP;
  const out = { own: 1, opp: 1, pos: 0, adj: { atk: 0, mid: 0, def: 0 }, notes: [] };
  const apply = e => {
    if (!e) return;
    if (e.own) out.own *= e.own;
    if (e.opp) out.opp *= e.opp;
    if (e.pos) out.pos += e.pos;
    if (e.good) out.notes.push({ good: true, text: e.good });
    if (e.bad) out.notes.push({ good: false, text: e.bad });
  };
  apply(T.press && T.press[currentPress]);
  apply(T.width && T.width[currentWidth]);
  apply(T.tactic && T.tactic[currentTactic]);
  const fa = (FORM_MATCH[style] || {})[currentFormation];
  if (fa) {
    out.adj.atk += fa.atk || 0; out.adj.mid += fa.mid || 0; out.adj.def += fa.def || 0;
    const net = (fa.atk || 0) + (fa.mid || 0) + (fa.def || 0);
    if (net > 0) out.notes.push({ good: true, text: `${currentFormation} suited this matchup` });
    else if (net < 0) out.notes.push({ good: false, text: `${currentFormation} was a poor fit here` });
  }
  return out;
}

// AI reads the game at half-time and shifts its approach (never mid-half)
function aiHalftimeAdapt(m) {
  for (const k of ['home', 'away']) {
    const s = m.sides[k];
    if (s.isUser) continue;
    const diff = m.score[k] - m.score[otherKey(k)];
    let mode = null;
    if (diff <= -1) mode = 'attack';
    else if (diff >= 2) mode = 'defend';
    if (!mode) continue;
    s.adapt = mode;
    s.shift = mode === 'attack' ? { atk: 3, def: -3 } : { atk: -3, def: 3 };
    s.dirty = true;
    if (m.userKey) {
      emit(m, { type: 'info', text: mode === 'attack'
        ? `🧠 ${s.team.name} change approach at the break and push forward`
        : `🧠 ${s.team.name} change approach at the break and shut up shop` });
    }
  }
}

function styleLabel(team) { return (STYLES[team.style] || { label: '' }).label; }

function opponentForNext() {
  if (liveMatch && liveMatch.userKey) return liveMatch.sides[otherKey(liveMatch.userKey)].team;
  if (cup && cup.active) { const r = cup.rounds[cup.idx]; return r ? r.opp : null; }
  if (currentRoundIdx >= fixtures.length) return null;
  const f = (fixtures[currentRoundIdx] || []).find(x => x.home.isUser || x.away.isUser);
  if (!f) return null;
  return f.home.isUser ? f.away : f.home;
}


// ===========================================================================
// HELP: one scrollable page per layer of the game
// ===========================================================================
const HELP_LAYERS = [
  { icon: '🧩', title: 'Drafting', short: 'Build your XI before the season.', items: [
    'Pick <b>11 starters + 3 bench</b> players from real Serie A 2026/27 squads. Each has a position, an <b>OVR</b> (rating) and a price.',
    '<b>Budget cap:</b> €500M (Tight Budget mode is €400M). Every Board Trust level adds €5M, up to +€20M.',
    '<b>Formation:</b> 4-3-3, 4-4-2, 3-5-2 or 5-3-2. It decides how many players you need in each line.',
    '<b>Out of position:</b> a neighbouring position costs 4 OVR (e.g. a ST on the wing), an unrelated one costs 10, and a keeper outfield (or the reverse) costs 30.',
    '<b>Chemistry:</b> 3, 4 or 5+ players from the same club gives +3%, +5% or +7% to the whole team.',
    '<b>Efficiency bonus:</b> unspent budget gives up to +8%.',
    '<b>Captain ©:</b> +2 OVR for him and about +1% for the team. He also takes your penalties.',
    '<b>💎 Best value:</b> marks the top 12% of players for rating-per-price.',
    '<b>🧬 Traits:</b> most players carry one (shown as a chip). It only works when he plays in his natural position.',
    '<b>Draft tools:</b> search, sort, filters, and ⚖ Compare for two players side by side.'
  ]},
  { icon: '🎮', title: 'Challenge modes', short: 'Optional rule twists, set on the start screen.', items: [
    '<b>Standard:</b> the normal game.',
    '<b>Tight Budget:</b> €400M cap.',
    '<b>Mixed XI:</b> at most 2 players from the same club.',
    '<b>Bargain Bin:</b> every player must cost €30M or less.',
    '<b>Iron Manager:</b> no pausing, manual subs or tactic changes once the season starts.',
    '<b>Titan League:</b> every AI club is +3 stronger.'
  ]},
  { icon: '📊', title: 'Team ratings', short: 'How your lineup becomes numbers.', items: [
    'Your XI becomes three lines: <b>ATK</b> (front three), <b>MID</b> (the CMs) and <b>DEF</b> (back four + keeper). The keeper also counts separately as <b>GK</b>.',
    '<b>Form:</b> recent match ratings (the 🟩/🟥 badges) raise or lower a player\'s OVR.',
    'Flat adjustments: <b>tactic</b> (±4), <b>press</b> (±1.5 DEF), <b>width</b> (±1 MID), <b>formation</b> shape, <b>trait</b> bonuses, and the <b>matchup</b> against the opponent\'s style.',
    '<b>Home side:</b> +1.5 to every line.',
    '<b>Red card:</b> −7% on every line for each red.',
    'Rough value of a point: +1 ATK or DEF is about 2% more (or fewer) chances. +1 MID is about 1.5% more possession.'
  ]},
  { icon: '🧭', title: 'Tactics and scouting', short: 'Read the opponent and set up to beat them.', items: [
    '<b>Tactic:</b> Attacking is +4 ATK and −4 DEF. Defensive is the reverse.',
    '<b>Press:</b> High, Mid or Low. High press means more possession and fewer chances against you, but weaker DEF and more yellow cards.',
    '<b>Width:</b> Narrow, Normal or Wide. Wide favours your wingers, narrow favours your CMs.',
    '<b>AI styles:</b> every club has a fixed style: Possession, Counter-attack, Physical or High press. Each prefers certain formations.',
    '<b>Scouting line:</b> your next opponent\'s style and the best way to beat it is shown above the formation bar.',
    '<b>Matchup:</b> the right formation, press and width against a style gives a bonus. The wrong ones cost you. The report card shows it with a 🧩 row.',
    '<b>AI adapts at half-time only:</b> behind, it pushes forward. Ahead by 2+, it shuts up shop.',
    'The <b>match report</b> shows the opponent\'s formation and style, so you can remember them for next time.'
  ]},
  { icon: '⚽', title: 'The match engine', short: 'What happens minute by minute.', items: [
    'A match is about <b>95 one-minute ticks</b>: 45 + added time in each half.',
    '<b>Possession</b> follows the MID gap (kept between 30% and 70%).',
    '<b>Chances</b> come from possession and your ATK against their DEF.',
    '<b>Goals:</b> each chance is more likely to score with a better shooter, and less likely against a better keeper or defence. Penalties are about 2.5% of chances.',
    '<b>Who shoots:</b> mostly strikers, then wingers, CMs and defenders.',
    '<b>Game state:</b> a team that is behind late pushes forward. A team that is ahead eases off.',
    '<b>VAR</b> reviews some goals and overturns a few.',
    '<b>Derbies:</b> each team has a rival. Derbies add a few extra chances and pull the two teams\' ratings closer together.',
    '<b>Half-time popup:</b> appears only if you\'re losing by 2+ or 3 starters are in poor form.'
  ]},
  { icon: '🟥', title: 'Cards, injuries and bans', short: 'Why your XI changes during the season.', items: [
    '<b>Yellows:</b> about 2% per side per minute. A player who is already booked is much less likely to be booked again.',
    '<b>Reds:</b> a second yellow, or a rare straight red. About 2–3 a season for your side.',
    '<b>Bans:</b> a red means 1 match out. A 5th yellow over the season means 1 match out, then the count resets.',
    '<b>Injuries:</b> 1–5 matches out, most often 1.',
    '<b>Subs:</b> 3 per match, live. Forced injury subs also happen automatically.',
    '<b>Squad news:</b> a popup appears before a match if starters are unavailable. If you ignore it, they are auto-swapped.'
  ]},
  { icon: '📅', title: 'The season', short: 'How a campaign runs.', items: [
    '<b>38 matches</b> against 19 clubs, home and away. 3 points for a win, 1 for a draw.',
    'After every match a <b>report card</b> appears. Tap Continue when you\'re ready.',
    'The season <b>auto-saves</b> after each match and resumes if you close the game.',
    '<b>Fast-forward</b> skips the rest of the season.',
    'The <b>speed button</b> at the bottom cycles Fast, Normal and Slow, which sets how long each match takes to play out.'
  ]},
  { icon: '🏛', title: 'Objectives, trust and rewards', short: 'Goals beyond the league table.', items: [
    '<b>Board objectives:</b> a main finishing target (+2 trust) and three random side objectives (+1 each), plus a bonus for beating the target by a lot. Tap 🎯 BOARD to see progress.',
    '<b>Board Trust:</b> every 4 points is a level, worth +€5M budget in future drafts (up to level 4). It carries over between seasons.',
    '<b>Achievements:</b> unlocks such as comebacks, hat-tricks, unbeaten seasons and the Scudetto.',
    '<b>Europe:</b> after the season the top 4 enter the Champions League (4 knockout rounds). 5th and 6th enter the Europa League (3 rounds). Matches are single legs with penalties if level.',
    '<b>Season rating and grade:</b> a score out of 100 with a tier grade, plus a career history list.'
  ]}
];

function openHelp() {
  try { AudioFX.playClick(); } catch (e) {}
  const nav = HELP_LAYERS.map((l, i) => `<a class="help-chip" onclick="helpJump(${i})">${l.icon}</a>`).join('');
  const pages = HELP_LAYERS.map((l, i) => `
    <section class="help-layer" id="help-layer-${i}">
      <div class="help-step">PAGE ${i + 1} OF ${HELP_LAYERS.length}</div>
      <h4>${l.icon} ${l.title}</h4>
      <div class="help-short">${l.short}</div>
      <ul>${l.items.map(t => `<li>${t}</li>`).join('')}</ul>
      ${i < HELP_LAYERS.length - 1 ? `<div class="help-next" onclick="helpJump(${i + 1})">Next: ${HELP_LAYERS[i + 1].icon} ${HELP_LAYERS[i + 1].title} ▼</div>`
                                   : `<div class="help-next" onclick="closeOverlay('help-modal')">✅ That's everything. Back to the game</div>`}
    </section>`).join('');
  openOverlay('help-modal', '❓ How to Play', `<div class="help-nav">${nav}</div><div class="help-scroll" id="help-scroll">${pages}</div>`);
}

function helpJump(i) {
  const el = document.getElementById('help-layer-' + i);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ===========================================================================
// MATCH SCREEN UI: tabs, menu, tactics panel, pitch graphic, momentum, banners, tour
// ===========================================================================
const $id = (id) => document.getElementById(id);

function setSimTab(tab) {
  try { AudioFX.playClick(); } catch (e) {}
  ['match', 'table', 'squad'].forEach(t => {
    const p = $id('pane-' + t); if (p) p.style.display = t === tab ? 'flex' : 'none';
  });
  document.querySelectorAll('.sim-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'squad') renderSquadTab();
  if (tab === 'table') updateStandingsTable();
}

function toggleStats() {
  const el = $id('match-stats-panel'); if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ---- auto-pause helper used by panels -------------------------------------
function autoPauseSim() {
  const sim = $id('screen-sim');
  if (!sim || !sim.classList.contains('active')) return false;
  if (isSimPaused || challengeMode === 'iron') return false;
  toggleSimPause();
  return true;
}
function autoResumeSim() { if (isSimPaused) toggleSimPause(); }

// ---- Tactics panel ---------------------------------------------------------
let _tacticsPaused = false;
function openTactics() {
  try { AudioFX.playClick(); } catch (e) {}
  updateScoutLine();
  const m = $id('tactics-modal'); if (!m) return;
  if (!m.classList.contains('active')) _tacticsPaused = autoPauseSim();
  m.classList.add('active');
}
function closeTactics() {
  const m = $id('tactics-modal'); if (!m) return;
  m.classList.remove('active');
  if (_tacticsPaused) { _tacticsPaused = false; autoResumeSim(); }
}

// ---- Menu ------------------------------------------------------------------
function openMenu() {
  try { AudioFX.playClick(); } catch (e) {}
  const onSim = $id('screen-sim').classList.contains('active');
  const music = AudioFX.currentTrack === 0 ? 'OFF' : `SONG ${AudioFX.currentTrack}/5`;
  const body = `
    <button class="menu-btn" onclick="closeOverlay('menu-modal'); goToMainMenu()">🏠 Main menu<small>${onSim ? 'Your season is saved after every match. Resume it from the start screen.' : 'Back to the start screen.'}</small></button>
    <button class="menu-btn" onclick="closeOverlay('menu-modal'); openHelp()">❓ How to play<small>The mechanics, one page at a time.</small></button>
    ${onSim ? `<button class="menu-btn" onclick="closeOverlay('menu-modal'); openObjectives()">🎯 Board objectives<small>Targets and Board Trust progress.</small></button>
    <button class="menu-btn" onclick="closeOverlay('menu-modal'); startTour(true)">🧭 Replay the quick tour<small>Four quick tips on the match screen.</small></button>` : ''}
    <button class="menu-btn" id="menu-music" onclick="toggleBackgroundMusic(); this.firstChild.textContent = '🎵 Music: ' + (AudioFX.currentTrack === 0 ? 'OFF' : 'SONG ' + AudioFX.currentTrack + '/5')">🎵 Music: ${music}<small>Tap to cycle songs.</small></button>
    <button class="menu-btn" onclick="closeOverlay('menu-modal'); resetGame()">🔄 Start a new season<small>Clears your current squad. Career history is kept.</small></button>`;
  openOverlay('menu-modal', '☰ Menu', body);
}

function goToMainMenu() {
  try { AudioFX.playClick(); } catch (e) {}
  const onSim = $id('screen-sim').classList.contains('active');
  let msg = onSim
    ? 'Go back to the main menu? Your season is saved after every match and you can resume it from the start screen. The match in progress restarts when you resume.'
    : 'Go back to the main menu? Your current draft stays until you start a new game.';
  if (onSim && cup && cup.active) msg += ' Your Europe run will be lost.';
  if (!confirm(msg)) return;
  stopAllSimTimers();
  liveMatch = null; subsModalOpen = false; awaitingContinue = false; isSimPaused = false;
  resetPauseButton();
  closeTactics();
  _tacticsPaused = false;
  const ht = $id('halftime-modal'); if (ht) ht.classList.remove('active');
  hideReportCard();
  closeOverlay('board-intro'); closeOverlay('obj-modal'); closeOverlay('help-modal'); closeOverlay('tour-layer');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $id('screen-start').classList.add('active');
  checkSavedGame();
}

// ---- Opponent card + chip --------------------------------------------------
function updateScoutLine() {
  const el = $id('opp-scout'), chip = $id('opp-chip');
  const t = opponentForNext();
  if (!t) { if (el) el.style.display = 'none'; if (chip) chip.style.display = 'none'; return; }
  ensureAiIdentity(t);
  const st = STYLES[t.style];
  if (!st) { if (el) el.style.display = 'none'; if (chip) chip.style.display = 'none'; return; }
  const u = leagueTeams.find(x => x.isUser);
  const derby = u && isDerbyPair(u, t);
  const when = liveMatch ? 'Now' : 'Next';
  if (chip) {
    chip.style.display = 'block';
    chip.innerHTML = `${when}: ${t.badge || ''} <b>${t.name}</b> · ${st.label} · ${t.formation || ''}${derby ? ' · 🔥' : ''} <span style="opacity:.7">— tap for tips ▸</span>`;
  }
  if (el) {
    el.style.display = 'block';
    el.innerHTML = `
      <div class="oc-head"><span class="oc-badge">${t.badge || '⚽'}</span>
        <div><div class="oc-name">${t.name}</div>
        <div class="oc-tags"><span class="oc-tag">${st.label}</span><span class="oc-tag">${t.formation || '4-3-3'}</span>${derby ? '<span class="oc-tag">🔥 Derby</span>' : ''}</div></div></div>
      <div class="oc-tip"><b>Beat them by:</b> ${st.tip}</div>`;
  }
}

// ---- Squad tab -------------------------------------------------------------
function renderSquadTab() {
  const box = $id('squad-list'); if (!box) return;
  const uk = liveMatch && liveMatch.userKey;
  const xi = uk ? liveMatch.sides[uk].xi : squad;
  const rows = (FORMATIONS[currentFormation] || FORMATIONS['4-3-3']).rows;
  const names = ['ATTACK', 'MIDFIELD', 'DEFENCE', 'GOALKEEPER'];
  let html = '';
  rows.forEach((row, i) => {
    html += `<div class="sq-line">${names[Math.min(i, names.length - 1)]}</div>`;
    row.forEach(slot => {
      const p = xi[slot];
      if (!p) { html += `<div class="sq-row out"><span class="sq-pos">${baseOf(slot)}</span><span class="sq-name">— empty —</span></div>`; return; }
      const tr = traitOf(p), tag = availabilityTag(p);
      const yel = p.yellowsSeason ? ` 🟨${p.yellowsSeason}` : '';
      html += `<div class="sq-row ${tag ? 'out' : ''}"><span class="sq-pos">${baseOf(slot)}</span>
        <span class="sq-name">${getFormBadge(p)} ${p.name}${captainId === p.id ? ' ©' : ''} ${tr ? tr.icon : ''}${yel}${tag ? ' ' + tag : ''}</span>
        <span class="sq-ovr">${p.ovr}</span></div>`;
    });
  });
  box.innerHTML = html;
  updateSimBenchStrip();
}

// ---- Result banner ---------------------------------------------------------
function showResultBanner(m) {
  const b = $id('result-banner'); if (!b || !m.userKey) return;
  const uk = m.userKey, mine = m.score[uk], theirs = m.score[otherKey(uk)];
  const cls = mine > theirs ? 'win' : (mine < theirs ? 'loss' : 'draw');
  const word = cls === 'win' ? 'WIN' : (cls === 'loss' ? 'DEFEAT' : 'DRAW');
  const goals = {};
  m.log.filter(e => e.type === 'goal' && e.side === uk).forEach(e => { const n = (e.scorer || '').replace(/ ©$/, ''); goals[n] = (goals[n] || 0) + 1; });
  const scorers = Object.entries(goals).map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join(' · ');
  b.className = 'result-banner ' + cls;
  b.innerHTML = `<div class="rb-big">${word} ${mine}–${theirs}</div><div class="rb-sub">${m.sides[otherKey(uk)].team.name}</div>${scorers ? `<div class="rb-sub" style="color:var(--accent-green);margin-top:6px;">⚽ ${scorers}</div>` : ''}`;
  void b.offsetWidth;
  b.classList.add('show');
  try { if (cls === 'win') PitchViz.celebrate(uk); } catch (e) {}
}
function hideResultBanner() { const b = $id('result-banner'); if (b) { b.className = 'result-banner'; b.innerHTML = ''; } }

// ===========================================================================
// PITCH GRAPHIC
// ===========================================================================
const PitchViz = {
  canvas: null, ctx: null, W: 0, H: 0, dpr: 1,
  home: [], away: [],            // dots {x,y,tx,ty,row,slot,gone}
  ball: { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 },
  mom: 0, pHome: 0.5, userKey: 'home', names: { home: '', away: '' },
  queue: [], cur: null, curT0: 0, caption: '', capColor: '#e2e8f0', capUntil: 0,
  tags: [], flashUntil: 0, flashK: null, carryAt: 0, possK: 'home', f: 1, running: false, phase: 'ko',

  init() {
    this.canvas = $id('pitch-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.running) { this.running = true; requestAnimationFrame(t => this.frame(t)); }
  },

  beginMatch(m) {
    this.init();
    this.live = m;
    this.userKey = m.userKey || 'home';
    this.names = { home: m.home.name, away: m.away.name };
    this.queue = []; this.cur = null; this.tags = []; this.caption = ''; this.mom = 0; this.pHome = 0.5;
    this.ball = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }; this.flashUntil = 0; this.phase = 'live';
    this.home = []; this.away = [];
    this.layout(true);
    this.setMomentumUI();
    const you = $id('mom-lbl-you'), opp = $id('mom-lbl-opp');
    if (you) you.innerText = 'YOU';
    if (opp) opp.innerText = (this.userKey === 'home' ? m.away.name : m.home.name).slice(0, 8).toUpperCase();
    this.live = m;
  },

  formationFor(k) {
    if (this.live) {
      const s = this.live.sides[k];
      if (s.isUser) return currentFormation;
      return (s.team && s.team.formation) || '4-3-3';
    }
    return currentFormation;
  },

  // normalised dot targets for a side. Home defends the left goal and attacks right.
  layout(snap) {
    const sides = ['home', 'away'];
    for (const k of sides) {
      const key = this.formationFor(k);
      const rows = (FORMATIONS[key] || FORMATIONS['4-3-3']).rows;
      const n = rows.length;
      let t = k === 'home' ? this.mom : -this.mom;
      t = Math.max(-0.9, Math.min(0.9, t));
      const arr = k === 'home' ? this.home : this.away;
      let idx = 0;
      rows.forEach((row, r) => {
        const frac = n > 1 ? r / (n - 1) : 0;
        const baseX = 0.64 - frac * (0.64 - 0.06);
        const push = r === n - 1 ? 0.03 : (r === 0 ? 0.12 : (r === n - 2 ? 0.07 : 0.10));
        let x = baseX + t * push;
        row.forEach((slot, i) => {
          const cnt = row.length;
          const y = r === n - 1 ? 0.5 : 0.14 + (cnt === 1 ? 0.36 : (i / (cnt - 1)) * 0.72);
          const gx = k === 'home' ? x : 1 - x;
          let d = arr[idx];
          if (!d) { d = arr[idx] = { x: gx, y, tx: gx, ty: y, row: r, slot, gone: false, ph: Math.random() * 6.28 }; }
          d.tx = gx; d.ty = y; d.row = r; d.slot = slot;
          if (snap) { d.x = gx; d.y = y; }
          idx++;
        });
      });
      arr.length = idx;
    }
  },

  setMomentumUI() {
    const fill = $id('mom-fill'); if (!fill) return;
    const um = this.userKey === 'home' ? this.mom : -this.mom;
    fill.style.width = (50 + Math.max(-1, Math.min(1, um)) * 46) + '%';
  },

  onTick(m) {
    this.live = m;
    this.pHome = m.lastPHome || 0.5;
    this.mom += ((this.pHome - 0.5) * 3 - this.mom) * 0.06;
    this.mom *= 0.995;
    this.mom = Math.max(-1, Math.min(1, this.mom));
    this.f = Math.max(0.5, Math.min(1.5, tickMs() / 90));
    this.setMomentumUI();
  },

  bump(k, amt) { this.mom = Math.max(-1, Math.min(1, this.mom + (k === 'home' ? amt : -amt))); },

  push(ev) {
    if (this.queue.length > 4) this.queue = this.queue.filter(e => e.t === 'goal' || e.t === 'red').slice(-4);
    this.queue.push(ev);
  },

  onChance(m, k, res, who) {
    this.bump(k, res === 'goal' ? 0.45 : 0.2);
    this.push({ t: 'shot', k, res, who });
  },

  onEvent(ev, m) {
    const k = ev.side;
    if (ev.type === 'goal') { this.push({ t: 'shot', k, res: 'goal', who: ev.scorer, pen: ev.penalty }); this.bump(k, 0.45); }
    else if (ev.type === 'pen') { this.push({ t: 'pen', k }); }
    else if (ev.type === 'card') { this.push({ t: 'card', k, red: false, who: this.nameFrom(ev.text) }); }
    else if (ev.type === 'red') { this.push({ t: 'card', k, red: true, who: this.nameFrom(ev.text) }); }
    else if (ev.type === 'injury') { this.push({ t: 'injury', k, who: this.nameFrom(ev.text) }); }
    else if (ev.type === 'var' && ev.disallowed) { this.push({ t: 'cap', text: '📺 VAR: goal disallowed', color: '#c4b5fd' }); }
  },

  nameFrom(text) {
    const m = /(?:Yellow card — |Second yellow for |RED CARD! |🚑 [^ ]+ )([^()—]+?)(?: \(|$| is| goes)/.exec(text || '');
    return m ? m[1].trim() : '';
  },

  setPhase(p) { this.phase = p; this.capUntil = 0; if (p === 'ht' || p === 'ft') { this.ball.tx = 0.5; this.ball.ty = 0.5; this.queue = []; this.cur = null; } },

  celebrate(k) { this.flashK = k; this.flashUntil = performance.now() + 1500; },

  ballTo(x, y) { this.ball.tx = x; this.ball.ty = y; },

  dotPos(k, pred) {
    const arr = (k === 'home' ? this.home : this.away).filter(d => !d.gone && pred(d));
    return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
  },

  startEvent(ev, now) {
    const f = this.f;
    this.cur = ev; this.curT0 = now; ev.step = 0;
    const atk = ev.k, dk = atk === 'home' ? 'away' : 'home';
    const dir = atk === 'home' ? 1 : -1;
    const goalX = atk === 'home' ? 1.0 : 0.0;
    if (ev.t === 'shot' || ev.t === 'pen') {
      const bx = atk === 'home' ? 0.8 : 0.2, by = 0.5 + (Math.random() - 0.5) * 0.36;
      ev.steps = [];
      if (ev.t === 'pen') { ev.steps.push({ x: atk === 'home' ? 0.88 : 0.12, y: 0.5, ms: 450 * f, cap: '🎯 PENALTY', color: '#fbbf24' }); return; }
      ev.steps.push({ x: bx, y: by, ms: 420 * f, cap: `Chance · ${this.names[atk]}`, color: atk === this.userKey ? '#38bdf8' : '#f87171' });
      if (ev.res === 'goal') {
        ev.steps.push({ x: goalX, y: 0.5 + (Math.random() - 0.5) * 0.14, ms: 220 * f, cap: `⚽ GOAL! ${ev.who || ''}`, color: '#fbbf24', goal: true });
      } else if (ev.res === 'save') {
        const gk = this.dotPos(dk, d => d.row === (dk === 'home' ? this.home : this.away).reduce((a, b) => Math.max(a, b.row), 0));
        ev.steps.push({ x: gk ? gk.x : (dk === 'home' ? 0.06 : 0.94), y: gk ? gk.y : 0.5, ms: 240 * f, cap: '🧤 Saved', color: '#94a3b8' });
      } else if (ev.res === 'block') {
        ev.steps.push({ x: atk === 'home' ? 0.84 : 0.16, y: by + (Math.random() - 0.5) * 0.1, ms: 200 * f, cap: '🧱 Blocked', color: '#94a3b8' });
      } else {
        ev.steps.push({ x: goalX + dir * 0.02, y: Math.random() < 0.5 ? 0.12 : 0.88, ms: 240 * f, cap: '💨 Wide', color: '#94a3b8' });
      }
    } else if (ev.t === 'card') {
      const d = this.dotPos(ev.k, dd => dd.row >= 1 && dd.row < (ev.k === 'home' ? this.home : this.away).reduce((a, b) => Math.max(a, b.row), 0));
      if (d) {
        this.tags.push({ d, until: now + 1800 * f, red: ev.red });
        if (ev.red) { setTimeout(() => { d.gone = true; }, 900 * f); }
      }
      this.caption = `${ev.red ? '🟥' : '🟨'} ${ev.who || ''}`; this.capColor = ev.red ? '#f87171' : '#fde047'; this.capUntil = now + 1700 * f;
      ev.steps = [{ x: d ? d.x : 0.5, y: d ? d.y : 0.5, ms: 500 * f }];
    } else if (ev.t === 'injury') {
      const d = this.dotPos(ev.k, dd => dd.row >= 0);
      if (d) this.tags.push({ d, until: now + 1800 * f, inj: true });
      this.caption = `🚑 ${ev.who || 'Injury'}`; this.capColor = '#fb923c'; this.capUntil = now + 1700 * f;
      ev.steps = [{ x: d ? d.x : 0.5, y: d ? d.y : 0.5, ms: 500 * f }];
    } else if (ev.t === 'cap') {
      this.caption = ev.text; this.capColor = ev.color; this.capUntil = now + 1600 * f;
      ev.steps = [{ x: 0.5, y: 0.5, ms: 400 * f }];
    }
    this.runStep(now);
  },

  runStep(now) {
    const ev = this.cur; if (!ev) return;
    const s = ev.steps[ev.step];
    if (!s) { this.cur = null; return; }
    this.ballTo(s.x, s.y);
    this.stepEnd = now + s.ms;
    if (s.cap) { this.caption = s.cap; this.capColor = s.color || '#e2e8f0'; this.capUntil = now + 1500 * this.f; }
    if (s.goal) { this.flashK = ev.k; this.flashUntil = now + 1500 * this.f; }
  },

  carry(now) {
    // idle play: ball drifts between players of the team in possession
    if (now < this.carryAt) return;
    this.carryAt = now + (380 + Math.random() * 280) * this.f;
    if (Math.random() > 0.65) this.possK = Math.random() < this.pHome ? 'home' : 'away';
    const k = this.possK;
    const maxRow = (k === 'home' ? this.home : this.away).reduce((a, b) => Math.max(a, b.row), 0);
    const roll = Math.random();
    const d = this.dotPos(k, dd => dd.row < maxRow && (roll < 0.35 ? dd.row === 0 : (roll < 0.8 ? dd.row === 1 : dd.row >= 2)));
    if (d) this.ballTo(d.x + (k === 'home' ? 0.02 : -0.02), d.y);
  },

  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    const sim = $id('screen-sim'), pane = $id('pane-match');
    if (!this.canvas || !sim || !sim.classList.contains('active') || !pane || pane.style.display === 'none' || document.hidden) return;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this.W !== w * dpr || this.H !== h * dpr) { this.canvas.width = w * dpr; this.canvas.height = h * dpr; this.W = w * dpr; this.H = h * dpr; this.dpr = dpr; }
    if (!this.live) { this.home.length === 0 && this.layout(true); }
    // event sequencing
    if (this.phase === 'live' || this.phase === 'second') {
      if (this.cur) {
        if (now >= this.stepEnd) { this.cur.step++; this.runStep(now); }
      } else if (this.queue.length) {
        this.startEvent(this.queue.shift(), now);
      } else if (!isSimPaused) {
        this.carry(now);
      }
    } else if (this.cur) { this.cur = null; }
    this.layout(false);
    // ease dots and ball
    const k = 0.12;
    for (const arr of [this.home, this.away]) for (const d of arr) {
      let tx = d.tx, ty = d.ty;
      const dx = this.ball.x - d.x, dy = this.ball.y - d.y;
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / 0.35);
      tx += dx * 0.12 * near; ty += dy * 0.12 * near;
      tx += Math.sin(now / 900 + d.ph) * 0.006; ty += Math.cos(now / 1100 + d.ph) * 0.008;
      d.x += (tx - d.x) * k; d.y += (ty - d.y) * k;
    }
    const bk = this.cur ? 0.22 : 0.10;
    this.ball.x += (this.ball.tx - this.ball.x) * bk; this.ball.y += (this.ball.ty - this.ball.y) * bk;
    this.draw(now);
  },

  draw(now) {
    const g = this.ctx, W = this.W, H = this.H;
    const pad = Math.round(H * 0.06);
    const X = x => pad + x * (W - 2 * pad), Y = y => pad + y * (H - 2 * pad);
    // grass
    const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#0e3a1f'); grad.addColorStop(1, '#0a2c17');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) { if (i % 2) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(X(i / 10), pad, (W - 2 * pad) / 10, H - 2 * pad); } }
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(1, H * 0.008);
    g.strokeRect(X(0), Y(0), X(1) - X(0), Y(1) - Y(0));
    g.beginPath(); g.moveTo(X(0.5), Y(0)); g.lineTo(X(0.5), Y(1)); g.stroke();
    g.beginPath(); g.arc(X(0.5), Y(0.5), H * 0.13, 0, 6.283); g.stroke();
    for (const s of [0, 1]) {
      const bx = s ? X(1) - (X(0.16) - X(0)) : X(0), sx = s ? X(1) - (X(0.07) - X(0)) : X(0);
      g.strokeRect(bx, Y(0.2), X(0.16) - X(0), Y(0.8) - Y(0.2));
      g.strokeRect(sx, Y(0.36), X(0.07) - X(0), Y(0.64) - Y(0.36));
    }
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(X(0) - pad * 0.45, Y(0.44), pad * 0.45, Y(0.56) - Y(0.44));
    g.fillRect(X(1), Y(0.44), pad * 0.45, Y(0.56) - Y(0.44));

    // legend
    g.font = `800 ${Math.round(H * 0.07)}px -apple-system, Segoe UI, Roboto, sans-serif`; g.textBaseline = 'middle'; g.textAlign = 'left';
    const oppName = this.names[this.userKey === 'home' ? 'away' : 'home'] || '';
    const r = H * 0.022;
    g.fillStyle = '#38bdf8'; g.beginPath(); g.arc(pad + r, pad * 0.75 + 2, r, 0, 6.283); g.fill();
    g.fillStyle = '#e2e8f0'; g.fillText('You', pad + r * 3, pad * 0.75 + 2);
    const w1 = g.measureText('You').width;
    g.fillStyle = '#ef4444'; g.beginPath(); g.arc(pad + r * 5 + w1 + 6, pad * 0.75 + 2, r, 0, 6.283); g.fill();
    g.fillStyle = '#e2e8f0'; g.fillText(oppName.slice(0, 14), pad + r * 7 + w1 + 6, pad * 0.75 + 2);

    // celebration pulse
    if (now < this.flashUntil) {
      const p = 1 - (this.flashUntil - now) / 1500;
      g.strokeStyle = `rgba(251,191,36,${0.7 * (1 - p)})`; g.lineWidth = H * 0.02;
      g.beginPath(); g.arc(X(this.ball.x), Y(this.ball.y), H * (0.06 + p * 0.5), 0, 6.283); g.stroke();
    }
    // dots
    const rad = Math.max(4, H * 0.036);
    const drawSide = (arr, col, k) => {
      for (const d of arr) {
        if (d.gone) continue;
        g.fillStyle = col; g.strokeStyle = 'rgba(2,6,23,0.9)'; g.lineWidth = 1.5;
        g.beginPath(); g.arc(X(d.x), Y(d.y), rad, 0, 6.283); g.fill(); g.stroke();
        if (now < this.flashUntil && this.flashK === k) { g.strokeStyle = '#fbbf24'; g.lineWidth = 1.5; g.beginPath(); g.arc(X(d.x), Y(d.y), rad + 2, 0, 6.283); g.stroke(); }
      }
    };
    const uk = this.userKey, ok = uk === 'home' ? 'away' : 'home';
    drawSide(uk === 'home' ? this.home : this.away, '#38bdf8', uk);
    drawSide(ok === 'home' ? this.home : this.away, '#ef4444', ok);
    // card / injury tags
    this.tags = this.tags.filter(t => t.until > now);
    for (const t of this.tags) {
      const x = X(t.d.x), y = Y(t.d.y) - rad - 7;
      if (t.inj) { g.font = `${Math.round(H * 0.1)}px sans-serif`; g.textAlign = 'center'; g.fillText('🚑', x, y); }
      else { g.fillStyle = t.red ? '#ef4444' : '#fde047'; g.fillRect(x - 4, y - 6, 8, 12); }
    }
    // ball
    const bx = X(this.ball.x), by = Y(this.ball.y), br = Math.max(3.5, H * 0.024);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(bx + 1.5, by + br, br * 0.9, br * 0.4, 0, 0, 6.283); g.fill();
    g.fillStyle = '#fff'; g.strokeStyle = '#0f172a'; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, br, 0, 6.283); g.fill(); g.stroke();
    // caption
    if (now < this.capUntil && this.caption) {
      g.font = `900 ${Math.round(H * 0.085)}px -apple-system, Segoe UI, Roboto, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = g.measureText(this.caption).width + 22, th = H * 0.15;
      g.fillStyle = 'rgba(2,6,23,0.78)'; g.fillRect(W / 2 - tw / 2, H - th - 6, tw, th);
      g.fillStyle = this.capColor; g.fillText(this.caption, W / 2, H - th / 2 - 6);
    }
    if (this.phase === 'ht' || this.phase === 'ft') {
      g.font = `900 ${Math.round(H * 0.11)}px -apple-system, Segoe UI, Roboto, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(2,6,23,0.6)'; g.fillRect(0, H * 0.4, W, H * 0.2);
      g.fillStyle = '#fbbf24'; g.fillText(this.phase === 'ht' ? 'HALF TIME' : 'FULL TIME', W / 2, H / 2);
    }
  }
};
function pitchOnChance(m, k, res, who) { PitchViz.onChance(m, k, res, who); }

// ===========================================================================
// FIRST-MATCH TOUR
// ===========================================================================
let _tourPaused = false;
function startTour(force) {
  try { if (!force && localStorage.getItem('calcio_tour_done')) return; } catch (e) {}
  setSimTab('match');
  closeOverlay('tour-layer');
  const steps = [
    { sel: '#pitch-wrap', text: '<b>Your match.</b> Blue dots are your team, red is the opponent. The ball moves as the game plays out and goals, cards and injuries show up here.' },
    { sel: '#momentum', text: '<b>Momentum.</b> When the bar leans blue you are on top. When it leans red, they are.' },
    { sel: '#tactics-btn', text: '<b>Tactics.</b> Tap here to change formation, press and width. Check the opponent card first: every club has a style you can counter.' },
    { sel: '#pace-btn', text: '<b>Match speed.</b> Tap to cycle Fast, Normal and Slow. You can also pause at any time.' }
  ];
  const layer = document.createElement('div'); layer.id = 'tour-layer'; layer.style.cssText = 'position:absolute;inset:0;z-index:350;';
  layer.innerHTML = '<div class="tour-ring" id="tour-ring"></div><div class="tour-card" id="tour-card"></div>';
  ($id('game-app') || document.body).appendChild(layer);
  _tourPaused = autoPauseSim();
  let i = 0;
  const show = () => {
    const s = steps[i], tgt = document.querySelector(s.sel), root = $id('game-app').getBoundingClientRect();
    const ring = $id('tour-ring'), card = $id('tour-card');
    if (!tgt) { next(); return; }
    const r = tgt.getBoundingClientRect();
    ring.style.left = (r.left - root.left - 4) + 'px'; ring.style.top = (r.top - root.top - 4) + 'px';
    ring.style.width = (r.width + 8) + 'px'; ring.style.height = (r.height + 8) + 'px';
    const mid = (r.top - root.top) + r.height / 2;
    card.style.top = mid < root.height / 2 ? (r.bottom - root.top + 14) + 'px' : 'auto';
    card.style.bottom = mid < root.height / 2 ? 'auto' : (root.bottom - r.top + 14) + 'px';
    card.innerHTML = `<div class="tc-step">TIP ${i + 1} OF ${steps.length}</div>${s.text}
      <div class="tc-btns"><button class="btn-select" style="flex:1;padding:10px;" onclick="tourNext()">${i === steps.length - 1 ? 'GOT IT ✓' : 'NEXT ▶'}</button>
      <button class="btn-select" style="padding:10px;background:#334155;color:#fff;" onclick="tourEnd()">SKIP</button></div>`;
  };
  const next = () => { i++; if (i >= steps.length) tourEnd(); else show(); };
  window.tourNext = next;
  show();
}
function tourEnd() {
  closeOverlay('tour-layer');
  try { localStorage.setItem('calcio_tour_done', '1'); } catch (e) {}
  if (_tourPaused) { _tourPaused = false; autoResumeSim(); }
}
function maybeStartTour() {
  let done = false; try { done = !!localStorage.getItem('calcio_tour_done'); } catch (e) {}
  if (done) return;
  setTimeout(() => { if ($id('screen-sim').classList.contains('active')) startTour(false); }, 1400);
}
try { PitchViz.init(); } catch (e) {}
