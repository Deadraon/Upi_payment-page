'use client';

import React, { useEffect, useRef } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouseRef.current.targetX = e.touches[0].clientX;
        mouseRef.current.targetY = e.touches[0].clientY;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchend', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchend', handleMouseLeave);
    };
  }, []);

  // Lerp smoothing loop for 60fps silky cursor movement
  useEffect(() => {
    let animId;
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const updateSmoothMouse = () => {
      mouseRef.current.x = lerp(mouseRef.current.x, mouseRef.current.targetX, 0.09);
      mouseRef.current.y = lerp(mouseRef.current.y, mouseRef.current.targetY, 0.09);
      animId = requestAnimationFrame(updateSmoothMouse);
    };

    animId = requestAnimationFrame(updateSmoothMouse);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Canvas Particles & Constellation System (Fully Mobile Optimized)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768;

    const particleColors = [
      'rgba(59, 130, 246, ',  // Electric Blue
      'rgba(14, 165, 233, ',  // Sky Blue
      'rgba(6, 182, 212, ',   // Ice Cyan
      'rgba(168, 85, 247, ',  // Violet
      'rgba(255, 255, 255, ', // White
    ];

    // Mobile: 22 particles for maximum performance, Desktop: 50 particles
    const particleCount = isMobile 
      ? Math.min(Math.floor((width * height) / 28000), 24)
      : Math.min(Math.floor((width * height) / 20000), 55);

    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 1.6 + 0.8;
      const alpha = Math.random() * 0.35 + 0.15;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.35 : 0.45),
        vy: (Math.random() - 0.5) * (isMobile ? 0.35 : 0.45),
        radius,
        baseRadius: radius,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        alpha,
        baseAlpha: alpha,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    const maxDist = isMobile ? 120 : 160;
    const maxPdist = isMobile ? 90 : 115;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = mx - p.x;
        const dy = my - p.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        if (distToMouse < maxDist && mx > 0) {
          const force = 1 - distToMouse / maxDist;
          p.radius = p.baseRadius + force * 2;
          p.alpha = Math.min(0.85, p.baseAlpha + force * 0.4);

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(56, 189, 248, ${force * 0.35})`;
          ctx.lineWidth = 0.85;
          ctx.stroke();
        } else {
          p.radius = Math.max(p.baseRadius, p.radius - 0.05);
          p.alpha = Math.max(p.baseAlpha, p.alpha - 0.01);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const pdx = p.x - p2.x;
          const pdy = p.y - p2.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

          if (pdist < maxPdist) {
            const lineAlpha = (1 - pdist / maxPdist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* ── 1. Crisp Solid Tech Grid (Linear & Horizontal Lines) ── */}
      <div
        className="absolute inset-0 opacity-[0.08] sm:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #38bdf8 1px, transparent 1px),
            linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── 2. Glowing Moving Laser Horizontal Scan Beam ── */}
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/35 to-transparent animate-laser-scan-horizontal pointer-events-none" />
      <div className="absolute inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-cyan-500/25 to-transparent animate-laser-scan-vertical pointer-events-none" />

      {/* ── 3. Reference Curved Vector Geometric Outlines (Deadraon Style) ── */}
      <div 
        className="absolute -top-20 sm:-top-28 -left-20 sm:-left-28 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] rounded-[50px] sm:rounded-[70px] border border-blue-500/25 bg-gradient-to-br from-blue-950/20 to-transparent rotate-12 animate-tech-float-1 pointer-events-none" 
      />

      <div 
        className="absolute top-[28%] -right-24 sm:-right-36 w-[360px] sm:w-[580px] h-[320px] sm:h-[480px] rounded-[60px] sm:rounded-[90px] border border-cyan-500/20 bg-gradient-to-bl from-indigo-950/20 to-transparent -rotate-6 animate-tech-float-2 pointer-events-none" 
      />

      <div 
        className="absolute -bottom-24 sm:-bottom-36 left-[10%] sm:left-[20%] w-[320px] sm:w-[540px] h-[300px] sm:h-[460px] rounded-[50px] sm:rounded-[80px] border border-purple-500/20 bg-gradient-to-tr from-purple-950/15 to-transparent rotate-45 animate-tech-float-3 pointer-events-none" 
      />

      {/* ── 4. Ambient Soft Glowing Mesh Orbs ── */}
      <div className="absolute top-1/4 left-1/4 sm:left-1/3 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-blue-500/10 rounded-full filter blur-[90px] sm:blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] bg-indigo-500/10 rounded-full filter blur-[80px] sm:blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '-4s' }} />

      {/* ── 5. Interactive Particle Canvas ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />
    </div>
  );
}
