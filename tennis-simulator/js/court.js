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
// High-res 4096×1024 canvas — each person is ~40px wide so texture stays sharp.
// maxAnisotropy is passed from the renderer to avoid blurring at oblique angles.
function makeCrowdTexture(colors, maxAnisotropy = 1) {
  const W = 4096, H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0c1a';
  ctx.fillRect(0, 0, W, H);

  const ROWS = 16;   // fewer rows → bigger people → sharper crowd
  const rowH = H / ROWS;
  const SKINS = ['#f5d5a0','#e8c478','#d4a56a','#c08050','#a06030','#8b4513','#ffdbac'];
  const HAIRS = ['#0e0300','#2a1008','#5a2a10','#9a6830','#d0b878','#e8e0d0','#1a0800'];

  // Seat-back color: brighten the theme color so it reads against the dark BG
  const raw = colors[0] || '#223355';
  const rr = Math.min(255, parseInt(raw.slice(1,3)||'22',16) + 40);
  const rg = Math.min(255, parseInt(raw.slice(3,5)||'33',16) + 40);
  const rb = Math.min(255, parseInt(raw.slice(5,7)||'55',16) + 60);
  const seatBase = `#${rr.toString(16).padStart(2,'0')}${rg.toString(16).padStart(2,'0')}${rb.toString(16).padStart(2,'0')}`;

  for (let row = 0; row < ROWS; row++) {
    const baseY    = row * rowH;
    // Row 0 = top of canvas = highest/furthest tier → dimmer
    // Row 15 = bottom = courtside → brighter
    const dimFade  = 0.62 + (row / ROWS) * 0.38;

    // ── Concrete step / floor between rows ─────────────────────
    ctx.fillStyle = '#14162a';
    ctx.fillRect(0, baseY, W, rowH * 0.14);

    // ── Seat backrests (plastic stadium chairs) ─────────────────
    const seatW  = rowH * 0.88;   // width of one seat unit
    const seatH  = rowH * 0.42;   // height of the backrest
    const seatY  = baseY + rowH * 0.54;

    for (let sx = seatW * 0.15; sx < W; sx += seatW) {
      // Most seats: slam theme colour; occasional contrast seat
      const rand = Math.random();
      let sc = seatBase;
      if (rand < 0.14) sc = colors[1] || '#ffffff';
      else if (rand < 0.22) sc = colors[2] || '#bbbbbb';

      // Parse hex → rgb for brightness adjustment
      const cr = Math.min(255, parseInt(sc.slice(1,3)||'22',16));
      const cg = Math.min(255, parseInt(sc.slice(3,5)||'33',16));
      const cb = Math.min(255, parseInt(sc.slice(5,7)||'55',16));
      ctx.fillStyle = `rgba(${Math.round(cr*dimFade)},${Math.round(cg*dimFade)},${Math.round(cb*dimFade)},1)`;

      const sw = seatW * 0.84;
      const sh = seatH;
      const sr = Math.min(sw, sh) * 0.22;   // corner radius
      const sx2 = sx - sw / 2;

      // Rounded rectangle for seat back (manual path for compat)
      ctx.beginPath();
      ctx.moveTo(sx2 + sr, seatY);
      ctx.lineTo(sx2 + sw - sr, seatY);
      ctx.arcTo(sx2+sw, seatY,    sx2+sw, seatY+sh, sr);
      ctx.lineTo(sx2+sw, seatY+sh-sr);
      ctx.arcTo(sx2+sw, seatY+sh, sx2+sw-sr, seatY+sh, sr);
      ctx.lineTo(sx2+sr, seatY+sh);
      ctx.arcTo(sx2, seatY+sh,    sx2, seatY+sh-sr, sr);
      ctx.lineTo(sx2, seatY+sr);
      ctx.arcTo(sx2, seatY,       sx2+sr, seatY, sr);
      ctx.closePath();
      ctx.fill();

      // Highlight edge on top of seat (plastic sheen)
      ctx.strokeStyle = `rgba(255,255,255,${0.12 * dimFade})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Shadow below seat
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(sx2, seatY + sh - 2, sw, 3);
    }

    // ── People — upper 58% of each row ─────────────────────────
    const colStep = seatW;
    const personH = rowH * 0.52;
    const personW = colStep * 0.72;

    for (let px = colStep * 0.15; px < W; px += colStep) {
      if (Math.random() < 0.07) continue; // empty seat

      const jitter  = (Math.random() - 0.5) * colStep * 0.22;
      const cx      = px + jitter;
      const personY = baseY + rowH * 0.04;

      const shirt  = colors[Math.floor(Math.random() * colors.length)];
      const skin   = SKINS[Math.floor(Math.random() * SKINS.length)];
      const hair   = HAIRS[Math.floor(Math.random() * HAIRS.length)];

      const headR   = personH * 0.18;
      const headCY  = personY + headR * 1.1;
      const bodyTop = personY + headR * 2.4;
      const bw      = personW * 0.48;

      ctx.globalAlpha = dimFade * 0.96;

      // Torso
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.moveTo(cx - bw * 0.65, bodyTop);
      ctx.lineTo(cx + bw * 0.65, bodyTop);
      ctx.lineTo(cx + bw * 0.85, personY + personH * 0.56);
      ctx.lineTo(cx - bw * 0.85, personY + personH * 0.56);
      ctx.closePath();
      ctx.fill();

      // Neck
      ctx.fillStyle = skin;
      ctx.fillRect(cx - bw * 0.14, bodyTop - personH * 0.08, bw * 0.28, personH * 0.1);

      // Head (oval)
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(cx, headCY, headR * 0.82, headR, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair (arc over top half of head)
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.ellipse(cx, headCY - headR * 0.1, headR * 0.88, headR * 0.68, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // 10%: raised arm (phone / wave)
      if (Math.random() < 0.10) {
        const side = Math.random() < 0.5 ? -1 : 1;
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(
          cx + side * bw * 0.9,
          bodyTop - personH * 0.22,
          bw * 0.14, personH * 0.30,
          Math.PI * 0.12 * side, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  ctx.globalAlpha = 1;

  // Depth vignette — top rows fade slightly to black
  const vg = ctx.createLinearGradient(0, 0, 0, H);
  vg.addColorStop(0,    'rgba(0,0,0,0.55)');
  vg.addColorStop(0.25, 'rgba(0,0,0,0.08)');
  vg.addColorStop(1,    'rgba(0,0,0,0.0)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  tex.minFilter  = THREE.LinearMipmapLinearFilter;
  tex.magFilter  = THREE.LinearFilter;
  return tex;
}

// ─── Court Class ───────────────────────────────────────────────────────────
export class Court {
  constructor(scene, themeName = 'australian', renderer = null) {
    this.scene    = scene;
    this._renderer = renderer;
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
    const t           = this._theme;
    const maxAniso    = this._renderer?.capabilities?.getMaxAnisotropy() ?? 1;
    const crowdTex    = makeCrowdTexture(t.crowdColors, maxAniso);

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
          // Use full UV — no tiling, 4096px texture fills each bleacher face
          vec2 uv = vUv;

          // Subtle Mexican wave: small vertical ripple that travels across crowd
          float wave = sin(vUv.x * 9.0 - time * 2.1) * 0.012;
          uv.y = clamp(uv.y + wave, 0.001, 0.999);

          vec4 col = texture2D(map, uv);

          // Sparse camera flashes (bright white blobs)
          float fx = floor(vUv.x * 80.0 + time * 0.3);
          float fy = floor(vUv.y * 18.0);
          float h  = hash(vec2(fx, fy));
          float flash = max(0.0, sin(time * 5.2 * h + h * 18.0) - 0.91) * 12.0;
          col.rgb += vec3(flash * 0.5);

          // Lighting gradient: court-side rows brighter, upper rows dimmer
          float lit = 0.72 + 0.28 * (1.0 - vUv.y);
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
