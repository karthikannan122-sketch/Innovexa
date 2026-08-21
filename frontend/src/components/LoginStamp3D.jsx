import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CATEGORY_INKS } from '../utils/categoryColors';

/**
 * LoginStamp3D — 3D Rotating Ledger Card with Interactive Stamp Press (Section 4)
 * Mid-press loop cycling category inks; reacts to success (decisive green press) and error (red-pink shake).
 */
export default function LoginStamp3D({ height = 480, authStatus = 'idle' }) {
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
    camera.position.set(0, 0, 6.2);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, heightPx);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0xFBFAF6, 0);
      container.appendChild(renderer.domElement);
    } catch (e) {
      setHasWebGL(false);
      return;
    }

    // Key Light & Fill
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    keyLight.position.set(-4, 5, 5);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0xFBFAF6, 0.85);
    scene.add(ambientLight);

    // 1. Large Physical Ledger Card
    const cardGeom = new THREE.BoxGeometry(2.4, 3.2, 0.06);
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.35,
      metalness: 0.05
    });
    const cardMesh = new THREE.Mesh(cardGeom, cardMat);

    // Subtle paper edge border
    const edges = new THREE.EdgesGeometry(cardGeom);
    const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xCDC7B8 }));
    cardMesh.add(edgeLine);

    const mainGroup = new THREE.Group();
    mainGroup.add(cardMesh);
    scene.add(mainGroup);

    // 2. Rubber Stamp Object
    const stampGroup = new THREE.Group();
    // Handle
    const handleGeom = new THREE.CylinderGeometry(0.25, 0.4, 1.1, 24);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x2B2A28, roughness: 0.6 });
    const handleMesh = new THREE.Mesh(handleGeom, handleMat);
    handleMesh.position.y = 0.6;
    stampGroup.add(handleMesh);

    // Stamp Base / Cushion
    const cushionGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 32);
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(CATEGORY_INKS.cat_ai.hex),
      emissiveIntensity: 0.35,
      roughness: 0.2
    });
    const cushionMesh = new THREE.Mesh(cushionGeom, cushionMat);
    stampGroup.add(cushionMesh);

    stampGroup.position.set(0, 0, 0.9);
    stampGroup.rotation.x = Math.PI / 2;
    mainGroup.add(stampGroup);

    const categoryKeys = Object.keys(CATEGORY_INKS);
    const categoryColorsList = categoryKeys.map(k => new THREE.Color(CATEGORY_INKS[k].hex));

    let animationId;
    let startTime = performance.now();
    let isPaused = false;

    const onVisibilityChange = () => { isPaused = document.hidden; };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const render = () => {
      if (!isPaused) {
        const now = performance.now();
        const elapsed = (now - startTime) / 1000;

        // Slow 3D tilt of the ledger card
        mainGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.18;
        mainGroup.rotation.x = Math.cos(elapsed * 0.4) * 0.08;

        if (authStatus === 'success') {
          // Decisive full stamp press in Green
          stampGroup.position.z = 0.15;
          cushionMat.emissive.set(CATEGORY_INKS.cat_fintech.hex);
        } else if (authStatus === 'error') {
          // Flash red-pink with quick shake
          stampGroup.position.x = Math.sin(elapsed * 30) * 0.05;
          stampGroup.position.z = 0.8;
          cushionMat.emissive.set(CATEGORY_INKS.cat_health.hex);
        } else {
          // Default Stamp mid-press loop: press 3s, hold, release 3s
          const pressCycle = (elapsed % 6) / 6; // 0 to 1
          let pressZ = 0.9;
          if (pressCycle < 0.4) {
            // Pressing down
            const p = pressCycle / 0.4;
            pressZ = 0.9 - 0.7 * Math.sin(p * Math.PI / 2);
          } else if (pressCycle < 0.6) {
            // Hold on paper
            pressZ = 0.2;
          } else {
            // Releasing up
            const p = (pressCycle - 0.6) / 0.4;
            pressZ = 0.2 + 0.7 * Math.sin(p * Math.PI / 2);
          }
          stampGroup.position.z = pressZ;
          stampGroup.position.x = 0;

          // Color cycling through category palette
          const colorIdx = Math.floor(elapsed * 0.3) % categoryColorsList.length;
          const nextColorIdx = (colorIdx + 1) % categoryColorsList.length;
          const colorLerp = (elapsed * 0.3) % 1;

          cushionMat.emissive.lerpColors(
            categoryColorsList[colorIdx],
            categoryColorsList[nextColorIdx],
            colorLerp
          );
        }

        renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [height, authStatus]);

  if (!hasWebGL) {
    return (
      <div style={{
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--paper-raised)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-paper)',
        padding: '2rem'
      }}>
        <div className="ledger-stamp" style={{ color: 'var(--ink-ai)', fontSize: '1.2rem' }}>
          ✦ VALIDATION LEDGER
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  );
}
