import './Welcome.css';

const logoSrc = '/Logo Pads.png';

export default function Welcome({ onEnter }) {
  return (
    <div className="welcome-screen" onClick={onEnter}>
      <div className="overlay" />

      <div className="content">
        <img src={logoSrc} alt="Worship Pads" className="logo" draggable="false" />

        <h2>WELCOME</h2>

        <p>Tap anywhere to enter</p>
      </div>
    </div>
  );
}
