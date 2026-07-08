import { useMemo, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Pads from './pages/Pads';
import AddChords from './pages/AddChords';
import { useCallback } from 'react';

const STORAGE_KEY = 'worship-pads-shared-chords';
const DEFAULT_CHORDS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sharedPads, setSharedPads] = useState([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSharedPads(JSON.parse(saved));
      } catch {
        setSharedPads([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedPads));
  }, [sharedPads]);

  const fetchSharedPads = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/uploads`);
      if (!response.ok) return;
      const data = await response.json();
      const normalized = data.map((item) => ({
        chord: item.chord,
        url: item.url.startsWith('http') ? item.url : `${BACKEND_URL}${item.url}`,
        filename: item.originalName || item.filename,
      }));
      setSharedPads(normalized);
    } catch (error) {
      console.warn('Could not fetch shared chords:', error);
    }
  };

  useEffect(() => {
    fetchSharedPads();
  }, []);

  const pads = useMemo(() => {
    const extras = sharedPads.filter((pad) => !DEFAULT_CHORDS.includes(pad.chord));
    return [...DEFAULT_CHORDS.map((chord) => ({ chord })), ...extras];
  }, [sharedPads]);

  const [isFull, setIsFull] = useState(false);
  const toggleFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Request fullscreen with proper vendor prefixes
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
        setIsFull(true);
      } else {
        // Exit fullscreen with proper vendor prefixes
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsFull(false);
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed', e);
    }
  }, []);

  return (
    <div className="app-shell">
      {location.pathname !== '/' && (
        <div className="app-nav">
          <label className="nav-select-label" htmlFor="page-select">
            Go to
          </label>
          <button onClick={toggleFullscreen} style={{ marginRight: 8, borderRadius: 12, padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.12)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.08)', transition: 'all 0.2s ease' }}>
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
      )}
      <Routes>
        <Route path="/" element={<Welcome onEnter={() => navigate('/pads')} />} />
        <Route path="/pads" element={<Pads pads={pads} customPads={sharedPads} />} />
        <Route path="/add-chords" element={<AddChords customPads={sharedPads} setCustomPads={setSharedPads} refreshSharedPads={fetchSharedPads} />} />
      </Routes>
    </div>
  );
}
