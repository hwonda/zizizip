'use client';

import { useLHQuery } from '@/hooks/queries/useLHQuery';
import { usePublicHousingStore } from '@/stores/usePublicHousingStore';

export default function LHSidebar() {
  const { data, isLoading, error } = useLHQuery();
  const { selectedLH, toggleSelection, isSelected, selectAll, clearSelections } = usePublicHousingStore();

  const notices = data?.dsList || [];

  const handleSelectAll = () => {
    if (selectedLH.size === notices.length) {
      clearSelections('LH');
    } else {
      selectAll('LH', notices.map((notice) => notice.PAN_ID));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-background rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-1" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-background rounded-lg shadow-lg p-4">
        <p className="text-red-500 text-sm">{'LH 공고 로딩 실패'}</p>
        <p className="text-gray-3 text-xs mt-1">{error.message}</p>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="w-full bg-background rounded-lg shadow-lg p-4">
        <p className="text-gray-3 text-sm">{'현재 진행 중인 LH 공고가 없습니다.'}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-background rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="p-4 border-b border-gray-7">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sub">{'LH 공고'}</h3>
          <span className="text-xs text-gray-3">{`총 ${ notices.length }건`}</span>
        </div>
        <button
          onClick={handleSelectAll}
          className="mt-2 text-xs text-accent-1 hover:underline"
        >
          {selectedLH.size === notices.length ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      {/* Notice List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {notices.map((notice) => {
          const selected = isSelected('LH', notice.PAN_ID);

          return (
            <div
              key={notice.PAN_ID}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selected
                  ? 'border-accent-1 bg-accent-1/5'
                  : 'border-gray-7 hover:border-gray-3'
              }`}
              onClick={() => toggleSelection('LH', notice.PAN_ID)}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSelection('LH', notice.PAN_ID)}
                  className="mt-1 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-sub line-clamp-2">
                    {notice.PAN_NM}
                  </h4>
                  <p className="text-xs text-gray-3 mt-1">
                    {`${ notice.PAN_NT_ST_DT } ~ ${ notice.CLSG_DT }`}
                  </p>
                  {notice.AIS_TP_CD_NM && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-8 text-gray-1 rounded">
                      {notice.AIS_TP_CD_NM}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-7">
        <p className="text-xs text-gray-3">
          {`선택된 공고: ${ selectedLH.size }개`}
        </p>
      </div>
    </div>
  );
}
