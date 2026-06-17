import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_CHORDS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function AddChords({ customPads, setCustomPads }) {
  const [chordName, setChordName] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleFileSelect = (event) => {
    setPendingFile(event.target.files?.[0] || null);
    setStatus('');
  };

  const handleUpload = () => {
    if (!pendingFile || !chordName.trim()) {
      setStatus('Please enter a chord name and select an audio file.');
      return;
    }

    const label = chordName.trim();
    const reader = new FileReader();
    reader.onload = () => {
      const audioData = reader.result;
      const nextPads = customPads.filter((pad) => pad.chord !== label);
      setCustomPads([...nextPads, { chord: label, audioData, filename: pendingFile.name }]);
      setChordName('');
      setPendingFile(null);
      setStatus(`Saved pad for ${label}`);
    };
    reader.readAsDataURL(pendingFile);
  };

  const removePad = (chord) => {
    setCustomPads(customPads.filter((pad) => pad.chord !== chord));
    setStatus(`Removed pad ${chord}`);
  };

  const navigate = useNavigate();

  const allChordList = [...DEFAULT_CHORDS, ...customPads.map((pad) => pad.chord).filter((chord) => !DEFAULT_CHORDS.includes(chord))];

  return (
    <div className="add-chords-page">
      <div className="panel">
        <h1>Add Chords</h1>
        <p>Upload audio for any chord and it will appear as a new pad.</p>

        <div className="add-chords-content">
          <div className="upload-section">
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>Upload New Pad</h2>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' }}>
              <label className="field-label">Chord name</label>
              <input
                type="text"
                value={chordName}
                onChange={(e) => setChordName(e.target.value)}
                placeholder="C, Dm7, Gsus4, Verse Pad..."
              />

              <label className="field-label">Audio file</label>
              <input type="file" accept="audio/*" onChange={handleFileSelect} />

              <div className="upload-preview">
                📁 {pendingFile ? pendingFile.name : 'No file selected yet'}
              </div>

              <button className="primary-button" type="button" onClick={handleUpload}>
                + Upload "{chordName || 'Chord'}"
              </button>

              {status && <div className="status-message">{status}</div>}
            </div>
          </div>

          <div className="pads-section">
            <h2 style={{ margin: '0 0 1.5rem' }}>All pads</h2>
            <div className="saved-grid">
              {allChordList.map((chord) => {
                const customPad = customPads.find((pad) => pad.chord === chord);
                const isCustom = !!customPad;
                return (
                  <div key={chord} className={`saved-item ${isCustom ? 'saved-active' : ''}`}>
                    <div>
                      <div className="saved-title">{chord}</div>
                      {isCustom && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{customPad.filename}</div>}
                    </div>
                    {isCustom && (
                      <button type="button" onClick={() => removePad(chord)}>
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
