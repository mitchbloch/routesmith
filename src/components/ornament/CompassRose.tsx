interface CompassRoseProps {
  size?: number;
  className?: string;
  spin?: boolean;
}

export default function CompassRose({ size = 28, className = '', spin = false }: CompassRoseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <g className={spin ? 'compass-spin' : ''} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        {/* Outer ring */}
        <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
        <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />

        {/* Cardinal points — 4 long arms */}
        <path d="M32 4 L34 30 L32 32 L30 30 Z" fill="currentColor" />
        <path d="M32 60 L34 34 L32 32 L30 34 Z" fill="currentColor" opacity="0.4" />
        <path d="M60 32 L34 30 L32 32 L34 34 Z" fill="currentColor" opacity="0.6" />
        <path d="M4 32 L30 30 L32 32 L30 34 Z" fill="currentColor" opacity="0.6" />

        {/* Diagonal hairlines */}
        <line x1="13" y1="13" x2="51" y2="51" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
        <line x1="51" y1="13" x2="13" y2="51" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />

        {/* Center dot */}
        <circle cx="32" cy="32" r="1.6" fill="currentColor" />

        {/* N marker */}
        <text x="32" y="3" fontSize="6" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fill="currentColor" fontWeight="600">N</text>
      </g>
    </svg>
  );
}
