"use client";

import { useEffect, useRef, useState } from "react";
import { BUGS, BUG_KINDS, bugSpeed, pickRandomKind, type BugKind } from "./bugs";
import { drawBug, drawGecko } from "./draw";
import styles from "./Game.module.css";

const WIDTH = 800;
const HEIGHT = 560;
const ROUND_SECONDS = 60;
const GECKO_SPEED = 220;
const MAX_BUGS = 10;
const SPAWN_INTERVAL = 0.7;
const BEST_KEY = "catch-bugs-best";
const GROWTH_PER_POINT = 0.015; // gecko grows 1.5% per energy point
const MAX_SCALE = 2.2;

type Phase = "ready" | "playing" | "over";

type Bug = {
  kind: BugKind;
  x: number;
  y: number;
  angle: number;
  turnTimer: number;
  t: number;
};

type Popup = { x: number; y: number; text: string; life: number };

type World = {
  gecko: { x: number; y: number; angle: number; walk: number; tongue: number; scale: number };
  bugs: Bug[];
  popups: Popup[];
  spawnTimer: number;
  timeLeft: number;
  energy: number;
  eaten: Record<BugKind, number>;
};

function emptyCounts(): Record<BugKind, number> {
  return Object.fromEntries(BUG_KINDS.map((k) => [k, 0])) as Record<BugKind, number>;
}

function newWorld(): World {
  return {
    gecko: { x: WIDTH / 2, y: HEIGHT / 2, angle: 0, walk: 0, tongue: 0, scale: 1 },
    bugs: [],
    popups: [],
    spawnTimer: 0,
    timeLeft: ROUND_SECONDS,
    energy: 0,
    eaten: emptyCounts(),
  };
}

function spawnBug(): Bug {
  // Enter from a random edge, heading roughly toward the middle
  const edge = Math.floor(Math.random() * 4);
  const x = edge === 0 ? 10 : edge === 1 ? WIDTH - 10 : Math.random() * WIDTH;
  const y = edge === 2 ? 10 : edge === 3 ? HEIGHT - 10 : Math.random() * HEIGHT;
  const angle = Math.atan2(HEIGHT / 2 - y, WIDTH / 2 - x) + (Math.random() - 0.5);
  return { kind: pickRandomKind(), x, y, angle, turnTimer: 1 + Math.random() * 2, t: Math.random() * 10 };
}

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // ignore: storage may be unavailable
  }
}

function angleDiff(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World>(newWorld());
  const keysRef = useRef(new Set<string>());
  const phaseRef = useRef<Phase>("ready");

  const [phase, setPhase] = useState<Phase>("ready");
  const [energy, setEnergy] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [best, setBest] = useState(0);
  const [eaten, setEaten] = useState(emptyCounts);

  useEffect(() => setBest(readBest()), []);

  const start = () => {
    worldRef.current = newWorld();
    phaseRef.current = "playing";
    setPhase("playing");
    setEnergy(0);
    setTimeLeft(ROUND_SECONDS);
  };

  // Keyboard input
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();
      keysRef.current.add(e.key);
      if ((e.key === " " || e.key === "Enter") && phaseRef.current !== "playing") start();
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    const onBlur = () => keysRef.current.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let hudTimer = 0;

    const update = (dt: number) => {
      const w = worldRef.current;
      const g = w.gecko;
      const keys = keysRef.current;

      // Grow smoothly toward the size earned by eating
      const targetScale = Math.min(MAX_SCALE, 1 + w.energy * GROWTH_PER_POINT);
      g.scale += (targetScale - g.scale) * Math.min(1, dt * 4);
      const margin = 20 * g.scale;

      // Gecko movement
      let dx = 0;
      let dy = 0;
      if (keys.has("ArrowLeft")) dx -= 1;
      if (keys.has("ArrowRight")) dx += 1;
      if (keys.has("ArrowUp")) dy -= 1;
      if (keys.has("ArrowDown")) dy += 1;
      if (dx || dy) {
        const len = Math.hypot(dx, dy);
        g.x = Math.min(WIDTH - margin, Math.max(margin, g.x + (dx / len) * GECKO_SPEED * dt));
        g.y = Math.min(HEIGHT - margin, Math.max(margin, g.y + (dy / len) * GECKO_SPEED * dt));
        const target = Math.atan2(dy, dx);
        g.angle += angleDiff(target, g.angle) * Math.min(1, dt * 12);
        g.walk += dt * 14;
      }
      g.tongue = Math.max(0, g.tongue - dt * 6);

      // Spawning
      w.spawnTimer -= dt;
      if (w.spawnTimer <= 0 && w.bugs.length < MAX_BUGS) {
        w.bugs.push(spawnBug());
        w.spawnTimer = SPAWN_INTERVAL;
      }

      // Bugs wander; they bounce off the walls
      for (const b of w.bugs) {
        b.t += dt;
        b.turnTimer -= dt;
        if (b.turnTimer <= 0) {
          b.angle += (Math.random() - 0.5) * 2.5;
          b.turnTimer = 0.6 + Math.random() * 2;
        }
        b.angle += (Math.random() - 0.5) * dt * 3;
        const speed = bugSpeed(b.kind);
        b.x += Math.cos(b.angle) * speed * dt;
        b.y += Math.sin(b.angle) * speed * dt;
        if (b.x < 10 || b.x > WIDTH - 10) {
          b.angle = Math.PI - b.angle;
          b.x = Math.min(WIDTH - 10, Math.max(10, b.x));
        }
        if (b.y < 10 || b.y > HEIGHT - 10) {
          b.angle = -b.angle;
          b.y = Math.min(HEIGHT - 10, Math.max(10, b.y));
        }
      }

      // Eating: bugs touching the gecko's head
      const headX = g.x + Math.cos(g.angle) * 26 * g.scale;
      const headY = g.y + Math.sin(g.angle) * 26 * g.scale;
      w.bugs = w.bugs.filter((b) => {
        const info = BUGS[b.kind];
        if (Math.hypot(b.x - headX, b.y - headY) > 12 * g.scale + info.size) return true;
        w.energy += info.points;
        w.eaten[b.kind] += 1;
        w.popups.push({ x: b.x, y: b.y, text: `+${info.points}`, life: 1 });
        g.tongue = 1;
        return false;
      });

      for (const p of w.popups) {
        p.life -= dt;
        p.y -= dt * 30;
      }
      w.popups = w.popups.filter((p) => p.life > 0);

      w.timeLeft = Math.max(0, w.timeLeft - dt);
      if (w.timeLeft === 0) {
        phaseRef.current = "over";
        setPhase("over");
        setEaten({ ...w.eaten });
        setBest((prev) => {
          if (w.energy > prev) {
            saveBest(w.energy);
            return w.energy;
          }
          return prev;
        });
      }
    };

    const render = () => {
      const w = worldRef.current;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      for (const b of w.bugs) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        drawBug(ctx, b.kind, b.t);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(w.gecko.x, w.gecko.y);
      ctx.rotate(w.gecko.angle);
      ctx.scale(w.gecko.scale, w.gecko.scale);
      drawGecko(ctx, w.gecko.walk, w.gecko.tongue);
      ctx.restore();

      ctx.font = "bold 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      for (const p of w.popups) {
        ctx.fillStyle = `rgba(214, 90, 30, ${p.life})`;
        ctx.fillText(p.text, p.x, p.y);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (phaseRef.current === "playing") {
        update(dt);
        hudTimer -= dt;
        if (hudTimer <= 0) {
          setEnergy(worldRef.current.energy);
          setTimeLeft(Math.ceil(worldRef.current.timeLeft));
          hudTimer = 0.1;
        }
      }
      render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.hud}>
        <span>
          에너지 <strong>{energy}</strong>
        </span>
        <span>
          남은 시간 <strong>{timeLeft}</strong>초
        </span>
        <span>
          최고 기록 <strong>{best}</strong>
        </span>
      </div>

      <div className={styles.stage}>
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className={styles.canvas} />

        {phase !== "playing" && (
          <div className={styles.overlay}>
            {phase === "ready" ? (
              <>
                <h2>배고픈 팻테일게코</h2>
                <p>방향키로 도마뱀을 움직여 {ROUND_SECONDS}초 동안 벌레를 최대한 많이 잡아먹으세요!</p>
              </>
            ) : (
              <>
                <h2>시간 종료!</h2>
                <p className={styles.score}>에너지 {energy}</p>
                <ul className={styles.summary}>
                  {BUG_KINDS.map((k) => (
                    <li key={k}>
                      {BUGS[k].name} × {eaten[k]}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button className={styles.button} onClick={start}>
              {phase === "ready" ? "시작하기" : "다시 하기"}
            </button>
            <p className={styles.hint}>Space 또는 Enter로도 시작할 수 있어요</p>
          </div>
        )}
      </div>

      <ul className={styles.legend}>
        {BUG_KINDS.map((k) => (
          <li key={k}>
            <BugIcon kind={k} />
            <span>{BUGS[k].name}</span>
            <strong>+{BUGS[k].points}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BugIcon({ kind }: { kind: BugKind }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.clearRect(0, 0, 40, 40);
    ctx.save();
    ctx.translate(20, 20);
    ctx.rotate(-Math.PI / 2);
    drawBug(ctx, kind, 0);
    ctx.restore();
  }, [kind]);
  return <canvas ref={ref} width={40} height={40} />;
}
