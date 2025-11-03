/**
 * 가격을 한국 원화 형식으로 포맷팅
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * 면적을 제곱미터 단위로 포맷팅
 */
export function formatArea(area: number): string {
  return `${ area.toLocaleString() }㎡`;
}
