'use client';

interface MapHeaderProps {
  showAllMarkers: boolean;
  showDebugInfo: boolean;
  onToggleMarkers: ()=> void;
  onToggleDebugInfo: ()=> void;
}

export default function MapHeader({
  showAllMarkers,
  showDebugInfo,
  onToggleMarkers,
  onToggleDebugInfo,
}: MapHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showAllMarkers}
            onChange={onToggleMarkers}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="ml-2 text-gray-700">{'마커 표출'}</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showDebugInfo}
            onChange={onToggleDebugInfo}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="ml-2 text-gray-700">{'디버그 정보'}</span>
        </label>
      </div>
    </div>
  );
}
