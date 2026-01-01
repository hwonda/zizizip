'use client';

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxFilterProps {
  label: string;
  options: CheckboxOption[];
  selectedValues: Set<string>;
  onToggle: (value: string)=> void;
  onSelectAll?: (selected: boolean)=> void;
}

const CheckboxFilter = ({
  label,
  options,
  selectedValues,
  onToggle,
  onSelectAll,
}: CheckboxFilterProps) => {
  const allSelected = options.every((opt) => selectedValues.has(opt.value));
  const noneSelected = options.every((opt) => !selectedValues.has(opt.value));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-main">{label}</label>
        {onSelectAll && (
          <button
            type="button"
            onClick={() => onSelectAll(!allSelected)}
            className="text-xs text-gray-4 hover:text-primary transition-colors"
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValues.has(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
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
      {noneSelected && (
        <p className="text-xs text-warning">{'최소 1개 이상 선택해주세요'}</p>
      )}
    </div>
  );
};

export default CheckboxFilter;

