'use client';

import BaseSlider from '@/components/ui/BaseSlider';

interface Mark {
  value: number;
}

interface SliderFilterProps {
  label: string;
  min: number;
  max: number;
  step: number;
  marks?: Mark[];
  value: [number, number];
  onChange: (newValue: [number, number])=> void;
  formatValue: (min: number, max: number)=> string;
}

const SliderFilter = ({ label, min, max, step, marks, value, onChange, formatValue }: SliderFilterProps) => {
  const handleChange = (_event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      onChange(newValue as [number, number]);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-main">{label}</label>
        <span className="text-xs text-accent-1 font-medium">{formatValue(value[0], value[1])}</span>
      </div>
      <div className="px-2">
        <BaseSlider
          value={value}
          onChange={handleChange}
          marks={marks}
          step={step}
          min={min}
          max={max}
        />
      </div>
    </div>
  );
};

export default SliderFilter;

