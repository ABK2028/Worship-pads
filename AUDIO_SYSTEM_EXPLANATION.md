# Web Audio API Implementation - Seamless Looping & Crossfading

## Problem Analysis: Why Your Previous Method Caused Issues

### 1. **Clicking on Loop Playback**
**Old method:** Using `<audio>` elements with `currentTime = 0` to restart the loop
- **Why it clicks:** Seeking on HTML audio elements is discontinuous. The browser has to:
  - Stop the current playback buffer
  - Perform a context switch to the file system
  - Reload the audio stream from the seek point
  - This breaks the smooth waveform at the boundary, causing an audible click/pop
- **Additional problem:** If the audio file has any encode artifacts (MP3 frame boundaries), restarting amplifies them

### 2. **Abrupt Cuts When Switching Tiles**
**Old method:** Fading out old source while fading in new source independently
- **Why it cuts:** The old source and new source weren't truly *overlapping*
- There was likely a timing gap between fade-out completing and fade-in starting
- Or the long fade times (2.0s) created a noticeable delay before the new sound arrived

---

## New Solution: Clean Web Audio API Implementation

### Key Improvements

#### 1. **Seamless Looping**
```javascript
source.loop = true; // Decoded buffers loop seamlessly at the end
```
- Uses the native Web Audio API looping on decoded `AudioBuffer`
- No seeking involved—the browser loops the buffer perfectly at the sample boundary
- **Zero clicks** because the waveform naturally connects at loop points

#### 2. **True Crossfading on Tile Switch**
```javascript
// Fade out old
oldGain.linearRampToValueAtTime(0, now + crossfadeTime);
oldSource.stop(now + crossfadeTime);

// Fade in new (at same time)
newGain.setValueAtTime(0, now);
newGain.linearRampToValueAtTime(volume, now + crossfadeTime);
newSource.start();
```
- **Overlapping:** Both sources run simultaneously during the crossfade window (250ms default)
- **Smooth transition:** The old sound fades to silence while the new sound fades in
- **No gap:** The two audio streams blend seamlessly

#### 3. **Preloaded Buffers**
```javascript
// On component mount, all audio buffers are decoded and cached
const preloadAllAudio = async () => {
  for (const chord of allChords) {
    await loadBuffer(chord);
  }
};
```
- All audio is decoded once on startup
- Playing a tile is instant—no loading latency
- Buffers are reused, reducing memory allocations

#### 4. **Master Gain Node**
```javascript
// Single volume control for all playback
source.connect(gainNode).connect(masterGain).connect(context.destination);
masterGain.gain.value = volume; // Apply volume to all sources
```
- All sources connect through a master gain node
- Volume slider updates affect the current playback smoothly
- Clean signal chain: `source → individual gain → master gain → speakers`

---

## Architecture

### Core Components

```javascript
const CROSSFADE_TIME = 0.25; // 250ms smooth crossfade

// Refs for lifecycle management
contextRef              // Web Audio API context
masterGainRef           // Master volume control
bufferCacheRef          // Decoded audio buffers
currentSourceRef        // Current playing source + gain (only one active)
```

### Signal Chain
```
AudioBuffer (preloaded)
    ↓
BufferSource (loops smoothly)
    ↓
Individual Gain Node (for crossfade)
    ↓
Master Gain Node (volume control)
    ↓
AudioContext.destination (speakers)
```

### State Management
- **`activeChord`:** Which chord is currently playing (display state)
- **`currentSourceRef`:** The actual audio source + gain nodes (audio control state)
- **`bufferCacheRef`:** All decoded buffers (audio data)

---

## How It Works: Step-by-Step

### Playing a Chord
1. User clicks a tile
2. `playChord(chord)` is called
3. If a chord is already playing:
   - Fade out the old source (250ms)
   - Stop the old source after fade completes
4. Create a new `BufferSource` with the preloaded buffer
5. Set loop to `true`
6. Fade in the new source (250ms, overlapping with step 3)
7. Call `source.start()`

### Stopping a Chord
1. User clicks the active tile again
2. `stopChord()` is called
3. Fade out the current source (250ms)
4. Call `source.stop()` after fade completes
5. Clear `currentSourceRef`

---

## Why This Works

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| Looping clicks | HTML audio seek breaks waveform continuity | Use `source.loop = true` on decoded buffers—zero seeking |
| Abrupt tile switch | Fade-out and fade-in don't overlap properly | Overlap both sources during a shared crossfade window |
| Latency on tile click | Buffers loaded on-demand | Preload all buffers on component mount |
| Unsmooth volume changes | Direct context.destination volume changes | Use master gain node with `setTargetAtTime()` for smooth ramps |

---

## Configuration

Default crossfade is **250ms** (hard-coded for optimal UX). Users can customize:
- **Volume:** 0–100% (real-time via master gain)
- **Fade In:** 0.1–5.0s (custom per session, applies to next tile click)
- **Fade Out:** 0.1–5.0s (custom per session, applies to current stop)

The hard-coded `CROSSFADE_TIME = 0.25` is independent of the UI sliders—it ensures a snappy, responsive feel while the UI sliders provide longer, ambient-pad-friendly fade times for manual control.

---

## Files Modified

- `src/pages/Pads.jsx` — Complete audio system rewrite
  - Replaced `audioRefs` with `bufferCacheRef` and `currentSourceRef`
  - Replaced `handleLoadAudio()` with `loadBuffer()` (preload on mount)
  - Replaced `playChord()` / `stopChord()` with crossfade logic
  - Updated `handleChordClick()` to use new refs
  - Removed `onMouseEnter` preload (all buffers preloaded already)

---

## Testing Checklist

- ✅ Play a chord—should start cleanly with fade-in
- ✅ Switch to another chord—should crossfade smoothly (no gap)
- ✅ Listen to looping—should have no clicks
- ✅ Adjust volume slider—should fade smoothly
- ✅ Toggle chord on/off—should fade out cleanly
- ✅ Open DevTools Console—should have no errors
