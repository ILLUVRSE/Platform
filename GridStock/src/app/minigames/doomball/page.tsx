// src/app/minigames/doomball/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  hits: number;
};

type PowerUpKind = "life" | "widen" | "slow";
type PowerUp = { x: number; y: number; vy: number; kind: PowerUpKind };
type Shard = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const WIDTH = 900;
const HEIGHT = 600;
const PADDLE_W = 140;
const PADDLE_H = 18;
const BALL_R = 10;
const POWER_CHANCE = 0.24;
const POWER_FALL = 180;
const BUFF_TIME = 10;
const MAX_LIVES = 6;
const COMBO_WINDOW = 3.5;
const MAX_COMBO = 5;

function createBricks(level: number): Brick[] {
  const rows = 4 + level;
  const cols = 10;
  const gap = 8;
  const startX = 40;
  const startY = 70;
  const brickW = (WIDTH - startX * 2 - gap * (cols - 1)) / cols;
  const brickH = 28;
  const bricks: Brick[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: startX + c * (brickW + gap),
        y: startY + r * (brickH + gap),
        w: brickW,
        h: brickH,
        hits: r < 2 ? 1 : 2, // tougher bricks lower in the grid
      });
    }
  }
  return bricks;
}

export default function DoomballPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1, message: "Tap/space to launch" });
  const [gameOver, setGameOver] = useState(false);

  const state = useRef({
    paddleX: WIDTH / 2 - PADDLE_W / 2,
    paddleY: HEIGHT - 40,
    paddleSpeed: 520,
    paddleBonus: 0,
    paddleBuffTimer: 0,
    slowTimer: 0,
    comboTimer: 0,
    combo: 1,
    bestCombo: 1,
    ballX: WIDTH / 2,
    ballY: HEIGHT - 60,
    ballVX: 260,
    ballVY: -340,
    lastPaddleX: WIDTH / 2 - PADDLE_W / 2,
    bricks: createBricks(1),
    powerups: [] as PowerUp[],
    shards: [] as Shard[],
    shake: 0,
    lives: 3,
    score: 0,
    level: 1,
    frozen: true,
    paused: false,
    lastTs: 0,
  });

  // Input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, down: boolean) => {
      if (down) keysRef.current.add(e.key.toLowerCase());
      else keysRef.current.delete(e.key.toLowerCase());
      if (down && e.key.toLowerCase() === "p") {
        state.current.paused = !state.current.paused;
        setHud((h) => ({
          ...h,
          message: state.current.paused ? "Paused (P to resume)" : "Back in action",
        }));
        if (!state.current.paused && !state.current.frozen) {
          loop(performance.now());
        }
      }
      if (e.key === " " && down) launch();
    };
    const handleMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
      state.current.paddleX = Math.max(20, Math.min(WIDTH - PADDLE_W - 20, x - PADDLE_W / 2));
    };
    const handleTouch = (e: TouchEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const touch = e.touches[0];
      const x = ((touch.clientX - rect.left) / rect.width) * WIDTH;
      state.current.paddleX = Math.max(20, Math.min(WIDTH - PADDLE_W - 20, x - PADDLE_W / 2));
    };
    const keyDown = (e: KeyboardEvent) => handleKey(e, true);
    const keyUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleTouch);
    const stop = () => animRef.current && cancelAnimationFrame(animRef.current);
    setReady(true);
    return () => {
      stop();
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleTouch);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  const resetBall = () => {
    state.current.ballX = WIDTH / 2;
    state.current.ballY = HEIGHT - 60;
    const angle = (Math.random() * 0.5 + 0.25) * Math.PI;
    const speed = 400 + state.current.level * 30;
    state.current.ballVX = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
    state.current.ballVY = -Math.abs(Math.sin(angle) * speed);
    state.current.frozen = true;
    state.current.combo = 1;
    state.current.comboTimer = 0;
  };

  const launch = () => {
    if (!ready) return;
    if (state.current.paused) state.current.paused = false;
    state.current.frozen = false;
    setGameOver(false);
    loop(performance.now());
  };

  const nextLevel = () => {
    state.current.level += 1;
    state.current.bricks = createBricks(state.current.level);
    resetBall();
  };

  const loseLife = () => {
    state.current.lives -= 1;
    if (state.current.lives <= 0) {
      setGameOver(true);
      state.current = {
        ...state.current,
        lives: 3,
        score: 0,
        level: 1,
        bricks: createBricks(1),
        powerups: [],
        shards: [],
        shake: 0,
        paddleBonus: 0,
        paddleBuffTimer: 0,
        slowTimer: 0,
        combo: 1,
        comboTimer: 0,
        bestCombo: state.current.bestCombo,
        lastPaddleX: WIDTH / 2 - PADDLE_W / 2,
        paused: false,
        paddleY: HEIGHT - 40,
        paddleSpeed: 520,
        ballX: WIDTH / 2,
        ballY: HEIGHT - 60,
        ballVX: 260,
        ballVY: -340,
        frozen: true,
        lastTs: 0,
      };
    }
    resetBall();
  };

  const handleBrickCollision = (brick: Brick, idx: number) => {
    const bx = state.current.ballX;
    const by = state.current.ballY;
    const vx = state.current.ballVX;
    // Determine side hit: compare overlap
    const overlapLeft = bx + BALL_R - brick.x;
    const overlapRight = brick.x + brick.w - (bx - BALL_R);
    const overlapTop = by + BALL_R - brick.y;
    const overlapBottom = brick.y + brick.h - (by - BALL_R);
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
      state.current.ballVX = -vx;
    } else {
      state.current.ballVY = -state.current.ballVY;
    }
    brick.hits -= 1;
    if (brick.hits <= 0) {
      state.current.bricks.splice(idx, 1);
      awardScore(50 + state.current.level * 10);
      spawnShards(brick.x + brick.w / 2, brick.y + brick.h / 2, "#22c55e", 12);
      if (Math.random() < POWER_CHANCE) {
        const kinds: PowerUpKind[] = ["life", "widen", "slow"];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        state.current.powerups.push({
          x: brick.x + brick.w / 2,
          y: brick.y + brick.h / 2,
          vy: POWER_FALL,
          kind,
        });
      }
    } else {
      awardScore(20);
      spawnShards(brick.x + brick.w / 2, brick.y + brick.h / 2, "#34d399", 6);
    }
  };

  const applyPower = (p: PowerUp) => {
    if (p.kind === "life") {
      state.current.lives = Math.min(MAX_LIVES, state.current.lives + 1);
      setHud((h) => ({ ...h, message: "Extra life!" }));
    }
    if (p.kind === "widen") {
      state.current.paddleBonus = 90;
      state.current.paddleBuffTimer = BUFF_TIME;
      setHud((h) => ({ ...h, message: "Wide paddle ready" }));
    }
    if (p.kind === "slow") {
      state.current.slowTimer = BUFF_TIME;
      state.current.ballVX *= 0.75;
      state.current.ballVY *= 0.75;
      setHud((h) => ({ ...h, message: "Time dilated" }));
    }
  };

  const spawnShards = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      state.current.shards.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        color,
      });
    }
  };

  const awardScore = (base: number) => {
    const comboScore = base * state.current.combo;
    state.current.score += comboScore;
    state.current.comboTimer = COMBO_WINDOW;
    state.current.combo = Math.min(MAX_COMBO, state.current.combo + 0.15);
    state.current.bestCombo = Math.max(state.current.bestCombo, state.current.combo);
    state.current.shake = Math.min(10, state.current.shake + 1);
    setHud((h) => ({ ...h, message: `Combo x${state.current.combo.toFixed(1)}!` }));
  };

  const step = (dt: number) => {
    const s = state.current;
    const paddleW = PADDLE_W + s.paddleBonus;

    // Buff timers
    if (s.paddleBuffTimer > 0) {
      s.paddleBuffTimer -= dt;
      if (s.paddleBuffTimer <= 0) {
        s.paddleBonus = 0;
      }
    }
    if (s.slowTimer > 0) {
      s.slowTimer -= dt;
    }
    if (s.comboTimer > 0) {
      s.comboTimer -= dt;
      if (s.comboTimer <= 0) {
        s.combo = 1;
      }
    }
    if (s.shake > 0) {
      s.shake = Math.max(0, s.shake - dt * 12);
    }

    if (s.paused) return;

    // Keyboard move
    const moveLeft = keysRef.current.has("arrowleft") || keysRef.current.has("a");
    const moveRight = keysRef.current.has("arrowright") || keysRef.current.has("d");
    if (moveLeft) s.paddleX = Math.max(20, s.paddleX - s.paddleSpeed * dt);
    if (moveRight) s.paddleX = Math.min(WIDTH - paddleW - 20, s.paddleX + s.paddleSpeed * dt);

    if (s.frozen) {
      s.ballX = s.paddleX + paddleW / 2;
      s.ballY = s.paddleY - BALL_R - 2;
      return;
    }

    const paddleDX = s.paddleX - s.lastPaddleX;
    s.lastPaddleX = s.paddleX;

    s.ballX += s.ballVX * dt;
    s.ballY += s.ballVY * dt;

    // Walls
    if (s.ballX <= BALL_R || s.ballX >= WIDTH - BALL_R) {
      s.ballVX = -s.ballVX;
      s.ballX = Math.max(BALL_R, Math.min(WIDTH - BALL_R, s.ballX));
    }
    if (s.ballY <= BALL_R) {
      s.ballVY = -s.ballVY;
      s.ballY = BALL_R;
    }
    if (s.ballY > HEIGHT + BALL_R) {
      loseLife();
      return;
    }

    // Paddle
    const withinX = s.ballX > s.paddleX - BALL_R && s.ballX < s.paddleX + paddleW + BALL_R;
    const hitPaddle = s.ballY + BALL_R >= s.paddleY && s.ballY + BALL_R <= s.paddleY + PADDLE_H && withinX && s.ballVY > 0;
    if (hitPaddle) {
      const hitPoint = (s.ballX - s.paddleX) / paddleW - 0.5;
      const angle = hitPoint * Math.PI * 0.6; // spread bounce angle
      const speed = Math.min(820, Math.hypot(s.ballVX, s.ballVY) + 12);
      s.ballVX = Math.sin(angle) * speed + paddleDX * 60;
      s.ballVY = -Math.abs(Math.cos(angle) * speed);
      s.ballY = s.paddleY - BALL_R - 1;
    }

    // Bricks
    for (let i = s.bricks.length - 1; i >= 0; i--) {
      const b = s.bricks[i];
      if (
        s.ballX + BALL_R > b.x &&
        s.ballX - BALL_R < b.x + b.w &&
        s.ballY + BALL_R > b.y &&
        s.ballY - BALL_R < b.y + b.h
      ) {
        handleBrickCollision(b, i);
        break;
      }
    }

    if (s.bricks.length === 0) {
      nextLevel();
    }

    // Powerups
    for (let i = s.powerups.length - 1; i >= 0; i--) {
      const p = s.powerups[i];
      p.y += p.vy * dt;
      const caught =
        p.y + 12 >= s.paddleY &&
        p.y <= s.paddleY + PADDLE_H + 10 &&
        p.x >= s.paddleX &&
        p.x <= s.paddleX + paddleW;
      if (caught) {
        applyPower(p);
        s.powerups.splice(i, 1);
        continue;
      }
      if (p.y > HEIGHT + 30) {
        s.powerups.splice(i, 1);
      }
    }

    for (let i = s.shards.length - 1; i >= 0; i--) {
      const shard = s.shards[i];
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      shard.vy += 240 * dt;
      shard.life -= dt;
      if (shard.life <= 0) s.shards.splice(i, 1);
    }

    // Speed control
    const speedCap = s.slowTimer > 0 ? 620 : 900;
    const curSpeed = Math.hypot(s.ballVX, s.ballVY);
    if (curSpeed > speedCap) {
      const factor = speedCap / curSpeed;
      s.ballVX *= factor;
      s.ballVY *= factor;
    }
  };

  const draw = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const s = state.current;
    const shakeX = s.shake > 0 ? (Math.random() - 0.5) * s.shake : 0;
    const shakeY = s.shake > 0 ? (Math.random() - 0.5) * s.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    // Bricks
    s.bricks.forEach((b) => {
      ctx.fillStyle = b.hits === 1 ? "#22c55e" : "#16a34a";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    });

    // Paddle
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(s.paddleX, s.paddleY, PADDLE_W + s.paddleBonus, PADDLE_H);

    // Ball
    const glow = ctx.createRadialGradient(s.ballX, s.ballY, 2, s.ballX, s.ballY, 16);
    glow.addColorStop(0, "#f8fafc");
    glow.addColorStop(1, "#22d3ee");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    // Shards
    s.shards.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, 3, 3);
      ctx.globalAlpha = 1;
    });

    ctx.restore();

    // Overlay text
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Score ${s.score}`, 20, 26);
    ctx.fillText(`Lives ${s.lives}`, 120, 26);
    ctx.fillText(`Level ${s.level}`, 220, 26);
    ctx.fillText(`Combo x${s.combo.toFixed(1)}`, 320, 26);

    // Powerups
    s.powerups.forEach((p) => {
      ctx.fillStyle = p.kind === "life" ? "#fcd34d" : p.kind === "widen" ? "#34d399" : "#60a5fa";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.kind === "life" ? "+" : p.kind === "widen" ? "↔" : "⏱", p.x, p.y + 1);
    });
  };

  const loop = (ts: number) => {
    const s = state.current;
    if (!s.lastTs) s.lastTs = ts;
    const dt = Math.min(0.033, (ts - s.lastTs) / 1000);
    s.lastTs = ts;
    step(dt);
    draw();
    setHud((h) => ({
      score: s.score,
      lives: s.lives,
      level: s.level,
      message: s.paused
        ? "Paused (P to resume)"
        : s.frozen
        ? "Tap/space to launch"
        : h.message,
    }));
    if (!s.frozen && !gameOver && !s.paused) {
      animRef.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!hud.message || hud.message.startsWith("Tap") || hud.message.startsWith("Paused")) return;
    const id = setTimeout(() => {
      if (!state.current.paused && !state.current.frozen) {
        setHud((h) => ({ ...h, message: "" }));
      }
    }, 1600);
    return () => clearTimeout(id);
  }, [hud.message]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Doomball</h1>
          <p className="text-gray-400 text-sm">Arcade breakout, rewritten for the browser.</p>
        </div>
        <Link href="/minigames/pixelpuck" className="text-sm text-green-400 hover:underline">Try PixelPuck →</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto,280px] gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between mb-3 text-sm text-gray-400">
            <span>Score: <span className="text-white font-semibold">{hud.score}</span></span>
            <span>Lives: <span className="text-white font-semibold">{hud.lives}</span></span>
            <span>Level: <span className="text-white font-semibold">{hud.level}</span></span>
          </div>
          <div className="relative">
            {gameOver && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 rounded-lg text-center space-y-2">
                <div className="text-2xl font-bold text-red-300">Game Over</div>
                <button
                  onClick={() => {
                    setGameOver(false);
                    state.current.lives = 3;
                    state.current.score = 0;
                    state.current.level = 1;
                    state.current.bricks = createBricks(1);
                    resetBall();
                    draw();
                  }}
                  className="px-4 py-2 bg-white text-black rounded font-semibold"
                >
                  Reset
                </button>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              className="w-full h-auto rounded-lg border border-gray-800 bg-black"
              onClick={launch}
            />
            {hud.message && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 bg-black/60 rounded-full text-sm text-white border border-gray-700">
                  {hud.message}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-lg font-semibold">How to play</h3>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li>Move with mouse, touch, or arrow / A / D keys; press P to pause.</li>
            <li>Click or press space to launch/serve; aim edge hits for sharper angles.</li>
            <li>Catching drops: +life, widen paddle, or slow time for control.</li>
            <li>Levels add rows and speed; keep the streak to push your score up.</li>
          </ul>
          <div className="pt-3 space-y-1 text-xs text-gray-300 border-t border-gray-800">
            <div className="flex justify-between">
              <span>Combo</span>
              <span className="font-semibold text-green-300">x{state.current.combo.toFixed(1)}</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-300"
                style={{
                  width: `${Math.min(100, (state.current.combo / MAX_COMBO) * 100)}%`,
                  transition: "width 120ms ease-out",
                }}
              />
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Best streak</span>
              <span>{state.current.bestCombo.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Buffs</span>
              <span>
                {state.current.paddleBuffTimer > 0 ? "Wide paddle" : ""}
                {state.current.slowTimer > 0 ? " · Time slow" : ""}
                {state.current.paddleBuffTimer <= 0 && state.current.slowTimer <= 0 ? "None" : ""}
              </span>
            </div>
          </div>
          <div className="pt-2 text-xs text-gray-500">
            Reimagined from the original Pygame Doomball so it runs inside GridStock.
          </div>
        </div>
      </div>
    </div>
  );
}
