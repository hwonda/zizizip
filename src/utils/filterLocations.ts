import { ExtendedLocationData } from '@/types';
import {
  FilterState,
  FloorCategory,
  RoomCategory,
  SLIDER_DEFAULTS,
} from '@/stores/useFilterStore';

/**
 * 층수를 카테고리로 변환
 */
export function getFloorCategory(floor: number): FloorCategory {
  if (floor === 1) return '1층';
  if (floor >= 2 && floor <= 5) return '저층';
  if (floor >= 6 && floor <= 8) return '중층';
  return '고층'; // 9층 이상
}

/**
 * 방 수를 카테고리로 변환
 */
export function getRoomCategory(rooms: number): RoomCategory {
  if (rooms === 1) return '원룸';
  if (rooms === 2) return '투룸';
  return '쓰리룸+'; // 3개 이상
}

/**
 * 슬라이더 범위 내에 값이 있는지 확인
 * max가 최대값과 같으면 "이상"으로 처리
 */
function isInRange(
  value: number | undefined,
  range: { min: number; max: number },
  maxDefault: number,
): boolean {
  if (value === undefined) return false;

  const isAboveMin = value >= range.min;
  // max가 기본 최대값이면 "이상" 조건으로 처리
  const isBelowMax = range.max >= maxDefault ? true : value <= range.max;

  return isAboveMin && isBelowMax;
}

/**
 * 가격 조건 확인 (price 또는 priceSets 중 하나라도 만족하면 true)
 */
function checkPriceCondition(
  location: ExtendedLocationData,
  depositRange: { min: number; max: number },
  monthlyRange: { min: number; max: number },
  saleRange: { min: number; max: number },
): boolean {
  // 매매가 체크
  if (location.price?.sale !== undefined) {
    // 매매가 필터가 기본값이 아니면 체크
    const saleInRange = isInRange(
      location.price.sale,
      saleRange,
      SLIDER_DEFAULTS.sale.max,
    );
    if (!saleInRange) return false;
  }

  // 임대 가격 체크 (deposit, monthly)
  const hasDepositFilter
    = depositRange.min !== SLIDER_DEFAULTS.deposit.min
    || depositRange.max !== SLIDER_DEFAULTS.deposit.max;
  const hasMonthlyFilter
    = monthlyRange.min !== SLIDER_DEFAULTS.monthly.min
    || monthlyRange.max !== SLIDER_DEFAULTS.monthly.max;

  // 임대 필터가 설정되어 있는 경우
  if (hasDepositFilter || hasMonthlyFilter) {
    // price.deposit/monthly 체크
    if (location.price?.deposit !== undefined || location.price?.monthly !== undefined) {
      const depositOk = !hasDepositFilter
        || (location.price?.deposit !== undefined
          && isInRange(location.price.deposit, depositRange, SLIDER_DEFAULTS.deposit.max));
      const monthlyOk = !hasMonthlyFilter
        || (location.price?.monthly !== undefined
          && isInRange(location.price.monthly, monthlyRange, SLIDER_DEFAULTS.monthly.max));

      if (depositOk && monthlyOk) return true;
    }

    // priceSets 체크 (하나라도 만족하면 OK)
    if (location.priceSets && location.priceSets.length > 0) {
      const anySetMatches = location.priceSets.some((set) => {
        const depositOk = !hasDepositFilter
          || (set.deposit !== undefined
            && isInRange(set.deposit, depositRange, SLIDER_DEFAULTS.deposit.max));
        const monthlyOk = !hasMonthlyFilter
          || (set.monthly !== undefined
            && isInRange(set.monthly, monthlyRange, SLIDER_DEFAULTS.monthly.max));
        return depositOk && monthlyOk;
      });

      if (anySetMatches) return true;
    }

    // 임대 필터가 설정되어 있는데 임대 정보가 없으면 제외
    if (!location.price?.deposit && !location.price?.monthly
        && (!location.priceSets || location.priceSets.length === 0)) {
      return false;
    }

    return false;
  }

  return true;
}

/**
 * 위치 데이터 필터링
 */
export function filterLocations(
  locations: ExtendedLocationData[],
  filter: FilterState,
): ExtendedLocationData[] {
  return locations.filter((location) => {
    // 1. 주택유형 필터
    if (location.houseType !== undefined) {
      if (!filter.houseTypes.has(location.houseType)) {
        return false;
      }
    } else if (filter.houseTypes.size < filter.availableHouseTypes.length) {
      // 주택유형이 없고 필터가 일부만 선택된 경우 제외
      return false;
    }

    // 2. 층수 필터
    if (location.floor !== undefined) {
      const floorCategory = getFloorCategory(location.floor);
      if (!filter.floors.has(floorCategory)) {
        return false;
      }
    } else if (filter.floors.size < 4) {
      // 층수가 없고 필터가 일부만 선택된 경우 제외
      return false;
    }

    // 3. 방 수 필터
    if (location.rooms !== undefined) {
      const roomCategory = getRoomCategory(location.rooms);
      if (!filter.rooms.has(roomCategory)) {
        return false;
      }
    } else if (filter.rooms.size < 3) {
      // 방 수가 없고 필터가 일부만 선택된 경우 제외
      return false;
    }

    // 4. 승강기 필터
    if (filter.elevator !== 'all') {
      if (location.elevator === undefined) {
        return false;
      }
      if (filter.elevator === 'yes' && !location.elevator) {
        return false;
      }
      if (filter.elevator === 'no' && location.elevator) {
        return false;
      }
    }

    // 5. 전용면적 필터
    const hasExclusiveAreaFilter
      = filter.exclusiveArea.min !== SLIDER_DEFAULTS.exclusiveArea.min
      || filter.exclusiveArea.max !== SLIDER_DEFAULTS.exclusiveArea.max;

    if (hasExclusiveAreaFilter) {
      if (location.exclusiveArea === undefined) {
        return false;
      }
      if (!isInRange(location.exclusiveArea, filter.exclusiveArea, SLIDER_DEFAULTS.exclusiveArea.max)) {
        return false;
      }
    }

    // 6. 가격 필터
    if (!checkPriceCondition(location, filter.deposit, filter.monthly, filter.sale)) {
      return false;
    }

    return true;
  });
}

/**
 * 위치 데이터에서 고유한 주택유형 추출
 */
export function extractHouseTypes(locations: ExtendedLocationData[]): string[] {
  const types = new Set<string>();
  locations.forEach((location) => {
    if (location.houseType) {
      types.add(location.houseType);
    }
  });
  return Array.from(types).sort();
}

