// src/app/minigames/pixelpuck/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Vec = { x: number; y: number };
type Mode = "campaign" | "time" | "free";
type ControlAction = "serve" | "smash" | "dash" | "pause" | "up" | "down" | "left" | "right";
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type PowerUpKind = "shield" | "curve" | "boost";
type PowerUp = { id: string; x: number; y: number; kind: PowerUpKind; ttl: number };
type Medal = "bronze" | "silver" | "gold";
type PixelPuckProgress = {
  maxCompletedStage: number;
  bestRally: number;
  bestScore: number;
  lastStageIndex: number;
  timeAttackBest: Record<string, number>;
  timeAttackMedals: Record<string, Medal>;
};

type Stage = {
  id: string;
  name: string;
  blurb: string;
  target: number;
  aiSkill: number; // 0.5 easy, 1 hard
  speedBoost: number; // puck speed multiplier
};

const WIDTH = 900;
const HEIGHT = 520;
const GOAL_W = 220;
const PUCK_R = 14;
const PAD_R = 28;
const FRICTION = 0.995;
const BASE_AI_SPEED = 360;
const MAX_PUCK = 950;
const MIN_PUCK = 160;
const PARTICLE_COUNT = 8;
const POWERUP_RADIUS = 12;
const POWERUP_TTL = 9;
const POWERUP_LIMIT = 2;
const POWERUP_MIN_DELAY = 4.5;
const POWERUP_MAX_DELAY = 8;
const SPEED_BOOST_DURATION = 3.5;
const SPEED_BOOST_MULT = 1.35;
const CURVE_DURATION = 1.6;
const CURVE_FORCE = 0.02;
const MAX_SHIELD = 2;
const PROGRESS_KEY = "gridstock_pixelpuck_progress";
const TIME_ATTACK_DURATION = 60;
const TIME_ATTACK_THRESHOLDS: Record<string, { bronze: number; silver: number; gold: number }> = {
  rookie: { bronze: 6, silver: 9, gold: 12 },
  glacier: { bronze: 7, silver: 10, gold: 13 },
  quake: { bronze: 8, silver: 11, gold: 14 },
  nebula: { bronze: 9, silver: 12, gold: 15 },
};

const STAGES: Stage[] = [
  {
    id: "rookie",
    name: "Rookie Rush",
    blurb: "Warmup goalie, standard puck speed. First to 3.",
    target: 3,
    aiSkill: 0.6,
    speedBoost: 1,
  },
  {
    id: "glacier",
    name: "Glacier Glide",
    blurb: "Colder ice, puck slides longer. First to 4.",
    target: 4,
    aiSkill: 0.75,
    speedBoost: 1.1,
  },
  {
    id: "quake",
    name: "Quake Breaker",
    blurb: "Aggressive keeper, harder rebounds. First to 5.",
    target: 5,
    aiSkill: 0.92,
    speedBoost: 1.2,
  },
  {
    id: "nebula",
    name: "Nebula Finals",
    blurb: "Blistering puck, pro goalie. First to 6.",
    target: 6,
    aiSkill: 1.05,
    speedBoost: 1.32,
  },
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const STAGE_COLORS: Record<string, { top: string; bottom: string }> = {
  rookie: { top: "#0b1224", bottom: "#04070d" },
  glacier: { top: "#0c1d2f", bottom: "#07101f" },
  quake: { top: "#1a0f24", bottom: "#0a0612" },
  nebula: { top: "#0f172a", bottom: "#0a0b1a" },
  free: { top: "#0b1224", bottom: "#04070d" },
};

const POWERUP_STYLES: Record<PowerUpKind, { color: string; label: string; name: string }> = {
  shield: { color: "#60a5fa", label: "S", name: "Shield" },
  curve: { color: "#22d3ee", label: "C", name: "Curve" },
  boost: { color: "#f59e0b", label: "B", name: "Boost" },
};

const defaultProgress = (): PixelPuckProgress => ({
  maxCompletedStage: -1,
  bestRally: 0,
  bestScore: 0,
  lastStageIndex: 0,
  timeAttackBest: {},
  timeAttackMedals: {},
});

const parseScoreMap = (value: unknown) => {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, number> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
    if (typeof val === "number" && Number.isFinite(val)) {
      out[key] = Math.max(0, val);
    }
  });
  return out;
};

const parseMedalMap = (value: unknown) => {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, Medal> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
    if (val === "bronze" || val === "silver" || val === "gold") {
      out[key] = val;
    }
  });
  return out;
};

const medalRank: Record<Medal, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

const medalForScore = (score: number, stageId: string): Medal | null => {
  const thresholds = TIME_ATTACK_THRESHOLDS[stageId];
  if (!thresholds) return null;
  if (score >= thresholds.gold) return "gold";
  if (score >= thresholds.silver) return "silver";
  if (score >= thresholds.bronze) return "bronze";
  return null;
};

const formatTime = (value: number) => {
  const total = Math.max(0, Math.ceil(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const medalLabel = (medal?: Medal | null) =>
  medal ? `${medal.charAt(0).toUpperCase()}${medal.slice(1)}` : "None";

const medalTone = (medal?: Medal | null) => {
  if (medal === "gold") return "text-amber-300";
  if (medal === "silver") return "text-slate-200";
  if (medal === "bronze") return "text-orange-300";
  return "text-slate-500";
};

const loadProgress = (): PixelPuckProgress => {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<PixelPuckProgress>;
    return {
      ...defaultProgress(),
      ...parsed,
      maxCompletedStage: Number.isFinite(parsed.maxCompletedStage)
        ? Math.max(-1, parsed.maxCompletedStage ?? -1)
        : -1,
      bestRally: Number.isFinite(parsed.bestRally) ? Math.max(0, parsed.bestRally ?? 0) : 0,
      bestScore: Number.isFinite(parsed.bestScore) ? Math.max(0, parsed.bestScore ?? 0) : 0,
      lastStageIndex: Number.isFinite(parsed.lastStageIndex)
        ? Math.max(0, parsed.lastStageIndex ?? 0)
        : 0,
      timeAttackBest: parseScoreMap(parsed.timeAttackBest),
      timeAttackMedals: parseMedalMap(parsed.timeAttackMedals),
    };
  } catch {
    return defaultProgress();
  }
};

const saveProgress = (next: PixelPuckProgress) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
};

const maxPlayableStage = (progress: PixelPuckProgress) =>
  Math.min(progress.maxCompletedStage + 1, STAGES.length - 1);

const clampStageIndex = (value: number, progress: PixelPuckProgress) =>
  clamp(value, 0, maxPlayableStage(progress));

export default function PixelPuckPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef({ player: 0, ai: 0 });
  const frozenRef = useRef(true);
  const pausedRef = useRef(false);
  const resumeFromPauseRef = useRef(false);
  const timeLeftRef = useRef(TIME_ATTACK_DURATION);
  const stageStatusRef = useRef<"playing" | "won" | "lost">("playing");
  const timeAttackStatusRef = useRef<"playing" | "ended">("playing");

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("campaign");
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [stageIndex, setStageIndex] = useState(0);
  const [stageStatus, setStageStatus] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [status, setStatus] = useState("Tap or press space to serve.");
  const [frozen, setFrozen] = useState(true);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_ATTACK_DURATION);
  const [timeAttackStatus, setTimeAttackStatus] = useState<"playing" | "ended">("playing");
  const [smashReady, setSmashReady] = useState(false);
  const [autoServe, setAutoServe] = useState(true);
  const [aimAssist, setAimAssist] = useState(true);
  const [dash, setDash] = useState({ ready: true, cooldown: 0 });
  const [shieldCharges, setShieldCharges] = useState(0);
  const [curveReady, setCurveReady] = useState(false);
  const [curveTimer, setCurveTimer] = useState(0);
  const [speedBoost, setSpeedBoost] = useState({ active: false, timer: 0 });
  const [rally, setRally] = useState(0);
  const [flash, setFlash] = useState<{ color: string; timer: number } | null>(null);
  const [shake, setShake] = useState<{ mag: number; timer: number }>({ mag: 0, timer: 0 });
  const [progress, setProgress] = useState<PixelPuckProgress>(() => defaultProgress());
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [controls, setControls] = useState<Record<ControlAction, string>>({
    serve: " ",
    smash: "f",
    dash: "shift",
    pause: "p",
    up: "arrowup",
    down: "arrowdown",
    left: "arrowleft",
    right: "arrowright",
  });
  const [listening, setListening] = useState<ControlAction | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const crowdNodeRef = useRef<GainNode | null>(null);

  const state = useRef({
    puck: { x: WIDTH / 2, y: HEIGHT / 2, vx: 260, vy: 120 },
    player: { x: WIDTH / 2, y: HEIGHT - 80 },
    ai: { x: WIDTH / 2, y: 80 },
    lastTs: 0,
    dashTimer: 0,
    trail: [] as Vec[],
    rallyCount: 0,
    lastPlayer: { x: WIDTH / 2, y: HEIGHT - 80 },
    lastPlayerVel: { x: 0, y: 0 },
    particles: [] as Particle[],
    powerUps: [] as PowerUp[],
    powerCooldown: 3,
    shieldCharges: 0,
    curveReady: false,
    curveTimer: 0,
    curveSpin: 0,
    speedBoostTimer: 0,
  });

  const goalToWin = () =>
    mode === "campaign" ? STAGES[stageIndex].target : mode === "free" ? 5 : Number.POSITIVE_INFINITY;

  const currentStage = () => STAGES[stageIndex];

  const unlockedCount = Math.min(STAGES.length, progress.maxCompletedStage + 2);
  const playableStageIndex = maxPlayableStage(progress);

  const schedulePowerUp = () => {
    state.current.powerCooldown =
      POWERUP_MIN_DELAY + Math.random() * (POWERUP_MAX_DELAY - POWERUP_MIN_DELAY);
  };

  const clearPowerField = () => {
    state.current.powerUps = [];
    schedulePowerUp();
  };

  const resetPowerState = () => {
    clearPowerField();
    state.current.shieldCharges = 0;
    state.current.curveReady = false;
    state.current.curveTimer = 0;
    state.current.curveSpin = 0;
    state.current.speedBoostTimer = 0;
    setShieldCharges(0);
    setCurveReady(false);
    setCurveTimer(0);
    setSpeedBoost({ active: false, timer: 0 });
  };

  const resetPauseState = () => {
    pausedRef.current = false;
    resumeFromPauseRef.current = false;
    setPaused(false);
  };

  const resetTimeAttack = (serveDown: boolean) => {
    resetPauseState();
    timeLeftRef.current = TIME_ATTACK_DURATION;
    setTimeLeft(TIME_ATTACK_DURATION);
    setTimeAttackStatus("playing");
    timeAttackStatusRef.current = "playing";
    resetScores(serveDown);
  };

  const endTimeAttack = () => {
    if (timeAttackStatusRef.current === "ended") return;
    timeAttackStatusRef.current = "ended";
    setTimeAttackStatus("ended");
    timeLeftRef.current = 0;
    setTimeLeft(0);
    setFrozen(true);
    frozenRef.current = true;
    setStatus("Time's up!");
    const stageId = currentStage().id;
    const runScore = scoreRef.current.player;
    const medal = medalForScore(runScore, stageId);
    setProgress((prev) => {
      const bestMap = { ...prev.timeAttackBest };
      const medals = { ...prev.timeAttackMedals };
      const bestScore = Math.max(bestMap[stageId] ?? 0, runScore);
      bestMap[stageId] = bestScore;
      if (medal) {
        const existing = medals[stageId];
        if (!existing || medalRank[medal] > medalRank[existing]) {
          medals[stageId] = medal;
        }
      }
      const next = { ...prev, timeAttackBest: bestMap, timeAttackMedals: medals };
      saveProgress(next);
      return next;
    });
  };

  const spawnPowerUp = () => {
    if (state.current.powerUps.length >= POWERUP_LIMIT) return;
    const kinds: PowerUpKind[] = ["shield", "curve", "boost"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const x = clamp(
      POWERUP_RADIUS + 40 + Math.random() * (WIDTH - POWERUP_RADIUS * 2 - 80),
      POWERUP_RADIUS + 40,
      WIDTH - POWERUP_RADIUS - 40
    );
    const midBand = HEIGHT * 0.28;
    const y = clamp(
      HEIGHT / 2 - midBand + Math.random() * (midBand * 2),
      HEIGHT / 2 - midBand,
      HEIGHT / 2 + midBand
    );
    state.current.powerUps.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x,
      y,
      kind,
      ttl: POWERUP_TTL,
    });
    schedulePowerUp();
  };

  const grantPowerUp = (kind: PowerUpKind, at: Vec) => {
    const style = POWERUP_STYLES[kind];
    spawnParticles(at.x, at.y, style.color);
    if (kind === "shield") {
      const next = clamp(state.current.shieldCharges + 1, 0, MAX_SHIELD);
      state.current.shieldCharges = next;
      setShieldCharges(next);
      setStatus(next > 1 ? "Shield stacked." : "Shield online.");
      setFlash({ color: "rgba(96,165,250,0.25)", timer: 0.3 });
      return;
    }
    if (kind === "curve") {
      state.current.curveReady = true;
      setCurveReady(true);
      setStatus("Curve shot ready.");
      setFlash({ color: "rgba(34,211,238,0.2)", timer: 0.3 });
      return;
    }
    if (kind === "boost") {
      state.current.speedBoostTimer = SPEED_BOOST_DURATION;
      setSpeedBoost({ active: true, timer: SPEED_BOOST_DURATION });
      setStatus("Speed burst!");
      setFlash({ color: "rgba(245,158,11,0.2)", timer: 0.3 });
    }
  };

  const resetRound = (serveDown = true) => {
    const boost = mode === "campaign" || mode === "time" ? currentStage().speedBoost : 1;
    state.current.puck = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * 240 * boost,
      vy: (serveDown ? 1 : -1) * (180 + Math.random() * 60) * boost,
    };
    state.current.lastTs = 0;
    setFrozen(true);
    setSmashReady(false);
    clearPowerField();
  };

  const resetScores = (serveDown: boolean) => {
    const reset = { player: 0, ai: 0 };
    scoreRef.current = reset;
    setScore(reset);
    resetPauseState();
    resetRound(serveDown);
    setStageStatus("playing");
    stageStatusRef.current = "playing";
    setRally(0);
    state.current.rallyCount = 0;
    resetPowerState();
  };

  useEffect(() => {
    stageStatusRef.current = stageStatus;
  }, [stageStatus]);

  useEffect(() => {
    frozenRef.current = frozen;
  }, [frozen]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    timeAttackStatusRef.current = timeAttackStatus;
  }, [timeAttackStatus]);

  useEffect(() => {
    const saved = loadProgress();
    setProgress(saved);
    setStageIndex(clampStageIndex(saved.lastStageIndex, saved));
    setProgressLoaded(true);
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;
    if (rally <= progress.bestRally) return;
    setProgress((prev) => {
      if (rally <= prev.bestRally) return prev;
      const next = { ...prev, bestRally: rally };
      saveProgress(next);
      return next;
    });
  }, [rally, progressLoaded, progress.bestRally]);

  useEffect(() => {
    if (!progressLoaded) return;
    if (score.player <= progress.bestScore) return;
    setProgress((prev) => {
      if (score.player <= prev.bestScore) return prev;
      const next = { ...prev, bestScore: score.player };
      saveProgress(next);
      return next;
    });
  }, [score.player, progressLoaded, progress.bestScore]);

  useEffect(() => {
    if (!progressLoaded) return;
    if (mode !== "campaign" || stageStatus !== "won") return;
    setProgress((prev) => {
      const nextMax = Math.max(prev.maxCompletedStage, stageIndex);
      const next = { ...prev, maxCompletedStage: nextMax };
      saveProgress(next);
      return next;
    });
  }, [mode, stageStatus, stageIndex, progressLoaded]);

  useEffect(() => {
    if (!progressLoaded) return;
    if (mode !== "campaign") return;
    if (progress.lastStageIndex === stageIndex) return;
    setProgress((prev) => {
      if (prev.lastStageIndex === stageIndex) return prev;
      const next = { ...prev, lastStageIndex: stageIndex };
      saveProgress(next);
      return next;
    });
  }, [stageIndex, mode, progressLoaded, progress.lastStageIndex]);

  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (listening) {
        setControls((cfg) => ({ ...cfg, [listening]: key }));
        setListening(null);
        return;
      }
      keysRef.current.add(key);
      if (key === controls.serve) {
        startPlay();
      }
      if (key === controls.smash && !frozenRef.current && stageStatusRef.current === "playing") {
        setSmashReady(true);
        setStatus("Power smash armed – hit the puck!");
      }
      if (key === controls.dash && !frozenRef.current && dash.ready) {
        dashBurst();
      }
      if (key === controls.pause) {
        if (stageStatusRef.current === "playing") {
          if (!pausedRef.current) {
            resumeFromPauseRef.current = !frozenRef.current;
            pausedRef.current = true;
            setPaused(true);
            frozenRef.current = true;
            setFrozen(true);
            setStatus("Paused (P to resume)");
          } else {
            pausedRef.current = false;
            setPaused(false);
            if (resumeFromPauseRef.current) {
              frozenRef.current = false;
              setFrozen(false);
              setStatus("");
              animRef.current = requestAnimationFrame(loop);
            } else {
              setStatus("Tap or press space to serve.");
            }
            resumeFromPauseRef.current = false;
          }
        }
      }
    };
    const keyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    const handleMove = (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((clientX - rect.left) / rect.width) * WIDTH;
      const y = ((clientY - rect.top) / rect.height) * HEIGHT;
      state.current.player.x = clamp(x, PAD_R + 10, WIDTH - PAD_R - 10);
      state.current.player.y = clamp(y, HEIGHT / 2 + PAD_R, HEIGHT - PAD_R - 10);
    };
    const onMouse = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch);
    setReady(true);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  const movePlayer = (dt: number) => {
    const speed =
      420 * (state.current.speedBoostTimer > 0 ? SPEED_BOOST_MULT : 1);
    const p = state.current.player;
    const prev = { ...state.current.lastPlayer };
    if (keysRef.current.has(controls.left) || keysRef.current.has("a")) p.x -= speed * dt;
    if (keysRef.current.has(controls.right) || keysRef.current.has("d")) p.x += speed * dt;
    if (keysRef.current.has(controls.up) || keysRef.current.has("w")) p.y -= speed * dt;
    if (keysRef.current.has(controls.down) || keysRef.current.has("s")) p.y += speed * dt;
    // Apply a bit of smoothing to avoid jitter
    const smooth = 0.25;
    p.x = clamp(p.x * (1 - smooth) + state.current.lastPlayer.x * smooth, PAD_R + 10, WIDTH - PAD_R - 10);
    p.y = clamp(p.y * (1 - smooth) + state.current.lastPlayer.y * smooth, HEIGHT / 2 + PAD_R, HEIGHT - PAD_R - 10);
    state.current.lastPlayerVel = { x: (p.x - prev.x) / dt, y: (p.y - prev.y) / dt };
    state.current.lastPlayer = { x: p.x, y: p.y };
  };

  const moveAI = (dt: number) => {
    const puck = state.current.puck;
    const look =
      mode === "campaign" || mode === "time"
        ? 0.9 + currentStage().aiSkill * 0.3
        : difficulty === "hard"
        ? 1.05
        : difficulty === "normal"
        ? 0.85
        : 0.65;
    let projectedX = puck.x + puck.vx * look;
    if (projectedX < PUCK_R || projectedX > WIDTH - PUCK_R) {
      const span = WIDTH - PUCK_R * 2;
      const wrapped = ((projectedX - PUCK_R) % span + span) % span;
      const mirror = wrapped > span / 2 ? span - wrapped : wrapped;
      projectedX = mirror + PUCK_R;
    }
    const target: Vec = {
      x: clamp(projectedX, PAD_R + 10, WIDTH - PAD_R - 10),
      y: clamp(puck.y - 70, PAD_R + 10, HEIGHT / 2 - PAD_R - 20),
    };
    const ai = state.current.ai;
    const base =
      mode === "campaign" || mode === "time"
        ? BASE_AI_SPEED * (0.7 + currentStage().aiSkill * 0.5)
        : difficulty === "hard"
        ? 480
        : difficulty === "normal"
        ? 400
        : 330;
    const dx = target.x - ai.x;
    const dy = target.y - ai.y;
    const dist = Math.hypot(dx, dy) || 1;
    ai.x += (dx / dist) * base * dt;
    ai.y += (dy / dist) * base * dt;
    ai.x = clamp(ai.x, PAD_R + 10, WIDTH - PAD_R - 10);
    ai.y = clamp(ai.y, PAD_R + 10, HEIGHT / 2 - PAD_R - 10);
  };

  const collidePuck = (pad: Vec, isPlayer: boolean) => {
    const puck = state.current.puck;
    const dx = puck.x - pad.x;
    const dy = puck.y - pad.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= PAD_R + PUCK_R) return;
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    let speed = Math.min(MAX_PUCK, Math.hypot(puck.vx, puck.vy) + 40);
    if (isPlayer && smashReady) {
      speed *= 1.5;
      setSmashReady(false);
      setStatus("Power smash!");
      setFlash({ color: "rgba(34,197,94,0.25)", timer: 0.35 });
      setShake({ mag: 6, timer: 0.4 });
    }
    if (isPlayer && state.current.curveReady) {
      const spinDirection = Math.sign(dx) || 1;
      state.current.curveSpin = spinDirection * 1.1;
      state.current.curveTimer = CURVE_DURATION;
      state.current.curveReady = false;
      setCurveReady(false);
      setCurveTimer(CURVE_DURATION);
      setStatus("Curve shot!");
      setFlash({ color: "rgba(34,211,238,0.2)", timer: 0.35 });
    }
    // Spin/English from paddle velocity
    const tangentialBoost = isPlayer ? state.current.lastPlayerVel.x * 0.35 : 0;
    const push = isPlayer ? 1 : -1;
    puck.vx = nx * speed + tangentialBoost;
    puck.vy = ny * speed * push;
    puck.x = pad.x + nx * (PAD_R + PUCK_R + 1);
    puck.y = pad.y + ny * (PAD_R + PUCK_R + 1);
    state.current.rallyCount += 1;
    setRally(Math.floor(state.current.rallyCount));
    spawnParticles(puck.x, puck.y, isPlayer ? "#22c55e" : "#f97316");
  };

  const step = (dt: number) => {
    if (frozenRef.current || stageStatusRef.current !== "playing") return;
    // Dash cooldown tick
    if (state.current.dashTimer > 0) {
      state.current.dashTimer -= dt;
      if (state.current.dashTimer <= 0) {
        setDash({ ready: true, cooldown: 0 });
      } else {
        setDash({ ready: false, cooldown: Math.max(0, state.current.dashTimer) });
      }
    }
    if (state.current.speedBoostTimer > 0) {
      state.current.speedBoostTimer = Math.max(0, state.current.speedBoostTimer - dt);
      if (state.current.speedBoostTimer <= 0) {
        setSpeedBoost({ active: false, timer: 0 });
      } else {
        setSpeedBoost({ active: true, timer: state.current.speedBoostTimer });
      }
    }
    if (state.current.curveTimer > 0) {
      state.current.curveTimer = Math.max(0, state.current.curveTimer - dt);
      setCurveTimer(state.current.curveTimer);
      if (state.current.curveTimer === 0) {
        state.current.curveSpin = 0;
      }
    }
    if (state.current.powerCooldown > 0) {
      state.current.powerCooldown = Math.max(0, state.current.powerCooldown - dt);
    }
    movePlayer(dt);
    moveAI(dt);
    if (state.current.powerUps.length > 0) {
      for (let i = state.current.powerUps.length - 1; i >= 0; i--) {
        const power = state.current.powerUps[i];
        power.ttl -= dt;
        if (power.ttl <= 0) {
          state.current.powerUps.splice(i, 1);
          continue;
        }
        const dx = power.x - state.current.player.x;
        const dy = power.y - state.current.player.y;
        if (Math.hypot(dx, dy) <= PAD_R + POWERUP_RADIUS) {
          grantPowerUp(power.kind, power);
          state.current.powerUps.splice(i, 1);
        }
      }
    }
    if (state.current.powerCooldown <= 0 && state.current.powerUps.length < POWERUP_LIMIT) {
      spawnPowerUp();
    }
    const puck = state.current.puck;
    puck.x += puck.vx * dt;
    puck.y += puck.vy * dt;
    // Trail
    state.current.trail.push({ x: puck.x, y: puck.y });
    if (state.current.trail.length > 24) state.current.trail.shift();
    const friction = FRICTION + Math.min(state.current.rallyCount, 12) * 0.00025;
    puck.vx *= friction;
    puck.vy *= friction;
    const speedNow = Math.hypot(puck.vx, puck.vy);
    if (speedNow < MIN_PUCK) {
      const factor = MIN_PUCK / (speedNow || 1);
      puck.vx *= factor;
      puck.vy *= factor;
    }
    if (state.current.curveTimer > 0 && state.current.curveSpin !== 0) {
      const spinForce = state.current.curveSpin * CURVE_FORCE;
      const vx = puck.vx;
      const vy = puck.vy;
      puck.vx += -vy * spinForce * dt;
      puck.vy += vx * spinForce * dt;
    }

    // Walls
    if (puck.x <= PUCK_R || puck.x >= WIDTH - PUCK_R) {
      puck.vx = -puck.vx * 0.98;
      puck.x = clamp(puck.x, PUCK_R, WIDTH - PUCK_R);
      puck.vx += (Math.random() - 0.5) * 26;
    }

    // Goals
    if (puck.y <= PUCK_R) {
      const inGoal = Math.abs(puck.x - WIDTH / 2) < GOAL_W / 2;
      if (inGoal) {
        setScore((s) => {
          const next = { ...s, player: s.player + 1 };
          scoreRef.current = next;
          return next;
        });
        setStatus("You scored! Tap/space to serve.");
        setFlash({ color: "rgba(52,211,153,0.35)", timer: 0.45 });
        setShake({ mag: 8, timer: 0.35 });
        resetRound(false);
        return;
      } else {
        puck.vy = -puck.vy;
        puck.y = PUCK_R;
      }
    }
    if (puck.y >= HEIGHT - PUCK_R) {
      const inGoal = Math.abs(puck.x - WIDTH / 2) < GOAL_W / 2;
      if (inGoal) {
        if (state.current.shieldCharges > 0) {
          const next = Math.max(0, state.current.shieldCharges - 1);
          state.current.shieldCharges = next;
          setShieldCharges(next);
          setStatus("Shield saved you!");
          setFlash({ color: "rgba(96,165,250,0.28)", timer: 0.35 });
          setShake({ mag: 6, timer: 0.3 });
          puck.vy = -Math.abs(puck.vy) * 1.05;
          puck.y = HEIGHT - PUCK_R - 2;
          puck.vx += (Math.random() - 0.5) * 90;
        } else {
        setScore((s) => {
          const next = { ...s, ai: s.ai + 1 };
          scoreRef.current = next;
          return next;
        });
        setStatus("AI scored. Tap/space to serve.");
        setFlash({ color: "rgba(239,68,68,0.35)", timer: 0.45 });
        setShake({ mag: 8, timer: 0.35 });
        resetRound(true);
        return;
        }
      } else {
        puck.vy = -puck.vy;
        puck.y = HEIGHT - PUCK_R;
      }
    }

    collidePuck(state.current.player, true);
    collidePuck(state.current.ai, false);

    // Rally decay slowly
    state.current.rallyCount = Math.max(0, state.current.rallyCount - dt * 0.2);
    setRally(Math.floor(state.current.rallyCount));

    // Particles
    for (let i = state.current.particles.length - 1; i >= 0; i--) {
      const p = state.current.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 10 * dt;
      p.life -= dt;
      if (p.life <= 0) state.current.particles.splice(i, 1);
    }

    const targetScore = goalToWin();
    if (scoreRef.current.player >= targetScore) {
      setStageStatus("won");
      stageStatusRef.current = "won";
      setFrozen(true);
      frozenRef.current = true;
      setStatus("Mission cleared! Continue?");
    } else if (scoreRef.current.ai >= targetScore) {
      setStageStatus("lost");
      stageStatusRef.current = "lost";
      setFrozen(true);
      frozenRef.current = true;
      setStatus("Mission failed. Retry?");
    }
  };

  const draw = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const theme = stageColors();
    const g = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    g.addColorStop(0, theme.top);
    g.addColorStop(1, theme.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    if (shake.timer > 0) {
      const mag = shake.mag * Math.random();
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // Center line
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT / 2);
    ctx.lineTo(WIDTH, HEIGHT / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Goals
    ctx.fillStyle = "rgba(34,197,94,0.18)";
    ctx.fillRect(WIDTH / 2 - GOAL_W / 2, 0, GOAL_W, 46);
    ctx.fillStyle = "rgba(239,68,68,0.18)";
    ctx.fillRect(WIDTH / 2 - GOAL_W / 2, HEIGHT - 46, GOAL_W, 46);

    // Power-ups
    state.current.powerUps.forEach((power) => {
      const style = POWERUP_STYLES[power.kind];
      const alpha = Math.max(0.35, power.ttl / POWERUP_TTL);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = style.color;
      ctx.beginPath();
      ctx.arc(power.x, power.y, POWERUP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0b0f1a";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(style.label, power.x, power.y + 0.5);
    });

    // Paddles
    const p = state.current.player;
    const ai = state.current.ai;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(p.x, p.y, PAD_R, 0, Math.PI * 2);
    ctx.fill();
    if (state.current.shieldCharges > 0) {
      ctx.strokeStyle = "rgba(96,165,250,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PAD_R + 6, 0, Math.PI * 2);
      ctx.stroke();
      if (state.current.shieldCharges > 1) {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PAD_R + 11, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (state.current.speedBoostTimer > 0) {
      ctx.strokeStyle = "rgba(245,158,11,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PAD_R + 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(ai.x, ai.y, PAD_R, 0, Math.PI * 2);
    ctx.fill();

    // Puck
    const puck = state.current.puck;
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, PUCK_R, 0, Math.PI * 2);
    ctx.fill();
    if (state.current.curveTimer > 0 || state.current.curveReady) {
      ctx.strokeStyle = "rgba(34,211,238,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(puck.x, puck.y, PUCK_R + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Aim assist path
    const path = predictPath();
    if (path.length > 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(puck.x, puck.y);
      path.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Trail
    if (state.current.trail.length > 1) {
      ctx.strokeStyle = "rgba(226,232,240,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const first = state.current.trail[0];
      ctx.moveTo(first.x, first.y);
      state.current.trail.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    }

    // Particles
    state.current.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      ctx.globalAlpha = 1;
    });

    // Rally badge
    if (rally > 2) {
      ctx.fillStyle = "rgba(74,222,128,0.18)";
      ctx.beginPath();
      ctx.roundRect(WIDTH - 160, HEIGHT / 2 - 24, 140, 32, 10);
      ctx.fill();
      ctx.fillStyle = "#bbf7d0";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Rally x${rally}`, WIDTH - 140, HEIGHT / 2 - 4);
    }

    // Flash overlay
    if (flash && flash.timer > 0) {
      ctx.fillStyle = flash.color;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    ctx.restore();
  };

  const loop = (ts: number) => {
    const s = state.current;
    if (!s.lastTs) s.lastTs = ts;
    const dt = Math.min(0.03, (ts - s.lastTs) / 1000);
    s.lastTs = ts;
    if (mode === "time" && timeAttackStatusRef.current === "playing" && !pausedRef.current) {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - dt);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        endTimeAttack();
      }
    }
    if (flash && flash.timer > 0) {
      const next = Math.max(0, flash.timer - dt);
      setFlash(next > 0 ? { ...flash, timer: next } : null);
    }
    if (shake.timer > 0) {
      const next = Math.max(0, shake.timer - dt);
      setShake(next > 0 ? { ...shake, timer: next } : { mag: 0, timer: 0 });
    }
    step(dt);
    draw();
    const target = goalToWin();
    const winning = scoreRef.current.player >= target || scoreRef.current.ai >= target;
    const timeOver = mode === "time" && timeAttackStatusRef.current === "ended";
    if (!winning && !timeOver) {
      animRef.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (stageStatus === "won") {
      // Advance campaign automatically after a short moment
      const id = setTimeout(() => {
        if (mode !== "campaign") return;
        if (stageIndex < STAGES.length - 1) {
          setStageIndex((i) => i + 1);
          setStageStatus("playing");
          setStatus("Next mission loaded. Tap to serve.");
          resetScores(stageIndex % 2 === 0);
        }
      }, 1200);
      return () => clearTimeout(id);
    }
  }, [stageStatus, mode, stageIndex]);

  useEffect(() => {
    // When stage changes, reset round
    if (mode === "time") {
      resetTimeAttack(stageIndex % 2 === 0);
      setStatus("Time attack ready. Tap to serve.");
    } else {
      resetScores(stageIndex % 2 === 0);
      setStatus("Tap or press space to serve.");
    }
  }, [stageIndex, mode]);

  useEffect(() => {
    if (!autoServe) return;
    if (pausedRef.current) return;
    if (mode === "time" && timeAttackStatusRef.current === "ended") return;
    if (!frozenRef.current || stageStatusRef.current !== "playing") return;
    const id = setTimeout(() => {
      if (
        frozenRef.current &&
        stageStatusRef.current === "playing" &&
        !pausedRef.current &&
        !(mode === "time" && timeAttackStatusRef.current === "ended")
      ) {
        startPlay();
      }
    }, 900);
    return () => clearTimeout(id);
  }, [frozen, autoServe, stageStatus, mode]);

  const startPlay = () => {
    resetPauseState();
    if (mode === "time") {
      if (timeAttackStatusRef.current === "ended") {
        resetTimeAttack(true);
      }
    } else if (stageStatusRef.current !== "playing") {
      // If stage was over, resume by resetting scores but keep mode/stage
      resetScores(true);
    }
    startCrowd();
    setFrozen(false);
    frozenRef.current = false;
    setStatus("");
    animRef.current = requestAnimationFrame(loop);
  };

  const dashBurst = () => {
    if (!dash.ready) return;
    const p = state.current.player;
    const puck = state.current.puck;
    const dx = puck.x - p.x;
    const dy = puck.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const jump = Math.min(140, dist);
    const nx = dx / dist;
    const ny = dy / dist;
    p.x = clamp(p.x + nx * jump, PAD_R + 10, WIDTH - PAD_R - 10);
    p.y = clamp(p.y + ny * jump, HEIGHT / 2 + PAD_R, HEIGHT - PAD_R - 10);
    setDash({ ready: false, cooldown: 4 });
    state.current.dashTimer = 4;
    setFlash({ color: "rgba(59,130,246,0.25)", timer: 0.25 });
  };

  const predictPath = () => {
    if (!aimAssist) return [];
    const pts: Vec[] = [];
    const puck = { ...state.current.puck };
    for (let i = 0; i < 120; i++) {
      // stop if would hit goal
      if (puck.y <= PUCK_R && Math.abs(puck.x - WIDTH / 2) < GOAL_W / 2) break;
      if (puck.y >= HEIGHT - PUCK_R && Math.abs(puck.x - WIDTH / 2) < GOAL_W / 2) break;
      const dt = 0.02;
      puck.x += puck.vx * dt;
      puck.y += puck.vy * dt;
      if (puck.x <= PUCK_R || puck.x >= WIDTH - PUCK_R) {
        puck.vx = -puck.vx;
      }
      pts.push({ x: puck.x, y: puck.y });
    }
    return pts;
  };

  const campaignComplete = stageIndex === STAGES.length - 1 && stageStatus === "won";
  const timeAttackStageId = currentStage().id;
  const timeAttackBest = progress.timeAttackBest[timeAttackStageId] ?? 0;
  const timeAttackMedal = progress.timeAttackMedals[timeAttackStageId];
  const runMedal = medalForScore(score.player, timeAttackStageId);
  const timeAttackThresholds = TIME_ATTACK_THRESHOLDS[timeAttackStageId];
  const timeLeftLabel = formatTime(timeLeft);

  const stageColors = () => {
    if (mode === "campaign" || mode === "time") {
      const palette = STAGE_COLORS[currentStage().id] || STAGE_COLORS.free;
      return palette;
    }
    return STAGE_COLORS.free;
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 140;
      state.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.35,
        color,
      });
    }
  };

  const startCrowd = () => {
    if (audioRef.current || typeof window === "undefined") return;
    try {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.06;
      const bufferSize = 1024;
      const noise = ctx.createScriptProcessor(bufferSize, 1, 1);
      let lastOut = 0;
      noise.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          output[i] = lastOut * 0.5;
        }
      };
      noise.connect(gain);
      gain.connect(ctx.destination);
      audioRef.current = ctx;
      crowdNodeRef.current = gain;
    } catch {
      // ignore if audio context fails
    }
  };

  return (
    <div className="space-y-6">
      <div className="gs-panel-strong rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">PixelPuck</h1>
          <p className="text-slate-300 text-sm">
            Campaign air hockey with stage bosses, power smashes, and free play.
          </p>
        </div>
        <Link
          href="/gridstock/minigames/doomball"
          className="text-sm text-emerald-300 hover:text-emerald-200 hover:underline"
        >
          ← Back to Doomball
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["campaign", "time", "free"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setStageStatus("playing");
              stageStatusRef.current = "playing";
              if (m === "time") {
                setStatus("Time attack ready. Tap to serve.");
                resetTimeAttack(true);
              } else {
                setStatus("Tap or press space to serve.");
                setTimeAttackStatus("playing");
                timeAttackStatusRef.current = "playing";
                timeLeftRef.current = TIME_ATTACK_DURATION;
                setTimeLeft(TIME_ATTACK_DURATION);
                resetScores(true);
              }
            }}
            className={`px-3 py-1 rounded-full text-sm border ${
              mode === m
                ? "border-[rgb(var(--grid-accent))] text-white bg-[rgb(var(--grid-accent)/0.16)]"
                : "border-[color:var(--grid-border)] text-slate-400 hover:border-[rgb(var(--grid-accent)/0.4)]"
            }`}
          >
            {m === "campaign" ? "Campaign" : m === "time" ? "Time Attack" : "Free Play"}
          </button>
        ))}
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={autoServe}
            onChange={(e) => setAutoServe(e.target.checked)}
            className="accent-emerald-400"
          />
          Auto-serve after goals
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={aimAssist}
            onChange={(e) => setAimAssist(e.target.checked)}
            className="accent-emerald-400"
          />
          Aim guide
        </label>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Stage:</span>
          <select
            value={mode === "campaign" || mode === "time" ? currentStage().id : "free"}
            onChange={(e) => {
              const id = e.target.value;
              if (mode === "campaign" || mode === "time") {
                const idx = STAGES.findIndex((s) => s.id === id);
                if (idx >= 0 && (mode === "time" || idx <= playableStageIndex)) {
                  setStageIndex(idx);
                } else {
                  setStatus("Complete the previous mission to unlock.");
                }
              }
            }}
            className="gs-select rounded-full px-3 py-1 text-xs"
          >
            {mode === "campaign" || mode === "time"
              ? STAGES.map((s, idx) => {
                  const locked = idx > playableStageIndex && mode === "campaign";
                  return (
                    <option key={s.id} value={s.id} disabled={locked}>
                      {s.name}{locked ? " (locked)" : ""}
                    </option>
                  );
                })
              : [
                  <option key="free" value="free">
                    Free Play
                  </option>,
                ]}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto,320px] gap-6">
        <div className="gs-panel rounded-2xl p-4">
          <div className="flex flex-wrap justify-between mb-3 text-sm text-slate-400 gap-3">
            <span>
              You: <span className="text-white font-semibold">{score.player}</span>
            </span>
            <span>
              Bot: <span className="text-white font-semibold">{score.ai}</span>
            </span>
            <span className="text-slate-500">{status}</span>
            {mode === "time" && (
              <span className="text-xs text-slate-400">
                Time: <span className="text-white">{timeLeftLabel}</span>
              </span>
            )}
          {mode === "free" && (
            <div className="flex items-center gap-2">
              {(["easy", "normal", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    setStatus(`Difficulty: ${d}`);
                    resetScores(true);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    difficulty === d
                      ? "border-[rgb(var(--grid-accent))] text-white bg-[rgb(var(--grid-accent)/0.2)]"
                      : "border-[color:var(--grid-border)] text-slate-400 hover:border-[rgb(var(--grid-accent)/0.4)]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
            {mode === "campaign" && (
              <span className="text-xs text-slate-400">
                Mission: <span className="text-white">{currentStage().name}</span> · First to{" "}
                {currentStage().target}
              </span>
            )}
            {mode === "time" && (
              <span className="text-xs text-slate-400">
                Stage: <span className="text-white">{currentStage().name}</span>
              </span>
            )}
            <span className="text-xs text-slate-400">
              Dash:{" "}
              <span className={dash.ready ? "text-emerald-300" : "text-amber-300"}>
                {dash.ready ? "Ready (Shift)" : `${dash.cooldown.toFixed(1)}s`}
              </span>
            </span>
            {rally > 2 && (
              <span className="text-xs text-emerald-300 font-semibold">Rally x{rally}</span>
            )}
          </div>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={WIDTH}
              height={HEIGHT}
              className="w-full h-auto rounded-2xl border border-[color:var(--grid-border)] bg-black"
              onClick={() => {
                startPlay();
              }}
            />
            {(frozen || stageStatus !== "playing" || (mode === "time" && timeAttackStatus === "ended")) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 bg-black/70 rounded-full text-sm text-white border border-[color:var(--grid-border)] text-center">
                  {mode === "time" && timeAttackStatus === "ended"
                    ? `Time's up! Score ${score.player}${runMedal ? ` · ${runMedal.toUpperCase()}` : ""}`
                    : stageStatus === "won"
                    ? campaignComplete
                      ? "Championship claimed! Tap to replay."
                      : "Mission cleared! Tap to continue."
                    : stageStatus === "lost"
                    ? "Mission failed. Tap to retry."
                    : "Tap/space to serve."}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={startPlay}
              className="px-3 py-2 rounded bg-[rgb(var(--grid-accent))] text-slate-950 text-sm font-semibold"
            >
              {mode === "time"
                ? timeAttackStatus === "ended"
                  ? "Restart Run"
                  : frozen
                  ? "Serve / Start"
                  : "Resume"
                : stageStatus === "playing"
                ? frozen
                  ? "Serve / Start"
                  : "Resume"
                : "Restart Round"}
            </button>
            <button
              onClick={() => {
                if (mode === "time") {
                  resetTimeAttack(true);
                  setStatus("Time attack ready. Tap to serve.");
                } else {
                  resetScores(true);
                  setStatus("Tap or press space to serve.");
                }
              }}
              className="px-3 py-2 rounded bg-[color:var(--grid-panel-strong)] border border-[color:var(--grid-border)] text-slate-200 text-sm"
            >
              {mode === "time" ? "Reset Run" : "Reset Score"}
            </button>
          </div>
          {stageStatus !== "playing" && (
            <div className="mt-4 flex gap-2">
              {stageStatus === "lost" && (
                <button
                  onClick={() => {
                    setStageStatus("playing");
                    stageStatusRef.current = "playing";
                    resetScores(true);
                    setStatus("Tap or press space to serve.");
                  }}
                  className="px-3 py-2 rounded bg-[rgb(var(--grid-danger))] text-slate-950 text-sm font-semibold"
                >
                  Retry Stage
                </button>
              )}
              {stageStatus === "won" && (
                <button
                  onClick={() => {
                    if (campaignComplete) {
                      setStageIndex(0);
                    } else {
                      setStageIndex((i) => Math.min(STAGES.length - 1, i + 1));
                    }
                    setStageStatus("playing");
                    stageStatusRef.current = "playing";
                    resetScores(true);
                    setStatus("Tap or press space to serve.");
                  }}
                  className="px-3 py-2 rounded bg-[rgb(var(--grid-success))] text-slate-950 text-sm font-semibold"
                >
                  {campaignComplete ? "Replay Campaign" : "Next Mission"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="gs-panel rounded-2xl p-4 space-y-3">
            <h3 className="text-lg font-semibold">Campaign</h3>
            <div className="text-xs text-slate-500">
              Unlocked: {unlockedCount}/{STAGES.length} missions
            </div>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage, idx) => {
                const completed =
                  idx <= progress.maxCompletedStage || (idx === stageIndex && stageStatus === "won");
                const active = idx === stageIndex;
                const locked = idx > playableStageIndex;
                return (
                  <div
                    key={stage.id}
                    className={`px-3 py-2 rounded-lg border text-xs ${
                      completed
                        ? "border-[rgb(var(--grid-success)/0.5)] bg-[rgb(var(--grid-success)/0.16)] text-emerald-100"
                        : active
                        ? "border-[rgb(var(--grid-accent))] text-white"
                        : locked
                        ? "border-[color:var(--grid-border)] text-slate-500 opacity-60"
                        : "border-[color:var(--grid-border)] text-slate-400"
                    }`}
                  >
                    {stage.name} · {stage.target} pts
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-slate-300">
              {mode === "campaign"
                ? currentStage().blurb
                : mode === "time"
                ? "Race the clock and stack medals on every mission."
                : "Pick your pace in Free Play and practice power smashes."}
            </div>
          </div>

          <div className="gs-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Time Attack</h3>
              <span className="text-xs text-slate-500">{TIME_ATTACK_DURATION}s</span>
            </div>
            <div className="text-xs text-slate-400">
              Race the clock. Medals are per stage in Time Attack mode.
            </div>
            {timeAttackThresholds && (
              <div className="text-xs text-slate-400">
                Targets: Bronze {timeAttackThresholds.bronze} · Silver {timeAttackThresholds.silver} · Gold{" "}
                {timeAttackThresholds.gold}
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Best for {currentStage().name}</span>
              <span className={medalTone(timeAttackMedal)}>
                {timeAttackBest} · {medalLabel(timeAttackMedal)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {STAGES.map((stage) => {
                const medal = progress.timeAttackMedals[stage.id];
                const best = progress.timeAttackBest[stage.id] ?? 0;
                return (
                  <div key={stage.id} className="flex items-center justify-between rounded-lg border border-[color:var(--grid-border)] px-2 py-1">
                    <span className="text-slate-300">{stage.name}</span>
                    <span className={medalTone(medal)}>
                      {best} · {medalLabel(medal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gs-panel rounded-2xl p-4 space-y-3">
            <h3 className="text-lg font-semibold">How to play</h3>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              <li>Mouse/touch or WASD/arrows move your striker (bottom half).</li>
              <li>Tap canvas or press space to serve. First to target score wins the stage.</li>
              <li>Press <span className="font-semibold text-white">F</span> to arm a power smash; your next hit supercharges the puck.</li>
              <li>Power-ups spawn mid-ice: Shield blocks one goal, Curve bends your next hit, Boost speeds you up.</li>
              <li>Campaign ramps goalie skill and puck speed each mission. Free Play lets you pick difficulty.</li>
            </ul>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <div>Built for GridStock’s arcade corner. Become the PixelPuck champion.</div>
              <div>Controls: Mouse/touch or WASD/arrows to move · Space/click to serve · F = Smash · Shift = Dash · P = Pause</div>
            </div>
          </div>

          <div className="gs-panel rounded-2xl p-4 space-y-3">
            <h3 className="text-lg font-semibold">Telemetry</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Rally</span>
                <span className="font-semibold text-emerald-300">{rally}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Smash</span>
                <span className={smashReady ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                  {smashReady ? "Armed" : "Hold F"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Dash</span>
                <span className={dash.ready ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                  {dash.ready ? "Ready" : `${dash.cooldown.toFixed(1)}s`}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Shield</span>
                <span className={shieldCharges > 0 ? "text-sky-300 font-semibold" : "text-slate-400"}>
                  {shieldCharges > 0 ? `${shieldCharges} charge${shieldCharges > 1 ? "s" : ""}` : "None"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Curve</span>
                <span className={curveReady || curveTimer > 0 ? "text-cyan-300 font-semibold" : "text-slate-400"}>
                  {curveReady
                    ? "Ready"
                    : curveTimer > 0
                    ? `${curveTimer.toFixed(1)}s`
                    : "Off"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Boost</span>
                <span className={speedBoost.active ? "text-amber-300 font-semibold" : "text-slate-400"}>
                  {speedBoost.active ? `${speedBoost.timer.toFixed(1)}s` : "Off"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Stage speed</span>
                <span>
                  {mode === "campaign" || mode === "time"
                    ? `${(currentStage().speedBoost * 100).toFixed(0)}%`
                    : "Custom"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Aim assist</span>
                <span className={aimAssist ? "text-emerald-300" : "text-slate-400"}>
                  {aimAssist ? "Enabled" : "Off"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Auto-serve</span>
                <span className={autoServe ? "text-emerald-300" : "text-slate-400"}>
                  {autoServe ? "After goals" : "Manual"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Best rally</span>
                <span className="text-emerald-300 font-semibold">{progress.bestRally}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">High score</span>
                <span className="text-emerald-300 font-semibold">{progress.bestScore}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStatus("Crowd is hyped!");
                  startCrowd();
                  setFlash({ color: "rgba(59,130,246,0.25)", timer: 0.3 });
                }}
                className="px-3 py-2 rounded bg-[rgb(var(--grid-accent-2))] text-slate-950 text-sm font-semibold"
              >
                Pump crowd noise
              </button>
              <button
                onClick={() => {
                  setRally(0);
                  state.current.rallyCount = 0;
                  setStatus("Rally cooled; regain control.");
                }}
                className="px-3 py-2 rounded bg-[color:var(--grid-panel-strong)] border border-[color:var(--grid-border)] text-slate-200 text-sm"
              >
                Cool down
              </button>
            </div>
          </div>

          <div className="gs-panel rounded-2xl p-4 space-y-3">
            <h3 className="text-lg font-semibold">Controls</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              {(Object.keys(controls) as ControlAction[]).map((action) => (
                <button
                  key={action}
                  onClick={() => setListening(action)}
                  className={`flex justify-between items-center px-3 py-2 rounded border ${
                    listening === action
                      ? "border-[rgb(var(--grid-accent))] text-white"
                      : "border-[color:var(--grid-border)] hover:border-[rgb(var(--grid-accent)/0.4)]"
                  }`}
                >
                  <span className="capitalize">{action}</span>
                  <span className="text-slate-400 font-mono">{listening === action ? "..." : controls[action]}</span>
                </button>
              ))}
            </div>
            {listening && (
              <div className="text-[11px] text-slate-400">
                Press a key to bind <span className="text-white font-semibold">{listening}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
