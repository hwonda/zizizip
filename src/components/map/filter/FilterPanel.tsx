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

// 슬라이더 표시 레벨 상수
const EXCLUSIVE_AREA_LEVELS = ['1', '20', '40', '60', '80', '100+'];
const EXCLUSIVE_AREA_VALUES = [1, 20, 40, 60, 80, 100];

const DEPOSIT_LEVELS = ['0', '3천', '5천', '8천', '1억', '1.5억', '2억', '2.5억', '3억', '4억', '5억', '10억'];
const DEPOSIT_VALUES = [0, 3000000, 5000000, 8000000, 100000000, 150000000, 200000000, 250000000, 300000000, 400000000, 500000000, 1000000000];

const MONTHLY_LEVELS = ['0', '20', '40', '60', '80', '100', '120', '150', '200'];
const MONTHLY_VALUES = [0, 200000, 400000, 600000, 800000, 1000000, 1200000, 1500000, 2000000];

const SALE_LEVELS = ['0', '1억', '2억', '3억', '5억', '7억', '10억', '15억', '20억'];
const SALE_VALUES = [0, 100000000, 200000000, 300000000, 500000000, 700000000, 1000000000, 1500000000, 2000000000];

// 층수 옵션
const FLOOR_OPTIONS = [
  { value: '1층', label: '1층' },
  { value: '저층', label: '저층(2~5)' },
  { value: '중층', label: '중층(6~8)' },
  { value: '고층', label: '고층(9~)' },
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

// 값을 인덱스로 변환하는 헬퍼 함수
function valueToIndex(value: number, values: number[]): number {
  for (let i = values.length - 1; i >= 0; i--) {
    if (value >= values[i]) return i;
  }
  return 0;
}

// 인덱스를 값으로 변환하는 헬퍼 함수
function indexToValue(index: number, values: number[]): number {
  return values[Math.min(index, values.length - 1)];
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
        // 필터 버튼 클릭은 제외 (버튼에 data-filter-button 속성 추가 필요)
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

  // 슬라이더 범위 변환 핸들러들
  const handleExclusiveAreaChange = useCallback((range: [number, number]) => {
    setExclusiveArea({
      min: indexToValue(range[0], EXCLUSIVE_AREA_VALUES),
      max: indexToValue(range[1], EXCLUSIVE_AREA_VALUES),
    });
  }, [setExclusiveArea]);

  const handleDepositChange = useCallback((range: [number, number]) => {
    setDeposit({
      min: indexToValue(range[0], DEPOSIT_VALUES),
      max: indexToValue(range[1], DEPOSIT_VALUES),
    });
  }, [setDeposit]);

  const handleMonthlyChange = useCallback((range: [number, number]) => {
    setMonthly({
      min: indexToValue(range[0], MONTHLY_VALUES),
      max: indexToValue(range[1], MONTHLY_VALUES),
    });
  }, [setMonthly]);

  const handleSaleChange = useCallback((range: [number, number]) => {
    setSale({
      min: indexToValue(range[0], SALE_VALUES),
      max: indexToValue(range[1], SALE_VALUES),
    });
  }, [setSale]);

  // 현재 슬라이더 범위를 인덱스로 변환
  const exclusiveAreaRange: [number, number] = useMemo(() => [
    valueToIndex(exclusiveArea.min, EXCLUSIVE_AREA_VALUES),
    valueToIndex(exclusiveArea.max, EXCLUSIVE_AREA_VALUES),
  ], [exclusiveArea]);

  const depositRange: [number, number] = useMemo(() => [
    valueToIndex(deposit.min, DEPOSIT_VALUES),
    valueToIndex(deposit.max, DEPOSIT_VALUES),
  ], [deposit]);

  const monthlyRange: [number, number] = useMemo(() => [
    valueToIndex(monthly.min, MONTHLY_VALUES),
    valueToIndex(monthly.max, MONTHLY_VALUES),
  ], [monthly]);

  const saleRange: [number, number] = useMemo(() => [
    valueToIndex(sale.min, SALE_VALUES),
    valueToIndex(sale.max, SALE_VALUES),
  ], [sale]);

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

  return (
    <div
      ref={panelRef}
      className={`absolute top-5 z-50 bg-background rounded-xl shadow-xl border border-gray-8 overflow-hidden ${ className }`}
      style={{ width: '320px', right: 'calc(100% - 2rem)' }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-8 bg-gray-10">
        <h3 className="font-bold text-main">{'필터'}</h3>
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
      <div className="p-4 space-y-5 overflow-y-auto" style={{ maxHeight: '800px' }}>
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

        {/* 5. 전용면적 */}
        <SliderFilter
          label="전용면적 (㎡)"
          displayLevels={EXCLUSIVE_AREA_LEVELS}
          range={exclusiveAreaRange}
          onRangeChange={handleExclusiveAreaChange}
        />

        {/* 6. 보증금 */}
        <SliderFilter
          label="보증금"
          displayLevels={DEPOSIT_LEVELS}
          range={depositRange}
          onRangeChange={handleDepositChange}
        />

        {/* 7. 월세 */}
        <SliderFilter
          label="월세 (만원)"
          displayLevels={MONTHLY_LEVELS}
          range={monthlyRange}
          onRangeChange={handleMonthlyChange}
        />

        {/* 8. 매매가 */}
        <SliderFilter
          label="매매가"
          displayLevels={SALE_LEVELS}
          range={saleRange}
          onRangeChange={handleSaleChange}
        />
      </div>
    </div>
  );
}

