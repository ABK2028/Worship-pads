import { useMemo, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Pads from './pages/Pads';
import AddChords from './pages/AddChords';
import { useCallback } from 'react';

const STORAGE_KEY = 'worship-pads-custom-chords';
const DEFAULT_CHORDS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customPads, setCustomPads] = useState([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCustomPads(JSON.parse(saved));
      } catch {
        setCustomPads([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customPads));
  }, [customPads]);

  const pads = useMemo(() => {
    const extras = customPads.filter((pad) => !DEFAULT_CHORDS.includes(pad.chord));
    return [...DEFAULT_CHORDS.map((chord) => ({ chord })), ...extras];
  }, [customPads]);

  const [isFull, setIsFull] = useState(false);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFull(true);
      } else {
        await document.exitFullscreen();
        setIsFull(false);
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed', e);
    }
  }, []);

  return (
    <div className="app-shell">
      <div className="app-nav">
        <label className="nav-select-label" htmlFor="page-select">
          Go to
        </label>
        <button onClick={toggleFullscreen} style={{ marginRight: 8, borderRadius: 12, padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.08)', transition: 'all 0.2s ease' }}>
          {isFull ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
        <select
          id="page-select"
          value={location.pathname}
          onChange={(event) => navigate(event.target.value)}
          className="nav-select"
        >
          <option value="/">Welcome</option>
          <option value="/pads">Pads</option>
          <option value="/add-chords">Add Chords</option>
        </select>
      </div>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/pads" element={<Pads pads={pads} customPads={customPads} />} />
        <Route path="/add-chords" element={<AddChords customPads={customPads} setCustomPads={setCustomPads} />} />
      </Routes>
    </div>
  );
}
