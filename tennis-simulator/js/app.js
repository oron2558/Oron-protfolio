import * as THREE from 'three';
import { Court } from './court.js';
import { Ball } from './ball.js';
import { SwingDetector } from './swing.js';
import { HUD } from './hud.js';
import { Session } from './session.js';
import { InputHandler } from './input.js';
import { TennisScore } from './scoring.js';

// ─── Renderer ──────────────────────────────────────────────
const canvas = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// ─── Scene ─────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080812);

// ─── Camera (player perspective behind baseline) ───────────
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.75, 11.5);
camera.lookAt(0, 1.1, 0);

const clock = new THREE.Clock();

// ─── Modules ───────────────────────────────────────────────
const court   = new Court(scene, 'australian', renderer);
const ball    = new Ball(scene);
const swing   = new SwingDetector();
const hud     = new HUD();
const session = new Session();
const input   = new InputHandler();
const score   = new TennisScore();

// ─── Shot Library ──────────────────────────────────────────
// Each shot: 4 Bezier control points + duration + label
const SHOTS = [
  {
    label: 'Forehand Cross-Court',
    from: new THREE.Vector3(-2.8, 1.6, -7.5),
    cp1:  new THREE.Vector3(-2.0, 4.2, -2.5),
    cp2:  new THREE.Vector3(1.8, 2.6,  2.5),
    to:   new THREE.Vector3(2.3, 1.35, 6.8),
    duration: 2.3,
  },
  {
    label: 'Backhand Down the Line',
    from: new THREE.Vector3(2.8, 1.6, -7.5),
    cp1:  new THREE.Vector3(2.2, 3.8, -2.0),
    cp2:  new THREE.Vector3(-1.2, 2.2, 2.0),
    to:   new THREE.Vector3(-2.2, 1.3, 6.5),
    duration: 2.1,
  },
  {
    label: 'Heavy Topspin',
    from: new THREE.Vector3(-1.2, 1.8, -7),
    cp1:  new THREE.Vector3(-0.6, 5.8, -1.5),
    cp2:  new THREE.Vector3(0.8,  3.5,  2.5),
    to:   new THREE.Vector3(1.2,  1.5,  6.2),
    duration: 2.6,
  },
  {
    label: 'Slice Approach',
    from: new THREE.Vector3(1.8, 2.2, -6),
    cp1:  new THREE.Vector3(1.2, 3.0, -1.5),
    cp2:  new THREE.Vector3(0.2, 2.2,  2.0),
    to:   new THREE.Vector3(-1.4, 1.45, 6.5),
    duration: 1.9,
  },
  {
    label: 'Center Drive',
    from: new THREE.Vector3(0, 1.7, -7.5),
    cp1:  new THREE.Vector3(0, 4.0, -2),
    cp2:  new THREE.Vector3(0, 2.4,  3),
    to:   new THREE.Vector3(0, 1.4,  6.8),
    duration: 2.0,
  },
];

let shotIndex  = 0;
let state      = 'idle';   // 'idle' | 'incoming' | 'result'
let swingHandled = false;
let nextTimer  = null;

// ─── Scoreboard DOM ────────────────────────────────────────
function updateScoreboard() {
  const d = score.getDisplay();
  document.getElementById('sb-sets-p').textContent  = d.sets.p;
  document.getElementById('sb-games-p').textContent = d.games.p;
  document.getElementById('sb-sets-c').textContent  = d.sets.c;
  document.getElementById('sb-games-c').textContent = d.games.c;

  const ppEl = document.getElementById('sb-pts-p');
  const pcEl = document.getElementById('sb-pts-c');
  ppEl.textContent = d.points.p;
  pcEl.textContent = d.points.c;
  ppEl.className = 'sb-cell sb-pts';
  pcEl.className = 'sb-cell sb-pts sb-pts--cpu';

  if (d.gameOver) {
    const isWin = d.winner === 0;
    const goEl  = document.getElementById('game-over');
    document.getElementById('go-title').textContent = isWin ? 'You Win!' : 'CPU Wins';
    document.getElementById('go-title').className   = 'go-title' + (isWin ? '' : ' go-title--loss');
    document.getElementById('go-sub').textContent   =
      `${d.sets.p}–${d.sets.c} sets`;
    goEl.style.display = 'block';
    session.save();
  }
}

// ─── Game Logic ────────────────────────────────────────────
function launchBall() {
  const shot = SHOTS[shotIndex % SHOTS.length];
  shotIndex++;

  document.getElementById('shot-label').textContent = shot.label;

  ball.launch({
    from:     shot.from,
    cp1:      shot.cp1,
    cp2:      shot.cp2,
    to:       shot.to,
    duration: shot.duration,
  });

  state        = 'incoming';
  swingHandled = false;
  swing.reset();
}

function processSwing(directionBias) {
  if (state !== 'incoming' || swingHandled) return;
  swingHandled = true;

  const t      = ball.getProgress();
  const result = swing.evaluate(t, 0.88);

  // Direction comes from player input unless it's a miss/weak
  if (result.result === 'hit') result.direction = directionBias;

  session.recordShot(result);
  hud.showFeedback(result);
  ball.applyHitResult(result.direction || 'miss');

  if (result.result === 'hit') {
    document.getElementById('quality-val').textContent = result.quality;
    document.getElementById('speed-val').textContent =
      Math.round(50 + result.quality * 0.8) + ' km/h';
    score.pointTo(0); // player wins the point on a good hit
  } else {
    score.pointTo(1); // cpu wins on weak/miss
  }
  updateScoreboard();

  state = 'result';
  scheduleNextBall(1800);
}

function autoMiss() {
  if (state !== 'incoming' || swingHandled) return;
  swingHandled = true;

  const result = { result: 'miss', quality: 0, grade: 'Miss!', reason: 'No swing' };
  session.recordShot(result);
  hud.showFeedback(result);
  score.pointTo(1); // auto-miss → cpu wins point
  updateScoreboard();

  state = 'result';
  scheduleNextBall(1500);
}

function scheduleNextBall(delayMs) {
  clearTimeout(nextTimer);
  nextTimer = setTimeout(() => {
    ball.reset();
    nextTimer = setTimeout(launchBall, 700);
  }, delayMs);
}

// ─── Input ─────────────────────────────────────────────────
input.onSwing(processSwing);
input.init();
input.connectSensor('ws://localhost:8000/ws/display');

// ─── Slam Selector ─────────────────────────────────────────
const slamBtns = document.querySelectorAll('.slam-btn');
function switchSlam(name) {
  court.setTheme(name);
  slamBtns.forEach(b => b.classList.toggle('active', b.dataset.slam === name));
}
slamBtns.forEach(btn => btn.addEventListener('click', () => switchSlam(btn.dataset.slam)));

document.addEventListener('keydown', (e) => {
  const slamMap = { '1': 'australian', '2': 'roland', '3': 'wimbledon', '4': 'usopen' };
  if (slamMap[e.key]) { switchSlam(slamMap[e.key]); return; }

  if (e.key === 'r' || e.key === 'R') {
    clearTimeout(nextTimer);
    ball.reset();
    score.reset();
    updateScoreboard();
    document.getElementById('game-over').style.display = 'none';
    state = 'idle';
    setTimeout(launchBall, 400);
  }
  if (e.key === 'f' || e.key === 'F') {
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.body.requestFullscreen();
  }
});

// ─── Animation Loop ────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  // Subtle camera breathing — makes the view feel alive
  camera.position.y = 1.75 + Math.sin(elapsed * 0.22) * 0.008;

  ball.update(dt);

  // Crowd wave + stadium light flicker
  court.updateCrowd(elapsed);
  court.flickerLights(elapsed);

  if (state === 'incoming') {
    const inZone = ball.isInStrikeZone();
    hud.showStrikeZone(inZone);

    if (ball.isDone() && !swingHandled) {
      autoMiss();
    }
  } else {
    hud.showStrikeZone(false);
  }

  hud.update(session.getStats());

  renderer.render(scene, camera);
}

// ─── Resize ────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Boot ──────────────────────────────────────────────────
animate();
setTimeout(launchBall, 1600);
