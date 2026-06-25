import * as THREE from 'three';

export class Ball {
  constructor(scene) {
    this.scene = scene;
    this.t = 0;
    this.duration = 2.2;
    this.state = 'idle';
    this.swingT = null;
    this.trajectory = null;
    this._trailData = [];

    this._buildMesh();
    this._buildLight();
    this._buildTrail();
    this._buildShadow();

    this.mesh.position.set(0, 20, 0);
  }

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
    // Soft point light that travels with the ball and casts a pool on the court
    this.ballLight = new THREE.PointLight(0xbbff22, 0, 8, 1.8);
    this.ballLight.castShadow = false;
    this.scene.add(this.ballLight);
  }

  _buildTrail() {
    this.trail = [];
    const TRAIL_LEN = 18;
    for (let i = 0; i < TRAIL_LEN; i++) {
      const r = 0.065 - i * 0.003;
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
    this._trailData = [];
  }

  launch(shotConfig) {
    const defaults = {
      from: new THREE.Vector3(-2.5, 1.5, -7),
      cp1:  new THREE.Vector3(-1,   3.5, -2),
      cp2:  new THREE.Vector3( 1.5, 2.2,  3),
      to:   new THREE.Vector3( 2,   1.3,  6.5),
      duration: 2.2,
    };

    const cfg = shotConfig || defaults;
    const from = cfg.from instanceof THREE.Vector3 ? cfg.from : new THREE.Vector3(...Object.values(cfg.from));
    const cp1  = cfg.cp1  instanceof THREE.Vector3 ? cfg.cp1  : new THREE.Vector3(...Object.values(cfg.cp1));
    const cp2  = cfg.cp2  instanceof THREE.Vector3 ? cfg.cp2  : new THREE.Vector3(...Object.values(cfg.cp2));
    const to   = cfg.to   instanceof THREE.Vector3 ? cfg.to   : new THREE.Vector3(...Object.values(cfg.to));

    this.trajectory = new THREE.CubicBezierCurve3(from, cp1, cp2, to);
    this.duration = cfg.duration || defaults.duration;
    this.t = 0;
    this.state = 'moving';
    this.swingT = null;
    this._trailData = [];

    this.mesh.position.copy(from);
    this.ballLight.position.copy(from);
    this.ballLight.intensity = 1.2;
  }

  update(dt) {
    if (this.state !== 'moving') return;

    this.t += dt / this.duration;
    if (this.t >= 1) {
      this.t = 1;
      this.state = 'done';
    }

    const pos = this.trajectory.getPoint(this.t);
    this.mesh.position.copy(pos);

    // Ground shadow — scales and fades with height above court
    const ht = Math.max(0, pos.y - 0.1);
    this.shadow.position.x = pos.x;
    this.shadow.position.z = pos.z;
    this.shadow.material.opacity = Math.max(0, 0.45 - ht * 0.12);
    const ss = 1 + ht * 0.06;
    this.shadow.scale.set(ss, ss, ss);

    // Light follows the ball, slightly offset downward so it pools on court
    this.ballLight.position.set(pos.x, pos.y - 0.2, pos.z);

    // Pulse brighter when entering the strike zone
    const inZone = this.t > 0.82 && this.t < 0.95;
    const baseIntensity = 1.2;
    const pulse = inZone ? 1.0 + 0.5 * Math.sin(Date.now() * 0.012) : 0;
    this.ballLight.intensity = baseIntensity + pulse;

    // Visual spin rotation
    this.mesh.rotation.x += dt * 16;
    this.mesh.rotation.z += dt * 9;

    this._updateTrail(pos);
  }

  _updateTrail(pos) {
    const now = Date.now();
    this._trailData.unshift({ x: pos.x, y: pos.y, z: pos.z, t: now });
    if (this._trailData.length > this.trail.length) {
      this._trailData.pop();
    }

    const maxAge = 380; // ms — slightly longer for more dramatic tail

    for (let i = 0; i < this.trail.length; i++) {
      const sphere = this.trail[i];
      const data = this._trailData[i];
      if (data) {
        sphere.position.set(data.x, data.y, data.z);
        const age = now - data.t;
        const freshness = Math.max(0, 1 - age / maxAge);
        const indexFade = 1 - (i / this.trail.length);
        sphere.material.opacity = freshness * indexFade * 0.72;
      } else {
        sphere.position.set(0, 20, 0);
        sphere.material.opacity = 0;
      }
    }
  }

  getProgress() {
    return this.t;
  }

  isInStrikeZone() {
    return this.t > 0.82 && this.t < 0.95;
  }

  getIdealHitT() {
    return 0.88;
  }

  isMoving() {
    return this.state === 'moving';
  }

  isDone() {
    return this.state === 'done' || this.t >= 1;
  }

  applyHitResult(direction) {
    const currentPos = this.mesh.position.clone();

    let destination;
    switch (direction) {
      case 'cross':
        destination = new THREE.Vector3(-3, 2, -7);
        break;
      case 'down_the_line':
        destination = new THREE.Vector3(3, 2, -7);
        break;
      case 'lob':
        destination = new THREE.Vector3(0, 5, -7);
        break;
      case 'net':
        destination = new THREE.Vector3(0, 0, 0);
        break;
      case 'out':
        destination = new THREE.Vector3(0, 0, -10);
        break;
      case 'miss':
      default:
        this.state = 'done';
        this.ballLight.intensity = 0;
        this._fadeOut();
        return;
    }

    const cp1 = new THREE.Vector3(currentPos.x * 0.5, currentPos.y + 1.5, currentPos.z - 1);
    const cp2 = new THREE.Vector3(destination.x * 0.5, destination.y + 1.0, destination.z + 2);

    this.trajectory = new THREE.CubicBezierCurve3(
      currentPos.clone(),
      cp1,
      cp2,
      destination
    );

    this.t = 0;
    this.duration = 1.4;
    this.state = 'moving';
    this._trailData = [];
    this.ballLight.intensity = 1.8;
  }

  _fadeOut() {
    const mat = this.mesh.material;
    mat.transparent = true;
    let opacity = 1.0;
    const fade = setInterval(() => {
      opacity -= 0.05;
      mat.opacity = Math.max(0, opacity);
      this.ballLight.intensity = Math.max(0, opacity * 1.2);
      this.trail.forEach(s => { s.material.opacity = 0; });
      this.shadow.material.opacity = 0;
      if (opacity <= 0) {
        clearInterval(fade);
        this.mesh.position.set(0, 20, 0);
        this.ballLight.position.set(0, 20, 0);
        this.ballLight.intensity = 0;
        mat.opacity = 1;
        mat.transparent = false;
      }
    }, 30);
  }

  reset() {
    this.state = 'idle';
    this.t = 0;
    this.swingT = null;
    this.mesh.position.set(0, 20, 0);
    this.mesh.material.opacity = 1;
    this.mesh.material.transparent = false;
    this.ballLight.position.set(0, 20, 0);
    this.ballLight.intensity = 0;
    this.shadow.material.opacity = 0;
    this._trailData = [];
    this.trail.forEach(s => {
      s.position.set(0, 20, 0);
      s.material.opacity = 0;
    });
  }
}
