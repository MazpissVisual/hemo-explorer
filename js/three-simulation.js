/**
 * 3D / VR / AR & HD INTERACTIVE CIRCULATORY SIMULATOR
 * Visualisasi Sistem Peredaran Darah Manusia (Presisi Sesuai Gambar 2)
 */

class Circulation3DSimulator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // 3D Groups
    this.diagram3DGroup = null;
    this.particlesGroup = null;
    this.labelsGroup = null;
    this.valvesGroup = null;
    this.heartGroup = null;
    this.lungsGroup = null;
    this.bodyGroup = null;

    this.circFilter = 'all'; // 'all', 'kecil', 'besar'
    this.speed = 1.0;
    this.isPlaying = true;
    this.bpm = 75;
    this.isVRMode = false;
    this.isARMode = false;
    this.cameraStream = null;

    this.particles = [];
    this.animationFrameId = null;
    this.clock = null;
    this.pulsePhase = 0;

    // Mouse orbit controls
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotation = { x: 0.05, y: 0 };
    this.zoom = 14.5;

    this.init();
    this.initHDDiagramSVG();
  }

  init() {
    if (typeof THREE === 'undefined') {
      this.initFallback2DCanvas();
      return;
    }

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 620;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, this.zoom);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Balanced Studio Lighting
    this.setupLighting();

    // Build Complete 3D Circulatory Anatomy (Sesuai Desain Gambar 2)
    this.buildCompleteCirculatoryAnatomy();
    this.build3DLabelsAndPins();
    this.initBloodParticles();

    // Event listeners
    this.attachEventListeners();

    // Animation Loop
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.95);
    mainLight.position.set(5, 8, 12);
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x90e0ef, 0.4);
    fillLight.position.set(-6, -4, 6);
    this.scene.add(fillLight);

    const redLight = new THREE.PointLight(0xff0054, 1.0, 10);
    redLight.position.set(-1.0, 0, 1.5);
    this.scene.add(redLight);

    const blueLight = new THREE.PointLight(0x00b4d8, 1.0, 10);
    blueLight.position.set(1.0, 0, 1.5);
    this.scene.add(blueLight);
  }

  // =========================================================================
  // MODEL 3D LENGKAP: PARU-PARU + JANTUNG PENAMPANG MELINTANG + SELURUH TUBUH
  // =========================================================================
  buildCompleteCirculatoryAnatomy() {
    this.diagram3DGroup = new THREE.Group();

    // 1. MATERIAL SISTEM
    const myocardiumMat = new THREE.MeshStandardMaterial({
      color: 0xdb5a6b,
      roughness: 0.4,
      metalness: 0.05
    });

    const cutSectionMat = new THREE.MeshStandardMaterial({
      color: 0xc92a42,
      roughness: 0.35,
      metalness: 0.05
    });

    const leftBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0077b6,
      emissive: 0x023e8a,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.1
    });

    const rightRedMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      emissive: 0x800f2f,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.1
    });

    const aortaRedMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      roughness: 0.25,
      metalness: 0.1
    });

    const pulmonaryBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0096c7,
      roughness: 0.25,
      metalness: 0.1
    });

    const valveMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      side: THREE.DoubleSide
    });

    // -----------------------------------------------------------------------
    // A. PARU-PARU 3D (BAGIAN ATAS)
    // -----------------------------------------------------------------------
    this.lungsGroup = new THREE.Group();
    this.lungsGroup.position.set(0, 4.4, 0);

    const lungGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0xf4978e,
      roughness: 0.45
    });

    // Paru-paru Kiri & Kanan
    const leftLung = new THREE.Mesh(lungGeo, lungMat);
    leftLung.position.set(-1.4, 0, 0);
    leftLung.scale.set(0.95, 1.35, 0.75);
    this.lungsGroup.add(leftLung);

    const rightLung = new THREE.Mesh(lungGeo, lungMat);
    rightLung.position.set(1.4, 0, 0);
    rightLung.scale.set(0.95, 1.35, 0.75);
    this.lungsGroup.add(rightLung);

    // Trakea & Percabangan Bronkus
    const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0x0077b6 }));
    trachea.position.set(0, 1.1, 0);
    this.lungsGroup.add(trachea);

    this.diagram3DGroup.add(this.lungsGroup);

    // -----------------------------------------------------------------------
    // B. JANTUNG ANATOMI 3D (BAGIAN TENGAH - PENAMPANG MELINTANG GAMBAR 2)
    // -----------------------------------------------------------------------
    this.heartGroup = new THREE.Group();
    this.heartGroup.position.set(0, 0.2, 0);

    // Dinding Luar Jantung (Contoured Thick Heart Rim)
    const heartContourPoints = [];
    for (let i = 0; i <= 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      const x = 2.1 * Math.sin(theta) * 0.95;
      const y = (2.2 * Math.cos(theta) - (theta > Math.PI ? 0.3 : 0)) * 1.05;
      heartContourPoints.push(new THREE.Vector3(x, y, -0.2));
    }
    const heartCurve = new THREE.CatmullRomCurve3(heartContourPoints, true);
    const heartBorder = new THREE.Mesh(new THREE.TubeGeometry(heartCurve, 40, 0.28, 16, true), cutSectionMat);
    this.heartGroup.add(heartBorder);

    // Back muscle plate (Backing plate)
    const heartBacking = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.6, 0.4, 32), myocardiumMat);
    heartBacking.rotation.x = Math.PI / 2;
    heartBacking.position.set(0, -0.1, -0.4);
    this.heartGroup.add(heartBacking);

    // Septum (Sekat Otot Pemisah Tengah)
    const septum = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 0.5), cutSectionMat);
    septum.position.set(0, -0.2, -0.05);
    this.heartGroup.add(septum);

    // -----------------------------------------------------------------------
    // RONGGA 4 RUANG (DILENGKAPI KONTUR DAN WARNA JELAS SESUAI GAMBAR 2)
    // -----------------------------------------------------------------------
    // Sisi Kiri Diagram (Serambi Kiri & Bilik Kiri - Biru di Gambar 2)
    const chamberGeoUpper = new THREE.SphereGeometry(0.85, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const chamberGeoLower = new THREE.SphereGeometry(1.05, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.75);

    // Serambi Kiri (Atas Kiri Diagram - Biru)
    const laChamber = new THREE.Mesh(chamberGeoUpper, leftBlueMat);
    laChamber.position.set(-0.95, 0.85, -0.1);
    laChamber.scale.set(0.95, 0.95, 0.6);
    this.heartGroup.add(laChamber);

    // Bilik Kiri (Bawah Kiri Diagram - Biru)
    const lvChamber = new THREE.Mesh(chamberGeoLower, leftBlueMat);
    lvChamber.position.set(-0.85, -0.9, -0.1);
    lvChamber.scale.set(0.95, 1.25, 0.65);
    this.heartGroup.add(lvChamber);

    // Sisi Kanan Diagram (Serambi Kanan & Bilik Kanan - Merah di Gambar 2)
    // Serambi Kanan (Atas Kanan Diagram - Merah)
    const raChamber = new THREE.Mesh(chamberGeoUpper, rightRedMat);
    raChamber.position.set(0.95, 0.85, -0.1);
    raChamber.scale.set(0.95, 0.95, 0.6);
    this.heartGroup.add(raChamber);

    // Bilik Kanan (Bawah Kanan Diagram - Merah)
    const rvChamber = new THREE.Mesh(chamberGeoLower, rightRedMat);
    rvChamber.position.set(0.85, -0.85, -0.1);
    rvChamber.scale.set(0.95, 1.2, 0.65);
    this.heartGroup.add(rvChamber);

    // -----------------------------------------------------------------------
    // KATUP JANTUNG (BIKUSPID & TRIKUSPID)
    // -----------------------------------------------------------------------
    this.valvesGroup = new THREE.Group();
    
    // Katup Kiri (Bikuspid/Mitral)
    const valveLeft = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 12, 24), valveMat);
    valveLeft.position.set(-0.9, -0.05, 0.15);
    valveLeft.rotation.x = Math.PI / 2.5;
    this.valvesGroup.add(valveLeft);

    // Katup Kanan (Trikuspid)
    const valveRight = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 12, 24), valveMat);
    valveRight.position.set(0.9, -0.05, 0.15);
    valveRight.rotation.x = Math.PI / 2.5;
    this.valvesGroup.add(valveRight);

    this.heartGroup.add(this.valvesGroup);

    // -----------------------------------------------------------------------
    // PEMBULUH UTAMA (AORTA, ARTERI PULMONALIS, VENA CAVA)
    // -----------------------------------------------------------------------
    // Lengkung Aorta (Merah di Pusat Atas)
    const aortaPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, 0.6, 0.1),
      new THREE.Vector3(-0.1, 1.8, 0.2),
      new THREE.Vector3(0.3, 2.3, 0.0),
      new THREE.Vector3(1.0, 2.0, -0.2),
      new THREE.Vector3(1.3, 1.0, -0.3)
    ]);
    const aortaMesh = new THREE.Mesh(new THREE.TubeGeometry(aortaPath, 24, 0.38, 16, false), aortaRedMat);
    this.heartGroup.add(aortaMesh);

    // 3 Cabang Arteri di Puncak Aorta
    [-0.1, 0.3, 0.7].forEach(x => {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 12), aortaRedMat);
      branch.position.set(x, 2.5, -0.1);
      branch.rotation.z = -0.15;
      this.heartGroup.add(branch);
    });

    // Arteri Pulmonalis (Biru) - Menyilang di depan Aorta menuju Paru-Paru
    const pulmPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.3, 0.5, 0.25),
      new THREE.Vector3(0.0, 1.4, 0.4),
      new THREE.Vector3(-0.7, 1.7, 0.2),
      new THREE.Vector3(-1.6, 1.6, -0.1)
    ]);
    const pulmMesh = new THREE.Mesh(new THREE.TubeGeometry(pulmPath, 20, 0.34, 16, false), pulmonaryBlueMat);
    this.heartGroup.add(pulmMesh);

    // Cabang Pulmonal Kanan
    const pulmRightPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 1.5, 0.2),
      new THREE.Vector3(0.6, 1.4, -0.1),
      new THREE.Vector3(1.6, 1.3, -0.2)
    ]);
    const pulmRightMesh = new THREE.Mesh(new THREE.TubeGeometry(pulmRightPath, 16, 0.26, 14, false), pulmonaryBlueMat);
    this.heartGroup.add(pulmRightMesh);

    // Vena Cava (Biru)
    const vcs = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.6, 16), pulmonaryBlueMat);
    vcs.position.set(1.5, 1.8, -0.2);
    this.heartGroup.add(vcs);

    const vci = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 16), pulmonaryBlueMat);
    vci.position.set(1.3, -1.9, -0.2);
    this.heartGroup.add(vci);

    this.diagram3DGroup.add(this.heartGroup);

    // -----------------------------------------------------------------------
    // C. SELURUH TUBUH (KAPILER 3D - BAGIAN BAWAH)
    // -----------------------------------------------------------------------
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, -4.4, 0);

    // Anyaman Kapiler Tubuh
    const capGeo = new THREE.TorusGeometry(1.6, 0.22, 12, 32);
    const capMesh = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({
      color: 0x9d4edd,
      roughness: 0.3,
      wireframe: true
    }));
    capMesh.scale.set(1.5, 0.6, 1);
    this.bodyGroup.add(capMesh);

    this.diagram3DGroup.add(this.bodyGroup);

    // -----------------------------------------------------------------------
    // D. PIPA SIRKULASI PENGHUBUNG (PIPES GAMBAR 2)
    // -----------------------------------------------------------------------
    // 1. Pipa Pulmonal Naik (Biru dari Jantung ke Paru-Paru Kiri)
    const pipePulmBlue = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.6, 1.8, 0),
      new THREE.Vector3(-2.8, 3.0, 0),
      new THREE.Vector3(-1.8, 4.4, 0)
    ]);
    this.diagram3DGroup.add(new THREE.Mesh(new THREE.TubeGeometry(pipePulmBlue, 20, 0.16, 12, false), pulmonaryBlueMat));

    // 2. Pipa Vena Pulmonalis Turun (Merah dari Paru-Paru Kanan ke Jantung)
    const pipePulmRed = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.8, 4.4, 0),
      new THREE.Vector3(2.8, 3.0, 0),
      new THREE.Vector3(1.5, 1.8, 0)
    ]);
    this.diagram3DGroup.add(new THREE.Mesh(new THREE.TubeGeometry(pipePulmRed, 20, 0.16, 12, false), aortaRedMat));

    // 3. Pipa Aorta Turun (Merah dari Jantung ke Seluruh Tubuh)
    const pipeAortaDown = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.2, 0.5, 0),
      new THREE.Vector3(2.9, -2.0, 0),
      new THREE.Vector3(1.6, -4.4, 0)
    ]);
    this.diagram3DGroup.add(new THREE.Mesh(new THREE.TubeGeometry(pipeAortaDown, 24, 0.18, 12, false), aortaRedMat));

    // 4. Pipa Vena Cava Naik (Biru dari Seluruh Tubuh ke Jantung)
    const pipeVenaUp = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.6, -4.4, 0),
      new THREE.Vector3(-2.9, -2.0, 0),
      new THREE.Vector3(-1.2, 0.5, 0)
    ]);
    this.diagram3DGroup.add(new THREE.Mesh(new THREE.TubeGeometry(pipeVenaUp, 24, 0.18, 12, false), pulmonaryBlueMat));

    this.scene.add(this.diagram3DGroup);
  }

  // =========================================================================
  // PIN LABEL 3D BERSIH & TERBACA JELAS (SESUAI GAMBAR 2)
  // =========================================================================
  build3DLabelsAndPins() {
    this.labelsGroup = new THREE.Group();

    // Data pin anatomi sesuai Gambar 2
    const pinData = [
      { text: "Paru-paru", pos: [0, 5.8, 0.1], bg: "#0f2b5c", border: "#ffffff", target: [0, 4.8, 0] },
      { text: "Aorta", pos: [0, 2.8, 0.4], bg: "#ff0054", border: "#ffffff", target: [0, 2.2, 0.2] },
      { text: "Arteri Pulmonalis", pos: [-3.4, 2.2, 0.2], bg: "#0077b6", border: "#ffffff", target: [-1.2, 1.6, 0.2] },
      { text: "Vena Cava", pos: [3.4, 2.2, 0.2], bg: "#0077b6", border: "#ffffff", target: [1.5, 1.8, 0] },
      { text: "Serambi Kiri (Left Atrium)", pos: [-3.6, 0.8, 0.3], bg: "#ff0054", border: "#ffffff", target: [-0.95, 0.85, 0.1] },
      { text: "Katup Bikuspid / Mitral", pos: [-3.6, -0.1, 0.3], bg: "#d97706", border: "#ffffff", target: [-0.9, -0.05, 0.2] },
      { text: "Bilik Kiri (Left Ventricle)", pos: [-3.6, -1.1, 0.3], bg: "#ff0054", border: "#ffffff", target: [-0.85, -0.9, 0.1] },
      { text: "Serambi Kanan (Right Atrium)", pos: [3.6, 0.8, 0.3], bg: "#0284c7", border: "#ffffff", target: [0.95, 0.85, 0.1] },
      { text: "Katup Trikuspid", pos: [3.6, -0.1, 0.3], bg: "#d97706", border: "#ffffff", target: [0.9, -0.05, 0.2] },
      { text: "Bilik Kanan (Right Ventricle)", pos: [3.6, -1.1, 0.3], bg: "#0284c7", border: "#ffffff", target: [0.85, -0.85, 0.1] },
      { text: "Seluruh Tubuh", pos: [0, -5.6, 0.1], bg: "#8338ec", border: "#ffffff", target: [0, -4.4, 0] }
    ];

    pinData.forEach(p => {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 76;
      const ctx = canvas.getContext('2d');

      // Rounded Pill Card
      ctx.fillStyle = p.bg;
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(10, 8, 360, 60, 30);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "Outfit", "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, 190, 38);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(p.pos[0], p.pos[1], p.pos[2]);
      sprite.scale.set(2.4, 0.48, 1);

      this.labelsGroup.add(sprite);

      // Curved leader pointer line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p.pos[0] * 0.85, p.pos[1], p.pos[2]),
        new THREE.Vector3(p.target[0], p.target[1], p.target[2])
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      this.labelsGroup.add(line);
    });

    this.scene.add(this.labelsGroup);
  }

  // =========================================================================
  // PARTIKEL ALIRAN DARAH MERAH (O2) & BIRU (CO2)
  // =========================================================================
  initBloodParticles() {
    this.particlesGroup = new THREE.Group();
    this.particles = [];

    // Kurva 1: Sirkulasi Darah Kecil (Pulmonal)
    const pulmPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.85, -0.85, 0.2),  // Bilik Kanan (Biru)
      new THREE.Vector3(0.3, 0.5, 0.25),    // Arteri Pulmonalis
      new THREE.Vector3(-1.6, 1.8, 0.1),
      new THREE.Vector3(-2.8, 3.0, 0),
      new THREE.Vector3(-1.4, 4.4, 0),      // Paru-paru Kiri
      new THREE.Vector3(0, 4.8, 0),
      new THREE.Vector3(1.4, 4.4, 0),       // Paru-paru Kanan
      new THREE.Vector3(2.8, 3.0, 0),
      new THREE.Vector3(1.5, 1.8, 0),       // Vena Pulmonalis
      new THREE.Vector3(-0.95, 0.85, 0.2)   // Serambi Kiri
    ], true);

    // Kurva 2: Sirkulasi Darah Besar (Sistemik)
    const systemicPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.85, -0.9, 0.2),  // Bilik Kiri (Merah)
      new THREE.Vector3(-0.3, 0.6, 0.2),    // Pangkal Aorta
      new THREE.Vector3(0.3, 2.3, 0),       // Lengkung Aorta
      new THREE.Vector3(2.9, -2.0, 0),      // Aorta Turun
      new THREE.Vector3(1.6, -4.4, 0),      // Kapiler Seluruh Tubuh
      new THREE.Vector3(0, -4.8, 0),
      new THREE.Vector3(-1.6, -4.4, 0),
      new THREE.Vector3(-2.9, -2.0, 0),     // Vena Cava
      new THREE.Vector3(1.3, -1.9, 0),
      new THREE.Vector3(0.95, 0.85, 0.2)    // Serambi Kanan
    ], true);

    const particleGeo = new THREE.SphereGeometry(0.12, 12, 12);

    const addSet = (path, count, type) => {
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0054 });
        const mesh = new THREE.Mesh(particleGeo, mat);
        this.particlesGroup.add(mesh);
        this.particles.push({
          mesh: mesh,
          path: path,
          t: i / count,
          type: type
        });
      }
    };

    addSet(pulmPath, 36, 'kecil');
    addSet(systemicPath, 45, 'besar');

    this.scene.add(this.particlesGroup);
  }

  // =========================================================================
  // ANIMASI & RENDER LOOP
  // =========================================================================
  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const delta = this.clock ? this.clock.getDelta() : 0.016;

    if (this.isPlaying) {
      const heartFreq = (this.bpm / 60) * Math.PI * 2;
      this.pulsePhase += delta * heartFreq * this.speed;

      // Detak Jantung
      const heartScale = 1.0 + Math.sin(this.pulsePhase) * 0.04 + Math.max(0, Math.sin(this.pulsePhase * 2)) * 0.03;
      if (this.heartGroup) {
        this.heartGroup.scale.set(heartScale, heartScale, heartScale);
      }

      // Paru-paru Mengembang
      if (this.lungsGroup) {
        const lungScale = 1.0 + Math.sin(this.pulsePhase * 0.4) * 0.04;
        this.lungsGroup.scale.set(lungScale, lungScale, lungScale);
      }

      // Katup Buka Tutup
      const valvePulse = Math.sin(this.pulsePhase) > 0 ? 0.25 : 0.02;
      if (this.valvesGroup) {
        this.valvesGroup.scale.set(1 + valvePulse, 1 + valvePulse, 1);
      }

      // Aliran Partikel Darah
      const flowSpeed = 0.12 * this.speed * (this.bpm / 75);
      this.particles.forEach(p => {
        let isVisible = true;
        if (this.circFilter === 'kecil' && p.type !== 'kecil') isVisible = false;
        if (this.circFilter === 'besar' && p.type === 'kecil') isVisible = false;

        p.mesh.visible = isVisible;
        if (!isVisible) return;

        p.t = (p.t + delta * flowSpeed) % 1.0;
        const pos = p.path.getPointAt(p.t);
        p.mesh.position.copy(pos);

        // Perubahan Warna Darah (O2 Merah vs CO2 Biru)
        if (p.type === 'kecil') {
          if (p.t < 0.45) {
            p.mesh.material.color.setHex(0x00b4d8); // Biru CO2
          } else {
            p.mesh.material.color.setHex(0xff0054); // Merah O2
          }
        } else {
          if (p.t < 0.5) {
            p.mesh.material.color.setHex(0xff0054); // Merah O2
          } else {
            p.mesh.material.color.setHex(0x00b4d8); // Biru CO2
          }
        }
      });
    }

    // Kamera Orbit
    this.updateCamera();

    // Render
    if (this.isVRMode) {
      this.renderStereoscopicVR();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateCamera() {
    const x = this.zoom * Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
    const y = this.zoom * Math.sin(this.rotation.x) + 0.1;
    const z = this.zoom * Math.cos(this.rotation.y) * Math.cos(this.rotation.x);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  setCirculationMode(filter) {
    this.circFilter = filter; // 'all', 'kecil', 'besar'
  }

  setSpeed(val) {
    this.speed = parseFloat(val);
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  resetView() {
    this.rotation = { x: 0.05, y: 0 };
    this.zoom = 14.5;
  }

  toggleVR() {
    this.isVRMode = !this.isVRMode;
    this.handleResize();
    return this.isVRMode;
  }

  toggleAR(videoElementId) {
    this.isARMode = !this.isARMode;
    const videoEl = document.getElementById(videoElementId);

    if (this.isARMode) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => {
            this.cameraStream = stream;
            if (videoEl) {
              videoEl.srcObject = stream;
              videoEl.style.display = 'block';
              videoEl.play();
            }
          })
          .catch(err => {
            console.warn("Kamera AR tidak dapat diakses:", err);
            this.isARMode = false;
          });
      }
    } else {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }
      if (videoEl) videoEl.style.display = 'none';
    }
    return this.isARMode;
  }

  renderStereoscopicVR() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const halfWidth = width / 2;

    this.renderer.setScissorTest(true);

    this.renderer.setScissor(0, 0, halfWidth, height);
    this.renderer.setViewport(0, 0, halfWidth, height);
    this.camera.position.x -= 0.15;
    this.renderer.render(this.scene, this.camera);

    this.renderer.setScissor(halfWidth, 0, halfWidth, height);
    this.renderer.setViewport(halfWidth, 0, halfWidth, height);
    this.camera.position.x += 0.3;
    this.renderer.render(this.scene, this.camera);

    this.camera.position.x -= 0.15;
    this.renderer.setScissorTest(false);
  }

  attachEventListeners() {
    const dom = this.renderer.domElement;

    const onPointerDown = (e) => {
      this.isDragging = true;
      this.previousMousePosition = {
        x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
        y: e.clientY || (e.touches && e.touches[0].clientY) || 0
      };
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.rotation.y -= deltaX * 0.007;
      this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.x + deltaY * 0.007));

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      this.zoom = Math.max(7, Math.min(26, this.zoom + e.deltaY * 0.012));
    };

    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 620;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // =========================================================================
  // DIAGRAM HD GAMBAR 2 INTERAKTIF (VECTOR SVG ENGINE)
  // =========================================================================
  initHDDiagramSVG() {
    const host = document.getElementById('diagram-svg-host');
    if (!host) return;

    host.innerHTML = `
      <svg viewBox="0 0 1000 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">
        <defs>
          <radialGradient id="grad-bg-lungs" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f4a261" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#e76f51" stop-opacity="0.95"/>
          </radialGradient>
          <radialGradient id="grad-heart-left" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#0096c7"/>
            <stop offset="100%" stop-color="#023e8a"/>
          </radialGradient>
          <radialGradient id="grad-heart-right" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#ff0054"/>
            <stop offset="100%" stop-color="#9d0208"/>
          </radialGradient>
          <linearGradient id="grad-aorta" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff4d6d"/>
            <stop offset="100%" stop-color="#c9184a"/>
          </linearGradient>
          <linearGradient id="grad-pulm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#48cae4"/>
            <stop offset="100%" stop-color="#0077b6"/>
          </linearGradient>
          <filter id="glow-badge" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
          </filter>
        </defs>

        <!-- PIPES / PEMBULUH DARAH SIRKULASI -->
        <!-- 1. Pipa Pulmonal (Biru ke Paru-Paru) -->
        <path d="M 420 310 C 280 280, 240 180, 380 120" fill="none" stroke="#00b4d8" stroke-width="22" stroke-linecap="round"/>
        <path d="M 420 310 C 280 280, 240 180, 380 120" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="12 18" class="svg-flow-anim"/>

        <!-- 2. Pipa Vena Pulmonalis (Merah dari Paru-Paru) -->
        <path d="M 620 120 C 760 180, 720 280, 580 310" fill="none" stroke="#ff0054" stroke-width="22" stroke-linecap="round"/>
        <path d="M 620 120 C 760 180, 720 280, 580 310" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="12 18" class="svg-flow-anim"/>

        <!-- 3. Pipa Aorta Sistemik (Merah ke Seluruh Tubuh) -->
        <path d="M 590 530 C 780 570, 780 670, 600 700" fill="none" stroke="#ff0054" stroke-width="24" stroke-linecap="round"/>
        <path d="M 590 530 C 780 570, 780 670, 600 700" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="12 18" class="svg-flow-anim"/>

        <!-- 4. Pipa Vena Cava (Biru dari Seluruh Tubuh ke Jantung) -->
        <path d="M 400 700 C 220 670, 220 570, 410 530" fill="none" stroke="#00b4d8" stroke-width="24" stroke-linecap="round"/>
        <path d="M 400 700 C 220 670, 220 570, 410 530" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="12 18" class="svg-flow-anim"/>

        <!-- PARU-PARU (TOP) -->
        <g id="svg-lung-group" style="cursor: pointer;" onclick="window.audioManager.speakText('Paru-paru tempat pertukaran gas karbondioksida dan oksigen.')">
          <!-- Left Lung -->
          <ellipse cx="440" cy="115" rx="55" ry="65" fill="url(#grad-bg-lungs)"/>
          <!-- Right Lung -->
          <ellipse cx="560" cy="115" rx="55" ry="65" fill="url(#grad-bg-lungs)"/>
          <!-- Trachea -->
          <path d="M 500 45 L 500 100 M 500 100 L 450 120 M 500 100 L 550 120" stroke="#0077b6" stroke-width="12" stroke-linecap="round" fill="none"/>
        </g>

        <!-- JANTUNG PENAMPANG MELINTANG (CENTER) -->
        <!-- Muscle Outer Frame -->
        <path d="M 500 240 C 330 200, 310 400, 500 580 C 690 400, 670 200, 500 240 Z" fill="#e76f51" stroke="#bd1f36" stroke-width="14" filter="url(#glow-badge)"/>

        <!-- Aorta Top Arc -->
        <path d="M 470 250 C 470 170, 550 160, 570 230" fill="none" stroke="url(#grad-aorta)" stroke-width="36" stroke-linecap="round"/>
        <!-- 3 Aorta Branches -->
        <path d="M 495 180 L 485 145 M 520 170 L 520 135 M 545 180 L 555 145" stroke="url(#grad-aorta)" stroke-width="14" stroke-linecap="round"/>

        <!-- Pulmonary Trunk Arc (Menyilang di Depan Aorta) -->
        <path d="M 510 260 C 460 210, 420 180, 390 190" fill="none" stroke="url(#grad-pulm)" stroke-width="32" stroke-linecap="round"/>

        <!-- Vena Cava -->
        <rect x="610" y="220" width="34" height="60" rx="12" fill="#0077b6"/>

        <!-- 4 CAVITY CHAMBERS -->
        <!-- 1. Serambi Kiri (Left Atrium) - Cavity Kiri Atas Diagram (Biru) -->
        <path d="M 375 300 C 420 280, 480 300, 480 360 C 480 400, 410 420, 365 380 Z" fill="url(#grad-heart-left)" stroke="#03045e" stroke-width="4" style="cursor: pointer;" onclick="openComponentDetail('jantung', 0)"/>

        <!-- 2. Bilik Kiri (Left Ventricle) - Cavity Kiri Bawah Diagram (Biru) -->
        <path d="M 365 420 C 420 400, 485 410, 485 500 C 485 545, 420 540, 370 480 Z" fill="url(#grad-heart-left)" stroke="#03045e" stroke-width="4" style="cursor: pointer;" onclick="openComponentDetail('jantung', 1)"/>

        <!-- 3. Serambi Kanan (Right Atrium) - Cavity Kanan Atas Diagram (Merah) -->
        <path d="M 625 300 C 580 280, 520 300, 520 360 C 520 400, 590 420, 635 380 Z" fill="url(#grad-heart-right)" stroke="#590d22" stroke-width="4" style="cursor: pointer;" onclick="openComponentDetail('jantung', 2)"/>

        <!-- 4. Bilik Kanan (Right Ventricle) - Cavity Kanan Bawah Diagram (Merah) -->
        <path d="M 635 420 C 580 400, 515 410, 515 500 C 515 545, 580 540, 630 480 Z" fill="url(#grad-heart-right)" stroke="#590d22" stroke-width="4" style="cursor: pointer;" onclick="openComponentDetail('jantung', 3)"/>

        <!-- Septum (Sekat Otot Tengah) -->
        <rect x="488" y="270" width="24" height="290" rx="10" fill="#c92a42"/>

        <!-- Katup Bikuspid (Mitral) -->
        <ellipse cx="420" cy="405" rx="30" ry="10" fill="#ffffff" stroke="#d97706" stroke-width="4" style="cursor: pointer;" onclick="window.audioManager.speakText('Katup Bikuspid atau Mitral, menjaga darah tidak kembali ke serambi kiri.')"/>

        <!-- Katup Trikuspid -->
        <ellipse cx="580" cy="405" rx="30" ry="10" fill="#ffffff" stroke="#d97706" stroke-width="4" style="cursor: pointer;" onclick="window.audioManager.speakText('Katup Trikuspid, memiliki 3 daun katup antara serambi kanan dan bilik kanan.')"/>

        <!-- SELURUH TUBUH (BOTTOM CAPILLARIES) -->
        <g id="svg-body-capillaries" style="cursor: pointer;" onclick="window.audioManager.speakText('Kapiler seluruh tubuh mengalirkan oksigen dan nutrisi ke seluruh sel-sel tubuh.')">
          <!-- Anyaman Kapiler -->
          <ellipse cx="500" cy="700" rx="110" ry="40" fill="#9d4edd" opacity="0.3"/>
          <path d="M 400 700 Q 450 670, 500 700 T 600 700 M 400 700 Q 450 730, 500 700 T 600 700" stroke="#c77dff" stroke-width="6" fill="none"/>
          <path d="M 420 685 L 580 715 M 420 715 L 580 685" stroke="#ffffff" stroke-width="3" stroke-dasharray="6 6" fill="none"/>
        </g>

        <!-- LABELS & POINTER LEADER LINES (EXACT GAMBAR 2) -->
        <!-- Paru-paru Badge -->
        <g transform="translate(500, 35)">
          <rect x="-70" y="-18" width="140" height="36" rx="18" fill="#0f2b5c" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="5" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Paru-paru</text>
        </g>

        <!-- Aorta Badge -->
        <g transform="translate(500, 220)">
          <rect x="-45" y="-15" width="90" height="30" rx="15" fill="#ff0054" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="5" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" text-anchor="middle">Aorta</text>
        </g>

        <!-- Arteri Pulmonalis Badge -->
        <g transform="translate(260, 290)">
          <line x1="75" y1="0" x2="145" y2="-45" stroke="#ffffff" stroke-width="2.5"/>
          <rect x="-85" y="-16" width="170" height="34" rx="17" fill="#0077b6" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="5" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" text-anchor="middle">Arteri Pulmonalis</text>
        </g>

        <!-- Vena Cava Badge -->
        <g transform="translate(740, 290)">
          <line x1="-60" y1="0" x2="-110" y2="-20" stroke="#ffffff" stroke-width="2.5"/>
          <rect x="-65" y="-16" width="130" height="34" rx="17" fill="#0077b6" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="5" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" text-anchor="middle">Vena Cava</text>
        </g>

        <!-- Serambi Kiri (Left Atrium) -->
        <g transform="translate(220, 420)">
          <line x1="85" y1="0" x2="160" y2="-65" stroke="#ffffff" stroke-width="2.5"/>
          <rect x="-95" y="-22" width="190" height="44" rx="22" fill="#ff0054" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="-3" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" text-anchor="middle">Serambi Kiri</text>
          <text x="0" y="14" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="normal" font-size="11" text-anchor="middle">(Left Atrium)</text>
        </g>

        <!-- Katup Bikuspid / Mitral -->
        <g transform="translate(200, 520)">
          <line x1="100" y1="0" x2="200" y2="-110" stroke="#ffffff" stroke-width="2.5"/>
          <rect x="-105" y="-18" width="210" height="36" rx="18" fill="#d97706" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="5" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="13" text-anchor="middle">Katup Bikuspid / Mitral</text>
        </g>

        <!-- Bilik Kiri (Left Ventricle) -->
        <g transform="translate(220, 620)">
          <line x1="85" y1="0" x2="170" y2="-140" stroke="#ffffff" stroke-width="2.5"/>
          <rect x="-95" y="-22" width="190" height="44" rx="22" fill="#ff0054" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="-3" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" text-anchor="middle">Bilik Kiri</text>
          <text x="0" y="14" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="normal" font-size="11" text-anchor="middle">(Left Ventricle)</text>
        </g>

        <!-- Serambi Kanan (Right Atrium) -->
        <g transform="translate(780, 420)">
          <line x1="-85" y1="0" x2="-180" y2="-65" stroke="#ffffff" stroke-width="2.5"/>
          <rect x="-95" y="-22" width="190" height="44" rx="22" fill="#0284c7" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="-3" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" text-anchor="middle">Serambi Kanan</text>
          <text x="0" y="14" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="normal" font-size="11" text-anchor="middle">(Right Atrium)</text>
        </g>

        <!-- Katup Trikuspid -->
        <g transform="translate(780, 520)">
          <line x1="-85" y1="0" x2="-195" y2="-110" stroke="#ffffff" stroke-width="2.5"/>
          <rect x="-90" y="-18" width="180" height="36" rx="18" fill="#d97706" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="5" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="13" text-anchor="middle">Katup Trikuspid</text>
        </g>

        <!-- Bilik Kanan (Right Ventricle) -->
        <g transform="translate(780, 620)">
          <line x1="-85" y1="0" x2="-180" y2="-140" stroke="#ffffff" stroke-width="2.5"/>
          <rect x="-95" y="-22" width="190" height="44" rx="22" fill="#0284c7" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="-3" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" text-anchor="middle">Bilik Kanan</text>
          <text x="0" y="14" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="normal" font-size="11" text-anchor="middle">(Right Ventricle)</text>
        </g>

        <!-- Seluruh Tubuh Badge -->
        <g transform="translate(500, 805)">
          <rect x="-90" y="-20" width="180" height="40" rx="20" fill="#8338ec" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-badge)"/>
          <text x="0" y="6" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Seluruh Tubuh</text>
        </g>
      </svg>
    `;
  }

  initFallback2DCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 620;
    this.container.innerHTML = '';
    this.container.appendChild(canvas);
  }
}

// Global Helper to switch between 3D and Gambar 2 HD mode
window.setDiagramMode = function(mode) {
  const container3d = document.getElementById('circulation-3d-canvas-container');
  const overlayHd = document.getElementById('diagram-hd-overlay');
  const btn3d = document.getElementById('btn-mode-3d');
  const btnHd = document.getElementById('btn-mode-hd');

  if (mode === 'hd') {
    if (container3d) container3d.style.display = 'none';
    if (overlayHd) overlayHd.classList.add('active');
    if (btn3d) btn3d.classList.remove('active');
    if (btnHd) btnHd.classList.add('active');
  } else {
    if (container3d) container3d.style.display = 'block';
    if (overlayHd) overlayHd.classList.remove('active');
    if (btn3d) btn3d.classList.add('active');
    if (btnHd) btnHd.classList.remove('active');
    if (window.sim3D) window.sim3D.handleResize();
  }
};

// Inisialisasi global
window.Circulation3DSimulator = Circulation3DSimulator;
