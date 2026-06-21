import * as THREE from 'three';

export class Court {
  constructor(scene) {
    this.scene = scene;
    this._buildEnvironment();
    this._buildGround();
    this._buildCourtSurface();
    this._buildCourtLines();
    this._buildNet();
    this._buildNetPosts();
    this._buildLighting();
  }

  _buildEnvironment() {
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.025);
    this.scene.background = new THREE.Color(0x0a0a1a);
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(30, 30);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9, metalness: 0.0 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  _buildCourtSurface() {
    const geo = new THREE.PlaneGeometry(10, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a7ab5, roughness: 0.8, metalness: 0.0 });
    const surface = new THREE.Mesh(geo, mat);
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.001;
    surface.receiveShadow = true;
    this.scene.add(surface);
  }

  _buildCourtLines() {
    const Y = 0.02;
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });

    const segments = [
      // Sidelines
      [-5, Y, -8,  -5, Y,  8],
      [ 5, Y, -8,   5, Y,  8],
      // Baselines
      [-5, Y, -8,   5, Y, -8],
      [-5, Y,  8,   5, Y,  8],
      // Service lines
      [-5, Y, -4,   5, Y, -4],
      [-5, Y,  4,   5, Y,  4],
      // Center line (near side: 0→+4, far side: 0→-4)
      [ 0, Y,  0,   0, Y,  4],
      [ 0, Y,  0,   0, Y, -4],
      // Center marks at baselines (short tick)
      [-0.3, Y, -8,  0.3, Y, -8],
      [-0.3, Y,  8,  0.3, Y,  8],
    ];

    const positions = [];
    for (const seg of segments) {
      positions.push(seg[0], seg[1], seg[2]);
      positions.push(seg[3], seg[4], seg[5]);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const lines = new THREE.LineSegments(geo, lineMat);
    this.scene.add(lines);
  }

  _buildNet() {
    const geo = new THREE.BoxGeometry(10.5, 0.92, 0.04);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      roughness: 0.6,
    });
    const net = new THREE.Mesh(geo, mat);
    net.position.set(0, 0.46, 0);
    net.castShadow = true;
    this.scene.add(net);

    // Net top cable
    const cableGeo = new THREE.CylinderGeometry(0.02, 0.02, 10.5, 8);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, 0.92, 0);
    this.scene.add(cable);
  }

  _buildNetPosts() {
    const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.06, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });

    [-5.3, 5.3].forEach(x => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0.53, 0);
      post.castShadow = true;
      this.scene.add(post);
    });
  }

  _buildLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x334466, 0.6);
    this.scene.add(ambient);

    // Stadium spotlights: 3 lights from above/sides pointing at court
    const lightConfigs = [
      { pos: [-12, 14, -6], target: [0, 0, -3], intensity: 120 },
      { pos: [ 12, 14,  0], target: [0, 0,  0], intensity: 120 },
      { pos: [ -8, 14,  7], target: [0, 0,  4], intensity: 100 },
    ];

    lightConfigs.forEach(cfg => {
      const light = new THREE.SpotLight(0xfff5e0, cfg.intensity);
      light.position.set(...cfg.pos);
      light.castShadow = true;
      light.angle = Math.PI / 6;
      light.penumbra = 0.3;
      light.decay = 2;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;

      const targetObj = new THREE.Object3D();
      targetObj.position.set(...cfg.target);
      this.scene.add(targetObj);
      light.target = targetObj;

      this.scene.add(light);

      // Visible light fixture sphere
      const bulbGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff5e0, emissive: 0xfff5e0, emissiveIntensity: 1 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(...cfg.pos);
      this.scene.add(bulb);
    });
  }
}
