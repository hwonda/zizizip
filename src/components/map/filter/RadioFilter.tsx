'use client';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioFilterProps {
  label: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string)=> void;
}

const RadioFilter = ({
  label,
  options,
  selectedValue,
  onChange,
}: RadioFilterProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-main">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                isSelected
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-gray-3 border-gray-7 hover:border-primary hover:text-primary'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RadioFilter;

