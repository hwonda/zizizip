import { ExtendedLocationData, LocationGroup } from '@/types';

/**
 * 같은 좌표를 가진 위치 데이터들을 그룹화합니다.
 * @param locations 위치 데이터 배열
 * @returns LocationGroup 배열
 */
export function groupLocationsByCoordinates(
  locations: ExtendedLocationData[],
): LocationGroup[] {
  const groups: Record<string, LocationGroup> = {};

  locations.forEach((location) => {
    if (!location.lat || !location.lon) return;

    const coordKey = `${ location.lat }_${ location.lon }`;

    if (groups[coordKey]) {
      groups[coordKey].units.push(location);
    } else {
      groups[coordKey] = {
        id: coordKey,
        lat: location.lat,
        lon: location.lon,
        units: [location],
        name: location.name,
        address: location.address,
        houseType: location.houseType,
        elevator: location.elevator,
      };
    }
  });

  return Object.values(groups);
}
