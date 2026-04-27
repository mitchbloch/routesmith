interface TickRuleProps {
  className?: string;
  ticks?: number;
  label?: string;
}

/**
 * Horizontal hairline with periodic tick marks — used as a section divider
 * that evokes the edge of a topographic map.
 */
export default function TickRule({ className = '', ticks = 12, label }: TickRuleProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <svg
        viewBox={`0 0 ${ticks * 24} 14`}
        preserveAspectRatio="none"
        className="w-full h-3 block"
        aria-hidden
      >
        <line x1="0" y1="7" x2={ticks * 24} y2="7" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const x = i * 24;
          const isMajor = i % 4 === 0;
          return (
            <line
              key={i}
              x1={x}
              y1={isMajor ? 0 : 4}
              x2={x}
              y2={isMajor ? 14 : 10}
              stroke="currentColor"
              strokeWidth={isMajor ? 1 : 0.6}
              opacity={isMajor ? 0.7 : 0.4}
            />
          );
        })}
      </svg>
      {label && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 bg-paper label-mono-sm">
          {label}
        </span>
      )}
    </div>
  );
}
