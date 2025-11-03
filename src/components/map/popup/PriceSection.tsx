import { ExtendedLocationData } from '@/types';
import { formatPrice } from '@/utils/formatters';

interface PriceSectionProps {
  unit: ExtendedLocationData;
}

export default function PriceSection({ unit }: PriceSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      {/* 여러 가격 세트가 있는 경우 */}
      {unit.priceSets && unit.priceSets.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {unit.priceSets.map((priceSet, index) => (
            <div
              key={index}
              className="group flex flex-col gap-0.5 border border-gray-8 hover:border-secondary hover:bg-secondary/5 rounded-md px-2 py-1 text-sm"
            >
              {priceSet.label && (
                <div className="text-xs text-gray-5 text-center font-medium pb-0.5">
                  {priceSet.label}
                </div>
              )}
              {priceSet.deposit && (
                <div className="flex justify-between gap-1">
                  <span className="text-sub">{'보증금'}</span>
                  <span className="text-primary font-medium">{formatPrice(priceSet.deposit)}</span>
                </div>
              )}
              {priceSet.monthly && (
                <div className="flex justify-between gap-1">
                  <span className="text-sub">{'월임대료'}</span>
                  <span className="text-primary font-medium">{formatPrice(priceSet.monthly)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 단일 가격 정보 */}
      {(!unit.priceSets || unit.priceSets.length === 0) && unit.price && (
        <div className="flex flex-col gap-0.5 border border-gray-8 hover:border-secondary hover:bg-secondary/5 rounded-md px-2 py-1 text-sm">
          {unit.price.deposit && (
            <div className="flex justify-between gap-1">
              <span className="text-sub">{'보증금'}</span>
              <span className="text-primary font-medium">{formatPrice(unit.price.deposit)}</span>
            </div>
          )}
          {unit.price.monthly && (
            <div className="flex justify-between gap-1">
              <span className="text-sub">{'월임대료'}</span>
              <span className="text-primary font-medium">{formatPrice(unit.price.monthly)}</span>
            </div>
          )}
          {unit.price.sale && (
            <div className="flex justify-between gap-1">
              <span className="text-sub">{'매매가'}</span>
              <span className="text-primary font-medium">{formatPrice(unit.price.sale)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
