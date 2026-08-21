import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CATEGORY_INKS } from '../utils/categoryColors';

/**
 * InnovationCore3D — Interactive Editorial 3D Innovation Core (Section 6)
 * Real-time morphing geometric crystal with live project nodes, dynamic network connecting lines,
 * raycasting hover/click interaction, and stage restructuring (IDEA -> CONNECT -> VALIDATE -> EVOLVE).
 */
export default function InnovationCore3D({
  height = 500,
  activeStage = 'CONNECT',
  onSelectCategory = () => {}
}) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

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
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, heightPx);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0xFBFAF6, 0);
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL init failed:', e);
      setHasWebGL(false);
      return;
    }

    // Key & Ambient Lights
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
    keyLight.position.set(-6, 6, 8);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0xFBFAF6, 0.85);
    scene.add(ambientLight);

    // Root Group
    const coreRoot = new THREE.Group();
    scene.add(coreRoot);

    // 1. Central Morphing Geometric Crystal Core (The Idea)
    const coreGeom = new THREE.IcosahedronGeometry(1.2, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.2,
      transmission: 0.6,
      thickness: 1.2,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(0x5B4FE0),
      emissiveIntensity: 0.35
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreRoot.add(coreMesh);

    // Core Wireframe Cage
    const wireGeom = new THREE.WireframeGeometry(coreGeom);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x201F1D, linewidth: 1.5, transparent: true, opacity: 0.65 });
    const wireMesh = new THREE.LineSegments(wireGeom, wireMat);
    coreMesh.add(wireMesh);

    // 2. Orbital Live Project Nodes (Real INNOVEXA Domains)
    const categoryKeys = Object.keys(CATEGORY_INKS);
    const nodeObjects = [];
    const nodeGroup = new THREE.Group();
    coreRoot.add(nodeGroup);

    const nodeGeom = new THREE.SphereGeometry(0.24, 24, 24);

    categoryKeys.forEach((key, idx) => {
      const cat = CATEGORY_INKS[key];
      const color = new THREE.Color(cat.hex);

      const mat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.3
      });

      const mesh = new THREE.Mesh(nodeGeom, mat);
      mesh.userData = { id: cat.id, name: cat.name, hex: cat.hex, label: cat.label };

      // Outer halo ring around each node
      const haloGeom = new THREE.RingGeometry(0.32, 0.36, 32);
      const haloMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const haloMesh = new THREE.Mesh(haloGeom, haloMat);
      mesh.add(haloMesh);

      nodeGroup.add(mesh);

      const angle = (idx / categoryKeys.length) * Math.PI * 2;
      const radius = 2.8;
      const targetPos = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * (radius * 0.7) + (idx % 2 === 0 ? 0.3 : -0.3),
        (Math.sin(angle * 2) * 0.8)
      );

      nodeObjects.push({
        mesh,
        category: cat,
        angle,
        baseRadius: radius,
        targetPos,
        currentPos: new THREE.Vector3(0, 0, 0),
        orbitSpeed: 0.002 + idx * 0.0003
      });
    });

    // 3. Dynamic Network Connecting Lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0xCDC7B8, transparent: true, opacity: 0.5 });
    const lineGeom = new THREE.BufferGeometry();
    const lineMesh = new THREE.LineSegments(lineGeom, lineMat);
    coreRoot.add(lineMesh);

    // 4. Raycasting for Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh = null;

    let targetCameraX = 0;
    let targetCameraY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / heightPx) * 2 - 1);
      mouse.x = x;
      mouse.y = y;

      targetCameraX = x * 0.6;
      targetCameraY = y * 0.4;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredMesh !== hit) {
          hoveredMesh = hit;
          setHoveredNode(hit.userData);
          container.style.cursor = 'pointer';
        }
      } else {
        if (hoveredMesh) {
          hoveredMesh = null;
          setHoveredNode(null);
          container.style.cursor = 'default';
        }
      }
    };

    const handleClick = () => {
      if (hoveredMesh && hoveredMesh.userData) {
        onSelectCategory(hoveredMesh.userData.id, hoveredMesh.userData.name);
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

    // Animation Loop
    let animationId;
    let startTime = performance.now();
    let isPaused = false;

    const onVisibilityChange = () => { isPaused = document.hidden; };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const render = () => {
      if (!isPaused) {
        const now = performance.now();
        const elapsed = (now - startTime) / 1000;

        // Camera Parallax
        camera.position.x += (targetCameraX - camera.position.x) * 0.05;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // Core Rotation & Stage Behaviors
        coreMesh.rotation.x = elapsed * 0.25;
        coreMesh.rotation.y = elapsed * 0.35;

        // Stage Parameters
        let stageMultiplier = 1;
        let lineOpacity = 0.5;
        let coreScale = 1;

        if (activeStage === 'IDEA') {
          stageMultiplier = 0.35;
          lineOpacity = 0.15;
          coreScale = 0.9;
        } else if (activeStage === 'CONNECT') {
          stageMultiplier = 1.0;
          lineOpacity = 0.55;
          coreScale = 1.1;
        } else if (activeStage === 'VALIDATE') {
          stageMultiplier = 1.15;
          lineOpacity = 0.85;
          coreScale = 1.25 + Math.sin(elapsed * 4) * 0.08; // Pulsing validation wave
        } else if (activeStage === 'EVOLVE') {
          stageMultiplier = 1.3;
          lineOpacity = 0.95;
          coreScale = 1.35;
        }

        coreMesh.scale.set(coreScale, coreScale, coreScale);
        lineMat.opacity = lineOpacity;

        // Node Positions & Network Line Coordinates
        const linePoints = [];

        nodeObjects.forEach((obj, idx) => {
          obj.angle += obj.orbitSpeed;
          const r = obj.baseRadius * stageMultiplier;

          const tx = Math.cos(obj.angle) * r;
          const ty = Math.sin(obj.angle) * (r * 0.65) + Math.sin(elapsed * 1.5 + idx) * 0.15;
          const tz = Math.sin(obj.angle * 2) * (0.8 * stageMultiplier);

          obj.mesh.position.x = tx;
          obj.mesh.position.y = ty;
          obj.mesh.position.z = tz;

          // Face the halo towards camera
          obj.mesh.children[0].lookAt(camera.position);

          // Highlight hovered node scale
          if (hoveredMesh === obj.mesh) {
            obj.mesh.scale.lerp(new THREE.Vector3(1.4, 1.4, 1.4), 0.15);
          } else {
            obj.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
          }

          // Line to core
          linePoints.push(0, 0, 0);
          linePoints.push(tx, ty, tz);

          // Inter-node connection lines (CONNECT / VALIDATE / EVOLVE stages)
          if (activeStage !== 'IDEA') {
            const nextIdx = (idx + 1) % nodeObjects.length;
            const nextNode = nodeObjects[nextIdx].mesh.position;
            linePoints.push(tx, ty, tz);
            linePoints.push(nextNode.x, nextNode.y, nextNode.z);
          }
        });

        lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));

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
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [height, activeStage]);

  if (!hasWebGL) {
    return (
      <div style={{
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--paper-raised)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-paper)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="editorial-hero" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            The Innovation Core
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.values(CATEGORY_INKS).map(cat => (
              <span key={cat.id} className="category-tag" style={{ backgroundColor: cat.lightBg, color: cat.hex }}>
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />

      {/* Interactive 3D Node Tooltip Card */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--paper-raised)',
            border: `1.5px solid ${hoveredNode.hex}`,
            boxShadow: 'var(--shadow-paper-hover)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.55rem 1.15rem',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            zIndex: 10,
            animation: 'modalPop 0.15s ease'
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: hoveredNode.hex,
              boxShadow: `0 0 8px ${hoveredNode.hex}`
            }}
          />
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--ink-charcoal)' }}>
              {hoveredNode.name}
            </div>
            <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--slate-muted)' }}>
              Click to explore live specimens in this domain ↗
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
