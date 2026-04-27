'use client';

interface Option {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface SingleSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  multi?: false;
  columns?: number;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  multi: true;
  noPreferenceValue?: string;
  columns?: number;
}

type OptionSelectorProps = SingleSelectProps | MultiSelectProps;

export default function OptionSelector(props: OptionSelectorProps) {
  const { options, columns = 1, multi } = props;

  const isSelected = (optValue: string): boolean => {
    if (multi) {
      return (props as MultiSelectProps).value.includes(optValue);
    }
    return (props as SingleSelectProps).value === optValue;
  };

  const handleClick = (optValue: string) => {
    if (!multi) {
      (props as SingleSelectProps).onChange(optValue);
      return;
    }

    const { value, onChange, noPreferenceValue = 'no-preference' } = props as MultiSelectProps;

    if (optValue === noPreferenceValue) {
      onChange([noPreferenceValue]);
      return;
    }

    let next = value.filter(v => v !== noPreferenceValue);

    if (next.includes(optValue)) {
      next = next.filter(v => v !== optValue);
    } else {
      next = [...next, optValue];
    }

    if (next.length === 0) {
      next = [noPreferenceValue];
    }

    onChange(next);
  };

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((opt, i) => {
        const selected = isSelected(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => handleClick(opt.value)}
            className={`relative p-4 border text-left transition-all group ${
              selected
                ? 'border-ink bg-paper-deep'
                : 'border-hairline bg-paper hover:border-ink-faded hover:bg-paper-deep/50'
            }`}
          >
            {/* Selected stamp — vermillion checkmark in top-right corner */}
            {selected && (
              <span className="absolute top-2 right-2 label-mono-sm !text-vermillion">●</span>
            )}

            <div className="flex items-center gap-3">
              {opt.icon && <span className="text-2xl shrink-0">{opt.icon}</span>}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="label-mono-sm shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <p
                    className="font-display text-[16px] font-medium text-ink"
                    style={{ fontVariationSettings: '"SOFT" 50, "opsz" 18' }}
                  >
                    {opt.label}
                  </p>
                </div>
                {opt.description && (
                  <p className="text-[13px] text-ink-faded mt-1 leading-snug">{opt.description}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
