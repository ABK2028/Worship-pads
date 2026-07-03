import { useRef, useEffect } from 'react';

export default function WaveCanvas({ side = 'left' }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = mq.matches;
    const onMQ = (e) => { reducedMotion = e.matches; };
    mq.addEventListener('change', onMQ);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const isLeft = side === 'left';

    const draw = (time) => {
      const t = time * 0.001;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      if (reducedMotion) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const rows = 80;
      const cols = 14;
      const edgeX = isLeft ? w : 0;
      const dir = isLeft ? -1 : 1;

      for (let row = 0; row < rows; row++) {
        const rowProgress = row / rows;
        const perspective = 1 - rowProgress * 0.7;
        const y = h - rowProgress * h;
        const brightness = (1 - rowProgress) * 0.8 + 0.1;
        const dotSize = perspective * 1.8 + 0.3;
        const spread = perspective * w * 0.9 + w * 0.1;
        const wavePhase = t * 0.8 + row * 0.15;
        const waveAmp = 25 * perspective + 5;

        for (let col = 0; col < cols; col++) {
          const colProgress = col / (cols - 1);
          const baseX = edgeX + dir * (colProgress * spread);
          const waveOffset = Math.sin(wavePhase + colProgress * Math.PI * 2) * waveAmp;
          const x = baseX + waveOffset;
          const yWave = y + Math.cos(wavePhase + colProgress * Math.PI * 2) * waveAmp * 0.3;
          const hue = isLeft
            ? 280 + Math.sin(colProgress * Math.PI + t) * 30
            : 190 + Math.sin(colProgress * Math.PI + t) * 25;
          const alpha = brightness * (0.4 + Math.sin(wavePhase + col * 0.3) * 0.3);

          ctx.beginPath();
          ctx.arc(x, yWave, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${Math.max(0, alpha)})`;
          ctx.fill();
        }

        if (row < 25 && rowProgress < 0.4) {
          const peakCol = 0.5;
          const baseX = edgeX + dir * (peakCol * spread);
          const waveOffset = Math.sin(wavePhase + peakCol * Math.PI * 2) * waveAmp;
          const pillarX = baseX + waveOffset;
          const pillarHeight = (1 - rowProgress) * 120 + 30;
          const hue = isLeft ? 290 : 190;

          const grad = ctx.createLinearGradient(pillarX, y, pillarX, y - pillarHeight);
          grad.addColorStop(0, `hsla(${hue}, 100%, 70%, ${brightness * 0.4})`);
          grad.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5 * perspective;
          ctx.beginPath();
          ctx.moveTo(pillarX, y);
          ctx.lineTo(pillarX, y - pillarHeight);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      const glowPoints = 80;
      for (let i = 0; i <= glowPoints; i++) {
        const progress = i / glowPoints;
        const y = h - progress * h;
        const perspective = 1 - progress * 0.7;
        const wavePhase = t * 0.8 + progress * rows * 0.15;
        const waveAmp = 25 * perspective + 5;
        const spread = perspective * w * 0.9 + w * 0.1;
        const x = edgeX + dir * spread + Math.sin(wavePhase + 0.5 * Math.PI * 2) * waveAmp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const glowHue = isLeft ? 290 : 190;
      ctx.strokeStyle = `hsla(${glowHue}, 100%, 70%, 0.2)`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = `hsla(${glowHue}, 100%, 75%, 0.5)`;
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Soft center glow effect
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gradient.addColorStop(0, `rgba(68, 210, 255, 0.04)`);
      gradient.addColorStop(0.6, `rgba(68, 210, 255, 0.008)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      mq.removeEventListener('change', onMQ);
    };
  }, [side]);

  return (
    <canvas
      ref={canvasRef}
      className="wave-canvas"
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
