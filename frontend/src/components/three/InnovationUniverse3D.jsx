import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { getCategoryInk, BRAND_COLORS } from '../../utils/categoryColors';

/**
 * InnovationUniverse3D — User's Personal Innovation Project Constellation (Section 11)
 * Shows the user's registered projects as interactive 3D nodes with review progress.
 */
export default function InnovationUniverse3D({
  height = 240,
  innovations = [],
  onSelectProject = () => {}
}) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hoveredProject, setHoveredProject] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || innovations.length === 0) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasWebGL(false);
      return;
    }

    let width = container.clientWidth || 480;
    let heightPx = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 6.5);

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

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
    keyLight.position.set(-4, 5, 5);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0xF8FAFC, 0.85);
    scene.add(ambientLight);

    const projectGroup = new THREE.Group();
    scene.add(projectGroup);

    // Central User Core
    const userCoreGeom = new THREE.OctahedronGeometry(0.5, 0);
    const userCoreMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: new THREE.Color(BRAND_COLORS.purple),
      emissiveIntensity: 0.7,
      roughness: 0.3
    });
    const userCoreMesh = new THREE.Mesh(userCoreGeom, userCoreMat);
    projectGroup.add(userCoreMesh);

    const nodeObjects = [];
    const nodeGroup = new THREE.Group();
    projectGroup.add(nodeGroup);

    const nodeGeom = new THREE.SphereGeometry(0.28, 20, 20);

    innovations.forEach((item, idx) => {
      const ink = getCategoryInk(item.category_id, item.category_name);
      const color = new THREE.Color(ink.hex);

      const mat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.3
      });

      const mesh = new THREE.Mesh(nodeGeom, mat);
      mesh.userData = {
        id: item.id,
        title: item.title,
        status: item.status,
        current: item.valid_reviews_count || 0,
        target: item.validation_target || 10,
        category: item.category_name,
        hex: ink.hex
      };

      nodeGroup.add(mesh);

      const angle = (idx / Math.max(1, innovations.length)) * Math.PI * 2;
      const radius = 2.1;

      nodeObjects.push({
        mesh,
        angle,
        radius,
        orbitSpeed: 0.0015 + idx * 0.0002
      });
    });

    const lineMat = new THREE.LineBasicMaterial({ color: 0xCBD5E1, transparent: true, opacity: 0.6 });
    const lineGeom = new THREE.BufferGeometry();
    const lineMesh = new THREE.LineSegments(lineGeom, lineMat);
    projectGroup.add(lineMesh);

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

      targetCameraX = x * 0.4;
      targetCameraY = y * 0.3;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredMesh !== hit) {
          hoveredMesh = hit;
          setHoveredProject(hit.userData);
          container.style.cursor = 'pointer';
        }
      } else {
        if (hoveredMesh) {
          hoveredMesh = null;
          setHoveredProject(null);
          container.style.cursor = 'default';
        }
      }
    };

    const handleClick = () => {
      if (hoveredMesh && hoveredMesh.userData) {
        onSelectProject(hoveredMesh.userData.id);
      }
    };

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 480;
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

        userCoreMesh.rotation.x = elapsed * 0.3;
        userCoreMesh.rotation.y = elapsed * 0.4;

        const linePoints = [];

        nodeObjects.forEach((obj, idx) => {
          obj.angle += obj.orbitSpeed;
          const r = obj.radius;

          const tx = Math.cos(obj.angle) * r;
          const ty = Math.sin(obj.angle) * (r * 0.6) + Math.sin(elapsed * 1.2 + idx) * 0.08;
          const tz = Math.sin(obj.angle * 2) * 0.5;

          obj.mesh.position.set(tx, ty, tz);

          if (hoveredMesh === obj.mesh) {
            obj.mesh.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.15);
          } else {
            obj.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
          }

          linePoints.push(0, 0, 0);
          linePoints.push(tx, ty, tz);

          if (nodeObjects.length > 1) {
            const nextIdx = (idx + 1) % nodeObjects.length;
            const nextPos = nodeObjects[nextIdx].mesh.position;
            linePoints.push(tx, ty, tz);
            linePoints.push(nextPos.x, nextPos.y, nextPos.z);
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
  }, [height, innovations]);

  if (!hasWebGL || innovations.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      />

      {hoveredProject && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--paper-raised)',
            border: `1.5px solid ${hoveredProject.hex}`,
            boxShadow: 'var(--shadow-paper-hover)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.9rem',
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
              backgroundColor: hoveredProject.hex
            }}
          />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-charcoal)' }}>
              {hoveredProject.title}
            </div>
            <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--slate-muted)' }}>
              {hoveredProject.status} • {hoveredProject.current}/{hoveredProject.target} Reviews (Click to open)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
