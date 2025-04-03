const canvas = document.getElementById("cursor-canvas");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const trail = [];
const trailLimit = 70;
const rippleGroups = [];
const maxRippleGroups = 8;
let mouseX = width / 2;
let mouseY = height / 2;
let hasMoved = false;
let time = 0;
let lastClickTime = 0;
const clickThrottle = 150;

document.addEventListener("mousemove", (e) => {
  hasMoved = true;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener("click", (e) => {
  const currentTime = Date.now();
  if (currentTime - lastClickTime < clickThrottle) return;
  lastClickTime = currentTime;

  if (rippleGroups.length >= maxRippleGroups) rippleGroups.shift();

  const rippleGroup = [];
  const baseHue = (time % 360) / 360;
  for (let i = 0; i < 2; i++) {
    rippleGroup.push({
      x: e.clientX,
      y: e.clientY,
      radius: 0,
      opacity: 1,
      hue: (baseHue + i * 0.1) % 1,
      delay: i * 5,
      frame: 0
    });
  }
  rippleGroups.push(rippleGroup);
});

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function animate() {
  time += 0.05;
  const last = trail.length ? trail[trail.length - 1] : { x: mouseX, y: mouseY };
  const smoothX = last.x + (mouseX - last.x) * 0.2;
  const smoothY = last.y + (mouseY - last.y) * 0.2;

  trail.push({ x: smoothX, y: smoothY });
  if (trail.length > trailLimit) trail.shift();

  ctx.clearRect(0, 0, width, height);

  const coreColor = getComputedStyle(document.documentElement).getPropertyValue('--cursor-core-color').trim();
  const hue = (time % 360) / 360;
  const glowColor = hslToRgb(hue, 0.8, 0.6);
  const outerGlowColor = hslToRgb(hue, 0.9, 0.5);

  for (let i = rippleGroups.length - 1; i >= 0; i--) {
    const group = rippleGroups[i];
    let allFaded = true;
    for (let j = group.length - 1; j >= 0; j--) {
      const ripple = group[j];
      ripple.frame++;
      if (ripple.frame < ripple.delay) continue;
      ripple.radius += 0.8;
      ripple.opacity -= 0.015;
      ripple.hue = (ripple.hue + 0.003) % 1;
      if (ripple.opacity <= 0) {
        group.splice(j, 1);
        continue;
      }
      allFaded = false;
      const shimmer = 1 + 0.15 * Math.sin(time + j);
      const rippleColor = hslToRgb(ripple.hue, 0.9, 0.5);
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = rippleColor;
      ctx.globalAlpha = ripple.opacity;
      ctx.shadowColor = rippleColor;
      ctx.shadowBlur = 30 * shimmer;
      ctx.lineWidth = 8 - j * 2;
      ctx.stroke();
    }
    if (allFaded) rippleGroups.splice(i, 1);
  }
  ctx.globalAlpha = 1;

  if (hasMoved && trail.length >= 4) {
    const shimmer = 1 + 0.1 * Math.sin(time);
    const outerBlur = 50 * shimmer;
    const innerBlur = 35 * shimmer;

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length - 2; i += 1) {
      if (i + 2 < trail.length) {
        ctx.bezierCurveTo(
          trail[i].x, trail[i].y,
          trail[i + 1].x, trail[i + 1].y,
          trail[i + 2].x, trail[i + 2].y
        );
      }
    }
    ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
    ctx.strokeStyle = outerGlowColor;
    ctx.shadowColor = outerGlowColor;
    ctx.shadowBlur = outerBlur;
    ctx.lineWidth = 18;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length - 2; i += 1) {
      if (i + 2 < trail.length) {
        ctx.bezierCurveTo(
          trail[i].x, trail[i].y,
          trail[i + 1].x, trail[i + 1].y,
          trail[i + 2].x, trail[i + 2].y
        );
      }
    }
    ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = innerBlur;
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length - 2; i += 1) {
      if (i +2 < trail.length) {
        ctx.bezierCurveTo(
          trail[i].x, trail[i].y,
          trail[i + 1].x, trail[i + 1].y,
          trail[i + 2].x, trail[i + 2].y
        );
      }
    }
    ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
    ctx.strokeStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 7;
    ctx.stroke();
  }

  requestAnimationFrame(animate);
}

animate();