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
    isNight: true,
    crowdColors: ['#1a5276','#2980b9','#ffffff','#f0f4ff','#aed6f1','#ffd700','#ff6b35','#085c8a','#ccddff','#e8f4f8'],
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
    isNight: false,
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
    isNight: false,
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
    isNight: true,
    crowdColors: ['#b71c1c','#ffffff','#1a237e','#e3f2fd','#ffeb3b','#ff5722','#4a148c','#f3e5f5','#ff8f00','#80deea'],
  },
};

// ─── Procedural Court Surface Texture ──────────────────────────────────────
function makeCourtTexture(theme) {
  const W = 512, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const r = (theme.courtColor >> 16) & 0xff;
  const g = (theme.courtColor >>  8) & 0xff;
  const b =  theme.courtColor        & 0xff;

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, W, H);

  if (theme.short === 'RG') {
    // Clay: horizontal drag lines from court preparation
    for (let py = 0; py < H; py += 5 + Math.random() * 5) {
      ctx.strokeStyle = `rgba(${r-28},${g-15},${b-8},0.3)`;
      ctx.lineWidth = 0.8 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, py + (Math.random() - 0.5) * 3);
      ctx.lineTo(W, py + (Math.random() - 0.5) * 3);
      ctx.stroke();
    }
    // Clay surface noise / colour variation
    for (let px = 0; px < W; px += 2) {
      for (let py = 0; py < H; py += 2) {
        const v = (Math.random() - 0.5) * 22;
        ctx.fillStyle = `rgba(${Math.min(255,r+v)},${Math.min(255,g+v*0.55)},${Math.max(0,b+v*0.2)},0.45)`;
        ctx.fillRect(px, py, 2, 2);
      }
    }
    // Occasional ball marks (darker circles)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(${r-40},${g-25},${b-10},0.35)`;
      ctx.beginPath();
      ctx.ellipse(Math.random()*W, Math.random()*H, 8+Math.random()*6, 4+Math.random()*3, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }

  } else if (theme.short === 'WIM') {
    // Grass: alternating mowing stripes (classic Wimbledon look)
    const stripes = 12;
    const sw = H / stripes;
    for (let i = 0; i < stripes; i++) {
      const bright = i % 2 === 0;
      ctx.fillStyle = bright
        ? `rgb(${Math.min(255,r+14)},${Math.min(255,g+14)},${Math.min(255,b+8)})`
        : `rgb(${Math.max(0,r-14)},${Math.max(0,g-14)},${Math.max(0,b-8)})`;
      ctx.fillRect(0, i * sw, W, sw);
    }
    // Fine vertical grass blades
    ctx.strokeStyle = `rgba(${r-20},${g-18},${b-10},0.2)`;
    ctx.lineWidth = 0.5;
    for (let px = 1; px < W; px += 3) {
      const y0 = Math.random() * H;
      ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px + (Math.random()-0.5)*2, y0+4); ctx.stroke();
    }
    // Worn centre-line areas (lighter)
    ctx.fillStyle = `rgba(255,255,255,0.06)`;
    ctx.fillRect(W*0.45, 0, W*0.1, H);

  } else {
    // Hard court (AO blue / USO blue): aggregate / acrylic texture
    for (let px = 0; px < W; px += 2) {
      for (let py = 0; py < H; py += 2) {
        const v = (Math.random() - 0.5) * 14;
        ctx.fillStyle = `rgba(${Math.min(255,r+v)},${Math.min(255,g+v*0.5)},${Math.min(255,b+v*0.5)},0.28)`;
        ctx.fillRect(px, py, 2, 2);
      }
    }
    // Faint directional lines (from acrylic application)
    ctx.strokeStyle = `rgba(255,255,255,0.04)`;
    ctx.lineWidth = 0.5;
    for (let py = 0; py < H; py += 18) {
      ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(W,py); ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(theme.short === 'RG' ? 3 : 2, theme.short === 'RG' ? 5 : 4);
  return tex;
}

// ─── Procedural Crowd Texture ───────────────────────────────────────────────
function makeCrowdTexture(colors) {
  const W = 1024, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d0d18';
  ctx.fillRect(0, 0, W, H);

  const ROWS = 20;
  const rowH = H / ROWS;

  // Draw seat row stripes
  for (let r = 0; r < ROWS; r++) {
    const shade = 12 + r * 0.4;
    ctx.fillStyle = `rgb(${shade},${shade},${shade+7})`;
    ctx.fillRect(0, r * rowH, W, rowH);
    ctx.fillStyle = 'rgba(50,50,75,0.45)';
    ctx.fillRect(0, r * rowH, W, rowH * 0.2);
  }

  // Skin tones + hair colors
  const SKINS  = ['#f0d0a0','#e0b880','#c89060','#a06030','#8b4513','#ffdbac','#d4956a'];
  const HAIRS  = ['#1a0800','#3d2208','#7b4b2a','#c8a060','#e8e0d0','#2a1a08','#1c0c00'];

  // People grid: columns = floor(W / colStep)
  const personH = rowH * 0.94;
  const personW = personH * 0.7;
  const colStep = personW * 0.82;
  const cols    = Math.ceil(W / colStep);

  for (let row = 0; row < ROWS; row++) {
    const baseY = row * rowH;
    // Brightness dims toward top (further from court lights)
    const alpha = 0.92 - row * 0.014;

    for (let col = 0; col < cols; col++) {
      // 8% empty seats
      if (Math.random() < 0.08) continue;

      const cx = col * colStep + Math.random() * 3 - 1.5;
      const cy = baseY + rowH * 0.06;

      const shirt   = colors[Math.floor(Math.random() * colors.length)];
      const skin    = SKINS [Math.floor(Math.random() * SKINS.length)];
      const hair    = HAIRS [Math.floor(Math.random() * HAIRS.length)];
      const headW   = personW * 0.40;
      const headH   = personH * 0.22;
      const headCY  = cy + personH * 0.22;
      const bodyTop = cy + personH * 0.36;

      ctx.globalAlpha = alpha;

      // Body (trapezoid: shoulders narrower, hips wider)
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.moveTo(cx - personW * 0.28, bodyTop);
      ctx.lineTo(cx + personW * 0.28, bodyTop);
      ctx.lineTo(cx + personW * 0.44, cy + personH);
      ctx.lineTo(cx - personW * 0.44, cy + personH);
      ctx.closePath();
      ctx.fill();

      // Neck
      ctx.fillStyle = skin;
      ctx.fillRect(cx - personW * 0.09, bodyTop - personH * 0.07, personW * 0.18, personH * 0.09);

      // Head (oval)
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(cx, headCY, headW * 0.92, headH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair (upper arc)
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.ellipse(cx, headCY - headH * 0.15, headW, headH * 0.65, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Raised arm / item for ~9% of people
      if (Math.random() < 0.09) {
        const armSide = Math.random() < 0.5 ? -1 : 1;
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(
          cx + armSide * personW * 0.52,
          bodyTop - personH * 0.25,
          personW * 0.13,
          personH * 0.28,
          Math.PI * 0.15 * armSide,
          0, Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  ctx.globalAlpha = 1;

  // Vignette: slightly darken edges
  const vg = ctx.createLinearGradient(0, 0, 0, H);
  vg.addColorStop(0,   'rgba(0,0,0,0.35)');
  vg.addColorStop(0.5, 'rgba(0,0,0,0.0)');
  vg.addColorStop(1,   'rgba(0,0,0,0.15)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  return new THREE.CanvasTexture(canvas);
}

// ─── Court Class ───────────────────────────────────────────────────────────
export class Court {
  constructor(scene, themeName = 'australian') {
    this.scene    = scene;
    this._theme   = SLAM_THEMES[themeName] || SLAM_THEMES.australian;
    this._objects = [];
    this._lights  = [];
    this._crowdUniforms = null;

    this._buildGround();
    this._buildCourtLines();
    this._buildNet();
    this._buildNetPosts();

    this._buildCourtSurface();
    this._buildStadium();
    this._buildLighting();
    this._applyEnvironment();
  }

  // ── Public API ──────────────────────────────────────────────
  setTheme(name) {
    const t = SLAM_THEMES[name];
    if (!t) return;
    this._theme = t;

    this._objects.forEach(o => {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => { if (m) { if (m.map) m.map.dispose(); m.dispose(); } });
      this.scene.remove(o);
    });
    this._lights.forEach(l => this.scene.remove(l));
    this._objects = [];
    this._lights  = [];
    this._crowdUniforms = null;

    this._buildCourtSurface();
    this._buildStadium();
    this._buildLighting();
    this._applyEnvironment();
  }

  updateCrowd(time) {
    if (this._crowdUniforms) this._crowdUniforms.time.value = time;
  }

  flickerLights(time) {
    if (!this._theme.isNight) return;
    const base = this._theme.lightIntensity;
    this._lights.forEach(l => {
      if (l.isSpotLight) {
        const f = 1 + Math.sin(time * 58 + l.position.x * 3.7) * 0.01
                    + Math.sin(time * 41 + l.position.z * 2.1) * 0.007;
        l.intensity = base * f;
      }
    });
  }

  static getThemes() { return SLAM_THEMES; }

  // ── Private ────────────────────────────────────────────────
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
    const t        = this._theme;
    const courtTex = makeCourtTexture(t);

    const addPlane = (w, d, color, x, y, z, map = null) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({
          color: map ? 0xffffff : color,
          map,
          roughness: 0.88,
        })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, z);
      m.receiveShadow = true;
      this.scene.add(m);
      this._objects.push(m);
    };

    // Surround base (below court, peeking out around edges)
    addPlane(50, 38,   t.surroundColor, 0, 0.001, 0);
    // Main court with procedural surface texture
    addPlane(10, 16,   0xffffff,        0, 0.003, 0, courtTex);
    // Service box overlay (only for venues with distinct service colour)
    if (t.serviceColor !== t.courtColor) {
      addPlane(10, 4, t.serviceColor, 0, 0.005,  2.0);
      addPlane(10, 4, t.serviceColor, 0, 0.005, -2.0);
    }
  }

  _buildCourtLines() {
    const Y   = 0.016;
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const segs = [
      [-5,Y,-8, -5,Y, 8], [ 5,Y,-8,  5,Y, 8],
      [-5,Y,-8,  5,Y,-8], [-5,Y, 8,  5,Y, 8],
      [-5,Y,-4,  5,Y,-4], [-5,Y, 4,  5,Y, 4],
      [ 0,Y, 0,  0,Y, 4], [ 0,Y, 0,  0,Y,-4],
      [-0.3,Y,-8, 0.3,Y,-8], [-0.3,Y,8, 0.3,Y,8],
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

    // Animated shader material for crowd
    this._crowdUniforms = {
      map:  { value: crowdTex },
      time: { value: 0.0 },
    };

    const crowdMat = new THREE.ShaderMaterial({
      uniforms: this._crowdUniforms,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D map;
        uniform float     time;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
        }

        void main() {
          // Tile texture 3× horizontally to fill wide bleacher faces
          vec2 uv = vec2(fract(vUv.x * 3.0), vUv.y);

          // Mexican wave — vertical sway ripple across the crowd
          float wave = sin(vUv.x * 7.0 - time * 2.3) * 0.024;
          uv.y = clamp(uv.y + wave, 0.0, 1.0);

          vec4 col = texture2D(map, uv);

          // Camera flashes: sparse random bright spots
          float fx = floor(vUv.x * 55.0 + time * 0.4);
          float fy = floor(vUv.y * 14.0);
          float h  = hash(vec2(fx, fy));
          float flash = max(0.0, sin(time * 4.8 * h + h * 22.0) - 0.90) * 14.0;
          col.rgb += vec3(flash * 0.55);

          // Lighting gradient: bottom rows brighter (court-side lights)
          float lit = 0.62 + 0.38 * (1.0 - vUv.y);
          col.rgb *= lit;

          gl_FragColor = vec4(col.rgb, 1.0);
        }
      `,
      side: THREE.FrontSide,
    });

    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0d0d18, roughness: 1.0 });

    // faceIdx: 0=+X  1=-X  2=+Y  3=-Y  4=+Z  5=-Z
    const addBlock = (w, h, d, x, y, z, fi) => {
      const geo  = new THREE.BoxGeometry(w, h, d);
      const mats = [0,1,2,3,4,5].map(i => i === fi ? crowdMat : darkMat);
      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this._objects.push(mesh);
    };

    const TIERS = 9, TH = 2.2, TD = 2.0;

    for (let i = 0; i < TIERS; i++) {
      // Far bleachers — crowd on +Z (idx 4)
      addBlock(26 + i * 2.5, TH, TD, 0, i*TH+TH*.5, -(12+i*TD), 4);
      // Left — crowd on +X (idx 0)
      addBlock(TD, TH, 28, -(9+i*TD), i*TH+TH*.5, -2, 0);
      // Right — crowd on -X (idx 1)
      addBlock(TD, TH, 28,  (9+i*TD), i*TH+TH*.5, -2, 1);
    }
    // Near bleachers (behind player) — crowd on -Z (idx 5)
    for (let i = 0; i < 5; i++) {
      addBlock(20+i*2, TH, TD, 0, i*TH+TH*.5, 12+i*TD, 5);
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

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshStandardMaterial({
          color: t.lightColor,
          emissive: t.lightColor,
          emissiveIntensity: 2,
        })
      );
      bulb.position.set(...cfg.pos);
      this.scene.add(bulb);
      this._lights.push(bulb);
    });
  }
}
