import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { BRAND_COLORS } from '../utils/categoryColors';

/**
 * LandingHero3D — Central Floating Innovation Core & 5 Meaningful 3D Objects
 * Direction:
 * - Central translucent faceted geometric crystal
 * - 5 Surrounding organic objects:
 *    1. IDEA -> Glowing holographic light bulb (Soft Lavender #9B8AE5)
 *    2. PRODUCT -> Floating modular cubes (Soft Periwinkle #7186D8)
 *    3. STARTUP -> Geometric growth crystal (Fresh Teal #58B8AD)
 *    4. COMMUNITY -> Abstract connected forms (Warm Apricot #F0A45D)
 *    5. INSIGHTS -> Holographic signal lens (Rose Pink #D86B9A)
 * - Subtle intelligent connection signals
 * - Mouse parallax & smooth floating physics
 */
export default function LandingHero3D({ height = 520, onSelectModule = () => {} }) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Accessibility check
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasWebGL(false);
      return;
    }

    let width = container.clientWidth || 560;
    let heightPx = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 7.8);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, heightPx);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0xF6F3EE, 0); // Transparent over Warm Ivory
      container.appendChild(renderer.domElement);
    } catch (e) {
      setHasWebGL(false);
      return;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
    keyLight.position.set(5, 8, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xE76F82, 0.6);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ==========================================
    // 1. CENTRAL INNOVATION CORE CRYSTAL
    // ==========================================
    const coreGroup = new THREE.Group();
    rootGroup.add(coreGroup);

    // Outer translucent faceted crystal
    const crystalGeom = new THREE.IcosahedronGeometry(1.2, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xFCFBF8,
      emissive: new THREE.Color(BRAND_COLORS.coral),
      emissiveIntensity: 0.22,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.82,
      thickness: 1.4,
      transparent: true,
      opacity: 0.92,
      reflectivity: 0.6
    });
    const crystalMesh = new THREE.Mesh(crystalGeom, crystalMat);
    coreGroup.add(crystalMesh);

    // Core Wireframe Hairlines
    const crystalEdges = new THREE.EdgesGeometry(crystalGeom);
    const crystalWireMat = new THREE.LineBasicMaterial({
      color: 0x24242B,
      transparent: true,
      opacity: 0.35,
      linewidth: 1.5
    });
    const crystalWire = new THREE.LineSegments(crystalEdges, crystalWireMat);
    crystalMesh.add(crystalWire);

    // Inner Glowing Core Seed
    const seedGeom = new THREE.OctahedronGeometry(0.55, 0);
    const seedMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(BRAND_COLORS.coral),
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const seedMesh = new THREE.Mesh(seedGeom, seedMat);
    coreGroup.add(seedMesh);

    // ==========================================
    // 2. FIVE ORGANIC SURROUNDING 3D OBJECTS
    // ==========================================
    const interactiveObjects = [];

    // Module definitions
    const modules = [
      {
        id: 'IDEA',
        name: 'Ideas',
        tag: '01 / SPARK',
        color: BRAND_COLORS.lavender,
        pos: new THREE.Vector3(-2.6, 1.4, 0.4),
        createMesh: () => {
          const grp = new THREE.Group();
          // Holographic Bulb Dome
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.48, 16, 16),
            new THREE.MeshPhysicalMaterial({
              color: 0xFFFFFF,
              emissive: new THREE.Color(BRAND_COLORS.lavender),
              emissiveIntensity: 0.6,
              roughness: 0.2,
              transmission: 0.85,
              transparent: true,
              opacity: 0.9
            })
          );
          grp.add(sphere);

          // Filament
          const filament = new THREE.Mesh(
            new THREE.TorusGeometry(0.18, 0.03, 8, 16),
            new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
          );
          filament.position.y = 0.05;
          grp.add(filament);

          // Base
          const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.15, 0.25, 12),
            new THREE.MeshStandardMaterial({ color: 0x24242B, metalness: 0.8, roughness: 0.3 })
          );
          base.position.y = -0.45;
          grp.add(base);

          return grp;
        }
      },
      {
        id: 'PRODUCT',
        name: 'Products',
        tag: '02 / BLUEPRINT',
        color: BRAND_COLORS.periwinkle,
        pos: new THREE.Vector3(2.6, 1.3, -0.3),
        createMesh: () => {
          const grp = new THREE.Group();
          const boxMat = new THREE.MeshPhysicalMaterial({
            color: 0xFCFBF8,
            emissive: new THREE.Color(BRAND_COLORS.periwinkle),
            emissiveIntensity: 0.4,
            roughness: 0.3,
            transmission: 0.7,
            transparent: true,
            opacity: 0.92
          });
          const geom = new THREE.BoxGeometry(0.44, 0.44, 0.44);

          // 3 Interlocking Modular Cubes
          const b1 = new THREE.Mesh(geom, boxMat);
          b1.position.set(-0.15, -0.15, 0);
          grp.add(b1);

          const b2 = new THREE.Mesh(geom, boxMat);
          b2.position.set(0.2, 0.2, 0.15);
          grp.add(b2);

          const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0x24242B, wireframe: true }));
          b3.position.set(0.1, -0.2, -0.15);
          grp.add(b3);

          return grp;
        }
      },
      {
        id: 'STARTUP',
        name: 'Startups',
        tag: '03 / GROWTH',
        color: BRAND_COLORS.teal,
        pos: new THREE.Vector3(2.3, -1.3, 0.5),
        createMesh: () => {
          const grp = new THREE.Group();
          const crystalMat = new THREE.MeshPhysicalMaterial({
            color: 0xFFFFFF,
            emissive: new THREE.Color(BRAND_COLORS.teal),
            emissiveIntensity: 0.45,
            roughness: 0.2,
            transmission: 0.8,
            transparent: true,
            opacity: 0.92
          });

          // Prismatic Growth Crystals
          const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 6), crystalMat);
          c1.position.set(0, 0.2, 0);
          grp.add(c1);

          const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 6), crystalMat);
          c2.position.set(-0.25, -0.05, 0.1);
          c2.rotation.z = -0.3;
          grp.add(c2);

          const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), crystalMat);
          c3.position.set(0.22, -0.1, -0.1);
          c3.rotation.z = 0.25;
          grp.add(c3);

          return grp;
        }
      },
      {
        id: 'COMMUNITY',
        name: 'Community',
        tag: '04 / PERSPECTIVE',
        color: BRAND_COLORS.apricot,
        pos: new THREE.Vector3(-2.4, -1.3, -0.4),
        createMesh: () => {
          const grp = new THREE.Group();
          const nodeMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(BRAND_COLORS.apricot),
            roughness: 0.3,
            metalness: 0.2
          });

          // 3 Connected Nodes
          const p1 = new THREE.Vector3(-0.25, 0.2, 0);
          const p2 = new THREE.Vector3(0.25, 0.15, 0.1);
          const p3 = new THREE.Vector3(0, -0.25, -0.1);

          [p1, p2, p3].forEach(p => {
            const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), nodeMat);
            s.position.copy(p);
            grp.add(s);
          });

          // Connective Lines
          const lineGeom = new THREE.BufferGeometry().setFromPoints([p1, p2, p3, p1]);
          const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x24242B, transparent: true, opacity: 0.4 }));
          grp.add(line);

          return grp;
        }
      },
      {
        id: 'INSIGHTS',
        name: 'Insights',
        tag: '05 / SIGNALS',
        color: BRAND_COLORS.rosePink,
        pos: new THREE.Vector3(0.1, 2.4, -0.4),
        createMesh: () => {
          const grp = new THREE.Group();
          // Holographic Signal Lens / Radar Rings
          const ring1 = new THREE.Mesh(
            new THREE.TorusGeometry(0.48, 0.035, 8, 24),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(BRAND_COLORS.rosePink), transparent: true, opacity: 0.85 })
          );
          ring1.rotation.x = Math.PI / 3;
          grp.add(ring1);

          const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(0.28, 0.025, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.9 })
          );
          ring2.rotation.x = Math.PI / 3;
          grp.add(ring2);

          const coreDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0x24242B })
          );
          grp.add(coreDot);

          return grp;
        }
      }
    ];

    // Build module objects and intelligent connection lines
    const connectionGroup = new THREE.Group();
    rootGroup.add(connectionGroup);

    const pulsePoints = [];

    modules.forEach((mod) => {
      const objGroup = new THREE.Group();
      objGroup.position.copy(mod.pos);
      const mesh = mod.createMesh();
      objGroup.add(mesh);
      rootGroup.add(objGroup);

      // Hit sphere for raycasting
      const hitSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitSphere.userData = mod;
      objGroup.add(hitSphere);
      interactiveObjects.push(hitSphere);

      // Intelligent Connection Curve from Core (0,0,0) to Module Position
      const midPoint = new THREE.Vector3(
        mod.pos.x * 0.5 + (Math.random() - 0.5) * 0.4,
        mod.pos.y * 0.5 + (Math.random() - 0.5) * 0.4,
        mod.pos.z * 0.5
      );
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        midPoint,
        mod.pos
      );

      const points = curve.getPoints(32);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(mod.color),
        transparent: true,
        opacity: 0.35,
        linewidth: 1
      });
      const line = new THREE.Line(lineGeom, lineMat);
      connectionGroup.add(line);

      // Animated Signal Pulse on curve
      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      connectionGroup.add(pulse);
      pulsePoints.push({ pulse, curve, progress: Math.random() });

      mod.group = objGroup;
      mod.basePos = mod.pos.clone();
    });

    // ==========================================
    // 3. MOUSE PARALLAX & ANIMATION LOOP
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.6;
      targetY = y * 0.45;

      // Raycasting for hover tooltip
      const mouseVec = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0) {
        const item = intersects[0].object.userData;
        setHoveredNode(item);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      const mouseVec = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);
      if (intersects.length > 0) {
        onSelectModule(intersects[0].object.userData.id);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth mouse parallax damping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      rootGroup.rotation.y = mouseX * 0.75 + Math.sin(time * 0.25) * 0.08;
      rootGroup.rotation.x = -mouseY * 0.65 + Math.cos(time * 0.2) * 0.06;

      // Slow Central Core Rotation & Float
      crystalMesh.rotation.y = time * 0.25;
      crystalMesh.rotation.x = Math.sin(time * 0.3) * 0.2;
      seedMesh.rotation.y = -time * 0.45;
      coreGroup.position.y = Math.sin(time * 0.8) * 0.08;

      // Individual Module Organic Floating Motion
      modules.forEach((mod, idx) => {
        const offset = idx * 1.2;
        mod.group.position.y = mod.basePos.y + Math.sin(time * 1.1 + offset) * 0.09;
        mod.group.position.x = mod.basePos.x + Math.cos(time * 0.8 + offset) * 0.05;
        mod.group.rotation.y = time * 0.3 + offset;
        mod.group.rotation.z = Math.sin(time * 0.6 + offset) * 0.1;
      });

      // Animate Signal Pulses travelling along curves
      pulsePoints.forEach(p => {
        p.progress += 0.007;
        if (p.progress > 1) p.progress = 0;
        const pos = p.curve.getPoint(p.progress);
        p.pulse.position.copy(pos);
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 560;
      camera.aspect = w / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(w, heightPx);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      document.body.style.cursor = 'default';
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [height]);

  if (!hasWebGL) {
    // 2D Editorial Geometric Fallback
    return (
      <div
        style={{
          height: `${height}px`,
          backgroundColor: 'var(--bg-white)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative'
        }}
      >
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
          01 / INNOVATION CORE
        </div>
        <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 800 }}>
          THE LIVING ECOSYSTEM
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px', textAlign: 'center', marginTop: '0.5rem' }}>
          Ideas • Products • Startups • Community • Insights
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Hover Indicator / Tooltip */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-dark)',
            color: 'var(--text-inverse)',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${hoveredNode.color}`,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeIn 0.15s ease',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: hoveredNode.color,
              boxShadow: `0 0 8px ${hoveredNode.color}`
            }}
          />
          <span className="mono" style={{ fontSize: '0.72rem', color: hoveredNode.color, fontWeight: 700 }}>
            {hoveredNode.tag}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Explore {hoveredNode.name} ↗
          </span>
        </div>
      )}

      {/* Subtle Legend Ribbon */}
      <div
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        <span className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
          INTERACTIVE 3D ECOSYSTEM • MOUSE PARALLAX
        </span>
      </div>
    </div>
  );
}
