import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CATEGORY_INKS, BRAND_COLORS } from '../../utils/categoryColors';

/**
 * CategoryUniverse3D — Interactive Category Network for Explore Page (Section 12)
 * Allows exploring technical domains as an interactive 3D constellation.
 */
export default function CategoryUniverse3D({
  height = 280,
  innovations = [],
  selectedCategory = 'ALL',
  onSelectCategory = () => {}
}) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hoveredCat, setHoveredCat] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasWebGL(false);
      return;
    }

    let width = container.clientWidth || 600;
    let heightPx = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, heightPx);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0xF8FAFC, 0);
      container.appendChild(renderer.domElement);
    } catch (e) {
      setHasWebGL(false);
      return;
    }

    // Light
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
    keyLight.position.set(-4, 5, 6);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0xF8FAFC, 0.85);
    scene.add(ambientLight);

    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // Central Universe Hub
    const hubGeom = new THREE.SphereGeometry(0.4, 24, 24);
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(BRAND_COLORS.purple),
      emissiveIntensity: 0.6,
      roughness: 0.3
    });
    const hubMesh = new THREE.Mesh(hubGeom, hubMat);
    universeGroup.add(hubMesh);

    // Category Nodes
    const categoryKeys = Object.keys(CATEGORY_INKS);
    const nodeObjects = [];
    const nodeGroup = new THREE.Group();
    universeGroup.add(nodeGroup);

    const nodeGeom = new THREE.SphereGeometry(0.25, 20, 20);

    categoryKeys.forEach((key, idx) => {
      const cat = CATEGORY_INKS[key];
      const count = innovations.filter(i => i.category_id === cat.id).length;
      const catColor = new THREE.Color(cat.hex);

      const isSelected = selectedCategory === cat.id;

      const mat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: catColor,
        emissiveIntensity: isSelected ? 1.0 : 0.65,
        roughness: 0.25
      });

      const mesh = new THREE.Mesh(nodeGeom, mat);
      mesh.userData = { id: cat.id, name: cat.name, count, hex: cat.hex, label: cat.label };

      // Halo ring
      const haloGeom = new THREE.RingGeometry(0.32, 0.38, 32);
      const haloMat = new THREE.MeshBasicMaterial({ color: catColor, side: THREE.DoubleSide, transparent: true, opacity: isSelected ? 0.9 : 0.5 });
      const haloMesh = new THREE.Mesh(haloGeom, haloMat);
      mesh.add(haloMesh);

      nodeGroup.add(mesh);

      const angle = (idx / categoryKeys.length) * Math.PI * 2;
      const radius = 2.6;

      nodeObjects.push({
        mesh,
        category: cat,
        angle,
        radius,
        orbitSpeed: 0.0012 + idx * 0.0001
      });
    });

    // Connecting Network Lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0xCBD5E1, transparent: true, opacity: 0.6 });
    const lineGeom = new THREE.BufferGeometry();
    const lineMesh = new THREE.LineSegments(lineGeom, lineMat);
    universeGroup.add(lineMesh);

    // Raycasting
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

      targetCameraX = x * 0.45;
      targetCameraY = y * 0.3;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredMesh !== hit) {
          hoveredMesh = hit;
          setHoveredCat(hit.userData);
          container.style.cursor = 'pointer';
        }
      } else {
        if (hoveredMesh) {
          hoveredMesh = null;
          setHoveredCat(null);
          container.style.cursor = 'default';
        }
      }
    };

    const handleClick = () => {
      if (hoveredMesh && hoveredMesh.userData) {
        onSelectCategory(hoveredMesh.userData.id);
      }
    };

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 600;
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

    const render = () => {
      if (!isPaused) {
        const now = performance.now();
        const elapsed = (now - startTime) / 1000;

        camera.position.x += (targetCameraX - camera.position.x) * 0.05;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        hubMesh.rotation.y = elapsed * 0.4;

        const linePoints = [];

        nodeObjects.forEach((obj, idx) => {
          obj.angle += obj.orbitSpeed;
          const r = obj.radius;

          const tx = Math.cos(obj.angle) * r;
          const ty = Math.sin(obj.angle) * (r * 0.5) + Math.sin(elapsed * 1.2 + idx) * 0.1;
          const tz = Math.sin(obj.angle * 2) * 0.6;

          obj.mesh.position.set(tx, ty, tz);
          obj.mesh.children[0].lookAt(camera.position);

          if (hoveredMesh === obj.mesh) {
            obj.mesh.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.15);
          } else {
            obj.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
          }

          linePoints.push(0, 0, 0);
          linePoints.push(tx, ty, tz);

          const nextIdx = (idx + 1) % nodeObjects.length;
          const nextPos = nodeObjects[nextIdx].mesh.position;
          linePoints.push(tx, ty, tz);
          linePoints.push(nextPos.x, nextPos.y, nextPos.z);
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
  }, [height, selectedCategory, innovations]);

  if (!hasWebGL) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      />

      {hoveredCat && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--paper-raised)',
            border: `1.5px solid ${hoveredCat.hex}`,
            boxShadow: 'var(--shadow-paper-hover)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.95rem',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 10,
            animation: 'modalPop 0.15s ease'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: hoveredCat.hex
            }}
          />
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-charcoal)' }}>
            {hoveredCat.name} ({hoveredCat.count} items) — Click to filter ↗
          </div>
        </div>
      )}
    </div>
  );
}
