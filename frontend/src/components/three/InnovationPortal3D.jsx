import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { BRAND_COLORS } from '../../utils/categoryColors';

/**
 * InnovationPortal3D — Interactive Portal for Login Page (Section 10)
 * Reactive to input focus and authentication states with convergence animation.
 */
export default function InnovationPortal3D({
  height = 320,
  authStatus = 'idle', // 'idle' | 'focus_email' | 'focus_password' | 'success' | 'error'
}) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasWebGL(false);
      return;
    }

    let width = container.clientWidth || 400;
    let heightPx = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 7);

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

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    keyLight.position.set(-4, 5, 6);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0xF8FAFC, 0.85);
    scene.add(ambientLight);

    const portalGroup = new THREE.Group();
    scene.add(portalGroup);

    // Central Core Seed
    const coreGeom = new THREE.IcosahedronGeometry(0.85, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(BRAND_COLORS.purple),
      emissiveIntensity: 0.6,
      roughness: 0.2,
      transmission: 0.6,
      transparent: true,
      opacity: 0.9
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    portalGroup.add(coreMesh);

    // Floating Geometric Satellites
    const satelliteGroup = new THREE.Group();
    portalGroup.add(satelliteGroup);

    const satGeoms = [
      new THREE.OctahedronGeometry(0.3, 0),
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.TetrahedronGeometry(0.35, 0),
      new THREE.DodecahedronGeometry(0.3, 0),
      new THREE.SphereGeometry(0.25, 16, 16)
    ];

    const colors = [BRAND_COLORS.blue, BRAND_COLORS.cyan, BRAND_COLORS.teal, BRAND_COLORS.gold, BRAND_COLORS.pink];
    const satellites = [];

    satGeoms.forEach((geom, idx) => {
      const color = new THREE.Color(colors[idx % colors.length]);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: color,
        emissiveIntensity: 0.7,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(geom, mat);
      satelliteGroup.add(mesh);

      const angle = (idx / satGeoms.length) * Math.PI * 2;
      satellites.push({
        mesh,
        angle,
        baseRadius: 2.2,
        currentRadius: 2.2,
        speed: 0.002 + idx * 0.0003
      });
    });

    // Connecting Lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0xCBD5E1, transparent: true, opacity: 0.5 });
    const lineGeom = new THREE.BufferGeometry();
    const lineMesh = new THREE.LineSegments(lineGeom, lineMat);
    portalGroup.add(lineMesh);

    let targetCameraX = 0;
    let targetCameraY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / heightPx) * 2 - 1);
      targetCameraX = x * 0.5;
      targetCameraY = y * 0.3;
    };

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 400;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
    };

    container.addEventListener('mousemove', handleMouseMove);
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

        coreMesh.rotation.x = elapsed * 0.3;
        coreMesh.rotation.y = elapsed * 0.4;

        let targetRadius = 2.2;
        let lineOpacity = 0.5;

        if (authStatus === 'focus_email') {
          targetRadius = 1.8;
          lineOpacity = 0.85;
          coreMat.emissive.set(BRAND_COLORS.cyan);
        } else if (authStatus === 'focus_password') {
          targetRadius = 1.4;
          lineOpacity = 0.95;
          coreMat.emissive.set(BRAND_COLORS.blue);
        } else if (authStatus === 'success') {
          targetRadius = 0.2; // Converge to center
          coreMat.emissive.set(BRAND_COLORS.green);
        } else if (authStatus === 'error') {
          targetRadius = 2.6;
          coreMat.emissive.set(BRAND_COLORS.orange);
          portalGroup.position.x = Math.sin(elapsed * 25) * 0.05;
        } else {
          coreMat.emissive.set(BRAND_COLORS.purple);
          portalGroup.position.x = 0;
        }

        lineMat.opacity = lineOpacity;

        const linePoints = [];

        satellites.forEach((sat, idx) => {
          sat.angle += sat.speed;
          sat.currentRadius += (targetRadius - sat.currentRadius) * 0.08;

          const tx = Math.cos(sat.angle) * sat.currentRadius;
          const ty = Math.sin(sat.angle) * (sat.currentRadius * 0.65) + Math.sin(elapsed * 1.5 + idx) * 0.08;
          const tz = Math.sin(sat.angle * 2) * 0.5;

          sat.mesh.position.set(tx, ty, tz);
          sat.mesh.rotation.x = elapsed * 0.5;
          sat.mesh.rotation.y = elapsed * 0.7;

          linePoints.push(0, 0, 0);
          linePoints.push(tx, ty, tz);

          const nextIdx = (idx + 1) % satellites.length;
          const nextPos = satellites[nextIdx].mesh.position;
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
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [height, authStatus]);

  if (!hasWebGL) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      />
    </div>
  );
}
