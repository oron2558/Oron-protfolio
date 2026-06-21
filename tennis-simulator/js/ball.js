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
    this._buildTrail();

    // Start hidden offscreen
    this.mesh.position.set(0, 20, 0);
  }

  _buildMesh() {
    const geo = new THREE.SphereGeometry(0.14, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xccff00,
      emissive: 0x88cc00,
      emissiveIntensity: 0.4,
      roughness: 0.5,
      metalness: 0.0,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }

  _buildTrail() {
    this.trail = [];
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.SphereGeometry(0.06 - i * 0.004, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xccff00,
        emissive: 0x88cc00,
        emissiveIntensity: 0.2,
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

    // Snap to start position immediately
    this.mesh.position.copy(from);
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

    // Visual spin rotation
    this.mesh.rotation.x += dt * 15;
    this.mesh.rotation.z += dt * 8;

    this._updateTrail(pos);
  }

  _updateTrail(pos) {
    const now = Date.now();
    this._trailData.unshift({ x: pos.x, y: pos.y, z: pos.z, t: now });
    if (this._trailData.length > 12) {
      this._trailData.pop();
    }

    const maxAge = 300; // ms

    for (let i = 0; i < this.trail.length; i++) {
      const sphere = this.trail[i];
      const data = this._trailData[i];
      if (data) {
        sphere.position.set(data.x, data.y, data.z);
        const age = now - data.t;
        const freshness = Math.max(0, 1 - age / maxAge);
        const indexFade = 1 - (i / this.trail.length);
        sphere.material.opacity = freshness * indexFade * 0.7;
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
        // Ball freezes and fades out
        this.state = 'done';
        this._fadeOut();
        return;
    }

    // Control points for the return trajectory
    const midX = (currentPos.x + destination.x) / 2;
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
  }

  _fadeOut() {
    const mat = this.mesh.material;
    mat.transparent = true;
    let opacity = 1.0;
    const fade = setInterval(() => {
      opacity -= 0.05;
      mat.opacity = Math.max(0, opacity);
      this.trail.forEach(s => { s.material.opacity = 0; });
      if (opacity <= 0) {
        clearInterval(fade);
        this.mesh.position.set(0, 20, 0);
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
    this._trailData = [];
    this.trail.forEach(s => {
      s.position.set(0, 20, 0);
      s.material.opacity = 0;
    });
  }
}
