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
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-sm text-gray-400 mb-1">Step {step} of {totalSteps}</p>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        {children}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="flex-1 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
