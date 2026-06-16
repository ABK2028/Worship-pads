import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Window from '../components/Window';

const PARTICLE_COUNT = 72;
const NOTE_SYMBOLS = ['♪', '♫', '♩', '♬', '♭', '♯'];

function Particle({ index, isDispersing }) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const radius = 170 + (index % 8) * 3;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const symbol = NOTE_SYMBOLS[index % NOTE_SYMBOLS.length];

  return (
    <motion.span
      className="particle"
      initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
      animate={isDispersing ? { opacity: 0, x: x * 2.1, y: y * 2.1, scale: 0.7 } : { opacity: 1, x, y, scale: 1 }}
      transition={{ duration: isDispersing ? 1.0 : 1.4, ease: 'easeOut' }}
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
    setTimeout(() => navigate('/pads'), 1100);
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
      <div style={{ position: 'absolute', left: 26, bottom: 26, zIndex: 50 }}>
        <Window title="Info" initiallyOpen={true}>{sampleContent}</Window>
      </div>
    </div>
  );
}
