'use client';

interface MapPinIconProps {
  color: string;
  size?: number;
  className?: string;
}

export default function MapPinIcon({ color, size = 16, className = '' }: MapPinIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        fill={color}
        stroke="#ffffff"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="10"
        r="3"
        fill="#ffffff"
        stroke={color}
        strokeWidth="1"
      />
    </svg>
  );
}
