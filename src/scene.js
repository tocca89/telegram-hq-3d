import * as THREE from 'three';

export class HQScene {
  constructor(container, offices, onSelectRoom) {
    this.container = container;
    this.offices = offices;
    this.onSelectRoom = onSelectRoom;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0f19);
    this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.015);

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.defaultCamPos = new THREE.Vector3(0, 38, 48);
    this.defaultTarget = new THREE.Vector3(0, 0, -5);
    this.camera.position.copy(this.defaultCamPos);
    this.cameraTarget = this.defaultTarget.clone();

    // Lerp targets for camera transitions
    this.targetCamPos = this.defaultCamPos.clone();
    this.targetLookAt = this.defaultTarget.clone();

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Interaction Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];
    this.hoveredObject = null;

    // Animated objects container
    this.animatedMeshes = [];

    // Drag / Orbit state
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.spherical = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.cameraTarget));

    this.setupLighting();
    this.buildBaseGrid();
    this.buildOffices();
    this.setupEvents();
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    sun.position.set(25, 45, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    const d = 35;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // Gentle fill light
    const fillLight = new THREE.DirectionalLight(0x818cf8, 0.4);
    fillLight.position.set(-25, 20, -25);
    this.scene.add(fillLight);
  }

  buildBaseGrid() {
    // Ground foundation
    const groundGeo = new THREE.PlaneGeometry(120, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070a12,
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Glowing subtle grid lines
    const grid = new THREE.GridHelper(90, 45, 0x1e293b, 0x0f172a);
    grid.position.y = 0;
    this.scene.add(grid);

    // Floating cyber dust particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = Math.random() * 25 + 1;
      positions[i + 2] = (Math.random() - 0.5) * 70;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.35,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(particles);
    this.particles = particles;
  }

  buildOffices() {
    this.offices.forEach((office) => {
      const roomGroup = new THREE.Group();
      roomGroup.position.set(office.gridPos.x, 0, office.gridPos.z);
      roomGroup.userData = { officeId: office.id, officeName: office.name };

      // 1. Room Floor Plate
      const floorGeo = new THREE.BoxGeometry(office.size.w, 0.4, office.size.d);
      const floorMat = new THREE.MeshStandardMaterial({
        color: office.floorColor,
        roughness: 0.4,
        metalness: 0.3
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = 0.2;
      floor.receiveShadow = true;
      floor.castShadow = true;
      roomGroup.add(floor);

      // Floor Neon Border Frame
      const frameGeo = new THREE.BoxGeometry(office.size.w + 0.3, 0.08, office.size.d + 0.3);
      const frameMat = new THREE.MeshBasicMaterial({
        color: office.glowColor,
        transparent: true,
        opacity: 0.7
      });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = 0.42;
      roomGroup.add(frame);

      // 2. Corner Pillars / Glass Walls
      const wallMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.22,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.7,
        ior: 1.5
      });

      // Back Wall
      const backWallGeo = new THREE.BoxGeometry(office.size.w - 0.5, 2.2, 0.2);
      const backWall = new THREE.Mesh(backWallGeo, wallMat);
      backWall.position.set(0, 1.5, -office.size.d / 2 + 0.2);
      roomGroup.add(backWall);

      // Side Wall Left
      const sideWallGeo = new THREE.BoxGeometry(0.2, 2.2, office.size.d - 0.5);
      const sideWall = new THREE.Mesh(sideWallGeo, wallMat);
      sideWall.position.set(-office.size.w / 2 + 0.2, 1.5, 0);
      roomGroup.add(sideWall);

      // 3. Room PointLight for Ambient Glow
      const roomLight = new THREE.PointLight(office.glowColor, 2.8, 14);
      roomLight.position.set(0, 4.5, 0);
      roomGroup.add(roomLight);

      // 4. Floating 3D Room Title Billboard
      this.createRoomBadge(roomGroup, office);

      // 5. Office-Specific Thematic Props
      this.buildRoomProps(roomGroup, office);

      // 6. Agents in the room
      this.buildRoomAgents(roomGroup, office);

      this.scene.add(roomGroup);

      // Register floor & interactive components for raycasting
      floor.userData = { officeId: office.id, isFloor: true };
      this.interactiveObjects.push(floor);
    });
  }

  createRoomBadge(roomGroup, office) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Rounded badge background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(10, 10, 492, 108, 24);
    ctx.fill();

    ctx.strokeStyle = office.color;
    ctx.lineWidth = 6;
    ctx.roundRect(10, 10, 492, 108, 24);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${office.icon} ${office.name}`, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6, 1.5, 1);
    sprite.position.set(0, 5.2, -office.size.d / 2 + 0.4);
    roomGroup.add(sprite);
  }

  buildRoomProps(roomGroup, office) {
    switch (office.id) {
      case 'generale': {
        // Executive Round Table
        const tableGeo = new THREE.CylinderGeometry(2.4, 2.2, 0.3, 32);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.6, roughness: 0.2 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(0, 1.2, 0);
        table.castShadow = true;
        roomGroup.add(table);

        // Floating Golden Antigravity Core
        const coreGeo = new THREE.OctahedronGeometry(0.85, 0);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.6,
          metalness: 0.9,
          roughness: 0.1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 2.6, 0);
        roomGroup.add(core);

        this.animatedMeshes.push({
          mesh: core,
          animate: (time) => {
            core.rotation.y = time * 0.8;
            core.rotation.x = time * 0.5;
            core.position.y = 2.6 + Math.sin(time * 2) * 0.15;
          }
        });
        break;
      }

      case 'videostudio': {
        // Dual Editing Monitors Desk
        const deskGeo = new THREE.BoxGeometry(4.2, 0.2, 1.6);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, 1.1, -1.8);
        desk.castShadow = true;
        roomGroup.add(desk);

        // Screens with glowing pink/purple timelines
        const screenGeo = new THREE.BoxGeometry(1.8, 1.1, 0.08);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
        const screen1 = new THREE.Mesh(screenGeo, screenMat);
        screen1.position.set(-1.05, 2.0, -1.8);
        screen1.rotation.y = 0.15;
        const screen2 = new THREE.Mesh(screenGeo, screenMat);
        screen2.position.set(1.05, 2.0, -1.8);
        screen2.rotation.y = -0.15;
        roomGroup.add(screen1, screen2);

        // Studio Light Tripod & Softbox
        const softboxGeo = new THREE.BoxGeometry(1.2, 1.5, 0.4);
        const softboxMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });
        const softbox = new THREE.Mesh(softboxGeo, softboxMat);
        softbox.position.set(3.2, 3.2, 1.8);
        softbox.rotation.y = -Math.PI / 4;
        roomGroup.add(softbox);
        break;
      }

      case 'homelab': {
        // 2 Cyber Server Racks with Blinking LEDs
        for (let i = -1; i <= 1; i += 2) {
          const rackGeo = new THREE.BoxGeometry(1.8, 4.0, 1.4);
          const rackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
          const rack = new THREE.Mesh(rackGeo, rackMat);
          rack.position.set(i * 2.8, 2.4, -2.2);
          rack.castShadow = true;
          roomGroup.add(rack);

          // LED strips on racks
          const ledGeo = new THREE.BoxGeometry(1.5, 0.1, 0.05);
          for (let j = 0; j < 6; j++) {
            const ledMat = new THREE.MeshBasicMaterial({ color: j % 2 === 0 ? 0x06b6d4 : 0x10b981 });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(i * 2.8, 1.2 + j * 0.5, -1.48);
            roomGroup.add(led);
          }
        }
        break;
      }

      case 'takeoff': {
        // Corporate Desk
        const deskGeo = new THREE.BoxGeometry(4.4, 0.2, 1.8);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.4 });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, 1.1, -1.5);
        desk.castShadow = true;
        roomGroup.add(desk);

        // Animated 3D Analytics Bar Charts
        for (let b = 0; b < 4; b++) {
          const h = 1.2 + b * 0.5;
          const barGeo = new THREE.BoxGeometry(0.4, h, 0.4);
          const barMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.4 });
          const bar = new THREE.Mesh(barGeo, barMat);
          bar.position.set(-1.2 + b * 0.8, 1.2 + h / 2, -1.5);
          roomGroup.add(bar);

          this.animatedMeshes.push({
            mesh: bar,
            initialY: 1.2 + h / 2,
            animate: (time) => {
              bar.scale.y = 1 + Math.sin(time * 3 + b) * 0.15;
            }
          });
        }
        break;
      }

      case 'ricette': {
        // Kitchen Prep Counter
        const counterGeo = new THREE.BoxGeometry(4.0, 1.2, 2.0);
        const counterMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.2 });
        const counter = new THREE.Mesh(counterGeo, counterMat);
        counter.position.set(0, 0.8, 0);
        counter.castShadow = true;
        roomGroup.add(counter);

        // 3D Model of Lorenzo's Plumcake 40x10cm!
        const loafGeo = new THREE.BoxGeometry(2.4, 0.7, 0.9);
        const loafMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const loaf = new THREE.Mesh(loafGeo, loafMat);
        loaf.position.set(0, 1.6, 0);
        loaf.castShadow = true;
        roomGroup.add(loaf);

        // Stainless steel bowl
        const bowlGeo = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bowlMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
        const bowl = new THREE.Mesh(bowlGeo, bowlMat);
        bowl.rotation.x = Math.PI;
        bowl.position.set(1.4, 1.7, 0);
        roomGroup.add(bowl);
        break;
      }

      case 'viaggi': {
        // Miniature Illuminated Runway Strip
        const runwayGeo = new THREE.BoxGeometry(1.6, 0.05, 6.0);
        const runwayMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
        const runway = new THREE.Mesh(runwayGeo, runwayMat);
        runway.position.set(-2.5, 0.42, 0.5);
        roomGroup.add(runway);

        // Floating & Banking Mini Jet
        const planeGroup = new THREE.Group();
        const fuselageGeo = new THREE.ConeGeometry(0.35, 1.8, 16);
        const planeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4, roughness: 0.2 });
        const fuselage = new THREE.Mesh(fuselageGeo, planeMat);
        fuselage.rotation.x = Math.PI / 2;
        planeGroup.add(fuselage);

        // Wings
        const wingGeo = new THREE.BoxGeometry(2.2, 0.05, 0.5);
        const wing = new THREE.Mesh(wingGeo, planeMat);
        wing.position.set(0, 0, 0.2);
        planeGroup.add(wing);

        planeGroup.position.set(0, 2.8, 0);
        roomGroup.add(planeGroup);

        this.animatedMeshes.push({
          mesh: planeGroup,
          animate: (time) => {
            planeGroup.position.y = 2.8 + Math.sin(time * 2.5) * 0.25;
            planeGroup.rotation.y = time * 0.5;
            planeGroup.rotation.z = Math.sin(time * 2.5) * 0.15;
          }
        });
        break;
      }
    }
  }

  buildRoomAgents(roomGroup, office) {
    const spacing = office.size.w / (office.agents.length + 1);

    office.agents.forEach((agent, idx) => {
      const agentGroup = new THREE.Group();
      const x = -office.size.w / 2 + spacing * (idx + 1);
      const z = 1.6;
      agentGroup.position.set(x, 1.4, z);
      agentGroup.userData = { isAgent: true, agentData: agent, officeId: office.id };

      // Bot Capsule Body
      const bodyGeo = new THREE.CapsuleGeometry(0.42, 0.6, 12, 16);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: agent.avatarColor,
        roughness: 0.3,
        metalness: 0.4
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      agentGroup.add(body);

      // Glowing Visor / Eyes
      const visorGeo = new THREE.BoxGeometry(0.48, 0.18, 0.25);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.25, 0.3);
      agentGroup.add(visor);

      // Floating Magnetic Hand Orbs
      for (let side = -1; side <= 1; side += 2) {
        const handGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const handMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 });
        const hand = new THREE.Mesh(handGeo, handMat);
        hand.position.set(side * 0.62, -0.1, 0.15);
        agentGroup.add(hand);
      }

      // Rotating Status Ring Halo Above Head
      const haloGeo = new THREE.TorusGeometry(0.45, 0.04, 8, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: agent.status.includes('Online') || agent.status.includes('Attivo') ? 0x10b981 : 0xfbbf24,
        transparent: true,
        opacity: 0.85
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.85, 0);
      agentGroup.add(halo);

      roomGroup.add(agentGroup);

      // Register for raycasting
      body.userData = { isAgent: true, agentData: agent, officeId: office.id };
      this.interactiveObjects.push(body);

      // Idle float animation
      this.animatedMeshes.push({
        mesh: agentGroup,
        baseY: 1.4,
        offset: idx * 1.5,
        animate: (time) => {
          agentGroup.position.y = 1.4 + Math.sin(time * 3 + idx) * 0.12;
          halo.rotation.z = time * 2;
        }
      });
    });
  }

  focusOffice(officeId) {
    if (!officeId || officeId === 'all') {
      this.targetCamPos.copy(this.defaultCamPos);
      this.targetLookAt.copy(this.defaultTarget);
      return;
    }

    const office = this.offices.find((o) => o.id === officeId);
    if (!office) return;

    this.targetLookAt.set(office.gridPos.x, 2, office.gridPos.z);
    this.targetCamPos.set(office.gridPos.x, 16, office.gridPos.z + 18);
  }

  setupEvents() {
    window.addEventListener('resize', this.onResize.bind(this));

    const dom = this.renderer.domElement;

    // Mouse Drag Rotation
    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('mousemove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.targetCamPos.x -= deltaX * 0.05;
        this.targetCamPos.z += deltaY * 0.05;

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    // Zoom on wheel
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.05;
      this.targetCamPos.y = THREE.MathUtils.clamp(this.targetCamPos.y + zoomFactor, 10, 75);
      this.targetCamPos.z = THREE.MathUtils.clamp(this.targetCamPos.z + zoomFactor, 15, 90);
    }, { passive: false });

    // Touch Support for Mobile / iPhone
    let touchStartDist = 0;
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.targetCamPos.x -= deltaX * 0.06;
        this.targetCamPos.z += deltaY * 0.06;

        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (touchStartDist - dist) * 0.1;
        this.targetCamPos.y = THREE.MathUtils.clamp(this.targetCamPos.y + delta, 12, 75);
        this.targetCamPos.z = THREE.MathUtils.clamp(this.targetCamPos.z + delta, 15, 90);
        touchStartDist = dist;
      }
    }, { passive: true });

    dom.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Click Detection on Rooms/Agents
    dom.addEventListener('click', (e) => {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const officeId = hit.userData.officeId;
        if (officeId && this.onSelectRoom) {
          this.onSelectRoom(officeId);
        }
      }
    });
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const time = performance.now() * 0.001;

    // Run animations for props and agents
    for (const item of this.animatedMeshes) {
      if (item.animate) {
        item.animate(time);
      }
    }

    // Slowly rotate background dust
    if (this.particles) {
      this.particles.rotation.y = time * 0.02;
    }

    // Camera Smooth Tween
    this.camera.position.lerp(this.targetCamPos, 0.065);
    this.cameraTarget.lerp(this.targetLookAt, 0.065);
    this.camera.lookAt(this.cameraTarget);

    // Hover Cursor check
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }

    this.renderer.render(this.scene, this.camera);
  }
}
