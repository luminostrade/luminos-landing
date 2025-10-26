import React, { useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Global comet system - only one comet at a time
    const cometSystem = {
      active: false,
      starIndex: null,
      startTime: 0,
      nextCometTime: (30 + Math.random() * 60) * 100, // 30-90 seconds (time is in 0.01 increments)
      duration: 8 * 100, // Comet lasts 8 seconds
      fadeOutTime: 2 * 100, // Additional 2 seconds for complete fade out
    };

    class Star {
      constructor(index, total) {
        this.index = index;
        this.angle = (index / total) * Math.PI * 2;
        this.radius = 150 + Math.random() * 200;
        this.size = 1 + Math.random() * 2;
        this.speed = 0.3 + Math.random() * 0.5;
        this.orbitSpeed = 0.001 + Math.random() * 0.002;
        this.phase = Math.random() * Math.PI * 2;
        this.trail = [];
        this.maxTrailLength = 80; // Longer magical trail
      }

      update(time, isComet) {
        this.angle += this.orbitSpeed;
        
        if (isComet) {
          const x = Math.cos(this.angle) * this.radius;
          const y = Math.sin(this.angle) * this.radius;
          this.trail.push({ x, y, time });
          
          if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
          }
        } else if (this.trail.length > 0) {
          // Fade out trail by removing points
          this.trail.shift();
        }
      }

      draw(ctx, centerX, centerY, time, isComet, cometProgress) {
        const x = centerX + Math.cos(this.angle) * this.radius;
        const y = centerY + Math.sin(this.angle) * this.radius;
        
        // Draw magical sparkling tail
        if (this.trail.length > 1) {
          ctx.shadowBlur = 0;
          
          for (let i = 0; i < this.trail.length - 1; i++) {
            const point = this.trail[i];
            const nextPoint = this.trail[i + 1];
            const progress = i / this.trail.length;
            
            // Create sparkling effect with varying opacity
            const sparkle = Math.sin(time * 10 + i * 0.5) * 0.3 + 0.7;
            const opacity = progress * 0.9 * sparkle * cometProgress;
            const width = progress * 6;
            
            // Main tail with gradient colors
            const gradient = ctx.createLinearGradient(
              centerX + point.x, centerY + point.y,
              centerX + nextPoint.x, centerY + nextPoint.y
            );
            gradient.addColorStop(0, `rgba(200, 200, 255, ${opacity * 0.6})`);
            gradient.addColorStop(0.5, `rgba(255, 250, 245, ${opacity})`);
            gradient.addColorStop(1, `rgba(255, 220, 200, ${opacity * 0.8})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(centerX + point.x, centerY + point.y);
            ctx.lineTo(centerX + nextPoint.x, centerY + nextPoint.y);
            ctx.stroke();
            
            // Add sparkle particles along the trail
            if (i % 3 === 0 && Math.random() > 0.5) {
              const sparkleSize = Math.random() * 2 + 1;
              ctx.fillStyle = `rgba(255, 255, 255, ${opacity * Math.random()})`;
              ctx.beginPath();
              ctx.arc(centerX + point.x, centerY + point.y, sparkleSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          // Add glow to the end of the trail
          if (this.trail.length > 5) {
            const lastPoint = this.trail[this.trail.length - 1];
            ctx.shadowBlur = 20;
            ctx.shadowColor = `rgba(255, 250, 245, ${cometProgress})`;
            ctx.fillStyle = `rgba(255, 250, 245, ${0.5 * cometProgress})`;
            ctx.beginPath();
            ctx.arc(centerX + lastPoint.x, centerY + lastPoint.y, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        const pulse = Math.sin(time * this.speed + this.phase) * 0.5 + 0.5;
        const currentSize = this.size * (0.5 + pulse * 0.5);
        const extraGlow = isComet ? 30 : 0;
        
        ctx.shadowBlur = 10 + pulse * 10 + extraGlow;
        ctx.shadowColor = '#FFFAF5';
        ctx.fillStyle = '#FFFAF5';
        ctx.beginPath();
        ctx.arc(x, y, currentSize + (isComet ? 3 : 0), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 250, 245, 0.05)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const stars = [];
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      stars.push(new Star(i, starCount));
    }

    const animate = () => {
      time += 0.01;
      
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Manage global comet system
      if (!cometSystem.active && time >= cometSystem.nextCometTime) {
        // Start a new comet
        cometSystem.active = true;
        cometSystem.starIndex = Math.floor(Math.random() * stars.length);
        cometSystem.startTime = time;
      }

      // Check if comet should be deactivated (after duration + fade out)
      if (cometSystem.active) {
        const elapsed = time - cometSystem.startTime;
        if (elapsed > cometSystem.duration + cometSystem.fadeOutTime) {
          cometSystem.active = false;
          cometSystem.starIndex = null;
          // Schedule next comet in 30-90 seconds
          cometSystem.nextCometTime = time + (30 + Math.random() * 60) * 100;
        }
      }

      // Calculate comet progress for fade in/out effects
      let cometProgress = 0;
      if (cometSystem.active) {
        const elapsed = time - cometSystem.startTime;
        if (elapsed < cometSystem.duration) {
          // Active phase - fade in quickly, stay bright
          cometProgress = Math.min(1, elapsed / 50); // Fade in over 0.5 seconds
        } else {
          // Fade out phase
          const fadeElapsed = elapsed - cometSystem.duration;
          cometProgress = Math.max(0, 1 - (fadeElapsed / cometSystem.fadeOutTime));
        }
      }

      stars.forEach((star, index) => {
        const isComet = cometSystem.active && index === cometSystem.starIndex;
        star.update(time, isComet);
        star.draw(ctx, centerX, centerY, time, isComet, cometProgress);
      });

      const centerPulse = Math.sin(time * 2) * 0.3 + 0.7;
      ctx.shadowBlur = 40 * centerPulse;
      ctx.shadowColor = '#FFFAF5';
      ctx.fillStyle = '#FFFAF5';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8 * centerPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      for (let i = 0; i < 12; i++) {
        const rayAngle = (i / 12) * Math.PI * 2 + time * 0.5;
        const rayLength = 30 + Math.sin(time * 3 + i) * 10;
        
        ctx.strokeStyle = `rgba(255, 250, 245, ${0.3 + Math.sin(time * 2 + i) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(rayAngle) * rayLength,
          centerY + Math.sin(rayAngle) * rayLength
        );
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full" style={{ color: '#FFFAF5' }}>
        <div className="text-center px-4 max-w-2xl">
          <h1 className="text-7xl md:text-9xl font-light tracking-widest mb-8 fade-in">
            LUMINOS
          </h1>
          
          <p className="text-xl md:text-2xl font-light tracking-wide mb-4 opacity-80 fade-in-delay-1">
            Brilliant Trading, Illuminated
          </p>
          
          <p className="text-sm md:text-base font-light tracking-wider mb-16 opacity-60 fade-in-delay-2">
            Where light meets execution
          </p>

          <p className="mt-8 text-xs md:text-sm font-light tracking-widest opacity-40 fade-in-delay-3">
            COMING SOON
          </p>
        </div>

        <div className="absolute bottom-8 text-center">
          <p className="text-xs font-light tracking-widest opacity-40">
            © 2025 LUMINOS TRADE
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;