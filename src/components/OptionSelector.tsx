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
      {options.map((opt) => {
        const selected = isSelected(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => handleClick(opt.value)}
            className={`relative px-4 py-3.5 border text-left transition-colors ${
              selected
                ? 'border-vermillion bg-vermillion/5'
                : 'border-hairline bg-paper hover:border-ink-faded'
            }`}
          >
            <div className="flex items-center gap-3">
              {opt.icon && <span className="text-xl shrink-0">{opt.icon}</span>}
              <div className="flex-1 min-w-0">
                <p className={`text-[15px] font-medium leading-tight ${selected ? 'text-vermillion' : 'text-ink'}`}>
                  {opt.label}
                </p>
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
