import * as THREE from 'three';

export class Ball {
  constructor(scene) {
    this.scene = scene;
    this.t     = 0;
    // 0=idle  1=opponent→bounce  2=bounce→player  3=return shot
    this._phase             = 0;
    this.state              = 'idle';
    this._curve1            = null; // opponent → bounce
    this._curve2            = null; // bounce   → player
    this._returnCurve       = null; // player   → opponent (after hit)
    this._dur1              = 1.2;
    this._dur2              = 1.5;
    this._returnDur         = 1.25;
    this._squishStart       = -1;
    this._bounceExpandStart = -1;
    this._bouncePoint       = new THREE.Vector3();
    this._trailData         = [];

    this._buildMesh();
    this._buildLight();
    this._buildTrail();
    this._buildShadow();
    this._buildBounceIndicator();

    this.mesh.position.set(0, 20, 0);
  }

  // ─── Build helpers ─────────────────────────────────────────

  _buildMesh() {
    const geo = new THREE.SphereGeometry(0.14, 20, 20);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xccff00,
      emissive: 0x99dd00,
      emissiveIntensity: 0.85,
      roughness: 0.38,
      metalness: 0.0,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }

  _buildShadow() {
    const geo = new THREE.CircleGeometry(0.22, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(geo, mat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.set(0, 0.02, 0);
    this.scene.add(this.shadow);
  }

  _buildLight() {
    this.ballLight = new THREE.PointLight(0xbbff22, 0, 8, 1.8);
    this.ballLight.castShadow = false;
    this.scene.add(this.ballLight);
  }

  _buildTrail() {
    this.trail = [];
    const TRAIL_LEN = 18;
    for (let i = 0; i < TRAIL_LEN; i++) {
      const r   = 0.065 - i * 0.003;
      const geo = new THREE.SphereGeometry(Math.max(r, 0.008), 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xccff00,
        emissive: 0x99dd00,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0,
      });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(0, 20, 0);
      this.scene.add(sphere);
      this.trail.push(sphere);
    }
  }

  _buildBounceIndicator() {
    // Pulsing yellow ring on the court showing where ball will land
    const geo = new THREE.TorusGeometry(0.38, 0.027, 8, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffee22, transparent: true, opacity: 0 });
    this.bounceRing = new THREE.Mesh(geo, mat);
    this.bounceRing.rotation.x = -Math.PI / 2;
    this.bounceRing.position.y = 0.04;
    this.scene.add(this.bounceRing);
  }

  // ─── Launch ────────────────────────────────────────────────

  launch(config) {
    const toV3 = v => v instanceof THREE.Vector3 ? v.clone() : new THREE.Vector3(v.x, v.y, v.z);

    const from   = toV3(config.from);
    const bounce = toV3(config.bouncePoint);
    const to     = toV3(config.to);
    const spin   = config.spin || 'flat';

    // Phase 1: opponent → bounce (arc over net)
    const dist  = from.distanceTo(bounce);
    const peakH = 3.0 + dist * 0.14;
    const cp1_1 = new THREE.Vector3(
      from.x * 0.65 + bounce.x * 0.35,
      peakH,
      from.z * 0.65 + bounce.z * 0.35
    );
    const cp2_1 = new THREE.Vector3(
      from.x * 0.05 + bounce.x * 0.95,
      bounce.y + 0.65,
      from.z * 0.05 + bounce.z * 0.95
    );
    this._curve1 = new THREE.CubicBezierCurve3(from, cp1_1, cp2_1, bounce);
    this._dur1   = config.phase1Duration || 1.2;

    // Phase 2: bounce → player hit zone (spin changes bounce height)
    const bounceH = spin === 'topspin' ? 2.2 : spin === 'slice' ? 0.9 : 1.4;
    const cp1_2   = new THREE.Vector3(bounce.x, bounce.y + bounceH, bounce.z + 1.8);
    const cp2_2   = new THREE.Vector3(
      bounce.x * 0.25 + to.x * 0.75,
      to.y + 0.45,
      to.z - 1.8
    );
    this._curve2 = new THREE.CubicBezierCurve3(bounce, cp1_2, cp2_2, to);
    this._dur2   = config.phase2Duration || 1.5;

    this._bouncePoint.copy(bounce);

    this.t                  = 0;
    this._phase             = 1;
    this.state              = 'moving';
    this._squishStart       = -1;
    this._bounceExpandStart = -1;
    this._trailData         = [];

    this.mesh.position.copy(from);
    this.mesh.scale.set(1, 1, 1);
    this.mesh.material.opacity     = 1;
    this.mesh.material.transparent = false;
    this.ballLight.position.copy(from);
    this.ballLight.intensity = 1.2;

    // Show bounce target ring
    this.bounceRing.position.x = bounce.x;
    this.bounceRing.position.z = bounce.z;
    this.bounceRing.scale.setScalar(1);
    this.bounceRing.material.opacity = 0.75;
  }

  // ─── Update ────────────────────────────────────────────────

  update(dt) {
    if (this.state !== 'moving') return;

    const now = Date.now();

    if (this._phase === 1) {
      this.t += dt / this._dur1;
      if (this.t >= 1) {
        this.t      = 0;
        this._phase = 2;
        this._doBounce(now);
      }
      this._updatePos(this._curve1.getPoint(Math.min(this.t, 1)), now, dt);
      // Pulse bounce ring while ball flies toward it
      this.bounceRing.material.opacity = 0.45 + 0.28 * Math.sin(now * 0.007);

    } else if (this._phase === 2) {
      this.t += dt / this._dur2;
      if (this.t >= 1) {
        this.t     = 1;
        this.state = 'done';
        this.ballLight.intensity = 0;
      }
      this._updatePos(this._curve2.getPoint(Math.min(this.t, 1)), now, dt);

    } else if (this._phase === 3) {
      this.t += dt / this._returnDur;
      if (this.t >= 1) {
        this.t     = 1;
        this.state = 'done';
        this.ballLight.intensity = 0;
      }
      this._updatePos(this._returnCurve.getPoint(Math.min(this.t, 1)), now, dt);
    }

    // Bounce ring expands and fades after impact
    if (this._bounceExpandStart > 0) {
      const bt = (now - this._bounceExpandStart) / 360;
      if (bt < 1) {
        this.bounceRing.scale.setScalar(1 + bt * 2.8);
        this.bounceRing.material.opacity = 0.75 * (1 - bt);
      } else {
        this.bounceRing.material.opacity = 0;
        this._bounceExpandStart = -1;
      }
    }

    // Squish animation springs back after bounce
    if (this._squishStart > 0) {
      const st = (now - this._squishStart) / 130;
      if (st < 1) {
        const sy = 0.3 + 0.7 * st;
        const sx = 1.55 - 0.55 * st;
        this.mesh.scale.set(sx, sy, sx);
      } else {
        this.mesh.scale.set(1, 1, 1);
        this._squishStart = -1;
      }
    }
  }

  _doBounce(now) {
    this._squishStart       = now;
    this._bounceExpandStart = now;
    this.ballLight.intensity = 3.0; // brief flash on impact
  }

  _updatePos(pos, now, dt) {
    this.mesh.position.copy(pos);

    // Ground shadow
    const ht = Math.max(0, pos.y - 0.1);
    this.shadow.position.set(pos.x, 0.02, pos.z);
    this.shadow.material.opacity = Math.max(0, 0.45 - ht * 0.12);
    const ss = 1 + ht * 0.06;
    this.shadow.scale.set(ss, ss, ss);

    // Light follows ball, pulses in strike zone
    this.ballLight.position.set(pos.x, pos.y - 0.2, pos.z);
    if (this._phase === 2 && this._squishStart < 0) {
      const inZone = this.t > 0.72 && this.t < 0.95;
      this.ballLight.intensity = 1.2 + (inZone ? 0.7 + 0.5 * Math.sin(now * 0.012) : 0);
    }

    this.mesh.rotation.x += dt * 16;
    this.mesh.rotation.z += dt * 9;

    this._updateTrail(pos);
  }

  _updateTrail(pos) {
    const now = Date.now();
    this._trailData.unshift({ x: pos.x, y: pos.y, z: pos.z, t: now });
    if (this._trailData.length > this.trail.length) this._trailData.pop();

    const maxAge = 380;
    for (let i = 0; i < this.trail.length; i++) {
      const sphere = this.trail[i];
      const data   = this._trailData[i];
      if (data) {
        sphere.position.set(data.x, data.y, data.z);
        const freshness = Math.max(0, 1 - (now - data.t) / maxAge);
        const indexFade = 1 - (i / this.trail.length);
        sphere.material.opacity = freshness * indexFade * 0.72;
      } else {
        sphere.position.set(0, 20, 0);
        sphere.material.opacity = 0;
      }
    }
  }

  // ─── Public API ────────────────────────────────────────────

  /** Progress within phase 2 (0–1). Returns -1 while still in phase 1. */
  getProgress() {
    return this._phase === 2 ? this.t : (this._phase < 2 ? -1 : 0);
  }

  isPhase2() {
    return this._phase === 2;
  }

  isInStrikeZone() {
    return this._phase === 2 && this.t > 0.72 && this.t < 0.95;
  }

  getIdealHitT() {
    return 0.88;
  }

  isMoving() {
    return this.state === 'moving';
  }

  isDone() {
    return this._phase >= 2 && (this.state === 'done' || this.t >= 1);
  }

  applyHitResult(direction) {
    const cur = this.mesh.position.clone();
    let destination;

    switch (direction) {
      case 'cross':
        destination = new THREE.Vector3(cur.x > 0 ? -3.5 : 3.5, 1.8, -9);
        break;
      case 'down_the_line':
        destination = new THREE.Vector3(cur.x > 0 ? 3.2 : -3.2, 1.8, -9);
        break;
      case 'lob':
        destination = new THREE.Vector3(0, 0.6, -9.5);
        break;
      case 'net':
        destination = new THREE.Vector3(cur.x * 0.3, 0.5, 0.5);
        break;
      case 'out':
        destination = new THREE.Vector3(cur.x * 1.6, 0.5, -11.5);
        break;
      case 'miss':
      default:
        this.state = 'done';
        this.ballLight.intensity = 0;
        this.bounceRing.material.opacity = 0;
        this._fadeOut();
        return;
    }

    const cp1 = new THREE.Vector3(
      cur.x * 0.4 + destination.x * 0.6,
      cur.y + 2.2,
      cur.z - 2
    );
    const cp2 = new THREE.Vector3(
      cur.x * 0.1 + destination.x * 0.9,
      destination.y + 1.6,
      destination.z + 2
    );

    this._returnCurve = new THREE.CubicBezierCurve3(cur.clone(), cp1, cp2, destination);
    this._returnDur   = direction === 'lob' ? 2.0 : 1.25;
    this._phase       = 3;
    this.t            = 0;
    this.state        = 'moving';
    this._trailData   = [];
    this.ballLight.intensity = 1.8;
    this.bounceRing.material.opacity = 0;
  }

  _fadeOut() {
    const mat   = this.mesh.material;
    mat.transparent = true;
    let opacity = 1.0;
    const fade  = setInterval(() => {
      opacity -= 0.05;
      mat.opacity                  = Math.max(0, opacity);
      this.ballLight.intensity      = Math.max(0, opacity * 1.2);
      this.trail.forEach(s => { s.material.opacity = 0; });
      this.shadow.material.opacity = 0;
      if (opacity <= 0) {
        clearInterval(fade);
        this.mesh.position.set(0, 20, 0);
        this.ballLight.position.set(0, 20, 0);
        this.ballLight.intensity = 0;
        mat.opacity     = 1;
        mat.transparent = false;
      }
    }, 30);
  }

  reset() {
    this.state              = 'idle';
    this.t                  = 0;
    this._phase             = 0;
    this._squishStart       = -1;
    this._bounceExpandStart = -1;

    this.mesh.position.set(0, 20, 0);
    this.mesh.material.opacity     = 1;
    this.mesh.material.transparent = false;
    this.mesh.scale.set(1, 1, 1);

    this.ballLight.position.set(0, 20, 0);
    this.ballLight.intensity = 0;

    this.shadow.material.opacity     = 0;
    this.bounceRing.material.opacity = 0;
    this.bounceRing.scale.setScalar(1);

    this._trailData = [];
    this.trail.forEach(s => {
      s.position.set(0, 20, 0);
      s.material.opacity = 0;
    });
  }
}
