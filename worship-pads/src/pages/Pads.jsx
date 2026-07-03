import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const DEFAULT_CHORDS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const CROSSFADE_TIME = 0.25; // 250ms smooth crossfade

export default function Pads({ pads = [], customPads = [] }) {
  const [activeChord, setActiveChord] = useState(null);
  const [volume, setVolume] = useState(0.78);
  const [fadeIn, setFadeIn] = useState(0.25); // Reduced to 250ms for snappy response
  const [fadeOut, setFadeOut] = useState(0.25); // Reduced to 250ms
  const [loadedAudio, setLoadedAudio] = useState({});
  
  // Core refs
  const contextRef = useRef(null);
  const masterGainRef = useRef(null);
  const bufferCacheRef = useRef({});
  const bufferPromisesRef = useRef({});
  
  // Track current playing source + gain for crossfading
  const currentSourceRef = useRef({ source: null, gain: null, chord: null });
  
  // UI refs
  const volRef = useRef(null);
  const fadeInRef = useRef(null);
  const fadeOutRef = useRef(null);

  // Initialize AudioContext on mount
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    contextRef.current = ctx;
    
    // Create master gain for volume control
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.78;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    return () => {
      // Stop current source if playing
      if (currentSourceRef.current.source) {
        currentSourceRef.current.source.stop();
      }
      ctx.close();
    };
  }, []);

  // Preload all audio buffers on mount (non-blocking, parallel)
  useEffect(() => {
    const preloadAllAudio = () => {
      const allChords = new Set([
        ...DEFAULT_CHORDS,
        ...pads.map(p => p.chord),
        ...customPads.map(p => p.chord).filter(Boolean)
      ]);

      // Start loads in parallel after a short delay so navigation animation isn't blocked
      setTimeout(() => {
        const promises = [...allChords].map((chord) => loadBuffer(chord));
        // Run in background; don't await here to avoid blocking render
        Promise.allSettled(promises).catch(() => {});
      }, 200);
    };

    if (contextRef.current) {
      preloadAllAudio();
    }
  }, [pads, customPads]);

  // Real-time fade updates for currently playing audio
  useEffect(() => {
    if (!currentSourceRef.current.gain || !contextRef.current) return;

    const now = contextRef.current.currentTime;
    const gainNode = currentSourceRef.current.gain;
    
    // If audio is playing, update the fade values
    // This will cause the audio to smoothly adjust to new fade parameters
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + Math.max(fadeIn, 0.05));
  }, [fadeIn]);

  const customAudioMap = useMemo(() => {
    return customPads.reduce((map, pad) => {
      if (pad.chord) map[pad.chord] = pad;
      return map;
    }, {});
  }, [customPads]);

  const primaryPads = useMemo(() => pads.slice(0, 12), [pads]);
  const extraPads = useMemo(() => pads.slice(12), [pads]);

  /**
   * Load audio buffer from file and cache it
   */
  const loadBuffer = async (chord) => {
    if (bufferCacheRef.current[chord]) return bufferCacheRef.current[chord];
    if (bufferPromisesRef.current[chord]) return bufferPromisesRef.current[chord];
    if (!contextRef.current) return null;

    try {
      let arrayBuffer;
      
      // Check for custom audio
      const customPad = customAudioMap[chord];
      if (customPad?.audioData) {
        arrayBuffer = customPad.audioData;
      } else {
        // Fetch from file
        const response = await fetch(`/audio/${encodeURIComponent(chord)}.mp3`);
        if (!response.ok) return null;
        arrayBuffer = await response.arrayBuffer();
      }

      // Kick off decoding and store the promise to prevent duplicate work
      const decodePromise = contextRef.current.decodeAudioData(arrayBuffer).then((buffer) => {
        bufferCacheRef.current[chord] = buffer;
        setLoadedAudio((prev) => ({ ...prev, [chord]: true }));
        delete bufferPromisesRef.current[chord];
        return buffer;
      }).catch((err) => {
        delete bufferPromisesRef.current[chord];
        throw err;
      });

      bufferPromisesRef.current[chord] = decodePromise;
      return decodePromise;
    } catch (error) {
      console.error(`Failed to load audio for ${chord}:`, error);
      return null;
    }
  };

  /**
   * Play a chord with crossfade effect
   */
  const playChord = async (chord) => {
    if (!contextRef.current || !masterGainRef.current) return;

    const buffer = await loadBuffer(chord);
    if (!buffer) return;

    const now = contextRef.current.currentTime;
    const effectiveFadeIn = Math.max(fadeIn, 0.05);
    const effectiveFadeOut = Math.max(fadeOut, 0.05);

    // Fade out previous source if it exists
    if (currentSourceRef.current.source && currentSourceRef.current.gain) {
      const oldGain = currentSourceRef.current.gain;
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + effectiveFadeOut);
      
      // Stop old source after fade completes
      currentSourceRef.current.source.stop(now + effectiveFadeOut);
    }

    // Create new source + gain
    const source = contextRef.current.createBufferSource();
    const gainNode = contextRef.current.createGain();

    source.buffer = buffer;
    source.loop = true; // Seamless loop on decoded buffer
    
    // Connect: source -> gain -> masterGain -> destination
    source.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    // Fade in the new source (overlaps with fade out)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + effectiveFadeIn);

    source.start();

    // Store for next transition
    currentSourceRef.current = { source, gain: gainNode, chord };
  };

  /**
   * Stop the currently playing chord with fade out
   */
  const stopChord = () => {
    if (!currentSourceRef.current.source || !contextRef.current) return;

    const now = contextRef.current.currentTime;
    const fadeTime = Math.max(fadeOut, 0.05);
    const gainNode = currentSourceRef.current.gain;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);

    currentSourceRef.current.source.stop(now + fadeTime);
    currentSourceRef.current = { source: null, gain: null, chord: null };
  };

  /**
   * Handle tile click
   */
  const handleChordClick = async (chord) => {
    if (activeChord === chord) {
      // Toggle off
      stopChord();
      setActiveChord(null);
      return;
    }

    // Switch to new chord (old one automatically crossfades out)
    await playChord(chord);
    setActiveChord(chord);
  };

  /**
   * Update master volume
   */
  const handleVolumeChange = (event) => {
    const val = Number(event.target.value);
    setVolume(val);
    
    if (masterGainRef.current && contextRef.current) {
      const now = contextRef.current.currentTime;
      masterGainRef.current.gain.setTargetAtTime(val, now, 0.01);
    }
    
    if (volRef.current) updateRangeBackground(volRef.current, val, 0, 1);
  };

  const getTileStatus = (chord) => {
    const customPad = customAudioMap[chord];
    if (activeChord === chord) return 'Playing';
    if (customPad?.filename) return customPad.filename;
    if (loadedAudio[chord] || customPad?.audioData) return 'Ready';
    return 'Loading...';
  };

  const renderPadTile = (pad) => {
    const isActive = activeChord === pad.chord;
    const hasAudio = !!loadedAudio[pad.chord] || !!customAudioMap[pad.chord]?.audioData;

    return (
      <button
        key={pad.chord}
        className={`pad-tile ${isActive ? 'active' : ''} ${!hasAudio ? 'no-audio' : ''}`}
        onClick={() => handleChordClick(pad.chord)}
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
