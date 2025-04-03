'use strict';

const circleCount = 150;
const circlePropCount = 8;
const circlePropsLength = circleCount * circlePropCount;
const baseSpeed = 0.1;
const rangeSpeed = 1;
const baseTTL = 150;
const rangeTTL = 200;
const baseRadius = 100;
const rangeRadius = 200;
const rangeHue = 60;
const xOff = 0.0015;
const yOff = 0.0015;
const zOff = 0.0015;
const backgroundColor = 'hsla(0,0%,5%,1)';

let container;
let shiftCanvas;
let shiftCtx;
let circleProps;
let simplex;
let baseHue;

function setup() {
  createCanvas();
  resize();
  initCircles();
  draw();
  window.addEventListener('resize', resize);
}

function createCanvas() {
  container = document.getElementById('shift-bg-container');
  shiftCanvas = {
    a: document.createElement('canvas'),
    b: document.createElement('canvas')
  };
  shiftCanvas.b.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -2;
  `;
  container.appendChild(shiftCanvas.b);
  shiftCtx = {
    a: shiftCanvas.a.getContext('2d'),
    b: shiftCanvas.b.getContext('2d')
  };
}

function resize() {
  const { innerWidth, innerHeight } = window;
  shiftCanvas.a.width = innerWidth;
  shiftCanvas.a.height = innerHeight;
  shiftCanvas.b.width = innerWidth;
  shiftCanvas.b.height = innerHeight;
}

function initCircles() {
  circleProps = new Float32Array(circlePropsLength);
  simplex = new SimplexNoise();
  baseHue = 220;

  for (let i = 0; i < circlePropsLength; i += circlePropCount) {
    initCircle(i);
  }
}

function initCircle(i) {
  const x = rand(shiftCanvas.a.width);
  const y = rand(shiftCanvas.a.height);
  const n = simplex.noise3D(x * xOff, y * yOff, baseHue * zOff);
  const t = rand(TAU);
  const speed = baseSpeed + rand(rangeSpeed);
  const vx = speed * cos(t);
  const vy = speed * sin(t);
  const life = 0;
  const ttl = baseTTL + rand(rangeTTL);
  const radius = baseRadius + rand(rangeRadius);
  const hue = baseHue + n * rangeHue;

  circleProps.set([x, y, vx, vy, life, ttl, radius, hue], i);
}

function updateCircles() {
  baseHue++;
  for (let i = 0; i < circlePropsLength; i += circlePropCount) {
    updateCircle(i);
  }
}

function updateCircle(i) {
  const i2 = i + 1, i3 = i + 2, i4 = i + 3, i5 = i + 4, i6 = i + 5, i7 = i + 6, i8 = i + 7;
  let x = circleProps[i];
  let y = circleProps[i2];
  let vx = circleProps[i3];
  let vy = circleProps[i4];
  let life = circleProps[i5];
  const ttl = circleProps[i6];
  const radius = circleProps[i7];
  const hue = circleProps[i8];

  drawCircle(x, y, life, ttl, radius, hue);

  life++;
  x += vx;
  y += vy;

  circleProps[i] = x;
  circleProps[i2] = y;
  circleProps[i5] = life;

  if (checkBounds(x, y, radius) || life > ttl) {
    initCircle(i);
  }
}

function drawCircle(x, y, life, ttl, radius, hue) {
  shiftCtx.a.save();
  shiftCtx.a.fillStyle = `hsla(${hue},60%,30%,${fadeInOut(life, ttl)})`;
  shiftCtx.a.beginPath();
  shiftCtx.a.arc(x, y, radius, 0, TAU);
  shiftCtx.a.fill();
  shiftCtx.a.closePath();
  shiftCtx.a.restore();
}

function checkBounds(x, y, radius) {
  return (
    x < -radius ||
    x > shiftCanvas.a.width + radius ||
    y < -radius ||
    y > shiftCanvas.a.height + radius
  );
}

function render() {
  shiftCtx.b.save();
  shiftCtx.b.filter = 'blur(50px)';
  shiftCtx.b.drawImage(shiftCanvas.a, 0, 0);
  shiftCtx.b.restore();
}

function draw() {
  shiftCtx.a.clearRect(0, 0, shiftCanvas.a.width, shiftCanvas.a.height);
  shiftCtx.b.fillStyle = backgroundColor;
  shiftCtx.b.fillRect(0, 0, shiftCanvas.b.width, shiftCanvas.b.height);
  updateCircles();
  render();
  window.requestAnimationFrame(draw);
}

// Utils
function rand(n) {
  return Math.random() * n;
}
function fadeInOut(t, m) {
  const hm = 0.5 * m;
  return Math.abs((t + hm) % m - hm) / hm;
}

const TAU = Math.PI * 2;
const cos = Math.cos;
const sin = Math.sin;

// Automatically start the background
setup();