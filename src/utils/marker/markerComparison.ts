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
  if (newLocations.length !== prevLocations.length) {
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

  return hasChanged;
}
