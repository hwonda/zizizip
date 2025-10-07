const landingPreferenceKey = 'zizizip_landing_preference';

export interface LandingPreference {
  type: 'hide-today' | 'never-show' | null;
  timestamp?: number;
}

export function setLandingPreference(type: 'hide-today' | 'never-show'): void {
  const preference: LandingPreference = {
    type,
    timestamp: Date.now(),
  };
  localStorage.setItem(landingPreferenceKey, JSON.stringify(preference));
}

export function getLandingPreference(): LandingPreference | null {
  try {
    const stored = localStorage.getItem(landingPreferenceKey);
    if (!stored) return null;

    const preference: LandingPreference = JSON.parse(stored);

    // '다시 보지 않기' 설정인 경우
    if (preference.type === 'never-show') {
      return preference;
    }

    // '오늘은 그만 보기' 설정인 경우 - 24시간 체크
    if (preference.type === 'hide-today' && preference.timestamp) {
      const hoursPassed = (Date.now() - preference.timestamp) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        return preference;
      } else {
        // 24시간 지났으면 삭제
        localStorage.removeItem(landingPreferenceKey);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get landing preference:', error);
    return null;
  }
}

export function clearLandingPreference(): void {
  localStorage.removeItem(landingPreferenceKey);
}

export function shouldShowLanding(): boolean {
  const preference = getLandingPreference();
  return preference === null;
}
