import type { BugKind } from "./bugs";

type Ctx = CanvasRenderingContext2D;

// All drawing functions draw in local coordinates, facing +x, centered at origin.

export function drawGecko(ctx: Ctx, walk: number, tongue: number) {
  const legSwing = Math.sin(walk) * 6;

  // Legs (drawn first so the body overlaps them)
  ctx.strokeStyle = "#c98a63";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const legs: [number, number, number][] = [
    [12, -1, legSwing],
    [12, 1, -legSwing],
    [-12, -1, -legSwing],
    [-12, 1, legSwing],
  ];
  for (const [x, side, swing] of legs) {
    ctx.beginPath();
    ctx.moveTo(x, side * 8);
    ctx.lineTo(x + swing + 4, side * 19);
    ctx.lineTo(x + swing + 8, side * 21);
    ctx.stroke();
  }

  // Fat tail
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-16, -9);
  ctx.bezierCurveTo(-34, -15, -52, -8, -56, 0);
  ctx.bezierCurveTo(-52, 8, -34, 15, -16, 9);
  ctx.closePath();
  ctx.fillStyle = "#b8653c";
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "#e9d8cf";
  for (let x = -50; x < -16; x += 9) ctx.fillRect(x, -16, 3, 32);
  ctx.restore();

  // Body with dark bands and white dorsal stripe
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#d98a55";
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "#6b3420";
  ctx.fillRect(-16, -12, 9, 24);
  ctx.fillRect(2, -12, 9, 24);
  ctx.fillStyle = "#f6efe8";
  ctx.fillRect(-24, -1.2, 48, 2.4);
  ctx.restore();

  // Tongue
  if (tongue > 0) {
    ctx.strokeStyle = "#e85a7a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(32 + tongue * 14, 0);
    ctx.stroke();
  }

  // Head
  ctx.beginPath();
  ctx.ellipse(25, 0, 12, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#8a4428";
  ctx.fill();
  ctx.fillStyle = "#f6efe8";
  ctx.fillRect(14, -9, 3, 18); // white band behind the head

  // Eyes
  ctx.fillStyle = "#1c1210";
  ctx.beginPath();
  ctx.arc(28, -7, 2.5, 0, Math.PI * 2);
  ctx.arc(28, 7, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawLegs(ctx: Ctx, xs: number[], len: number, wiggle: number, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  xs.forEach((x, i) => {
    const swing = Math.sin(wiggle + i * 2) * 2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + swing * side, side * len);
      ctx.stroke();
    }
  });
}

function drawSegments(ctx: Ctx, count: number, spacing: number, radius: number, t: number, fill: string, line: string) {
  for (let i = count - 1; i >= 0; i--) {
    const x = 8 - i * spacing;
    const y = Math.sin(t * 8 - i * 0.9) * 1.6;
    ctx.beginPath();
    ctx.arc(x, y, i === 0 ? radius * 0.9 : radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function drawBug(ctx: Ctx, kind: BugKind, t: number) {
  switch (kind) {
    case "ant": {
      drawLegs(ctx, [-1, 1, 3], 6, t * 20, "#1a1a1a", 1.2);
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(-6, 0, 4.5, 3.5, 0, 0, Math.PI * 2);
      ctx.ellipse(1, 0, 3, 2.2, 0, 0, Math.PI * 2);
      ctx.ellipse(6, 0, 2.8, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "spider": {
      ctx.strokeStyle = "#2b1d16";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const spread = (i - 1.5) * 6 + Math.sin(t * 18 + i) * 1.5;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(1, 0);
          ctx.quadraticCurveTo(1 + spread * 0.8, side * 10, 1 + spread * 1.4, side * 12);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#3b2a20";
      ctx.beginPath();
      ctx.arc(-5, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4e382b";
      ctx.beginPath();
      ctx.arc(3, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "mealworm":
      drawSegments(ctx, 7, 3.2, 3.2, t, "#d39b3a", "#8a5a1c");
      break;
    case "silkworm":
      drawSegments(ctx, 7, 4, 4.5, t, "#f3eee2", "#b9b2a3");
      break;
    case "cricket": {
      ctx.strokeStyle = "#4a2e1a";
      ctx.lineWidth = 1;
      ctx.beginPath(); // antennae
      ctx.moveTo(9, -1);
      ctx.quadraticCurveTo(18, -6, 24, -10);
      ctx.moveTo(9, 1);
      ctx.quadraticCurveTo(18, 6, 24, 10);
      ctx.stroke();
      ctx.lineWidth = 2;
      const kick = Math.sin(t * 14) * 2;
      ctx.beginPath(); // big hind legs
      ctx.moveTo(-3, -3);
      ctx.lineTo(-8 + kick, -10);
      ctx.lineTo(-16 + kick, -6);
      ctx.moveTo(-3, 3);
      ctx.lineTo(-8 - kick, 10);
      ctx.lineTo(-16 - kick, 6);
      ctx.stroke();
      drawLegs(ctx, [2, 5], 6, t * 14, "#4a2e1a", 1.2);
      ctx.fillStyle = "#7a4a26";
      ctx.beginPath();
      ctx.ellipse(-2, 0, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a3418";
      ctx.beginPath();
      ctx.arc(8, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "fly": {
      const flap = 0.35 + Math.abs(Math.sin(t * 40)) * 0.35;
      ctx.fillStyle = "rgba(210, 225, 240, 0.7)";
      ctx.strokeStyle = "rgba(90, 110, 130, 0.6)";
      ctx.lineWidth = 0.8;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(-4, side * 6, 8, 4, side * flap, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = "#2a2a30";
      ctx.beginPath();
      ctx.ellipse(-2, 0, 6, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, 0, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b8312f";
      ctx.beginPath();
      ctx.arc(6, -2, 1.6, 0, Math.PI * 2);
      ctx.arc(6, 2, 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}
