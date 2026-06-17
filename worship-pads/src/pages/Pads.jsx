import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const DEFAULT_CHORDS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function Pads({ pads = [], customPads = [] }) {
  const [activeChord, setActiveChord] = useState(null);
  const [volume, setVolume] = useState(0.78);
  const [fadeIn, setFadeIn] = useState(2.0);
  const [fadeOut, setFadeOut] = useState(2.0);
  const [loadedAudio, setLoadedAudio] = useState({});
  const audioRefs = useRef({});
  const contextRef = useRef(null);
  const volRef = useRef(null);
  const fadeInRef = useRef(null);
  const fadeOutRef = useRef(null);

  useEffect(() => {
    contextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      contextRef.current?.close();
    };
  }, []);

  const customAudioMap = useMemo(() => {
    return customPads.reduce((map, pad) => {
      if (pad.chord) map[pad.chord] = pad;
      return map;
    }, {});
  }, [customPads]);

  const primaryPads = useMemo(() => pads.slice(0, 12), [pads]);
  const extraPads = useMemo(() => pads.slice(12), [pads]);

  const loadAudioSource = async (chord) => {
    const customPad = customAudioMap[chord];
    if (customPad?.audioData) return customPad.audioData;

    const response = await fetch(`/audio/${encodeURIComponent(chord)}.mp3`);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  };

  const handleLoadAudio = async (chord) => {
    if (!contextRef.current) return;
    if (loadedAudio[chord]) return;

    try {
      const source = await loadAudioSource(chord);
      if (!source) return;

      const data = source instanceof ArrayBuffer ? source : await fetch(source).then((res) => res.arrayBuffer());
      const buffer = await contextRef.current.decodeAudioData(data);
      audioRefs.current[chord] = { buffer, source: null, gain: null };
      setLoadedAudio((prev) => ({ ...prev, [chord]: true }));
    } catch (error) {
      console.error('Failed to load audio', chord, error);
    }
  };

  const playChord = async (chord) => {
    if (!contextRef.current) return;
    await handleLoadAudio(chord);
    const chordData = audioRefs.current[chord]?.buffer;
    if (!chordData) return;

    const now = contextRef.current.currentTime;
    const gain = contextRef.current.createGain();
    gain.gain.value = 0;
    
    // Cancel any existing scheduled changes and perform a linear fade in
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.max(fadeIn, 0.05));

    const source = contextRef.current.createBufferSource();
    source.buffer = chordData;
    source.loop = true;
    source.connect(gain).connect(contextRef.current.destination);
    source.start();

    audioRefs.current[chord] = { ...audioRefs.current[chord], source, gain };
  };

  const stopChord = (chord) => {
    const audio = audioRefs.current[chord];
    if (!audio?.source || !audio?.gain) return;
    const now = contextRef.current.currentTime;
    
    // Cancel any existing scheduled changes and perform a linear fade out
    audio.gain.gain.cancelScheduledValues(now);
    audio.gain.gain.setValueAtTime(audio.gain.gain.value, now);
    audio.gain.gain.linearRampToValueAtTime(0, now + Math.max(fadeOut, 0.05));
    
    // Stop the source after the fade out completes
    audio.source.stop(now + Math.max(fadeOut, 0.05));
    audioRefs.current[chord] = { ...audio, source: null, gain: null };
  };

  const handleChordClick = async (chord) => {
    if (activeChord === chord) {
      stopChord(chord);
      setActiveChord(null);
      return;
    }

    if (activeChord) {
      stopChord(activeChord);
    }

    await playChord(chord);
    setActiveChord(chord);
  };

  const handleVolumeChange = (event) => {
    const val = Number(event.target.value);
    setVolume(val);
    const now = contextRef.current?.currentTime;
    if (!now) return;
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio?.gain) audio.gain.gain.setTargetAtTime(val, now, 0.01);
    });
    if (volRef.current) updateRangeBackground(volRef.current, val, 0, 1);
  };

  const getTileStatus = (chord) => {
    const customPad = customAudioMap[chord];
    if (activeChord === chord) return 'Playing';
    if (customPad?.filename) return customPad.filename;
    if (loadedAudio[chord] || customPad?.audioData) return 'Tap to play';
    return 'No audio';
  };

  const renderPadTile = (pad) => {
    const isActive = activeChord === pad.chord;
    const hasAudio = !!loadedAudio[pad.chord] || !!customAudioMap[pad.chord]?.audioData;

    return (
      <button
        key={pad.chord}
        className={`pad-tile ${isActive ? 'active' : ''} ${!hasAudio ? 'no-audio' : ''}`}
        onClick={() => handleChordClick(pad.chord)}
        onMouseEnter={() => handleLoadAudio(pad.chord)}
      >
        <span>{pad.chord}</span>
        <span className="tile-status">{getTileStatus(pad.chord)}</span>
      </button>
    );
  };

  const updateRangeBackground = (el, value, min, max) => {
    if (!el) return;
    const pct = Math.round(((value - min) / (max - min)) * 100);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#2c77d9';
    el.style.background = `linear-gradient(90deg, ${accent} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`;
  };

  useEffect(() => {
    if (volRef.current) updateRangeBackground(volRef.current, volume, 0, 1);
    if (fadeInRef.current) updateRangeBackground(fadeInRef.current, fadeIn, 0.1, 5);
    if (fadeOutRef.current) updateRangeBackground(fadeOutRef.current, fadeOut, 0.1, 5);
  }, []);

  return (
    <motion.div className="pads-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <div className="pads-topbar">
        <div className="topbar-panel volume-panel">
          <div className="topbar-label">Volume</div>
          <div className="topbar-control">
            <input ref={volRef} type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} />
            <span>{Math.round(volume * 100)}</span>
          </div>
        </div>

        <div className="topbar-panel fade-panel">
          <div className="topbar-label">Fade In</div>
          <div className="topbar-control fade-row">
            <input ref={fadeInRef} type="range" min="0.1" max="5" step="0.1" value={fadeIn} onChange={(e) => { setFadeIn(Number(e.target.value)); updateRangeBackground(fadeInRef.current, Number(e.target.value), 0.1, 5); }} />
            <span>{fadeIn.toFixed(1)}s</span>
          </div>
        </div>

        <div className="topbar-panel fade-panel">
          <div className="topbar-label">Fade Out</div>
          <div className="topbar-control fade-row">
            <input ref={fadeOutRef} type="range" min="0.1" max="5" step="0.1" value={fadeOut} onChange={(e) => { setFadeOut(Number(e.target.value)); updateRangeBackground(fadeOutRef.current, Number(e.target.value), 0.1, 5); }} />
            <span>{fadeOut.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="pads-grid">{primaryPads.map(renderPadTile)}</div>
      {extraPads.length > 0 && <div className="pads-grid extra-grid">{extraPads.map(renderPadTile)}</div>}
    </motion.div>
  );
}
