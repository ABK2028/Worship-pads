export default function WorshipPadsLogo({ size = 260 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="worship-logo"
    >
      <svg viewBox="0 0 210 210" width="100%" height="100%" fill="none">
        <defs>
          <linearGradient id="wpGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#30D6FF" />
            <stop offset="100%" stopColor="#C964FF" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="105" cy="105" r="90" fill="rgba(12, 18, 32, 0.82)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" filter="url(#glow)" />
        <path d="M58 142V68h27l16 44 16-44h26v74h-26V99l-16 44-16-44v43H58Z" fill="url(#wpGradient)" />
        <path d="M140 76h20c0 19-11 40-28 52v7c23-13 38-37 38-59 0-27-25-46-53-46h-27v74h21V76Z" fill="url(#wpGradient)" opacity="0.95" />
      </svg>
    </div>
  );
}
