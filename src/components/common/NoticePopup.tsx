'use client';

import { useState, useEffect, ReactNode } from 'react';
import { X, CalendarCheck } from 'lucide-react';
import { setNoticePreference, shouldShowNotice } from '@/utils/noticePreference';

export interface NoticeContent {
  id: string;
  title?: string;
  content: ReactNode;
}

interface NoticePopupProps {
  notices: NoticeContent[];
  onClose?: ()=> void;
}

export default function NoticePopup({ notices, onClose }: NoticePopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (hasChecked) return;

    // 표시할 공지사항이 있는지 확인
    const visibleNotices = notices.filter((notice) => shouldShowNotice(notice.id));

    if (visibleNotices.length > 0) {
      setIsVisible(true);
      // 첫 번째 표시 가능한 공지의 인덱스 찾기
      const firstVisibleIndex = notices.findIndex(
        (notice) => notice.id === visibleNotices[0].id,
      );
      setCurrentNoticeIndex(firstVisibleIndex);
    }

    setHasChecked(true);
  }, [notices, hasChecked]);

  const handleClose = (shouldHideToday = false) => {
    const currentNotice = notices[currentNoticeIndex];

    if (shouldHideToday && currentNotice) {
      setNoticePreference(currentNotice.id);
    }

    // 다음 공지사항이 있는지 확인
    const remainingNotices = notices
      .slice(currentNoticeIndex + 1)
      .filter((notice) => shouldShowNotice(notice.id));

    if (remainingNotices.length > 0) {
      // 다음 공지사항으로 이동
      const nextIndex = notices.findIndex((notice) => notice.id === remainingNotices[0].id);
      setCurrentNoticeIndex(nextIndex);
    } else {
      // 더 이상 표시할 공지사항이 없으면 닫기
      setIsVisible(false);
      onClose?.();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible || notices.length === 0) return null;

  const currentNotice = notices[currentNoticeIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/70 animate-intro"
      onClick={handleBackdropClick}
    >
      <div className="relative w-[60vw] sm:w-[480px] max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden font-pretendard">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-10">
          <h2 className="text-lg font-bold text-main">
            {currentNotice.title || '공지'}
          </h2>
          <button
            onClick={() => handleClose(false)}
            className="text-gray-1 hover:text-primary transition-all duration-300"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {currentNotice.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-10">
          <button
            onClick={() => handleClose(true)}
            className="flex items-center gap-1.5 text-sm text-gray-3 transition-all duration-300 hover:text-primary active:scale-[0.98]"
          >
            <CalendarCheck className='w-4 h-4' />
            <span>{'오늘은 그만 보기'}</span>
          </button>
          <button
            onClick={() => handleClose(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-secondary transition-all duration-300 active:scale-[0.98]"
          >
            {'닫기'}
          </button>
        </div>
      </div>
    </div>
  );
}
