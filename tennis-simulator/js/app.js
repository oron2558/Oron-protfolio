import * as THREE from 'three';
import { Court } from './court.js';
import { Ball } from './ball.js';
import { SwingDetector } from './swing.js';
import { HUD } from './hud.js';
import { Session } from './session.js';
import { InputHandler } from './input.js';
import { TennisScore } from './scoring.js';
import { Opponent } from './opponent.js';

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

// ─── Camera ────────────────────────────────────────────────
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
const score    = new TennisScore();
const opponent = new Opponent(scene);

// ─── Shot Library ──────────────────────────────────────────
// Each shot: where opponent stands, where ball bounces in player's court,
// where it ends up (player hit zone), spin type, and phase durations.
function mkShot(label, oppX, bx, bz, tx, tz, spin, p1, p2) {
  return {
    label,
    opponentX:     oppX,
    bouncePoint:   new THREE.Vector3(bx, 0.06, bz),
    to:            new THREE.Vector3(tx, 1.25, tz),
    spin,
    phase1Duration: p1,
    phase2Duration: p2,
  };
}

const SHOTS = [
  mkShot('Cross-Court FH',      -3.5,  2.8,  4.0,  3.5,  9.5, 'flat',    1.20, 1.55),
  mkShot('Cross-Court BH',       3.5, -2.8,  4.0, -3.5,  9.5, 'flat',    1.20, 1.55),
  mkShot('Down the Line FH',    -3.2, -2.5,  5.2, -3.0,  9.5, 'flat',    1.10, 1.45),
  mkShot('Down the Line BH',     3.2,  2.5,  5.2,  3.0,  9.5, 'flat',    1.10, 1.45),
  mkShot('Wide to Forehand',     3.0,  3.8,  3.2,  4.3,  9.5, 'slice',   1.10, 1.35),
  mkShot('Wide to Backhand',    -3.0, -3.8,  3.2, -4.3,  9.5, 'slice',   1.10, 1.35),
  mkShot('Center Body Shot',     0.0,  0.2,  4.0,  0.0,  9.5, 'flat',    1.20, 1.50),
  mkShot('Heavy Topspin Deep',  -1.5,  0.5,  5.8,  0.8,  9.5, 'topspin', 1.55, 1.65),
  mkShot('Low Slice Approach',   2.0,  1.5,  3.5,  2.0,  9.0, 'slice',   1.05, 1.30),
  mkShot('Short Ball',          -0.5, -0.5,  2.0, -0.5,  8.0, 'flat',    1.00, 1.20),
  mkShot('Deep Kick',            1.0,  0.0,  6.0,  0.2,  9.5, 'topspin', 1.40, 1.70),
  mkShot('Angle Wide FH',       -2.0,  3.5,  2.5,  4.5,  9.5, 'slice',   1.10, 1.40),
];

// Shuffle order so it never feels predictable
let shotPool = [];
function nextShot() {
  if (shotPool.length === 0) {
    shotPool = [...SHOTS].sort(() => Math.random() - 0.5);
  }
  return shotPool.pop();
}

let state        = 'idle';
let swingHandled = false;
let nextTimer    = null;

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
    document.getElementById('go-sub').textContent   = `${d.sets.p}–${d.sets.c} sets`;
    goEl.style.display = 'block';
    session.save();
  }
}

// ─── Direction indicator ───────────────────────────────────
const dirLabel = document.getElementById('shot-label');
function showDirection(dir) {
  const map = {
    cross:         '← Cross-Court',
    down_the_line: '→ Down the Line',
    lob:           '↑ Lob',
  };
  if (dirLabel) dirLabel.textContent = map[dir] || '';
}

// ─── Game Logic ────────────────────────────────────────────
function launchBall() {
  if (score.gameOver) return;
  const shot = nextShot();

  ball.launch({
    from:          new THREE.Vector3(shot.opponentX, 1.35, -9.2),
    bouncePoint:   shot.bouncePoint,
    to:            shot.to,
    spin:          shot.spin,
    phase1Duration: shot.phase1Duration,
    phase2Duration: shot.phase2Duration,
  });

  opponent.swing(shot.opponentX);

  state        = 'incoming';
  swingHandled = false;
  swing.reset();
}

function processSwing(directionBias) {
  if (state !== 'incoming' || swingHandled || !ball.isPhase2()) return;
  swingHandled = true;

  // *** THE FIX: record the swing so evaluate() doesn't return 'miss' ***
  swing.recordSwing(directionBias);

  const t      = ball.getProgress();
  const result = swing.evaluate(t, 0.88);

  if (result.result === 'hit') result.direction = directionBias;

  session.recordShot(result);
  hud.showFeedback(result);
  ball.applyHitResult(result.direction || 'miss');

  if (result.result === 'hit') {
    document.getElementById('quality-val').textContent = result.quality;
    document.getElementById('speed-val').textContent =
      Math.round(50 + result.quality * 0.8) + ' km/h';
    score.pointTo(0);
  } else {
    score.pointTo(1);
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
  score.pointTo(1);
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
input.init(showDirection);
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
  const dt      = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  camera.position.y = 1.75 + Math.sin(elapsed * 0.22) * 0.008;

  opponent.update(dt);
  ball.update(dt);

  court.updateCrowd(elapsed);
  court.flickerLights(elapsed);

  if (state === 'incoming' && ball.isDone() && !swingHandled) {
    autoMiss();
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
