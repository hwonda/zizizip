import { ExtendedLocationData } from '@/types';

/**
 * 두 위치 데이터 배열이 동일한지 비교합니다.
 * @param newLocations 새로운 위치 데이터 배열
 * @param prevLocations 이전 위치 데이터 배열
 * @returns 데이터가 변경되었으면 true, 아니면 false
 */
export function locationsChanged(
  newLocations: ExtendedLocationData[],
  prevLocations: ExtendedLocationData[],
): boolean {
  console.log(`🔍 데이터 변경 확인: 새로운 ${ newLocations.length }개 vs 이전 ${ prevLocations.length }개`);

  if (newLocations.length !== prevLocations.length) {
    console.log('✅ 배열 길이가 다름 → 변경됨');
    return true;
  }

  const hasChanged = newLocations.some((newLoc, index) => {
    const prevLoc = prevLocations[index];
    return !prevLoc
      || newLoc.name !== prevLoc.name
      || newLoc.lat !== prevLoc.lat
      || newLoc.lon !== prevLoc.lon
      || newLoc.price !== prevLoc.price
      || newLoc.datasetId !== prevLoc.datasetId;
  });

  console.log(`🔍 내용 비교 결과: ${ hasChanged ? '변경됨' : '변경되지 않음' }`);
  return hasChanged;
}
