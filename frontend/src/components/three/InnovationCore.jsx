import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CATEGORY_INKS, BRAND_COLORS } from '../../utils/categoryColors';

/**
 * InnovationCore — Polymorphic 3D Specimen Engine
 * Used in Creative Studio (Create Idea), Dashboard Active Project, and Detail Views.
 */
export default function InnovationCore({
  height = 380,
  modelType = 'SPARK', // 'SPARK' | 'STRUCTURE' | 'ECOSYSTEM' | 'LENS'
  category = null,
  accentColor = null,
  interactive = true
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

    let width = container.clientWidth || 360;
    let heightPx = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 6.5);

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

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    scene.add(ambientLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Resolve color
    let hex = accentColor || BRAND_COLORS.lavender;
    if (category && CATEGORY_INKS[category]) {
      hex = CATEGORY_INKS[category].hex;
    }

    const colorObj = new THREE.Color(hex);

    if (modelType === 'SPARK') {
      // 3D Glowing Idea Bulb & Crystal Filament
      const bulbGeom = new THREE.SphereGeometry(0.9, 24, 24);
      const bulbMat = new THREE.MeshPhysicalMaterial({
        color: 0xFCFBF8,
        emissive: colorObj,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        transmission: 0.85,
        thickness: 1.2,
        transparent: true,
        opacity: 0.92
      });
      const bulb = new THREE.Mesh(bulbGeom, bulbMat);
      rootGroup.add(bulb);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.92, 1)),
        new THREE.LineBasicMaterial({ color: 0x24242B, transparent: true, opacity: 0.25 })
      );
      rootGroup.add(wire);

      const coreCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45, 0),
        new THREE.MeshBasicMaterial({ color: colorObj, wireframe: true })
      );
      rootGroup.add(coreCrystal);

    } else if (modelType === 'STRUCTURE') {
      // 3D Modular Product Cubes
      const boxMat = new THREE.MeshPhysicalMaterial({
        color: 0xFCFBF8,
        emissive: colorObj,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        transmission: 0.75,
        transparent: true,
        opacity: 0.92
      });
      const geom = new THREE.BoxGeometry(0.75, 0.75, 0.75);

      const b1 = new THREE.Mesh(geom, boxMat);
      b1.position.set(-0.3, -0.2, 0);
      rootGroup.add(b1);

      const b2 = new THREE.Mesh(geom, boxMat);
      b2.position.set(0.35, 0.35, 0.2);
      rootGroup.add(b2);

      const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x24242B, wireframe: true }));
      b3.position.set(0.1, -0.35, -0.2);
      rootGroup.add(b3);

    } else {
      // Prismatic Growth Crystal Cluster
      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0xFCFBF8,
        emissive: colorObj,
        emissiveIntensity: 0.45,
        roughness: 0.15,
        transmission: 0.8,
        transparent: true,
        opacity: 0.92
      });

      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 6), crystalMat);
      rootGroup.add(c1);

      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 6), crystalMat);
      c2.position.set(-0.45, -0.2, 0.2);
      c2.rotation.z = -0.3;
      rootGroup.add(c2);

      const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.0, 6), crystalMat);
      c3.position.set(0.45, -0.3, -0.2);
      c3.rotation.z = 0.25;
      rootGroup.add(c3);
    }

    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x * 0.5;
      mouseY = y * 0.5;
    };

    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      rootGroup.rotation.y = time * 0.35 + mouseX * 0.8;
      rootGroup.rotation.x = Math.sin(time * 0.25) * 0.15 - mouseY * 0.6;
      rootGroup.position.y = Math.sin(time * 0.9) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      camera.aspect = w / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(w, heightPx);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      if (interactive) container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [height, modelType, category, accentColor, interactive]);

  if (!hasWebGL) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="editorial-mono-label" style={{ color: 'var(--coral)' }}>[ 3D SPECIMEN ]</span>
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height: `${height}px` }} />;
}
