import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Window from '../components/Window';

const PARTICLE_COUNT = 120;
const NOTE_SYMBOLS = ['♪', '♫', '♩', '♬', '♭', '♯'];

function Particle({ index, isDispersing }) {
  // Generate random positions across the entire viewport
  const randomX = (Math.random() - 0.5) * window.innerWidth;
  const randomY = (Math.random() - 0.5) * window.innerHeight;
  
  // Seeded random for consistency
  const seed = index * 12345;
  const seedX = Math.sin(seed) * window.innerWidth * 0.6;
  const seedY = Math.cos(seed) * window.innerHeight * 0.6;
  
  const symbol = NOTE_SYMBOLS[index % NOTE_SYMBOLS.length];
  const colors = ['rgba(255, 255, 255, 0.35)', 'rgba(255, 182, 90, 0.25)', 'rgba(255, 255, 255, 0.3)', 'rgba(0, 217, 255, 0.2)'];
  const color = colors[index % colors.length];
  const delay = (index % 20) * 0.08;

  return (
    <motion.span
      className="particle"
      style={{ color }}
      initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
      animate={isDispersing ? { opacity: 0, x: seedX * 1.8, y: seedY * 1.8, scale: 0.2 } : { opacity: 0.6, x: seedX, y: seedY, scale: 1 }}
      transition={{ duration: isDispersing ? 1.2 : 1.6, ease: 'easeOut', delay: isDispersing ? 0 : delay }}
    >
      {symbol}
    </motion.span>
  );
}

export default function Welcome() {
  const [isDispersing, setIsDispersing] = useState(false);
  const navigate = useNavigate();
  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => i), []);

  const sampleContent = (
    <div>
      <h3 style={{ marginTop: 0 }}>About Worship Pads</h3>
      <p style={{ marginBottom: 0 }}>This is a draggable, resizable window example. Drag the titlebar, resize from bottom-right.</p>
    </div>
  );

  const handleEnter = () => {
    if (isDispersing) return;
    setIsDispersing(true);
    // Shorter delay so transition to Pads feels snappy
    setTimeout(() => navigate('/pads'), 300);
  };

  return (
    <div className="welcome-page" onClick={handleEnter}>
      <div className="welcome-backdrop" />
      <div className="particles-wrap">
        {particles.map((i) => (
          <Particle key={i} index={i} isDispersing={isDispersing} />
        ))}
      </div>

      <motion.div
        className="welcome-copy"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1>CHURCH AMBIENT PADS</h1>
        <p>AARON</p>
        <span className="subcopy">Tap anywhere to enter</span>
      </motion.div>
    </div>
  );
}
