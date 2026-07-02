import * as THREE from 'three';

export class Opponent {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, -9.5);
    scene.add(this.group);

    this._targetX    = 0;
    this._swingPhase = 0; // 0=idle, 1=windup, 2=strike, 3=follow-through
    this._swingStart = 0;
    this.armGroup    = null;

    this._build();
  }

  _mat(hex, rough = 0.85) {
    return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 });
  }

  _build() {
    const white = this._mat(0xf2f2f2);
    const navy  = this._mat(0x1a2a5e);
    const skin  = this._mat(0xc49a6c);
    const black = this._mat(0x111111, 0.5);

    // Shoes
    for (const sx of [-0.12, 0.12]) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.28), black.clone());
      shoe.position.set(sx, 0.04, 0.04);
      this.group.add(shoe);
    }

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.072, 0.062, 0.52, 8);
    for (const sx of [-0.12, 0.12]) {
      const leg = new THREE.Mesh(legGeo, skin.clone());
      leg.position.set(sx, 0.36, 0);
      this.group.add(leg);
    }

    // Shorts
    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.30, 10), navy.clone());
    shorts.position.y = 0.74;
    this.group.add(shorts);

    // Shirt / torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.21, 0.58, 10), white.clone());
    torso.position.y = 1.15;
    this.group.add(torso);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), skin.clone());
    neck.position.y = 1.53;
    this.group.add(neck);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), skin.clone());
    head.position.y = 1.69;
    this.group.add(head);

    // Cap crown
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 12), this._mat(0x222266));
    cap.position.y = 1.84;
    this.group.add(cap);

    // Cap brim
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 12), this._mat(0x222266));
    brim.position.set(0, 1.79, 0.1);
    this.group.add(brim);

    // Non-dominant arm (left)
    const leftUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.44, 8), white.clone());
    leftUpper.rotation.z = Math.PI / 4.5;
    leftUpper.position.set(-0.285, 1.2, 0);
    this.group.add(leftUpper);

    const leftFore = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.36, 8), skin.clone());
    leftFore.rotation.z = Math.PI / 3.5;
    leftFore.position.set(-0.42, 1.02, 0);
    this.group.add(leftFore);

    // Dominant arm group (right) — animated
    this.armGroup = new THREE.Group();
    this.armGroup.position.set(0.21, 1.12, 0);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.4, 8), white.clone());
    upperArm.rotation.z = -Math.PI / 5;
    upperArm.position.set(0.12, 0, 0);
    this.armGroup.add(upperArm);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.044, 0.36, 8), skin.clone());
    forearm.rotation.z = -Math.PI / 3.2;
    forearm.position.set(0.27, -0.14, 0);
    this.armGroup.add(forearm);

    // Racket pivot attached to forearm end
    this.racketPivot = new THREE.Group();
    this.racketPivot.position.set(0.48, -0.26, 0);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.34, 8), black.clone());
    handle.rotation.z = Math.PI / 2;
    handle.position.x = 0.17;
    this.racketPivot.add(handle);

    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.02, 8, 24), black.clone());
    frame.position.x = 0.44;
    frame.rotation.y = Math.PI / 2;
    this.racketPivot.add(frame);

    const strings = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.34, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xeeee44, wireframe: true, opacity: 0.7, transparent: true })
    );
    strings.position.x = 0.44;
    strings.rotation.y = Math.PI / 2;
    this.racketPivot.add(strings);

    this.armGroup.add(this.racketPivot);
    this.group.add(this.armGroup);
  }

  swing(targetX) {
    this._targetX    = targetX;
    this._swingPhase = 1;
    this._swingStart = Date.now();
  }

  update(dt) {
    // Smooth lateral movement toward ball origin
    this.group.position.x += (this._targetX - this.group.position.x) * Math.min(dt * 4.5, 1);

    // Body faces slightly toward player
    this.group.rotation.y = -this.group.position.x * 0.055;

    const age = Date.now() - this._swingStart;

    switch (this._swingPhase) {
      case 0: // idle bounce
        this.group.position.y = Math.sin(Date.now() * 0.0016) * 0.013;
        break;

      case 1: { // wind-up (500 ms)
        const t = Math.min(age / 500, 1);
        this.armGroup.rotation.z = t * 0.9;
        this.armGroup.rotation.y = t * 0.25;
        if (t >= 1) this._swingPhase = 2;
        break;
      }

      case 2: { // strike (140 ms)
        const t = Math.min((age - 500) / 140, 1);
        this.armGroup.rotation.z = 0.9  - t * 1.85;
        this.armGroup.rotation.y = 0.25 - t * 0.5;
        if (t >= 1) this._swingPhase = 3;
        break;
      }

      case 3: { // follow-through (380 ms)
        const t = Math.min((age - 640) / 380, 1);
        this.armGroup.rotation.z = -0.95 + t * 0.75;
        if (t >= 1) {
          this._swingPhase = 0;
          this.armGroup.rotation.set(0, 0, 0);
        }
        break;
      }
    }
  }
}
