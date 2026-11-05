import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CrowdManager, CUSHION_SPOTS } from './CrowdManager.js';

// Free-orbiting 360° player-following camera (starts at cozy elevated oblique angle, freely rotates & zooms around player)
const FOLLOW_CAMERA_FOV = 38;
const FOLLOW_CAMERA_DEFAULT_FOCUS = new THREE.Vector3(-0.78, 0.85, 1.06);
const INITIAL_ORBIT_OFFSET = new THREE.Vector3(1.75, 4.85, 5.15);
const FOLLOW_CAMERA_DAMPING = 7.5;
const CUTAWAY_ROOF_NAMES = /^(Cone\.?007|Cube\.?15[2-7]|Cylinder\.?0(2[4-9]|3[0-9]|4[01])|Sphere\.?14[4-9])$/;

export class DobbySanctuaryWorld {
  constructor({ canvas, labelsLayer, playerProfile, onStationActivate, onDobbyBow, onMoktakStrike, onAIMoktak, onBreezeToast }) {
    this.canvas = canvas;
    this.labelsLayer = labelsLayer;
    this.playerProfile = playerProfile;
    this.onStationActivate = onStationActivate;
    this.onDobbyBow = onDobbyBow;
    this.onMoktakStrike = onMoktakStrike;
    this.onAIMoktak = onAIMoktak;
    this.onBreezeToast = onBreezeToast;

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(FOLLOW_CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 80);
    this.cameraFocus = FOLLOW_CAMERA_DEFAULT_FOCUS.clone();
    this.desiredCameraFocus = FOLLOW_CAMERA_DEFAULT_FOCUS.clone();
    this.tempFocusDelta = new THREE.Vector3();
    this.tempOrbitVec = new THREE.Vector3();
    this.reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') || { matches: false };

    this.camera.position.copy(this.cameraFocus).add(INITIAL_ORBIT_OFFSET);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.copy(this.cameraFocus);
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.enableDamping = !this.reducedMotionQuery.matches;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = 0.85;
    this.controls.zoomSpeed = 0.9;
    this.controls.minDistance = 1.85;
    this.controls.maxDistance = 11.5;
    this.controls.minPolarAngle = 0.14;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.update();

    this.cameraYaw = Math.atan2(
      this.camera.position.x - this.controls.target.x,
      this.camera.position.z - this.controls.target.z,
    );

    this.raycaster = new THREE.Raycaster();
    this.pointerDownPos = new THREE.Vector2();
    this.isDraggingOrbit = false;
    this.keys = new Set();

    this.dobbyGroup = null;
    this.dobbyAnimatedFlames = [];
    this.dobbySparkles = [];
    this.cushionMeshes = [];
    this.roofCutawayMeshes = [];
    this.isRoofCutaway = true;
    this.floorTarget = null;

    this.floatingBlessings = [];
    this.blessingSeq = 0;
    this.actorTagEls = new Map();
    this.stationTagEls = new Map();
    this.blessingTagEls = new Map();

    this.moktakRipples = [];
    this.shrineMoktakGroup = null;
    this.shrineMoktakStrikeAt = -9999;
    this.dobbyPortraitDataUrl = '';
    this.crowd = null;
    this.canvas.style.cursor = 'grab';

    this.setupAtmosphereAndLighting();
    this.buildShrineMoktak();
    this.bindEvents();
    this.handleResize();
  }

  computeDesiredCameraFocus(outVec) {
    const self = this.crowd?.getSelf();
    if (!self) {
      return outVec.copy(FOLLOW_CAMERA_DEFAULT_FOCUS);
    }
    const p = self.obj.position;
    const steadyY = self.seatedIdx >= 0 ? 0.25 : 0.04;
    return outVec.set(p.x, steadyY + 0.60, p.z);
  }

  snapCameraToPlayer(resetAngle = false) {
    this.computeDesiredCameraFocus(this.desiredCameraFocus);
    const dx = this.desiredCameraFocus.x - this.cameraFocus.x;
    const dy = this.desiredCameraFocus.y - this.cameraFocus.y;
    const dz = this.desiredCameraFocus.z - this.cameraFocus.z;
    this.cameraFocus.copy(this.desiredCameraFocus);

    if (resetAngle) {
      const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      const distScale = aspect < 1.35 ? Math.min(1.38, 1.35 / Math.max(aspect, 0.65)) : 1.0;
      this.controls.target.copy(this.cameraFocus);
      this.camera.position.copy(this.cameraFocus).addScaledVector(INITIAL_ORBIT_OFFSET, distScale);
    } else {
      this.tempFocusDelta.set(dx, dy, dz);
      this.controls.target.add(this.tempFocusDelta);
      this.camera.position.add(this.tempFocusDelta);
    }
    this.controls.update();
    this.updateRoofCutaway();
  }

  updateRoofCutaway() {
    if (this.roofCutawayMeshes.length === 0) return;
    if (this.camera.position.y > 3.30 && !this.isRoofCutaway) {
      this.isRoofCutaway = true;
      for (const m of this.roofCutawayMeshes) m.visible = false;
    } else if (this.camera.position.y < 3.05 && this.isRoofCutaway) {
      this.isRoofCutaway = false;
      for (const m of this.roofCutawayMeshes) m.visible = true;
    }
  }

  buildShrineMoktak() {
    const g = new THREE.Group();
    g.position.set(0, 0.01, -0.08);
    g.rotation.y = -0.18;

    // Crimson & gold brocade cushion
    const cushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.31, 0.075, 24),
      new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.68 }),
    );
    cushion.position.y = 0.038;
    cushion.castShadow = true;
    cushion.receiveShadow = true;

    const goldTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.282, 0.016, 12, 32),
      new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.32, metalness: 0.45 }),
    );
    goldTrim.rotation.x = Math.PI / 2;
    goldTrim.position.y = 0.072;

    // Carved dark mahogany Wooden Fish ("Mõ Hắc Mộc")
    const fishPivot = new THREE.Group();
    fishPivot.position.set(0, 0.21, 0);

    const fishBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.195, 28, 22),
      new THREE.MeshStandardMaterial({
        color: '#5c2810',
        roughness: 0.3,
        metalness: 0.08,
      }),
    );
    fishBody.scale.set(1.24, 0.86, 1.06);
    fishBody.castShadow = true;
    fishBody.receiveShadow = true;

    // Acoustic resonant mouth slit + hollow cheek dimples
    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.034, 0.12),
      new THREE.MeshStandardMaterial({ color: '#140703', roughness: 0.92 }),
    );
    slit.position.set(0, -0.02, 0.16);

    const cheekMat = new THREE.MeshStandardMaterial({ color: '#140703', roughness: 0.9 });
    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), cheekMat);
    cheekL.position.set(-0.165, -0.018, 0.145);
    const cheekR = cheekL.clone();
    cheekR.position.x = 0.165;

    // Inlaid glowing emerald-gold mystic crest on top of the Mõ
    const crestRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.072, 0.012, 10, 24),
      new THREE.MeshStandardMaterial({ color: '#fcd34d', roughness: 0.28, metalness: 0.5 }),
    );
    crestRing.rotation.x = Math.PI / 2;
    crestRing.position.set(0, 0.158, 0.01);

    const crestGem = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 16, 12),
      new THREE.MeshStandardMaterial({
        color: '#34d399',
        emissive: '#10b981',
        emissiveIntensity: 1.35,
        roughness: 0.18,
      }),
    );
    crestGem.scale.set(1.2, 0.42, 1.0);
    crestGem.position.set(0, 0.156, 0.01);

    // Carved handle tail loop on left/back
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.028, 12, 20),
      new THREE.MeshStandardMaterial({ color: '#471e0b', roughness: 0.35 }),
    );
    handle.position.set(-0.21, 0.01, -0.02);
    handle.castShadow = true;

    fishPivot.add(fishBody, slit, cheekL, cheekR, crestRing, crestGem, handle);

    // Animated 3D Wooden Mallet ("Dùi Gõ Mõ") poised to strike directly onto the crest!
    const malletPivot = new THREE.Group();
    malletPivot.position.set(0.38, 0.23, 0.04);

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.024, 0.42, 12),
      new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.42 }),
    );
    stick.rotation.z = Math.PI * 0.37;
    stick.position.set(-0.16, 0.09, 0);
    stick.castShadow = true;

    const striker = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 18, 14),
      new THREE.MeshStandardMaterial({
        color: '#fde047',
        emissive: '#f59e0b',
        emissiveIntensity: 0.35,
        roughness: 0.28,
      }),
    );
    striker.scale.set(1.18, 0.95, 0.95);
    striker.position.set(-0.34, 0.165, 0);
    striker.castShadow = true;

    malletPivot.add(stick, striker);
    malletPivot.rotation.z = -0.22;

    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.shrineMoktakHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.58, 0.72), hitMat);
    this.shrineMoktakHitbox.position.set(0.05, 0.26, 0);

    this.moktakFlashLight = new THREE.PointLight('#34D399', 0, 2.6, 1.8);
    this.moktakFlashLight.position.set(0, 0.46, 0.05);

    g.add(cushion, goldTrim, fishPivot, malletPivot, this.shrineMoktakHitbox, this.moktakFlashLight);
    this.shrineMoktakGroup = g;
    this.shrineMoktakFish = fishPivot;
    this.shrineMoktakGem = crestGem;
    this.shrineMalletPivot = malletPivot;
    this.scene.add(g);
  }

  spawnMoktakRipple(worldPos, color = '#34D399') {
    const geo = new THREE.RingGeometry(0.18, 0.27, 40);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(worldPos.x, 0.032, worldPos.z);
    this.scene.add(mesh);
    this.moktakRipples.push({
      mesh,
      born: performance.now(),
      duration: 820,
    });
  }

  triggerMoktakStrike(actorId = 'self', popText = '') {
    const now = performance.now();
    this.shrineMoktakStrikeAt = now;
    const shrineWorld = new THREE.Vector3(0, 0.03, -0.08);
    this.spawnMoktakRipple(shrineWorld, '#34D399');
    this.spawnMoktakRipple(shrineWorld, '#FDE047');

    const actorPos = this.crowd?.triggerMoktak(actorId);
    if (actorPos) {
      this.spawnMoktakRipple(actorPos, '#6EE7B7');
    }
    if (popText) {
      const anchor = actorId === 'self'
        ? new THREE.Vector3(0, 0.52, -0.08)
        : (actorPos || shrineWorld).clone().add(new THREE.Vector3(0, 1.18, 0));
      this.addFloatingBlessing(anchor, popText);
    }
  }

  setupAtmosphereAndLighting() {
    // Cheerful morning garden sky backdrop contrasting with the Dark Chibi Dobby Statue!
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 32;
    skyCanvas.height = 256;
    const sctx = skyCanvas.getContext('2d');
    const grad = sctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#8ED8F8');
    grad.addColorStop(0.45, '#C8F0FA');
    grad.addColorStop(0.78, '#FEF9DC');
    grad.addColorStop(1.0, '#D9F4B8');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 32, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = skyTex;
    this.scene.fog = new THREE.FogExp2('#FEF7E2', 0.015);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.38;

    const hemi = new THREE.HemisphereLight('#FFFDF4', '#E5B887', 0.92);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#FFF3D1', 2.05);
    sun.position.set(-5.2, 7.2, 3.9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 25;
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    const warmLanternGlow = new THREE.PointLight('#FFE4A0', 1.25, 12, 1.5);
    warmLanternGlow.position.set(0, 3.15, 0.25);
    this.scene.add(warmLanternGlow);

    // Subtle mystic emerald & amethyst aura lights right around Dark Chibi Dobby's Obsidian Altar & Cursed Sock
    this.altarEmeraldLight = new THREE.PointLight('#10B981', 1.15, 3.2, 1.8);
    this.altarEmeraldLight.position.set(0, 0.42, -0.55);
    this.scene.add(this.altarEmeraldLight);

    this.sockAmethystLight = new THREE.PointLight('#A855F7', 0.95, 2.6, 1.8);
    this.sockAmethystLight.position.set(0.62, 1.28, -0.92);
    this.scene.add(this.sockAmethystLight);

    // Volumetric morning sunbeams streaming through the arched pavilion windows
    const beamCanvas = document.createElement('canvas');
    beamCanvas.width = 128;
    beamCanvas.height = 256;
    const bctx = beamCanvas.getContext('2d');
    const imgData = bctx.createImageData(128, 256);
    for (let y = 0; y < 256; y++) {
      const vy = y / 255;
      const fadeY = Math.sin(vy * Math.PI) * (1.0 - 0.35 * vy);
      for (let x = 0; x < 128; x++) {
        const vx = (x / 127) * 2 - 1;
        const fadeX = Math.pow(Math.max(0, 1 - vx * vx), 2.2);
        const idx = (y * 128 + x) * 4;
        imgData.data[idx] = 255;
        imgData.data[idx + 1] = 247;
        imgData.data[idx + 2] = 205;
        imgData.data[idx + 3] = Math.round(255 * fadeX * fadeY);
      }
    }
    bctx.putImageData(imgData, 0, 0);
    const beamTex = new THREE.CanvasTexture(beamCanvas);
    beamTex.colorSpace = THREE.SRGBColorSpace;
    const beamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.sunbeamMeshes = [];
    for (const [bx, by, bz, rz, ry] of [
      [-2.65, 2.35, -1.55, -0.46, 0.25],
      [-2.25, 2.25,  0.35, -0.44, -0.18],
      [ 2.55, 2.35, -1.65, -0.38, -0.25],
    ]) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 5.2), beamMat);
      plane.position.set(bx, by, bz);
      plane.rotation.set(0.12, ry, rz);
      this.scene.add(plane);
      this.sunbeamMeshes.push(plane);
    }

    // Floating round golden sun-dust motes
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 64;
    dotCanvas.height = 64;
    const dctx = dotCanvas.getContext('2d');
    const dgrad = dctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    dgrad.addColorStop(0.0, 'rgba(255, 255, 240, 1.0)');
    dgrad.addColorStop(0.35, 'rgba(255, 238, 165, 0.85)');
    dgrad.addColorStop(0.75, 'rgba(255, 220, 120, 0.22)');
    dgrad.addColorStop(1.0, 'rgba(255, 220, 120, 0.0)');
    dctx.fillStyle = dgrad;
    dctx.fillRect(0, 0, 64, 64);
    const dotTex = new THREE.CanvasTexture(dotCanvas);
    dotTex.colorSpace = THREE.SRGBColorSpace;

    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 72;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 7.4;
      dustPos[i * 3 + 1] = 0.35 + Math.random() * 3.3;
      dustPos[i * 3 + 2] = -3.0 + Math.random() * 5.8;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        map: dotTex,
        color: '#FFF6CC',
        size: 0.13,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.dustPoints);

    // Invisible floor raycast plane + station hitboxes for intuitive 3D clicking
    this.floorTarget = new THREE.Mesh(
      new THREE.CircleGeometry(5.2, 56),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.floorTarget.rotation.x = -Math.PI / 2;
    this.floorTarget.position.set(0, 0.01, 0);
    this.scene.add(this.floorTarget);

    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.fortuneStationHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), hitMat);
    this.fortuneStationHitbox.position.set(3.0, 0.75, 0.42);
    this.fortuneStationHitbox.userData.station = 'fortune';
    this.scene.add(this.fortuneStationHitbox);
  }

  async init() {
    const loader = new GLTFLoader();
    const loadGlb = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

    const [hallGltf, dobbyGltf, macGltf, wizardGltf] = await Promise.all([
      loadGlb('/models/sanctuary_hall.glb'),
      loadGlb('/models/dobby_statue.glb'),
      loadGlb('/models/macaron_cushion.glb'),
      loadGlb('/models/wizard_pilgrim.glb'),
    ]);

    // 1. Sunny Honey-Oak Pavilion & Garden (Dynamic roof cutaway: open from above, cozy ceiling from eye-level)
    const hall = hallGltf.scene;
    const wishRack = hall.getObjectByName('SockWishRack');
    if (wishRack) {
      wishRack.removeFromParent();
    }
    hall.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
      if (CUTAWAY_ROOF_NAMES.test(o.name)) {
        o.visible = false;
        this.roofCutawayMeshes.push(o);
      }
    });
    this.hallGroup = hall;
    this.scene.add(hall);

    // 2. Centerpiece Stage-7 Collectible Dark Chibi Dobby Statue (0.976m metric -> 2.26x = 2.21m heroic shrine!)
    const dobby = dobbyGltf.scene;
    dobby.scale.setScalar(2.26);
    dobby.position.set(0, 0, -1.15);

    dobby.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      const mName = m?.name || '';
      const isFlame = o.name.includes('Ghost_Flame') || o.name.includes('CandleFlame') || mName.includes('Ghost_Flame');
      const isSparkle = o.name.includes('Sparkle') || mName.includes('Sparkle');

      if (isFlame) {
        o.castShadow = false;
        o.receiveShadow = false;
        if (m) {
          m.transparent = true;
          m.opacity = 0.86;
          m.depthWrite = false;
          m.side = THREE.DoubleSide;
          m.color?.set('#1a0b2e');
          m.roughness = 0.95;
          m.emissiveIntensity = 0.92;
        }
        this.dobbyAnimatedFlames.push({
          mesh: o,
          baseY: o.position.y,
          baseScaleY: o.scale.y,
          phase: Math.random() * Math.PI * 2,
        });
      } else if (isSparkle) {
        o.castShadow = false;
        if (m) {
          m.emissive = new THREE.Color('#6EE7B7');
          m.emissiveIntensity = 1.35;
        }
        this.dobbySparkles.push({
          mesh: o,
          baseY: o.position.y,
          phase: Math.random() * Math.PI * 2,
        });
      } else {
        o.castShadow = true;
        o.receiveShadow = true;
        if (m) {
          // Ensure VertexColors (SkinCol / SkullCol) stay active & crisp under bright pavilion daylight
          if (o.geometry.attributes.color) {
            m.vertexColors = true;
          }
          // Tame KHR_materials_sheen white blow-out under bright morning sunlight so dark charcoal cloth stays rich
          if ('sheen' in m && m.sheen > 0) {
            m.sheen = 0.16;
            m.sheenColor?.set('#2b213a');
          }
          if (mName.includes('Cloth_Plain') || mName.includes('Shroud_Runes')) {
            m.normalScale?.set(0.22, 0.22);
            m.roughness = 0.92;
          }
          if (mName.includes('Shroud_Runes')) {
            m.emissiveIntensity = 1.75;
          } else if (mName.includes('Altar_Drum') || mName.includes('Altar_Top')) {
            m.emissiveIntensity = 2.05;
          } else if (mName.includes('Emerald_Eye')) {
            m.emissiveIntensity = 0.68;
            m.roughness = 0.05;
          }
        }
      }
      o.userData.isDobbyStatue = true;
    });

    this.dobbyGroup = dobby;
    this.scene.add(dobby);

    // 3. Spawn 10 Pastel French Macaron Cushions around the Dark Obsidian Altar
    CUSHION_SPOTS.forEach((spot, idx) => {
      const mac = macGltf.scene.clone(true);
      mac.position.set(spot.x, 0, spot.z);
      mac.traverse((o) => {
        if (o.isMesh && o.material) {
          o.material = o.material.clone();
          if (o.material.name.includes('MacMint')) {
            o.material.color.set(spot.col);
          }
          o.castShadow = true;
          o.receiveShadow = true;
          o.userData.cushionIdx = idx;
          this.cushionMeshes.push(o);
        }
      });
      this.scene.add(mac);
    });

    // 4. Spawn Player + Cozy Wizard Crowd
    this.crowd = new CrowdManager({
      scene: this.scene,
      wizardTemplate: wizardGltf.scene,
      playerProfile: this.playerProfile,
      onBreezeToast: this.onBreezeToast,
      onAIMoktak: (name, pos) => {
        if (pos) this.spawnMoktakRipple(pos, '#A7F3D0');
        this.onAIMoktak?.(name, pos);
      },
    });
    this.snapCameraToPlayer(true);

    // 5. Capture live 3D closeup portrait of the Dark Chibi Dobby Statue for Collectible Fortune Cards
    this.captureDobbyPortrait();

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  captureDobbyPortrait() {
    const savedPos = this.camera.position.clone();
    const savedTarget = this.controls.target.clone();
    const savedFov = this.camera.fov;
    const savedBg = this.scene.background;
    const savedFog = this.scene.fog;

    // Studio dark-velvet radial gradient backdrop so Dobby's emerald eyes, charcoal shroud & cursed sock pop on the Fortune Card!
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 256;
    bgCanvas.height = 256;
    const bctx = bgCanvas.getContext('2d');
    const rgrad = bctx.createRadialGradient(128, 118, 18, 128, 128, 175);
    rgrad.addColorStop(0.0, '#2b1d42');
    rgrad.addColorStop(0.55, '#191329');
    rgrad.addColorStop(1.0, '#0d0b16');
    bctx.fillStyle = rgrad;
    bctx.fillRect(0, 0, 256, 256);
    const portraitBgTex = new THREE.CanvasTexture(bgCanvas);
    portraitBgTex.colorSpace = THREE.SRGBColorSpace;

    this.scene.background = portraitBgTex;
    this.scene.fog = null;
    if (this.hallGroup) this.hallGroup.visible = false;
    if (this.shrineMoktakGroup) this.shrineMoktakGroup.visible = false;
    for (const sb of this.sunbeamMeshes) sb.visible = false;
    for (const c of this.cushionMeshes) c.visible = false;
    if (this.crowd) {
      for (const a of this.crowd.actors.values()) a.obj.visible = false;
    }
    this.dustPoints.visible = false;

    this.renderer.setSize(680, 420, false);
    this.camera.fov = 42;
    this.camera.aspect = 680 / 420;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(-0.06, 1.62, 1.56);
    this.camera.lookAt(0.05, 1.45, -1.15);
    this.renderer.render(this.scene, this.camera);
    this.dobbyPortraitDataUrl = this.canvas.toDataURL('image/png');
    portraitBgTex.dispose();

    // Restore scene & free-orbit player-follow camera
    this.scene.background = savedBg;
    this.scene.fog = savedFog;
    if (this.hallGroup) this.hallGroup.visible = true;
    if (this.shrineMoktakGroup) this.shrineMoktakGroup.visible = true;
    for (const sb of this.sunbeamMeshes) sb.visible = true;
    for (const c of this.cushionMeshes) c.visible = true;
    if (this.crowd) {
      for (const a of this.crowd.actors.values()) a.obj.visible = true;
    }
    this.dustPoints.visible = true;
    this.camera.fov = savedFov;
    this.camera.position.copy(savedPos);
    this.controls.target.copy(savedTarget);
    this.handleResize();
    this.controls.update();
    this.updateRoofCutaway();
  }

  focusCamera() {
    this.snapCameraToPlayer(false);
  }

  addFloatingBlessing(worldPos, text) {
    this.floatingBlessings.push({
      id: ++this.blessingSeq,
      pos: worldPos.clone(),
      text,
      until: performance.now() + 2600,
      born: performance.now(),
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('blur', () => this.keys.clear());

    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const openModal = document.querySelector('dialog[open]');
      if (openModal) {
        this.keys.clear();
        if (openModal.id === 'moktak-popover' && e.code === 'KeyM') {
          e.preventDefault();
          this.onMoktakStrike?.();
        }
        return;
      }
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.code,
        )
      ) {
        this.keys.add(e.code);
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.onDobbyBow?.();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        this.onMoktakStrike?.();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.set(e.clientX, e.clientY);
      this.isDraggingOrbit = false;
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (
        (e.buttons & 1) !== 0 &&
        Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y) > 6
      ) {
        this.isDraggingOrbit = true;
        this.canvas.style.cursor = 'grabbing';
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.raycaster.setFromCamera(ndc, this.camera);
      const interactiveTargets = [
        this.fortuneStationHitbox,
        ...(this.shrineMoktakGroup ? [this.shrineMoktakGroup] : []),
        ...(this.dobbyGroup ? [this.dobbyGroup] : []),
        ...this.cushionMeshes,
      ];
      const hit = this.raycaster.intersectObjects(interactiveTargets, true).length > 0;
      this.canvas.style.cursor = hit ? 'pointer' : 'grab';
    });

    this.canvas.addEventListener('pointerup', (e) => {
      const wasDragging =
        this.isDraggingOrbit ||
        Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y) > 7;
      this.isDraggingOrbit = false;
      this.canvas.style.cursor = 'grab';
      if (wasDragging) {
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.raycaster.setFromCamera(ndc, this.camera);

      // 1. Check 3D Fortune Card station
      const stHits = this.raycaster.intersectObject(this.fortuneStationHitbox, false);
      if (stHits.length > 0) {
        this.onStationActivate?.(stHits[0].object.userData.station);
        return;
      }

      // 1b. Check 3D Shrine Wooden Fish ("Gõ Mõ") direct strike!
      if (this.shrineMoktakGroup) {
        const mokHits = this.raycaster.intersectObject(this.shrineMoktakGroup, true);
        if (mokHits.length > 0) {
          this.onMoktakStrike?.();
          return;
        }
      }

      // 2. Check Dark Chibi Dobby Statue click -> respectful bow!
      if (this.dobbyGroup) {
        const dobbyHits = this.raycaster.intersectObject(this.dobbyGroup, true);
        if (dobbyHits.length > 0) {
          this.onDobbyBow?.();
          return;
        }
      }

      // 3. Check Macaron Cushions -> walk over & sit!
      const macHits = this.raycaster.intersectObjects(this.cushionMeshes, false);
      if (macHits.length > 0) {
        const idx = macHits[0].object.userData.cushionIdx;
        const sp = CUSHION_SPOTS[idx];
        this.crowd?.walkSelfTo(sp.x, sp.z, idx);
        return;
      }

      // 4. Check floor click -> walk!
      const floorHits = this.raycaster.intersectObject(this.floorTarget, false);
      if (floorHits.length > 0) {
        const pt = floorHits[0].point;
        this.crowd?.walkSelfTo(pt.x, pt.z, -1);
      }
    });
  }

  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
  }

  projectToScreen(vec3) {
    const p = vec3.clone().project(this.camera);
    if (p.z < -1 || p.z > 1) return null;
    return {
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  renderWorldLabels(now) {
    if (!this.labelsLayer || !this.crowd) return;

    const liveActorIds = new Set();
    for (const actor of this.crowd.actors.values()) {
      liveActorIds.add(actor.id);
      let pill = this.actorTagEls.get(actor.id);
      if (!pill) {
        pill = document.createElement('div');
        pill.className = 'name-tag' + (actor.isSelf ? ' is-self' : '');
        this.labelsLayer.appendChild(pill);
        this.actorTagEls.set(actor.id, pill);
      }
      const headTop = actor.obj.position.clone().add(new THREE.Vector3(0, 0.98, 0));
      const sc = this.projectToScreen(headTop);
      if (!sc) {
        pill.hidden = true;
        continue;
      }
      pill.hidden = false;
      const labelText = actor.isSelf ? `${actor.name} (Bạn)` : actor.name;
      if (pill.textContent !== labelText) pill.textContent = labelText;
      pill.style.setProperty('--tx', `${sc.x.toFixed(1)}px`);
      pill.style.setProperty('--ty', `${sc.y.toFixed(1)}px`);
    }
    for (const [id, el] of this.actorTagEls) {
      if (!liveActorIds.has(id)) {
        el.remove();
        this.actorTagEls.delete(id);
      }
    }

    const stations = [
      { id: 'fortune', pos: new THREE.Vector3(3.02, 1.48, 0.45), text: '🔮 Xin Quẻ' },
    ];
    for (const st of stations) {
      let btn = this.stationTagEls.get(st.id);
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'station-tag';
        btn.textContent = st.text;
        btn.addEventListener('click', () => this.onStationActivate?.(st.id));
        this.labelsLayer.appendChild(btn);
        this.stationTagEls.set(st.id, btn);
      }
      const sc = this.projectToScreen(st.pos);
      if (!sc || sc.x < -80 || sc.x > window.innerWidth + 80 || sc.y < -40 || sc.y > window.innerHeight + 40) {
        btn.hidden = true;
        continue;
      }
      btn.hidden = false;
      btn.style.setProperty('--tx', `${sc.x.toFixed(1)}px`);
      btn.style.setProperty('--ty', `${sc.y.toFixed(1)}px`);
    }

    this.floatingBlessings = this.floatingBlessings.filter((b) => now < b.until);
    const liveBlessingIds = new Set();
    for (const b of this.floatingBlessings) {
      liveBlessingIds.add(b.id);
      let tag = this.blessingTagEls.get(b.id);
      if (!tag) {
        tag = document.createElement('div');
        tag.className = 'floating-blessing';
        tag.textContent = b.text;
        this.labelsLayer.appendChild(tag);
        this.blessingTagEls.set(b.id, tag);
      }
      const progress = (now - b.born) / 2600;
      const lifted = b.pos.clone().add(new THREE.Vector3(0, progress * 0.42, 0));
      const sc = this.projectToScreen(lifted);
      if (!sc) {
        tag.hidden = true;
        continue;
      }
      tag.hidden = false;
      tag.style.setProperty('--tx', `${sc.x.toFixed(1)}px`);
      tag.style.setProperty('--ty', `${sc.y.toFixed(1)}px`);
      tag.style.setProperty('--alpha', (1 - Math.pow(progress, 2)).toFixed(2));
    }
    for (const [id, el] of this.blessingTagEls) {
      if (!liveBlessingIds.has(id)) {
        el.remove();
        this.blessingTagEls.delete(id);
      }
    }
  }

  animate(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Animate Dark Chibi Dobby's cursed ghost flames, candle flames & sparkles!
    for (const f of this.dobbyAnimatedFlames) {
      const wave = Math.sin(now * 0.0042 + f.phase);
      f.mesh.scale.y = f.baseScaleY * (1.0 + 0.075 * wave);
      f.mesh.rotation.z = 0.045 * Math.cos(now * 0.0034 + f.phase);
    }
    for (const sp of this.dobbySparkles) {
      sp.mesh.position.y = sp.baseY + Math.sin(now * 0.0038 + sp.phase) * 0.008;
      sp.mesh.rotation.y = Math.sin(now * 0.0025 + sp.phase) * 0.35;
    }
    this.altarEmeraldLight.intensity = 1.05 + 0.22 * Math.sin(now * 0.003);
    this.sockAmethystLight.intensity = 0.88 + 0.20 * Math.cos(now * 0.0037);

    // Animate 3D Shrine Wooden Fish ("Mõ Hắc Mộc") & Mallet strike + expanding soundwave rings!
    if (this.shrineMoktakGroup) {
      const elapsed = now - this.shrineMoktakStrikeAt;
      if (elapsed >= 0 && elapsed < 420) {
        const t = elapsed / 420;
        const swing = t < 0.24
          ? THREE.MathUtils.lerp(-0.48, 0.45, t / 0.24)
          : 0.45 * Math.exp(-(t - 0.24) * 6.8) * Math.cos((t - 0.24) * 15.0);
        this.shrineMalletPivot.rotation.z = swing;

        const squash = t > 0.16 && t < 0.85
          ? Math.exp(-(t - 0.16) * 6.2) * Math.sin((t - 0.16) * 19.0) * 0.19
          : 0;
        this.shrineMoktakFish.scale.set(1 + squash, 1 - squash * 1.15, 1 + squash);
        this.shrineMoktakGem.material.emissiveIntensity = 1.35 + Math.max(0, 2.8 * (1 - t));
        this.moktakFlashLight.intensity = Math.max(0, 2.4 * (1 - t * 1.3));
      } else {
        this.shrineMalletPivot.rotation.z = -0.22 + Math.sin(now * 0.0028) * 0.03;
        this.shrineMoktakFish.scale.set(1, 1, 1);
        this.shrineMoktakGem.material.emissiveIntensity = 1.35 + 0.2 * Math.sin(now * 0.0035);
        this.moktakFlashLight.intensity = 0;
      }
    }

    for (let i = this.moktakRipples.length - 1; i >= 0; i--) {
      const r = this.moktakRipples[i];
      const p = (now - r.born) / r.duration;
      if (p >= 1) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        this.moktakRipples.splice(i, 1);
      } else {
        const ease = 1 - Math.pow(1 - p, 2.4);
        const s = 1 + ease * 3.8;
        r.mesh.scale.set(s, s, 1);
        r.mesh.material.opacity = (1 - p) * 0.88;
      }
    }

    // Gentle sun-dust drift
    this.dustPoints.rotation.y = now * 0.00004;

    // Optional Q/E smooth horizontal orbit around the player
    const orbitDir = (this.keys.has('KeyE') ? 1 : 0) - (this.keys.has('KeyQ') ? 1 : 0);
    if (orbitDir !== 0) {
      const angle = orbitDir * 1.85 * dt;
      this.tempOrbitVec.subVectors(this.camera.position, this.controls.target);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const rx = this.tempOrbitVec.x * cosA + this.tempOrbitVec.z * sinA;
      const rz = -this.tempOrbitVec.x * sinA + this.tempOrbitVec.z * cosA;
      this.tempOrbitVec.x = rx;
      this.tempOrbitVec.z = rz;
      this.camera.position.copy(this.controls.target).add(this.tempOrbitVec);
    }

    // Update live camera azimuth yaw so WASD / Arrow keys always steer relative to current view
    this.cameraYaw = Math.atan2(
      this.camera.position.x - this.controls.target.x,
      this.camera.position.z - this.controls.target.z,
    );

    if (this.crowd) {
      this.crowd.nudgeSelfByKeys(this.keys, dt, this.cameraYaw);
      this.crowd.update(now, dt);
    }

    // Rigidly translate both OrbitControls target & camera together so free orbit angle + zoom never drift while following player
    this.computeDesiredCameraFocus(this.desiredCameraFocus);
    const prevX = this.cameraFocus.x;
    const prevY = this.cameraFocus.y;
    const prevZ = this.cameraFocus.z;
    if (this.reducedMotionQuery.matches) {
      this.cameraFocus.copy(this.desiredCameraFocus);
    } else {
      const camAlpha = 1 - Math.exp(-FOLLOW_CAMERA_DAMPING * dt);
      this.cameraFocus.lerp(this.desiredCameraFocus, camAlpha);
    }
    this.tempFocusDelta.set(
      this.cameraFocus.x - prevX,
      this.cameraFocus.y - prevY,
      this.cameraFocus.z - prevZ,
    );
    this.controls.target.add(this.tempFocusDelta);
    this.camera.position.add(this.tempFocusDelta);

    this.controls.update();
    this.updateRoofCutaway();

    this.renderer.render(this.scene, this.camera);
    this.renderWorldLabels(now);

    requestAnimationFrame(this.animate);
  }
}
