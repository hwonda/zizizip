'use client';

import { useState } from 'react';

interface TabsProps<T extends string> {
  tabs: T[];
  activeTab: T;
  onTabChange: (tab: T)=> void;
}

export default function Tabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: TabsProps<T>) {
  const [hoverStyle, setHoverStyle] = useState<{
    left: number;
    width: number;
    height: number;
    opacity: number;
  }>({
    left: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const container = button.parentElement;

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      setHoverStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
        height: buttonRect.height,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="flex w-full bg-background rounded-xl p-1 gap-1 shadow-lg relative">
      <div
        className="absolute bg-accent-1/20 rounded-lg transition-all duration-300 ease-out pointer-events-none"
        style={{
          left: hoverStyle.left + 'px',
          width: hoverStyle.width + 'px',
          height: hoverStyle.height + 'px',
          opacity: hoverStyle.opacity,
          top: '0.25rem',
        }}
      />

      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`flex-1 p-2 text-sm transition-colors rounded-lg relative z-10 ${
            activeTab === tab
              ? 'bg-accent-1 text-inverse font-bold'
              : ''
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
