import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { BRAND_COLORS } from '../../utils/categoryColors';

/**
 * PossibilityEngine3D — Fully Interactive 3D Innovation Ecosystem
 * 
 * Background:
 * - Sleek deep dark canvas with ambient purple-blue radial glow for high-contrast neon luminescence
 * 
 * Interactive Elements:
 * 1. ✦ IDEA (Purple #7C3AED): Glowing crystalline spark with animated orbiting particle cloud
 * 2. ◈ PRODUCT (Electric Blue #2563EB): 4 modular cubes that smoothly separate and reassemble
 * 3. △ STARTUP (Teal #14B8A6): Floating geometric pyramid that expands with wireframe resonance
 * 4. ◎ COMMUNITY (Warm Gold #FBBF24): Connected validator nodes with pulsing golden network arcs
 * 5. ◉ INSIGHTS (Pink #EC4899): Signal lens with rotating scanning focal beam
 * 6. ◆ CENTRAL CORE (Purple Crystal): Translucent faceted polyhedron with pulsing light wave
 * 
 * Features:
 * - Large generous hit-spheres for effortless clicking and hovering
 * - Real-time smooth lerping animations
 * - Mouse parallax & rotation inertia
 * - Travelling signal pulses along neural network lines
 * - Direct click navigation to workspaces
 */

const ECOSYSTEM_ELEMENTS = [
  {
    id: 'IDEA',
    name: 'IDEAS',
    action: 'Create & Submit',
    subtitle: 'Every great innovation starts as a spark.',
    color: BRAND_COLORS.purple,
    hexColor: '#7C3AED',
    targetTab: 'submit',
    basePos: [-2.5, 0.6, 0.4],
    floatOffset: 0.0
  },
  {
    id: 'PRODUCT',
    name: 'PRODUCTS',
    action: 'Inspect Architecture',
    subtitle: 'Build modular solutions that matter.',
    color: BRAND_COLORS.blue,
    hexColor: '#2563EB',
    targetTab: 'explore',
    basePos: [0.1, 2.1, 0.2],
    floatOffset: 1.2
  },
  {
    id: 'STARTUP',
    name: 'STARTUPS',
    action: 'Explore Ventures',
    subtitle: 'Shape the future one step at a time.',
    color: BRAND_COLORS.teal,
    hexColor: '#0F9D8A',
    targetTab: 'explore',
    basePos: [2.4, 0.8, -0.2],
    floatOffset: 2.4
  },
  {
    id: 'COMMUNITY',
    name: 'COMMUNITY',
    action: 'Join Peer Desk',
    subtitle: 'People. Perspectives. Progress together.',
    color: BRAND_COLORS.gold,
    hexColor: '#E5A93D',
    targetTab: 'queue',
    basePos: [-1.7, -1.8, 0.3],
    floatOffset: 3.6
  },
  {
    id: 'INSIGHTS',
    name: 'INSIGHTS',
    action: 'View AI Signals',
    subtitle: 'Turn feedback into meaningful direction.',
    color: BRAND_COLORS.pink,
    hexColor: '#D946A6',
    targetTab: 'insight',
    basePos: [1.8, -1.7, 0.4],
    floatOffset: 4.8
  }
];

export default function PossibilityEngine3D({
  height = 480,
  isConverging = false,
  onSelectNode = () => {}
}) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [activeElementId, setActiveElementId] = useState(null);
  const [clickFeedback, setClickFeedback] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasWebGL(false);
      return;
    }

    let width = container.clientWidth || 540;
    let heightPx = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 8.4);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, heightPx);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
    } catch (e) {
      setHasWebGL(false);
      return;
    }

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0x1E293B, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    dirLight1.position.set(-6, 8, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7C3AED, 1.0);
    dirLight2.position.set(6, -6, 6);
    scene.add(dirLight2);

    const coreLight = new THREE.PointLight(0x7C3AED, 2.5, 8);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Hit test meshes collection
    const interactiveHitMeshes = [];

    // Helper: Create invisible generous hit sphere
    const createHitSphere = (id, radius = 0.65) => {
      const hitGeom = new THREE.SphereGeometry(radius, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.userData = { id };
      interactiveHitMeshes.push(hitMesh);
      return hitMesh;
    };

    // =========================================================================
    // 1. CENTRAL INNOVEXA CORE (Translucent Faceted Crystal)
    // =========================================================================
    const coreGroup = new THREE.Group();
    rootGroup.add(coreGroup);

    const coreGeom = new THREE.IcosahedronGeometry(0.95, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x9333EA,
      emissive: new THREE.Color(0x7C3AED),
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.75,
      transparent: true,
      opacity: 0.88,
      reflectivity: 0.9
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreGroup.add(coreMesh);

    // Crisp luminous edges
    const coreEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(coreGeom),
      new THREE.LineBasicMaterial({ color: 0xC084FC, transparent: true, opacity: 0.85, linewidth: 2 })
    );
    coreMesh.add(coreEdges);

    // Inner wireframe energy sphere
    const innerGeom = new THREE.OctahedronGeometry(0.55, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    coreMesh.add(innerMesh);

    const coreHit = createHitSphere('CORE', 1.05);
    coreGroup.add(coreHit);

    // Shockwave pulse ring on click
    const shockwaveGeom = new THREE.RingGeometry(0.1, 0.18, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xC084FC,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeom, shockwaveMat);
    shockwaveMesh.rotation.x = Math.PI / 2;
    coreGroup.add(shockwaveMesh);
    let shockwaveProgress = 1.0;

    // =========================================================================
    // 2. SURROUNDING 5 INDEPENDENT INNOVATION ELEMENTS
    // =========================================================================
    const elementsGroup = new THREE.Group();
    rootGroup.add(elementsGroup);

    // --- A. IDEA: Glowing Purple Spark & Swirling Particle Field ---
    const ideaGroup = new THREE.Group();
    const ideaCoreGeom = new THREE.OctahedronGeometry(0.42, 0);
    const ideaCoreMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(0x9333EA),
      emissiveIntensity: 1.2,
      roughness: 0.15
    });
    const ideaMesh = new THREE.Mesh(ideaCoreGeom, ideaCoreMat);
    ideaGroup.add(ideaMesh);

    const ideaEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(ideaCoreGeom),
      new THREE.LineBasicMaterial({ color: 0xF3E8FF, transparent: true, opacity: 0.9 })
    );
    ideaMesh.add(ideaEdges);

    // Spark Particles
    const sparkCount = 32;
    const sparkGeom = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const radius = 0.45 + Math.random() * 0.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      sparkPositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      sparkPositions[i * 3 + 1] = radius * Math.sin(phi);
      sparkPositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xC084FC,
      size: 0.08,
      transparent: true,
      opacity: 0.9
    });
    const sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    ideaGroup.add(sparkPoints);

    const ideaHit = createHitSphere('IDEA', 0.7);
    ideaGroup.add(ideaHit);
    elementsGroup.add(ideaGroup);

    // --- B. PRODUCT: 4 Modular Glowing Cubes (Separate / Reassemble) ---
    const prodGroup = new THREE.Group();
    const cubeGeom = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const prodMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(0x2563EB),
      emissiveIntensity: 1.1,
      roughness: 0.2
    });
    const p1 = new THREE.Mesh(cubeGeom, prodMat);
    const p2 = new THREE.Mesh(cubeGeom, prodMat);
    const p3 = new THREE.Mesh(cubeGeom, prodMat);
    const p4 = new THREE.Mesh(cubeGeom, prodMat);

    [p1, p2, p3, p4].forEach(p => {
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(cubeGeom),
        new THREE.LineBasicMaterial({ color: 0x93C5FD, transparent: true, opacity: 0.85 })
      );
      p.add(edge);
      prodGroup.add(p);
    });

    const prodHit = createHitSphere('PRODUCT', 0.75);
    prodGroup.add(prodHit);
    elementsGroup.add(prodGroup);

    // --- C. STARTUP: Floating Teal Pyramid / Geometric Crystal ---
    const startGroup = new THREE.Group();
    const pyrGeom = new THREE.ConeGeometry(0.38, 0.7, 4);
    const startMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(0x14B8A6),
      emissiveIntensity: 1.1,
      roughness: 0.2
    });
    const startMesh = new THREE.Mesh(pyrGeom, startMat);
    startGroup.add(startMesh);

    const startEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(pyrGeom),
      new THREE.LineBasicMaterial({ color: 0x99F6E4, transparent: true, opacity: 0.9 })
    );
    startMesh.add(startEdges);

    // Outer wireframe resonance halo
    const startHaloGeom = new THREE.ConeGeometry(0.48, 0.85, 4);
    const startHaloMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const startHalo = new THREE.Mesh(startHaloGeom, startHaloMat);
    startGroup.add(startHalo);

    const startHit = createHitSphere('STARTUP', 0.7);
    startGroup.add(startHit);
    elementsGroup.add(startGroup);

    // --- D. COMMUNITY: Connected Golden Validator Nodes ---
    const commGroup = new THREE.Group();
    const nodeGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const commMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(0xF59E0B),
      emissiveIntensity: 1.2,
      roughness: 0.25
    });
    const c1 = new THREE.Mesh(nodeGeom, commMat);
    const c2 = new THREE.Mesh(nodeGeom, commMat);
    const c3 = new THREE.Mesh(nodeGeom, commMat);
    commGroup.add(c1);
    commGroup.add(c2);
    commGroup.add(c3);

    // Connection Arcs between community members
    const commLineGeom = new THREE.BufferGeometry();
    const commLinePos = new Float32Array(3 * 2 * 3);
    commLineGeom.setAttribute('position', new THREE.BufferAttribute(commLinePos, 3));
    const commLineMat = new THREE.LineBasicMaterial({ color: 0xFDE68A, transparent: true, opacity: 0.8, linewidth: 1.5 });
    const commLineMesh = new THREE.LineSegments(commLineGeom, commLineMat);
    commGroup.add(commLineMesh);

    const commHit = createHitSphere('COMMUNITY', 0.75);
    commGroup.add(commHit);
    elementsGroup.add(commGroup);

    // --- E. INSIGHTS: Signal Scanning Lens (Pink) ---
    const lensGroup = new THREE.Group();
    const torusGeom = new THREE.TorusGeometry(0.35, 0.05, 16, 32);
    const lensRingMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(0xEC4899),
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    const lensRing = new THREE.Mesh(torusGeom, lensRingMat);
    lensGroup.add(lensRing);

    // Translucent Glass Center Lens
    const discGeom = new THREE.CircleGeometry(0.3, 24);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0xF472B6,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const discMesh = new THREE.Mesh(discGeom, discMat);
    lensGroup.add(discMesh);

    // Scanning Light Ray
    const rayGeom = new THREE.CylinderGeometry(0.02, 0.35, 0.8, 16, 1, true);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xF472B6,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const rayMesh = new THREE.Mesh(rayGeom, rayMat);
    rayMesh.rotation.x = Math.PI / 2;
    lensGroup.add(rayMesh);

    const lensHit = createHitSphere('INSIGHTS', 0.7);
    lensGroup.add(lensHit);
    elementsGroup.add(lensGroup);

    // =========================================================================
    // 3. DIGITAL NEURAL NETWORK LINES & SIGNALS
    // =========================================================================
    const elementGroups = [
      { id: 'IDEA', group: ideaGroup, config: ECOSYSTEM_ELEMENTS[0] },
      { id: 'PRODUCT', group: prodGroup, config: ECOSYSTEM_ELEMENTS[1] },
      { id: 'STARTUP', group: startGroup, config: ECOSYSTEM_ELEMENTS[2] },
      { id: 'COMMUNITY', group: commGroup, config: ECOSYSTEM_ELEMENTS[3] },
      { id: 'INSIGHTS', group: lensGroup, config: ECOSYSTEM_ELEMENTS[4] }
    ];

    // Neural Network Lines
    const neuralLineGeom = new THREE.BufferGeometry();
    const neuralLinePos = new Float32Array(5 * 2 * 3);
    neuralLineGeom.setAttribute('position', new THREE.BufferAttribute(neuralLinePos, 3));
    const neuralLineMat = new THREE.LineBasicMaterial({
      color: 0x64748B,
      transparent: true,
      opacity: 0.45,
      linewidth: 1.5
    });
    const neuralLinesMesh = new THREE.LineSegments(neuralLineGeom, neuralLineMat);
    rootGroup.add(neuralLinesMesh);

    // Travelling Signal Light Packets
    const pulseCount = 5;
    const pulseGeom = new THREE.BufferGeometry();
    const pulsePositions = new Float32Array(pulseCount * 3);
    pulseGeom.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
    const pulseMat = new THREE.PointsMaterial({
      color: 0xC084FC,
      size: 0.16,
      transparent: true,
      opacity: 0.95
    });
    const pulsePoints = new THREE.Points(pulseGeom, pulseMat);
    rootGroup.add(pulsePoints);

    // =========================================================================
    // 4. RAYCASTING, HOVER & CLICK ACTIONS
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredId = null;
    let targetCameraX = 0;
    let targetCameraY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / heightPx) * 2 - 1);
      mouse.x = x;
      mouse.y = y;

      targetCameraX = x * 0.55;
      targetCameraY = y * 0.35;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveHitMeshes);

      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData?.id;
        if (hitId && hitId !== currentHoveredId) {
          currentHoveredId = hitId;
          setActiveElementId(hitId === 'CORE' ? 'INNOVEXA' : hitId);
          container.style.cursor = 'pointer';
        }
      } else {
        if (currentHoveredId) {
          currentHoveredId = null;
          setActiveElementId(null);
          container.style.cursor = 'default';
        }
      }
    };

    const handleClick = () => {
      if (currentHoveredId) {
        // Trigger Core shockwave animation
        shockwaveProgress = 0.0;

        // Visual flash feedback
        const el = ECOSYSTEM_ELEMENTS.find(e => e.id === currentHoveredId);
        const name = el ? el.name : 'INNOVEXA CORE';
        setClickFeedback(name);
        setTimeout(() => setClickFeedback(null), 1200);

        if (currentHoveredId === 'CORE') {
          onSelectNode('IDEA');
        } else {
          onSelectNode(currentHoveredId);
        }
      }
    };

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 540;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    let animationId;
    let startTime = performance.now();
    let isPaused = false;

    const onVisibilityChange = () => { isPaused = document.hidden; };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // =========================================================================
    // 5. ANIMATION LOOP (Lively, Physics-Inspired Motion)
    // =========================================================================
    const render = () => {
      if (!isPaused) {
        const now = performance.now();
        const elapsed = (now - startTime) / 1000;

        // Camera smooth parallax
        camera.position.x += (targetCameraX - camera.position.x) * 0.06;
        camera.position.y += (targetCameraY - camera.position.y) * 0.06;
        camera.lookAt(0, 0, 0);

        // Core slow rotation and floating
        coreMesh.rotation.x = elapsed * 0.15;
        coreMesh.rotation.y = elapsed * 0.22;
        coreGroup.position.y = Math.sin(elapsed * 0.8) * 0.08;
        innerMesh.rotation.y = -elapsed * 0.4;
        innerMesh.rotation.z = elapsed * 0.3;

        // Animate shockwave on click
        if (shockwaveProgress < 1.0) {
          shockwaveProgress += 0.035;
          const s = 1.0 + shockwaveProgress * 3.5;
          shockwaveMesh.scale.set(s, s, s);
          shockwaveMat.opacity = Math.max(0, (1.0 - shockwaveProgress) * 0.9);
        }

        // Update each surrounding element with rich responsive animations
        const linePosAttr = neuralLineGeom.attributes.position;
        const pulsePosAttr = pulseGeom.attributes.position;

        elementGroups.forEach((item, idx) => {
          const cfg = item.config;
          const isHovered = (currentHoveredId === item.id);

          const convFactor = isConverging ? 0.25 : 1.0;

          // Organic floating offsets
          const floatY = Math.sin(elapsed * 1.3 + cfg.floatOffset) * 0.12;
          const floatX = Math.cos(elapsed * 0.95 + cfg.floatOffset) * 0.08;

          const targetX = cfg.basePos[0] * convFactor + floatX;
          const targetY = cfg.basePos[1] * convFactor + floatY;
          const targetZ = cfg.basePos[2] * convFactor;

          item.group.position.x += (targetX - item.group.position.x) * 0.1;
          item.group.position.y += (targetY - item.group.position.y) * 0.1;
          item.group.position.z += (targetZ - item.group.position.z) * 0.1;

          // 1. IDEA: Pulsing spark and rotating particles
          if (item.id === 'IDEA') {
            const targetScale = isHovered ? 1.35 : 1.0;
            ideaMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
            ideaCoreMat.emissiveIntensity = isHovered ? 2.0 : 1.2;
            ideaMesh.rotation.y = elapsed * 0.8;
            ideaMesh.rotation.x = elapsed * 0.5;

            sparkPoints.rotation.y = elapsed * (isHovered ? 1.6 : 0.6);
            sparkPoints.rotation.z = elapsed * 0.4;
          }

          // 2. PRODUCT: Modular cubes dynamically separate and reconnect
          else if (item.id === 'PRODUCT') {
            const sep = isHovered ? 0.38 : 0.18;
            const lift = isHovered ? 0.38 : 0.22;

            p1.position.lerp(new THREE.Vector3(-sep, -sep * 0.8, sep * 0.5), 0.12);
            p2.position.lerp(new THREE.Vector3(sep, -sep * 0.6, -sep * 0.5), 0.12);
            p3.position.lerp(new THREE.Vector3(-sep * 0.3, lift, sep * 0.3), 0.12);
            p4.position.lerp(new THREE.Vector3(sep * 0.5, lift * 0.9, -sep * 0.2), 0.12);

            p1.rotation.y = elapsed * 0.6;
            p2.rotation.x = elapsed * 0.7;
            p3.rotation.z = elapsed * 0.5;
            p4.rotation.y = -elapsed * 0.8;
          }

          // 3. STARTUP: Pyramid expands and emits energy halo
          else if (item.id === 'STARTUP') {
            const targetScale = isHovered ? 1.3 : 1.0;
            startMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
            startMesh.rotation.y = elapsed * (isHovered ? 1.4 : 0.5);
            startHalo.rotation.y = -elapsed * 0.8;
            startHaloMat.opacity = isHovered ? 0.7 : 0.3;
          }

          // 4. COMMUNITY: Nodes orbit each other and converge on hover
          else if (item.id === 'COMMUNITY') {
            const spread = isHovered ? 0.18 : 0.32;
            const angle = elapsed * (isHovered ? 2.0 : 0.8);

            c1.position.set(Math.cos(angle) * spread, Math.sin(angle) * spread * 0.7, 0);
            c2.position.set(Math.cos(angle + (Math.PI * 2) / 3) * spread, Math.sin(angle + (Math.PI * 2) / 3) * spread * 0.7, 0);
            c3.position.set(Math.cos(angle + (Math.PI * 4) / 3) * spread, Math.sin(angle + (Math.PI * 4) / 3) * spread * 0.7, 0.08);

            // Update golden arcs between nodes
            const pArr = commLineGeom.attributes.position.array;
            pArr[0] = c1.position.x; pArr[1] = c1.position.y; pArr[2] = c1.position.z;
            pArr[3] = c2.position.x; pArr[4] = c2.position.y; pArr[5] = c2.position.z;
            pArr[6] = c2.position.x; pArr[7] = c2.position.y; pArr[8] = c2.position.z;
            pArr[9] = c3.position.x; pArr[10] = c3.position.y; pArr[11] = c3.position.z;
            pArr[12] = c3.position.x; pArr[13] = c3.position.y; pArr[14] = c3.position.z;
            pArr[15] = c1.position.x; pArr[16] = c1.position.y; pArr[17] = c1.position.z;
            commLineGeom.attributes.position.needsUpdate = true;
          }

          // 5. INSIGHTS: Signal lens scans and projects light ray
          else if (item.id === 'INSIGHTS') {
            lensRing.rotation.z = elapsed * (isHovered ? 1.8 : 0.5);
            lensRing.rotation.x = Math.sin(elapsed * 0.9) * 0.3;
            discMat.opacity = isHovered ? 0.75 : 0.45;
            rayMesh.scale.set(isHovered ? 1.4 : 1.0, isHovered ? 1.6 : 1.0, isHovered ? 1.4 : 1.0);
            rayMat.opacity = isHovered ? 0.5 : 0.2;
          }

          // Update neural connection lines from Core (0,0,0) to element
          linePosAttr.setXYZ(idx * 2, 0, coreGroup.position.y, 0);
          linePosAttr.setXYZ(idx * 2 + 1, item.group.position.x, item.group.position.y, item.group.position.z);

          // Update travelling signal pulses
          const pulseSpeed = isHovered ? 2.2 : 0.9;
          const pulseT = ((elapsed * pulseSpeed + idx * 0.2) % 1.0);
          const px = item.group.position.x * pulseT;
          const py = coreGroup.position.y * (1 - pulseT) + item.group.position.y * pulseT;
          const pz = item.group.position.z * pulseT;
          pulsePosAttr.setXYZ(idx, px, py, pz);
        });

        linePosAttr.needsUpdate = true;
        pulsePosAttr.needsUpdate = true;

        if (currentHoveredId) {
          neuralLineMat.opacity = 0.85;
          pulseMat.size = 0.22;
        } else {
          neuralLineMat.opacity = 0.4;
          pulseMat.size = 0.14;
        }

        renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [height, isConverging, onSelectNode]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      userSelect: 'none',
      backgroundColor: '#17171F',
      backgroundImage: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.22) 0%, rgba(23, 23, 31, 0.95) 75%, #17171F 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(124, 58, 237, 0.3)',
      boxShadow: '0 20px 50px rgba(23, 23, 31, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      overflow: 'hidden'
    }}>
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: `${height}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!hasWebGL && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#FFFFFF' }}>
            <div className="editorial-index" style={{ color: 'var(--color-purple)', marginBottom: '0.5rem' }}>
              ✦ INNOVEXA INNOVATION ECOSYSTEM
            </div>
            <p className="editorial-lead" style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Ideas • Products • Startups • Community • Insights
            </p>
          </div>
        )}
      </div>

      {/* Click Feedback Toast */}
      {clickFeedback && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(124, 58, 237, 0.95)',
          color: '#FFFFFF',
          padding: '0.4rem 1.25rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-sans)',
          fontWeight: 800,
          letterSpacing: '0.08em',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.6)',
          zIndex: 10,
          animation: 'modalPop 0.2s ease forwards'
        }}>
          ✦ OPENING {clickFeedback}...
        </div>
      )}

      {/* Floating HUD / Interactive Text Overlays for the 5 Elements */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        left: '14px',
        right: '14px',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {/* Active Element Display Card */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1.1rem',
          maxWidth: '340px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          pointerEvents: 'auto',
          transition: 'all 0.2s ease'
        }}>
          {activeElementId ? (
            (() => {
              const el = ECOSYSTEM_ELEMENTS.find(e => e.id === activeElementId);
              if (!el) {
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C084FC' }} />
                      <span className="editorial-index" style={{ color: '#C084FC', fontSize: '0.78rem', fontWeight: 800 }}>
                        INNOVEXA CORE
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#E2E8F0', lineHeight: '1.3' }}>
                      The central innovation ecosystem uniting creators, validators, and builders.
                    </p>
                  </div>
                );
              }
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: el.hexColor }} />
                      <span className="editorial-index" style={{ color: el.hexColor, fontSize: '0.78rem', fontWeight: 800 }}>
                        {el.name}
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                      CLICK TO OPEN ↗
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#E2E8F0', lineHeight: '1.3' }}>
                    {el.subtitle}
                  </p>
                </div>
              );
            })()
          ) : (
            <div>
              <div className="editorial-index" style={{ color: '#C084FC', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                ✦ THE INNOVATION NETWORK
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                Click & hover any 3D node to inspect and enter.
              </p>
            </div>
          )}
        </div>

        {/* 5 Node Quick Badges with Glow */}
        <div style={{
          display: 'flex',
          gap: '0.45rem',
          flexWrap: 'wrap',
          pointerEvents: 'auto'
        }}>
          {ECOSYSTEM_ELEMENTS.map(el => {
            const isActive = (activeElementId === el.id);
            return (
              <button
                key={el.id}
                onClick={() => {
                  onSelectNode(el.id);
                  setClickFeedback(el.name);
                  setTimeout(() => setClickFeedback(null), 1200);
                }}
                onMouseEnter={() => setActiveElementId(el.id)}
                onMouseLeave={() => setActiveElementId(null)}
                style={{
                  padding: '0.32rem 0.65rem',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--radius-xs)',
                  border: `1px solid ${isActive ? el.hexColor : 'rgba(255, 255, 255, 0.15)'}`,
                  backgroundColor: isActive ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.65)',
                  color: isActive ? el.hexColor : 'rgba(255, 255, 255, 0.75)',
                  cursor: 'pointer',
                  boxShadow: isActive ? `0 0 12px ${el.hexColor}66` : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {el.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
