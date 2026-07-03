import './Welcome.css';
import WaveCanvas from '../components/WaveCanvas';
import WorshipPadsLogo from '../components/WorshipPadsLogo';

export default function Welcome({ onEnter }) {
  return (
    <div
      className="welcome-screen"
      onClick={onEnter}
    >
      <div className="wave-panel wave-left">
        <WaveCanvas side="left" />
      </div>
      <div className="wave-panel wave-right">
        <WaveCanvas side="right" />
      </div>

      <div className="content">
        <WorshipPadsLogo size={260} />
        <h2>WELCOME</h2>
        <p>Tap anywhere to enter</p>
      </div>
    </div>
  );
}
