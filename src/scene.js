import * as THREE from 'three';

export class HQScene {
  constructor(container, offices, onSelectRoom) {
    this.container = container;
    this.offices = offices;
    this.onSelectRoom = onSelectRoom;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0f19);
    this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.012);

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Camera setup - framed to see characters clearly
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.defaultCamPos = new THREE.Vector3(0, 28, 42);
    this.defaultTarget = new THREE.Vector3(0, 1.5, -5);
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
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Interaction Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];
    this.agentMeshes = [];

    // Animated objects container
    this.animatedMeshes = [];

    // Drag / Orbit state
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    this.setupLighting();
    this.buildBaseGrid();
    this.buildOffices();
    this.setupEvents();
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xf8fafc, 1.3);
    sun.position.set(30, 48, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 130;
    const d = 40;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x818cf8, 0.5);
    fillLight.position.set(-30, 25, -25);
    this.scene.add(fillLight);
  }

  buildBaseGrid() {
    // Ground foundation
    const groundGeo = new THREE.PlaneGeometry(140, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070a12,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle grid helper
    const grid = new THREE.GridHelper(100, 50, 0x1e293b, 0x0f172a);
    grid.position.y = 0;
    this.scene.add(grid);

    // Floating cyber dust particles
    const particleCount = 250;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 90;
      positions[i + 1] = Math.random() * 30 + 1;
      positions[i + 2] = (Math.random() - 0.5) * 80;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.35,
      transparent: true,
      opacity: 0.45,
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

      // 1. Floor Plate
      const floorGeo = new THREE.BoxGeometry(office.size.w, 0.4, office.size.d);
      const floorMat = new THREE.MeshStandardMaterial({
        color: office.floorColor,
        roughness: 0.35,
        metalness: 0.25
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
        opacity: 0.75
      });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = 0.42;
      roomGroup.add(frame);

      // 2. Translucent Glass Walls
      const wallMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.75,
        ior: 1.5
      });

      // Back Wall
      const backWallGeo = new THREE.BoxGeometry(office.size.w - 0.4, 2.5, 0.2);
      const backWall = new THREE.Mesh(backWallGeo, wallMat);
      backWall.position.set(0, 1.6, -office.size.d / 2 + 0.2);
      roomGroup.add(backWall);

      // Side Wall Left
      const sideWallGeo = new THREE.BoxGeometry(0.2, 2.5, office.size.d - 0.4);
      const sideWall = new THREE.Mesh(sideWallGeo, wallMat);
      sideWall.position.set(-office.size.w / 2 + 0.2, 1.6, 0);
      roomGroup.add(sideWall);

      // 3. Room PointLight for Ambient Glow
      const roomLight = new THREE.PointLight(office.glowColor, 3.2, 16);
      roomLight.position.set(0, 5.0, 0);
      roomGroup.add(roomLight);

      // 4. Floating 3D Room Title Billboard
      this.createRoomBadge(roomGroup, office);

      // 5. Props
      this.buildRoomProps(roomGroup, office);

      // 6. Real Stylized Humanoid Characters (Omini) with desks and chairs!
      this.buildHumanoidAgents(roomGroup, office);

      this.scene.add(roomGroup);

      // Register floor for raycasting
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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
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
    sprite.scale.set(6.5, 1.6, 1);
    sprite.position.set(0, 5.8, -office.size.d / 2 + 0.4);
    roomGroup.add(sprite);
  }

  buildRoomProps(roomGroup, office) {
    switch (office.id) {
      case 'generale': {
        // Floating Golden Antigravity Core
        const coreGeo = new THREE.OctahedronGeometry(0.9, 0);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.7,
          metalness: 0.9,
          roughness: 0.1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 3.2, 0);
        roomGroup.add(core);

        this.animatedMeshes.push({
          mesh: core,
          animate: (time) => {
            core.rotation.y = time * 0.9;
            core.rotation.x = time * 0.5;
            core.position.y = 3.2 + Math.sin(time * 2) * 0.18;
          }
        });
        break;
      }

      case 'videostudio': {
        // Studio Light Tripod & Softbox
        const softboxGeo = new THREE.BoxGeometry(1.2, 1.6, 0.4);
        const softboxMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });
        const softbox = new THREE.Mesh(softboxGeo, softboxMat);
        softbox.position.set(3.8, 3.2, 2.2);
        softbox.rotation.y = -Math.PI / 4;
        roomGroup.add(softbox);

        // Film Tripod Camera
        const camBodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.0);
        const camMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
        const camBody = new THREE.Mesh(camBodyGeo, camMat);
        camBody.position.set(-3.6, 2.4, 2.0);
        camBody.rotation.y = Math.PI / 4;
        roomGroup.add(camBody);

        // Red tally LED on camera
        const tallyGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const tallyMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const tally = new THREE.Mesh(tallyGeo, tallyMat);
        tally.position.set(-3.4, 2.8, 1.8);
        roomGroup.add(tally);
        break;
      }

      case 'homelab': {
        // 2 Cyber Server Racks with Blinking LEDs
        for (let i = -1; i <= 1; i += 2) {
          const rackGeo = new THREE.BoxGeometry(1.6, 4.2, 1.4);
          const rackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
          const rack = new THREE.Mesh(rackGeo, rackMat);
          rack.position.set(i * 3.8, 2.4, -2.6);
          rack.castShadow = true;
          roomGroup.add(rack);

          // LED strips on racks
          const ledGeo = new THREE.BoxGeometry(1.3, 0.1, 0.05);
          for (let j = 0; j < 6; j++) {
            const ledMat = new THREE.MeshBasicMaterial({ color: j % 2 === 0 ? 0x06b6d4 : 0x10b981 });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(i * 3.8, 1.0 + j * 0.55, -1.88);
            roomGroup.add(led);
          }
        }
        break;
      }

      case 'takeoff': {
        // Animated 3D Analytics Bar Charts in corner
        for (let b = 0; b < 3; b++) {
          const h = 1.0 + b * 0.6;
          const barGeo = new THREE.BoxGeometry(0.45, h, 0.45);
          const barMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.4 });
          const bar = new THREE.Mesh(barGeo, barMat);
          bar.position.set(3.4 + b * 0.6, 0.4 + h / 2, -2.8);
          roomGroup.add(bar);

          this.animatedMeshes.push({
            mesh: bar,
            initialY: 0.4 + h / 2,
            animate: (time) => {
              bar.scale.y = 1 + Math.sin(time * 3 + b) * 0.2;
            }
          });
        }
        break;
      }

      case 'ricette': {
        // Baking table & Plumcake
        const loafGeo = new THREE.BoxGeometry(2.0, 0.6, 0.8);
        const loafMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const loaf = new THREE.Mesh(loafGeo, loafMat);
        loaf.position.set(3.2, 1.8, -2.5);
        loaf.castShadow = true;
        roomGroup.add(loaf);
        break;
      }

      case 'viaggi': {
        // Floating Mini Jet
        const planeGroup = new THREE.Group();
        const fuselageGeo = new THREE.ConeGeometry(0.4, 2.0, 16);
        const planeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4, roughness: 0.2 });
        const fuselage = new THREE.Mesh(fuselageGeo, planeMat);
        fuselage.rotation.x = Math.PI / 2;
        planeGroup.add(fuselage);

        const wingGeo = new THREE.BoxGeometry(2.4, 0.06, 0.6);
        const wing = new THREE.Mesh(wingGeo, planeMat);
        wing.position.set(0, 0, 0.3);
        planeGroup.add(wing);

        planeGroup.position.set(0, 4.0, 0);
        roomGroup.add(planeGroup);

        this.animatedMeshes.push({
          mesh: planeGroup,
          animate: (time) => {
            planeGroup.position.y = 4.0 + Math.sin(time * 2.5) * 0.3;
            planeGroup.rotation.y = time * 0.6;
            planeGroup.rotation.z = Math.sin(time * 2.5) * 0.15;
          }
        });
        break;
      }
    }
  }

  /**
   * Builds real stylized humanoid characters ("omini") complete with:
   * - Head, face/glasses, torso, arms, hands, legs, shoes
   * - Office desk + ergonomic chair + laptop
   * - Floating Billboard Name Tag above head
   * - Typing & breathing animation
   */
  buildHumanoidAgents(roomGroup, office) {
    const agentCount = office.agents.length;
    const spacing = (office.size.w - 3.0) / Math.max(1, agentCount);

    office.agents.forEach((agent, idx) => {
      const ominoGroup = new THREE.Group();

      const posX = -office.size.w / 2 + 1.8 + idx * spacing + (agentCount === 1 ? 2.5 : 0.8);
      const posZ = (idx % 2 === 0) ? -0.5 : 1.2;
      ominoGroup.position.set(posX, 0.4, posZ);
      ominoGroup.userData = { isAgent: true, agentData: agent, officeId: office.id };

      // 1. DESK & WORKSTATION
      const deskGeo = new THREE.BoxGeometry(2.4, 0.15, 1.2);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.2 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0, 1.2, 0.2);
      desk.castShadow = true;
      desk.receiveShadow = true;
      ominoGroup.add(desk);

      // Desk Legs (metal)
      const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      for (let dx = -1.0; dx <= 1.0; dx += 2.0) {
        for (let dz = -0.45; dz <= 0.45; dz += 0.9) {
          const deskLegGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
          const deskLeg = new THREE.Mesh(deskLegGeo, legMat);
          deskLeg.position.set(dx, 0.6, 0.2 + dz);
          ominoGroup.add(deskLeg);
        }
      }

      // Laptop on Desk with glowing screen
      const laptopBaseGeo = new THREE.BoxGeometry(0.7, 0.04, 0.5);
      const laptopMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
      laptopBase.position.set(0, 1.3, 0.2);
      ominoGroup.add(laptopBase);

      const laptopScreenGeo = new THREE.BoxGeometry(0.7, 0.45, 0.03);
      const laptopScreenMat = new THREE.MeshBasicMaterial({ color: office.glowColor });
      const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopScreenMat);
      laptopScreen.position.set(0, 1.52, -0.05);
      laptopScreen.rotation.x = -0.25;
      ominoGroup.add(laptopScreen);

      // Coffee Mug
      const mugGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.16, 12);
      const mugMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const mug = new THREE.Mesh(mugGeo, mugMat);
      mug.position.set(0.75, 1.35, 0.35);
      ominoGroup.add(mug);

      // 2. ERGONOMIC CHAIR
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const chairSeatGeo = new THREE.BoxGeometry(0.9, 0.12, 0.9);
      const chairSeat = new THREE.Mesh(chairSeatGeo, chairMat);
      chairSeat.position.set(0, 0.85, 1.0);
      ominoGroup.add(chairSeat);

      const chairBackGeo = new THREE.BoxGeometry(0.9, 1.1, 0.12);
      const chairBack = new THREE.Mesh(chairBackGeo, chairMat);
      chairBack.position.set(0, 1.45, 1.4);
      ominoGroup.add(chairBack);

      // 3. HUMANOID BODY (L'OMINO!)
      const ominoBody = new THREE.Group();
      ominoBody.position.set(0, 0.9, 0.9);

      // Torso with colored clothes (felpa/giacca con colore dell'agente)
      const torsoGeo = new THREE.BoxGeometry(0.85, 1.0, 0.5);
      const torsoMat = new THREE.MeshStandardMaterial({
        color: agent.avatarColor,
        roughness: 0.4,
        metalness: 0.1
      });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 0.5;
      torso.castShadow = true;
      ominoBody.add(torso);

      // Head (testa)
      const headGeo = new THREE.SphereGeometry(0.42, 16, 16);
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 }); // tonalità pelle chiara/anime
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.set(0, 1.3, 0);
      head.castShadow = true;
      ominoBody.add(head);

      // Hair / Hat / Accessories based on role
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const hairGeo = new THREE.SphereGeometry(0.44, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 1.35, 0);
      ominoBody.add(hair);

      // Eyes (visore cyber o occhiali carini)
      const glassesGeo = new THREE.BoxGeometry(0.5, 0.14, 0.1);
      const glassesMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
      const glasses = new THREE.Mesh(glassesGeo, glassesMat);
      glasses.position.set(0, 1.3, -0.4);
      ominoBody.add(glasses);

      // Arms & Hands (Braccia che digitano sulla tastiera!)
      const armMat = torsoMat;
      const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.65, 8);

      // Left Arm
      const leftArm = new THREE.Mesh(armGeo, armMat);
      leftArm.position.set(-0.55, 0.45, -0.3);
      leftArm.rotation.x = Math.PI / 3;
      leftArm.rotation.z = -0.2;
      ominoBody.add(leftArm);

      // Right Arm
      const rightArm = new THREE.Mesh(armGeo, armMat);
      rightArm.position.set(0.55, 0.45, -0.3);
      rightArm.rotation.x = Math.PI / 3;
      rightArm.rotation.z = 0.2;
      ominoBody.add(rightArm);

      // Hands (mani)
      const handGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const leftHand = new THREE.Mesh(handGeo, skinMat);
      leftHand.position.set(-0.35, 0.35, -0.65);
      ominoBody.add(leftHand);

      const rightHand = new THREE.Mesh(handGeo, skinMat);
      rightHand.position.set(0.35, 0.35, -0.65);
      ominoBody.add(rightHand);

      // Legs (gambe sedute)
      const legMatPants = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
      const legUpperGeo = new THREE.BoxGeometry(0.28, 0.25, 0.7);

      const leftLeg = new THREE.Mesh(legUpperGeo, legMatPants);
      leftLeg.position.set(-0.25, 0.05, -0.35);
      ominoBody.add(leftLeg);

      const rightLeg = new THREE.Mesh(legUpperGeo, legMatPants);
      rightLeg.position.set(0.25, 0.05, -0.35);
      ominoBody.add(rightLeg);

      ominoGroup.add(ominoBody);

      // 4. FLOATING 3D NAME TAG BILLBOARD ABOVE HEAD
      this.createAgentNameTag(ominoGroup, agent, office);

      roomGroup.add(ominoGroup);

      // Register omino for Raycaster click & hover
      torso.userData = { isAgent: true, agentData: agent, officeId: office.id };
      head.userData = { isAgent: true, agentData: agent, officeId: office.id };
      this.interactiveObjects.push(torso, head);
      this.agentMeshes.push(ominoGroup);

      // 5. Typing & breathing animation
      this.animatedMeshes.push({
        mesh: ominoBody,
        animate: (time) => {
          // Breathing motion
          ominoBody.position.y = 0.9 + Math.sin(time * 2.5 + idx) * 0.04;
          head.rotation.x = Math.sin(time * 3 + idx) * 0.05;

          // Typing hands motion
          leftHand.position.y = 0.35 + Math.sin(time * 12 + idx) * 0.03;
          rightHand.position.y = 0.35 + Math.cos(time * 12 + idx) * 0.03;
        }
      });
    });
  }

  createAgentNameTag(ominoGroup, agent, office) {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Rounded background container
    ctx.fillStyle = 'rgba(11, 15, 25, 0.92)';
    ctx.roundRect(8, 8, 364, 84, 20);
    ctx.fill();

    ctx.strokeStyle = agent.avatarColor;
    ctx.lineWidth = 5;
    ctx.roundRect(8, 8, 364, 84, 20);
    ctx.stroke();

    // Status Dot
    ctx.fillStyle = agent.status.includes('Online') || agent.status.includes('Attivo') ? '#10b981' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(36, 50, 10, 0, Math.PI * 2);
    ctx.fill();

    // Agent Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(agent.name, 62, 50);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 0.85, 1);
    sprite.position.set(0, 3.2, 0.9);
    ominoGroup.add(sprite);
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
    this.targetCamPos.set(office.gridPos.x, 14, office.gridPos.z + 16);
  }

  setupEvents() {
    window.addEventListener('resize', this.onResize.bind(this));

    const dom = this.renderer.domElement;

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

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.05;
      this.targetCamPos.y = THREE.MathUtils.clamp(this.targetCamPos.y + zoomFactor, 8, 70);
      this.targetCamPos.z = THREE.MathUtils.clamp(this.targetCamPos.z + zoomFactor, 12, 85);
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
        this.targetCamPos.y = THREE.MathUtils.clamp(this.targetCamPos.y + delta, 8, 70);
        this.targetCamPos.z = THREE.MathUtils.clamp(this.targetCamPos.z + delta, 12, 85);
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

    // Run animations for props and omini
    for (const item of this.animatedMeshes) {
      if (item.animate) {
        item.animate(time);
      }
    }

    if (this.particles) {
      this.particles.rotation.y = time * 0.015;
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
