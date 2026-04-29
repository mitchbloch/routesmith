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
    <div className="min-h-screen bg-paper flex flex-col pt-12">
      {/* Progress strip */}
      <div className="px-5 sm:px-8 pt-6 pb-2">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-ink-faded">
              Step {step} of {totalSteps}
            </span>
            <span className="text-[12px] text-ink-faded">{pct}%</span>
          </div>
          <div className="relative h-[2px] bg-hairline-soft">
            <div
              className="absolute inset-y-0 left-0 bg-vermillion transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 sm:px-8 pt-5 pb-3 ink-rise">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-[26px] sm:text-[30px] leading-[1.15] font-semibold text-ink tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-ink-faded mt-1.5 text-[14px]">{subtitle}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 sm:px-8 py-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 sm:px-8 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] border-t border-hairline bg-paper">
        <div className="max-w-2xl mx-auto flex gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-hairline text-[13px] font-medium text-ink-faded hover:text-ink hover:border-ink transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!canContinue}
            className="flex-1 px-5 py-2 bg-vermillion text-white text-[13px] font-medium hover:bg-vermillion-deep disabled:bg-hairline disabled:text-ink-faded disabled:cursor-not-allowed transition-colors"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
