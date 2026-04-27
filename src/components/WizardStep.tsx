'use client';

interface WizardStepProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext: () => void;
  canContinue?: boolean;
  children: React.ReactNode;
  nextLabel?: string;
}

export default function WizardStep({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  onNext,
  canContinue = true,
  children,
  nextLabel = 'Continue',
}: WizardStepProps) {
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-paper flex flex-col pt-14">
      {/* Cartographic progress strip */}
      <div className="px-5 sm:px-8 pt-6 pb-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="label-mono-sm">
              Survey · step <span className="text-ink">{String(step).padStart(2, '0')}</span> of {String(totalSteps).padStart(2, '0')}
            </span>
            <span className="coord-mono text-ink-faded">{pct}%</span>
          </div>
          <div className="relative h-[3px] bg-hairline-soft">
            <div
              className="absolute inset-y-0 left-0 bg-vermillion transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
            {/* Tick marks */}
            <div className="absolute inset-0 flex justify-between pointer-events-none">
              {Array.from({ length: totalSteps + 1 }).map((_, i) => (
                <span key={i} className="w-px h-[7px] -translate-y-[2px] bg-ink/35" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 sm:px-8 pt-4 pb-3 ink-rise">
        <div className="max-w-2xl mx-auto">
          <h1
            className="font-display text-[30px] sm:text-[34px] leading-[1.05] font-semibold text-ink tracking-tight"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 80' }}
          >
            {title}
          </h1>
          {subtitle && <p className="text-ink-faded mt-2 text-[15px]">{subtitle}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 sm:px-8 py-5 overflow-y-auto">
        <div className="max-w-2xl mx-auto ink-rise" style={{ animationDelay: '80ms' }}>
          {children}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 sm:px-8 py-4 border-t border-hairline bg-paper-deep/40">
        <div className="max-w-2xl mx-auto flex gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-5 py-2.5 border border-hairline text-ink-faded hover:text-ink hover:border-ink label-mono-sm transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!canContinue}
            className="flex-1 px-5 py-2.5 bg-vermillion text-paper label-mono-sm !text-paper hover:bg-vermillion-deep disabled:bg-hairline disabled:!text-ink-faded disabled:cursor-not-allowed transition-colors group flex items-center justify-center gap-2"
          >
            <span>{nextLabel}</span>
            <span className="font-mono text-[12px] group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
