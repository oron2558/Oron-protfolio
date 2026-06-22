import * as THREE from 'three';

// ─── Grand Slam Themes ─────────────────────────────────────────────────────
export const SLAM_THEMES = {
  australian: {
    name: 'Australian Open', emoji: '🇦🇺', short: 'AO',
    courtColor:    0x0297db,
    serviceColor:  0x1aadea,
    surroundColor: 0x013f6e,
    skyColor:      0x07101e,
    fogColor:      0x07101e,  fogDensity: 0.014,
    ambientColor:  0x223355,  ambientIntensity: 0.45,
    lightColor:    0xfff8f0,  lightIntensity: 155,
    crowdColors: ['#1a5276','#2980b9','#ffffff','#f0f4ff','#d6eaf8','#aed6f1','#ffd700','#ff6b35','#085c8a','#ccddff'],
  },
  roland: {
    name: 'Roland Garros', emoji: '🇫🇷', short: 'RG',
    courtColor:    0xbb5522,
    serviceColor:  0xbb5522,
    surroundColor: 0x4a7a28,
    skyColor:      0x7ab0d8,
    fogColor:      0x8ab5d5,  fogDensity: 0.011,
    ambientColor:  0x664422,  ambientIntensity: 0.78,
    lightColor:    0xfff5cc,  lightIntensity: 165,
    crowdColors: ['#1b5e20','#ffffff','#f44336','#ff9800','#33691e','#e8f5e9','#ffccbc','#c8e6c9','#795548','#ffe082'],
  },
  wimbledon: {
    name: 'Wimbledon', emoji: '🇬🇧', short: 'WIM',
    courtColor:    0x3a7d2e,
    serviceColor:  0x4e9840,
    surroundColor: 0x285c1e,
    skyColor:      0x8bafc4,
    fogColor:      0xa8c4d2,  fogDensity: 0.012,
    ambientColor:  0x445533,  ambientIntensity: 0.68,
    lightColor:    0xf0f8ff,  lightIntensity: 128,
    crowdColors: ['#ffffff','#f5f5f5','#9b59b6','#6c3483','#e8d5f0','#d4b8e0','#2e7d32','#e0e0e0','#f8f8f8','#c8e6c9'],
  },
  usopen: {
    name: 'US Open', emoji: '🇺🇸', short: 'USO',
    courtColor:    0x2855a0,
    serviceColor:  0x3a7a55,
    surroundColor: 0x1a3878,
    skyColor:      0x040810,
    fogColor:      0x040810,  fogDensity: 0.013,
    ambientColor:  0x1a2244,  ambientIntensity: 0.35,
    lightColor:    0xffffff,  lightIntensity: 225,
    crowdColors: ['#b71c1c','#ffffff','#1a237e','#e3f2fd','#ffeb3b','#ff5722','#4a148c','#f3e5f5','#ff8f00','#80deea'],
  },
};

// ─── Procedural Crowd Texture ───────────────────────────────────────────────
function makeCrowdTexture(colors) {
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Seat row stripes
  const rowH = H / 20;
  for (let r = 0; r < 20; r++) {
    ctx.fillStyle = r % 2 === 0 ? '#12121c' : '#0d0d16';
    ctx.fillRect(0, r * rowH, W, rowH);
    // seat back highlight
    ctx.fillStyle = 'rgba(60,60,90,0.35)';
    ctx.fillRect(0, r * rowH, W, rowH * 0.22);
  }

  // Crowd members: body + head
  for (let i = 0; i < 4200; i++) {
    const x  = Math.random() * W;
    const y  = Math.random() * H;
    const sz = 3.5 + Math.random() * 5;
    const c  = colors[Math.floor(Math.random() * colors.length)];
    ctx.globalAlpha = 0.55 + Math.random() * 0.45;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y + sz * 0.25, sz * 0.48, sz * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    // skin tone head
    ctx.globalAlpha = 0.7 + Math.random() * 0.3;
    ctx.fillStyle = ['#e8c49a','#c49060','#f5deb3','#d2a679','#8b5a2b'][Math.floor(Math.random()*5)];
    ctx.beginPath();
    ctx.ellipse(x, y - sz * 0.45, sz * 0.36, sz * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return new THREE.CanvasTexture(canvas);
}

// ─── Court Class ───────────────────────────────────────────────────────────
export class Court {
  constructor(scene, themeName = 'australian') {
    this.scene    = scene;
    this._theme   = SLAM_THEMES[themeName] || SLAM_THEMES.australian;
    this._objects = [];
    this._lights  = [];

    // Permanent geometry (never changes with theme)
    this._buildGround();
    this._buildCourtLines();
    this._buildNet();
    this._buildNetPosts();

    // Theme-dependent
    this._buildCourtSurface();
    this._buildStadium();
    this._buildLighting();
    this._applyEnvironment();
  }

  setTheme(name) {
    const t = SLAM_THEMES[name];
    if (!t) return;
    this._theme = t;

    // Dispose old theme objects
    this._objects.forEach(o => {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => { if (m) { if (m.map) m.map.dispose(); m.dispose(); } });
      this.scene.remove(o);
    });
    this._lights.forEach(l => this.scene.remove(l));
    this._objects = [];
    this._lights  = [];

    this._buildCourtSurface();
    this._buildStadium();
    this._buildLighting();
    this._applyEnvironment();
  }

  static getThemes() { return SLAM_THEMES; }

  // ── Private ────────────────────────────────────────────────────────────
  _applyEnvironment() {
    const t = this._theme;
    this.scene.fog        = new THREE.FogExp2(t.fogColor, t.fogDensity);
    this.scene.background = new THREE.Color(t.skyColor);
  }

  _buildGround() {
    const g = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x090c12, roughness: 0.98 })
    );
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    this.scene.add(g);
  }

  _buildCourtSurface() {
    const t = this._theme;

    const addPlane = (w, d, color, x, y, z) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.88 })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, z);
      m.receiveShadow = true;
      this.scene.add(m);
      this._objects.push(m);
    };

    // Surround base (big, slightly below court surface)
    addPlane(50, 38, t.surroundColor,  0, 0.001, 0);
    // Main court surface
    addPlane(10, 16, t.courtColor,     0, 0.003, 0);
    // Service box overlay (only when different from court)
    if (t.serviceColor !== t.courtColor) {
      addPlane(10, 4, t.serviceColor,  0, 0.005,  2.0);
      addPlane(10, 4, t.serviceColor,  0, 0.005, -2.0);
    }
  }

  _buildCourtLines() {
    const Y   = 0.016;
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const segs = [
      [-5,Y,-8, -5,Y, 8],  [ 5,Y,-8,  5,Y, 8],   // sidelines
      [-5,Y,-8,  5,Y,-8],  [-5,Y, 8,  5,Y, 8],   // baselines
      [-5,Y,-4,  5,Y,-4],  [-5,Y, 4,  5,Y, 4],   // service lines
      [ 0,Y, 0,  0,Y, 4],  [ 0,Y, 0,  0,Y,-4],   // center lines
      [-0.3,Y,-8, 0.3,Y,-8], [-0.3,Y,8, 0.3,Y,8], // center marks
    ];
    const pts = [];
    for (const s of segs) pts.push(s[0],s[1],s[2], s[3],s[4],s[5]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.scene.add(new THREE.LineSegments(geo, mat));
  }

  _buildNet() {
    const net = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 0.92, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, roughness: 0.6 })
    );
    net.position.set(0, 0.46, 0);
    net.castShadow = true;
    this.scene.add(net);

    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 10.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.4 })
    );
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, 0.92, 0);
    this.scene.add(cable);
  }

  _buildNetPosts() {
    const geo = new THREE.CylinderGeometry(0.05, 0.05, 1.06, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });
    [-5.3, 5.3].forEach(x => {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(x, 0.53, 0);
      p.castShadow = true;
      this.scene.add(p);
    });
  }

  _buildStadium() {
    const t        = this._theme;
    const crowdTex = makeCrowdTexture(t.crowdColors);
    const darkMat  = new THREE.MeshStandardMaterial({ color: 0x0e0e18, roughness: 1.0 });
    const crowdMat = new THREE.MeshStandardMaterial({ map: crowdTex, roughness: 0.9 });

    // faceIdx: 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z
    const addBlock = (w, h, d, x, y, z, faceIdx) => {
      const geo  = new THREE.BoxGeometry(w, h, d);
      const mats = [0,1,2,3,4,5].map(i => i === faceIdx ? crowdMat : darkMat);
      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this._objects.push(mesh);
    };

    const TIERS = 9, TH = 2.2, TD = 2.0;

    // Far bleachers (Z<-12): crowd face = +Z (idx 4)
    for (let i = 0; i < TIERS; i++) {
      addBlock(26 + i * 2.5, TH, TD, 0, i * TH + TH * 0.5, -(12 + i * TD), 4);
    }

    // Near bleachers (Z>+12): crowd face = -Z (idx 5)
    for (let i = 0; i < 5; i++) {
      addBlock(20 + i * 2, TH, TD, 0, i * TH + TH * 0.5, 12 + i * TD, 5);
    }

    // Left bleachers (X<-9): crowd face = +X (idx 0)
    for (let i = 0; i < TIERS; i++) {
      addBlock(TD, TH, 28, -(9 + i * TD), i * TH + TH * 0.5, -2, 0);
    }

    // Right bleachers (X>+9): crowd face = -X (idx 1)
    for (let i = 0; i < TIERS; i++) {
      addBlock(TD, TH, 28, 9 + i * TD, i * TH + TH * 0.5, -2, 1);
    }
  }

  _buildLighting() {
    const t = this._theme;

    const ambient = new THREE.AmbientLight(t.ambientColor, t.ambientIntensity);
    this.scene.add(ambient);
    this._lights.push(ambient);

    const cfgs = [
      { pos: [-18, 22, -8],  tgt: [ 0, 0, -4] },
      { pos: [ 18, 22,  0],  tgt: [ 0, 0,  0] },
      { pos: [ -8, 20,  8],  tgt: [ 0, 0,  4] },
      { pos: [  0, 24, -14], tgt: [ 0, 0,  0] },
    ];

    cfgs.forEach(cfg => {
      const light = new THREE.SpotLight(t.lightColor, t.lightIntensity);
      light.position.set(...cfg.pos);
      light.castShadow   = true;
      light.angle        = Math.PI / 5;
      light.penumbra     = 0.38;
      light.decay        = 1.8;
      light.shadow.mapSize.set(1024, 1024);

      const tgt = new THREE.Object3D();
      tgt.position.set(...cfg.tgt);
      this.scene.add(tgt);
      light.target = tgt;
      this.scene.add(light);
      this._lights.push(light, tgt);

      // Visible fixture
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshStandardMaterial({ color: t.lightColor, emissive: t.lightColor, emissiveIntensity: 2 })
      );
      bulb.position.set(...cfg.pos);
      this.scene.add(bulb);
      this._lights.push(bulb);
    });
  }
}
