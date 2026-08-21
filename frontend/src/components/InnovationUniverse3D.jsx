import React, { useRef, useEffect } from 'react';

/**
 * InnovationUniverse3D — Interactive 3D WebGL / Canvas Innovation Scene (Section 9 & 10)
 * Central rotating innovation particle core with orbiting concept nodes that react smoothly to cursor movement.
 */
export default function InnovationUniverse3D({ height = 480, compact = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let heightPx = (canvas.height = height);

    // Mouse coordinates for 3D parallax tilt
    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0;
    let rotY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - heightPx / 2;
      targetRotX = (y / (heightPx / 2)) * 0.45;
      targetRotY = (x / (width / 2)) * 0.45;
    };

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth || 500;
        heightPx = canvas.height = height;
      }
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);

    // 3D Particles Generator (80 floating nodes around central sphere)
    const particleCount = compact ? 45 : 75;
    const particles = [];
    const sphereRadius = compact ? 85 : 120;

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const dist = sphereRadius * (0.65 + 0.45 * Math.random());
      
      const colors = ['#7C3AED', '#2563EB', '#06B6D4', '#F97316', '#22C55E', '#EC4899'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      particles.push({
        origX: dist * Math.sin(theta) * Math.cos(phi),
        origY: dist * Math.sin(theta) * Math.sin(phi),
        origZ: dist * Math.cos(theta),
        size: Math.random() * 2.5 + 1.2,
        color,
        speed: (Math.random() * 0.006 + 0.003) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    // 4 Key Orbiting Concept Satellites
    const satellites = [
      { label: 'REVIEWERS', angle: 0, orbitR: sphereRadius * 1.55, color: '#06B6D4', speed: 0.012 },
      { label: 'IDEAS', angle: Math.PI / 2, orbitR: sphereRadius * 1.45, color: '#7C3AED', speed: 0.01 },
      { label: 'INSIGHTS', angle: Math.PI, orbitR: sphereRadius * 1.6, color: '#F97316', speed: 0.009 },
      { label: 'COMMUNITY', angle: (3 * Math.PI) / 2, orbitR: sphereRadius * 1.5, color: '#22C55E', speed: 0.011 }
    ];

    let time = 0;

    const render = () => {
      try {
        time += 0.016;

        // Spring damping rotation toward mouse target
        rotX += (targetRotX - rotX) * 0.06;
        rotY += (targetRotY - rotY) * 0.06;

        const autoAngle = time * 0.35;
        const curRotY = rotY + autoAngle;
        const curRotX = rotX;

        ctx.clearRect(0, 0, width, heightPx);

        const cx = width / 2;
        const cy = heightPx / 2;

        // Perspective projection constants
        const fov = 400;

        // Render Central Pulsating Glow
        const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, sphereRadius * 1.2);
        glowGrad.addColorStop(0, 'rgba(124, 58, 237, 0.25)');
        glowGrad.addColorStop(0.5, 'rgba(37, 99, 235, 0.12)');
        glowGrad.addColorStop(1, 'rgba(248, 250, 252, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, sphereRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Transform & Project particles
        const projected = particles.map(p => {
          // Rotate around Y axis
          const cosY = Math.cos(curRotY);
          const sinY = Math.sin(curRotY);
          let x1 = p.origX * cosY + p.origZ * sinY;
          let z1 = -p.origX * sinY + p.origZ * cosY;

          // Rotate around X axis
          const cosX = Math.cos(curRotX);
          const sinX = Math.sin(curRotX);
          let y2 = p.origY * cosX - z1 * sinX;
          let z2 = p.origY * sinX + z1 * cosX;

          const scale = fov / (fov + z2);
          return {
            x: cx + x1 * scale,
            y: cy + y2 * scale,
            z: z2,
            size: p.size * scale,
            color: p.color,
            alpha: Math.max(0.2, (z2 + sphereRadius) / (2 * sphereRadius))
          };
        });

        // Sort particles back-to-front
        projected.sort((a, b) => b.z - a.z);

        // Draw particle lattice connection lines
        ctx.lineWidth = 0.75;
        for (let i = 0; i < projected.length; i++) {
          for (let j = i + 1; j < projected.length; j++) {
            const dx = projected[i].x - projected[j].x;
            const dy = projected[i].y - projected[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 48) {
              ctx.strokeStyle = `rgba(124, 58, 237, ${0.22 * (1 - dist / 48)})`;
              ctx.beginPath();
              ctx.moveTo(projected[i].x, projected[i].y);
              ctx.lineTo(projected[j].x, projected[j].y);
              ctx.stroke();
            }
          }
        }

        // Draw particles
        for (const p of projected) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.8, p.size), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Draw Orbiting Concept Satellites
        for (const sat of satellites) {
          sat.angle += sat.speed;
          const sx = sat.orbitR * Math.cos(sat.angle);
          const sy = (sat.orbitR * 0.45) * Math.sin(sat.angle);
          const sz = sat.orbitR * Math.sin(sat.angle);

          // Rotate
          const cosY = Math.cos(curRotY * 0.5);
          const sinY = Math.sin(curRotY * 0.5);
          const x1 = sx * cosY + sz * sinY;
          const z1 = -sx * sinY + sz * cosY;

          const scale = fov / (fov + z1);
          const px = cx + x1 * scale;
          const py = cy + sy * scale;

          // Line to core
          ctx.strokeStyle = `${sat.color}44`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.setLineDash([]);

          // Satellite Orb
          ctx.fillStyle = sat.color;
          ctx.beginPath();
          ctx.arc(px, py, 6 * scale, 0, Math.PI * 2);
          ctx.fill();

          // Label Tag
          ctx.fillStyle = '#172033';
          ctx.font = `600 ${Math.max(9, Math.round(11 * scale))}px Space Grotesk, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(sat.label, px, py - 10 * scale);
        }

        animationFrameId = requestAnimationFrame(render);
      } catch (err) {
        console.error('InnovationUniverse3D render error:', err);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [height, compact]);

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: `${height}px`,
          cursor: 'grab'
        }}
      />
    </div>
  );
}
