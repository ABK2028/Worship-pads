# Audio Files Folder

This folder stores the default chord audio files used by the Worship Pads application.

## How to Add Audio Files

1. **Place audio files directly in this folder** with the naming convention: `{ChordName}.mp3`
   
   Example files:
   - `C.mp3`
   - `Db.mp3`
   - `D.mp3`
   - `Eb.mp3`
   - etc.

2. **Or upload files through the app interface:**
   - Go to the "Add Chords" page
   - Enter a chord name (e.g., "C", "Am7", "Gsus4")
   - Select an MP3 audio file
   - Click "Upload" to save it

## File Requirements

- **Format:** MP3 (recommended for browser compatibility)
- **Size:** Keep files reasonably sized (< 5MB for good performance)
- **Naming:** Use the exact chord name as the filename (case-sensitive)

## Example Directory Structure

```
public/
  audio/
    C.mp3
    Db.mp3
    D.mp3
    Eb.mp3
    E.mp3
    F.mp3
    Gb.mp3
    G.mp3
    Ab.mp3
    A.mp3
    Bb.mp3
    B.mp3
```

## How It Works

- **Default Chords:** The app first looks for audio files in this folder (12 default chords)
- **Custom Chords:** When you upload via the app, files are stored in the browser's local memory
- **Playback:** Click any pad to play its audio with fade in/out and volume control

## Supported Audio Formats

While MP3 is recommended, the app can handle other formats supported by your browser:
- MP3
- WAV
- OGG
- FLAC

## Note

If you add files to this folder directly, you may need to refresh the app (clear cache) for the changes to take effect.
