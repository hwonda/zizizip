'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { X, RotateCcw } from 'lucide-react';
import {
  useFilterStore,
  FloorCategory,
  RoomCategory,
  ElevatorFilter,
  SLIDER_DEFAULTS,
  ALL_FLOORS,
  ALL_ROOMS,
} from '@/stores/useFilterStore';
import CheckboxFilter from './CheckboxFilter';
import RadioFilter from './RadioFilter';
import SliderFilter from './SliderFilter';

interface FilterPanelProps {
  className?: string;
}

// 슬라이더 눈금 위치 (marks)
const AREA_MARKS = [0, 20, 40, 60, 80, 100].map((v) => ({ value: v }));
const DEPOSIT_MARKS = [0, 5000, 10000, 50000, 100000, 200000, 300000, 500000].map((v) => ({ value: v }));
const MONTHLY_MARKS = [0, 20, 40, 60, 80, 100, 150, 200].map((v) => ({ value: v }));
const SALE_MARKS = [0, 10000, 20000, 30000, 50000, 70000, 100000].map((v) => ({ value: v }));

// 층수 옵션
const FLOOR_OPTIONS = [
  { value: '1층', label: '1층' },
  { value: '저층', label: '저층(2~5층)' },
  { value: '중층', label: '중층(6~8층)' },
  { value: '고층', label: '고층(9층 이상)' },
];

// 방 수 옵션
const ROOM_OPTIONS = [
  { value: '원룸', label: '원룸' },
  { value: '투룸', label: '투룸' },
  { value: '쓰리룸+', label: '쓰리룸+' },
];

// 승강기 옵션
const ELEVATOR_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'yes', label: '있음' },
  { value: 'no', label: '없음' },
];

// 금액 포맷 유틸
function formatWon(value: number): string {
  if (value >= 100000000) {
    const eok = value / 100000000;
    return eok % 1 === 0 ? `${ eok }억` : `${ eok.toFixed(1) }억`;
  }
  if (value >= 10000) {
    const man = value / 10000;
    return man % 1 === 0 ? `${ man }만` : `${ man.toFixed(0) }만`;
  }
  if (value === 0) return '0';
  return `${ value }`;
}

// 만원 단위 포맷
function formatMan(value: number): string {
  if (value === 0) return '0';
  return `${ value }만`;
}

export default function FilterPanel({ className = '' }: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    isOpen,
    setIsOpen,
    houseTypes,
    availableHouseTypes,
    toggleHouseType,
    setAllHouseTypes,
    floors,
    toggleFloor,
    setAllFloors,
    rooms,
    toggleRoom,
    setAllRooms,
    elevator,
    setElevator,
    exclusiveArea,
    setExclusiveArea,
    deposit,
    setDeposit,
    monthly,
    setMonthly,
    sale,
    setSale,
    resetFilters,
  } = useFilterStore();

  // 패널 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('[data-filter-button]')) return;
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // 주택유형 옵션 동적 생성
  const houseTypeOptions = useMemo(() => {
    return availableHouseTypes.map((type) => ({
      value: type,
      label: type,
    }));
  }, [availableHouseTypes]);

  // 슬라이더 핸들러 — store에 직접 반영
  const handleExclusiveAreaChange = useCallback((range: [number, number]) => {
    setExclusiveArea({ min: range[0], max: range[1] });
  }, [setExclusiveArea]);

  const handleDepositChange = useCallback((range: [number, number]) => {
    setDeposit({ min: range[0] * 10000, max: range[1] * 10000 });
  }, [setDeposit]);

  const handleMonthlyChange = useCallback((range: [number, number]) => {
    setMonthly({ min: range[0] * 10000, max: range[1] * 10000 });
  }, [setMonthly]);

  const handleSaleChange = useCallback((range: [number, number]) => {
    setSale({ min: range[0] * 10000, max: range[1] * 10000 });
  }, [setSale]);

  // 슬라이더 값 포맷 함수들
  const formatExclusiveArea = useCallback((min: number, max: number) => {
    const isMax = max >= SLIDER_DEFAULTS.exclusiveArea.max;
    const isMin = min <= SLIDER_DEFAULTS.exclusiveArea.min;
    if (isMin && isMax) return `${ SLIDER_DEFAULTS.exclusiveArea.max }㎡ 초과`;
    if (isMin) return `${ max }㎡ 이하`;
    if (isMax) return `${ min }㎡ 초과`;
    return `${ min } ~ ${ max }㎡`;
  }, []);

  const formatDeposit = useCallback((min: number, max: number) => {
    const realMin = min * 10000;
    const realMax = max * 10000;
    const isMax = realMax >= SLIDER_DEFAULTS.deposit.max;
    const isMin = realMin <= SLIDER_DEFAULTS.deposit.min;
    if (isMin && isMax) return `${ formatWon(SLIDER_DEFAULTS.deposit.max) } 초과`;
    if (isMin) return `${ formatWon(realMax) } 이하`;
    if (isMax) return `${ formatWon(realMin) } 초과`;
    return `${ formatWon(realMin) } ~ ${ formatWon(realMax) }`;
  }, []);

  const formatMonthly = useCallback((min: number, max: number) => {
    const isMax = max * 10000 >= SLIDER_DEFAULTS.monthly.max;
    const isMin = min <= SLIDER_DEFAULTS.monthly.min;
    if (isMin && isMax) return `${ formatMan(max) } 초과`;
    if (isMin) return `${ formatMan(max) } 이하`;
    if (isMax) return `${ formatMan(min) } 초과`;
    return `${ formatMan(min) } ~ ${ formatMan(max) }`;
  }, []);

  const formatSale = useCallback((min: number, max: number) => {
    const realMin = min * 10000;
    const realMax = max * 10000;
    const isMax = realMax >= SLIDER_DEFAULTS.sale.max;
    const isMin = realMin <= SLIDER_DEFAULTS.sale.min;
    if (isMin && isMax) return `${ formatWon(SLIDER_DEFAULTS.sale.max) } 초과`;
    if (isMin) return `${ formatWon(realMax) } 이하`;
    if (isMax) return `${ formatWon(realMin) } 초과`;
    return `${ formatWon(realMin) } ~ ${ formatWon(realMax) }`;
  }, []);

  // 필터가 기본값인지 확인
  const isDefaultFilter = useMemo(() => {
    const isHouseTypesDefault = houseTypes.size === availableHouseTypes.length;
    const isFloorsDefault = floors.size === ALL_FLOORS.length;
    const isRoomsDefault = rooms.size === ALL_ROOMS.length;
    const isElevatorDefault = elevator === 'all';
    const isExclusiveAreaDefault
      = exclusiveArea.min === SLIDER_DEFAULTS.exclusiveArea.min
      && exclusiveArea.max === SLIDER_DEFAULTS.exclusiveArea.max;
    const isDepositDefault
      = deposit.min === SLIDER_DEFAULTS.deposit.min
      && deposit.max === SLIDER_DEFAULTS.deposit.max;
    const isMonthlyDefault
      = monthly.min === SLIDER_DEFAULTS.monthly.min
      && monthly.max === SLIDER_DEFAULTS.monthly.max;
    const isSaleDefault
      = sale.min === SLIDER_DEFAULTS.sale.min
      && sale.max === SLIDER_DEFAULTS.sale.max;

    return (
      isHouseTypesDefault
      && isFloorsDefault
      && isRoomsDefault
      && isElevatorDefault
      && isExclusiveAreaDefault
      && isDepositDefault
      && isMonthlyDefault
      && isSaleDefault
    );
  }, [houseTypes, availableHouseTypes, floors, rooms, elevator, exclusiveArea, deposit, monthly, sale]);

  if (!isOpen) return null;

  // store 값(원) → 슬라이더 값(만원 단위) 변환
  const depositValue: [number, number] = [deposit.min / 10000, deposit.max / 10000];
  const monthlyValue: [number, number] = [monthly.min / 10000, monthly.max / 10000];
  const saleValue: [number, number] = [sale.min / 10000, sale.max / 10000];

  return (
    <div
      ref={panelRef}
      className={`absolute top-0 right-24 w-[320px] z-50 bg-background rounded-xl shadow-xl border border-gray-8 overflow-hidden ${ className }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-8 bg-gray-10">
        <h3 className="font-bold text-main">{'주택 필터'}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetFilters}
            disabled={isDefaultFilter}
            className={`p-1.5 rounded-lg transition-colors ${
              isDefaultFilter
                ? 'text-gray-6 cursor-not-allowed'
                : 'text-gray-4 hover:text-primary hover:bg-gray-9'
            }`}
            title="필터 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-gray-4 hover:text-error hover:bg-gray-9 transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 필터 컨텐츠 */}
      <div className="flex flex-col gap-2 p-4 overflow-y-auto max-h-[800px]">
        {/* 1. 주택유형 */}
        {availableHouseTypes.length > 0 && (
          <CheckboxFilter
            label="주택유형"
            options={houseTypeOptions}
            selectedValues={houseTypes}
            onToggle={toggleHouseType}
            onSelectAll={setAllHouseTypes}
          />
        )}

        {/* 2. 층수 */}
        <CheckboxFilter
          label="층수"
          options={FLOOR_OPTIONS}
          selectedValues={floors as Set<string>}
          onToggle={(value) => toggleFloor(value as FloorCategory)}
          onSelectAll={setAllFloors}
        />

        {/* 3. 방 수 */}
        <CheckboxFilter
          label="방 수"
          options={ROOM_OPTIONS}
          selectedValues={rooms as Set<string>}
          onToggle={(value) => toggleRoom(value as RoomCategory)}
          onSelectAll={setAllRooms}
        />

        {/* 4. 승강기 */}
        <RadioFilter
          label="승강기"
          options={ELEVATOR_OPTIONS}
          selectedValue={elevator}
          onChange={(value) => setElevator(value as ElevatorFilter)}
        />

        {/* 5. 전용면적: 0~100㎡, 1㎡ 단위 */}
        <SliderFilter
          label="전용면적(㎡)"
          min={0}
          max={100}
          step={1}
          marks={AREA_MARKS}
          value={[exclusiveArea.min, exclusiveArea.max]}
          onChange={handleExclusiveAreaChange}
          formatValue={formatExclusiveArea}
        />

        {/* 6. 보증금: 0~50000만원(5억), 100만원 단위 */}
        <SliderFilter
          label="보증금"
          min={0}
          max={50000}
          step={100}
          marks={DEPOSIT_MARKS}
          value={depositValue}
          onChange={handleDepositChange}
          formatValue={formatDeposit}
        />

        {/* 7. 월세: 0~200만원, 1만원 단위 */}
        <SliderFilter
          label="월세"
          min={0}
          max={200}
          step={1}
          marks={MONTHLY_MARKS}
          value={monthlyValue}
          onChange={handleMonthlyChange}
          formatValue={formatMonthly}
        />

        {/* 8. 매매가: 0~100000만원(10억), 100만원 단위 */}
        <SliderFilter
          label="매매가"
          min={0}
          max={100000}
          step={100}
          marks={SALE_MARKS}
          value={saleValue}
          onChange={handleSaleChange}
          formatValue={formatSale}
        />
      </div>
    </div>
  );
}
