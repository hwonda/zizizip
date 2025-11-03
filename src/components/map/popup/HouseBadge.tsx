import { Building2, Hotel, House } from 'lucide-react';

interface HouseBadgeProps {
  houseType: string;
}

type HouseTypeConfig = {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  label: string;
};

const getHouseTypeConfig = (houseType: string): HouseTypeConfig => {
  const normalizedType = houseType.trim();

  if (normalizedType.includes('아파트')) {
    return {
      icon: Building2,
      bgColor: 'bg-house-apartment',
      label: '아파트',
    };
  }

  if (normalizedType.includes('오피스텔')) {
    return {
      icon: Hotel,
      bgColor: 'bg-house-officetel',
      label: '오피스텔',
    };
  }

  return {
    icon: House,
    bgColor: 'bg-house-etc',
    label: normalizedType,
  };
};

export default function HouseBadge({ houseType }: HouseBadgeProps) {
  const config = getHouseTypeConfig(houseType);
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm cursor-default ${ config.bgColor }`}
    >
      <Icon className="w-4 h-4 text-white" />
      <span className="text-white font-medium">{config.label}</span>
    </div>
  );
}
