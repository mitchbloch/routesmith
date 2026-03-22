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

    // Clicking a real option — remove no-preference if present
    let next = value.filter(v => v !== noPreferenceValue);

    if (next.includes(optValue)) {
      next = next.filter(v => v !== optValue);
    } else {
      next = [...next, optValue];
    }

    // If nothing selected, fall back to no-preference
    if (next.length === 0) {
      next = [noPreferenceValue];
    }

    onChange(next);
  };

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleClick(opt.value)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            isSelected(opt.value)
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {opt.icon && <span className="text-2xl">{opt.icon}</span>}
            <div>
              <p className="font-medium text-gray-900">{opt.label}</p>
              {opt.description && (
                <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
