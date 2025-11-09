const noticePreferenceKey = 'zizizip_notice_preference';

export interface NoticePreference {
  noticeId: string;
  hiddenUntil: number; // KST 자정의 timestamp
}

// KST 자정 구하기
function getKSTMidnight(): number {
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const localOffset = now.getTimezoneOffset(); // 분 단위 (UTC와의 차이)

  // 현재 시간을 KST로 변환
  const kstTime = new Date(now.getTime() + ((kstOffset + localOffset) * 60 * 1000));

  // KST 기준 다음 날 자정
  kstTime.setHours(24, 0, 0, 0);

  return kstTime.getTime();
}

export function setNoticePreference(noticeId: string): void {
  try {
    const stored = localStorage.getItem(noticePreferenceKey);
    const preferences: NoticePreference[] = stored ? JSON.parse(stored) : [];

    // 이미 존재하는 noticeId면 업데이트, 없으면 추가
    const existingIndex = preferences.findIndex((pref) => pref.noticeId === noticeId);
    const newPreference: NoticePreference = {
      noticeId,
      hiddenUntil: getKSTMidnight(),
    };

    if (existingIndex !== -1) {
      preferences[existingIndex] = newPreference;
    } else {
      preferences.push(newPreference);
    }

    localStorage.setItem(noticePreferenceKey, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to set notice preference:', error);
  }
}

export function shouldShowNotice(noticeId: string): boolean {
  try {
    const stored = localStorage.getItem(noticePreferenceKey);
    if (!stored) return true;

    const preferences: NoticePreference[] = JSON.parse(stored);
    const preference = preferences.find((pref) => pref.noticeId === noticeId);

    if (!preference) return true;

    const now = Date.now();

    // 자정이 지났으면 해당 preference 삭제하고 true 반환
    if (now >= preference.hiddenUntil) {
      const updatedPreferences = preferences.filter((pref) => pref.noticeId !== noticeId);
      localStorage.setItem(noticePreferenceKey, JSON.stringify(updatedPreferences));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to check notice preference:', error);
    return true;
  }
}

export function clearNoticePreference(noticeId?: string): void {
  try {
    if (!noticeId) {
      // noticeId가 없으면 모든 preference 삭제
      localStorage.removeItem(noticePreferenceKey);
      return;
    }

    const stored = localStorage.getItem(noticePreferenceKey);
    if (!stored) return;

    const preferences: NoticePreference[] = JSON.parse(stored);
    const updatedPreferences = preferences.filter((pref) => pref.noticeId !== noticeId);
    localStorage.setItem(noticePreferenceKey, JSON.stringify(updatedPreferences));
  } catch (error) {
    console.error('Failed to clear notice preference:', error);
  }
}
