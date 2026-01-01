import { create } from 'zustand';

// 층수 카테고리 타입
export type FloorCategory = '1층' | '저층' | '중층' | '고층';

// 방 수 카테고리 타입
export type RoomCategory = '원룸' | '투룸' | '쓰리룸+';

// 승강기 필터 타입
export type ElevatorFilter = 'all' | 'yes' | 'no';

// 슬라이더 범위 타입
export interface SliderRange {
  min: number;
  max: number;
}

// 필터 상태 인터페이스
export interface FilterState {
  // 패널 열림 상태
  isOpen: boolean;

  // 주택유형 필터 (동적으로 추출된 값들)
  houseTypes: Set<string>;
  availableHouseTypes: string[];

  // 층수 필터
  floors: Set<FloorCategory>;

  // 방 수 필터
  rooms: Set<RoomCategory>;

  // 승강기 필터
  elevator: ElevatorFilter;

  // 전용면적 필터 (㎡)
  exclusiveArea: SliderRange;

  // 보증금 필터 (만원)
  deposit: SliderRange;

  // 월세 필터 (만원)
  monthly: SliderRange;

  // 매매가 필터 (만원)
  sale: SliderRange;

  // Actions
  setIsOpen: (isOpen: boolean)=> void;
  togglePanel: ()=> void;

  setAvailableHouseTypes: (types: string[])=> void;
  toggleHouseType: (type: string)=> void;
  setAllHouseTypes: (selected: boolean)=> void;

  toggleFloor: (floor: FloorCategory)=> void;
  setAllFloors: (selected: boolean)=> void;

  toggleRoom: (room: RoomCategory)=> void;
  setAllRooms: (selected: boolean)=> void;

  setElevator: (value: ElevatorFilter)=> void;

  setExclusiveArea: (range: SliderRange)=> void;
  setDeposit: (range: SliderRange)=> void;
  setMonthly: (range: SliderRange)=> void;
  setSale: (range: SliderRange)=> void;

  resetFilters: ()=> void;
}

// 기본 슬라이더 범위 상수
export const SLIDER_DEFAULTS = {
  exclusiveArea: { min: 0, max: 100 }, // ㎡, 100은 100 이상 의미
  deposit: { min: 0, max: 500000000 }, // 원 (0~5억+)
  monthly: { min: 0, max: 2000000 }, // 원 (0~200만원)
  sale: { min: 0, max: 1000000000 }, // 원 (0~10억+)
};

// 모든 층수 카테고리
export const ALL_FLOORS: FloorCategory[] = ['1층', '저층', '중층', '고층'];

// 모든 방 수 카테고리
export const ALL_ROOMS: RoomCategory[] = ['원룸', '투룸', '쓰리룸+'];

export const useFilterStore = create<FilterState>((set, get) => ({
  // 초기 상태
  isOpen: false,

  houseTypes: new Set<string>(),
  availableHouseTypes: [],

  floors: new Set<FloorCategory>(ALL_FLOORS),
  rooms: new Set<RoomCategory>(ALL_ROOMS),
  elevator: 'all',

  exclusiveArea: { ...SLIDER_DEFAULTS.exclusiveArea },
  deposit: { ...SLIDER_DEFAULTS.deposit },
  monthly: { ...SLIDER_DEFAULTS.monthly },
  sale: { ...SLIDER_DEFAULTS.sale },

  // 패널 제어
  setIsOpen: (isOpen) => set({ isOpen }),
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  // 주택유형 액션
  setAvailableHouseTypes: (types) => {
    set({
      availableHouseTypes: types,
      houseTypes: new Set(types), // 초기값: 모두 선택
    });
  },

  toggleHouseType: (type) => {
    set((state) => {
      const newSet = new Set(state.houseTypes);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return { houseTypes: newSet };
    });
  },

  setAllHouseTypes: (selected) => {
    set((state) => ({
      houseTypes: selected ? new Set(state.availableHouseTypes) : new Set(),
    }));
  },

  // 층수 액션
  toggleFloor: (floor) => {
    set((state) => {
      const newSet = new Set(state.floors);
      if (newSet.has(floor)) {
        newSet.delete(floor);
      } else {
        newSet.add(floor);
      }
      return { floors: newSet };
    });
  },

  setAllFloors: (selected) => {
    set({ floors: selected ? new Set(ALL_FLOORS) : new Set() });
  },

  // 방 수 액션
  toggleRoom: (room) => {
    set((state) => {
      const newSet = new Set(state.rooms);
      if (newSet.has(room)) {
        newSet.delete(room);
      } else {
        newSet.add(room);
      }
      return { rooms: newSet };
    });
  },

  setAllRooms: (selected) => {
    set({ rooms: selected ? new Set(ALL_ROOMS) : new Set() });
  },

  // 승강기 액션
  setElevator: (value) => set({ elevator: value }),

  // 슬라이더 액션
  setExclusiveArea: (range) => set({ exclusiveArea: range }),
  setDeposit: (range) => set({ deposit: range }),
  setMonthly: (range) => set({ monthly: range }),
  setSale: (range) => set({ sale: range }),

  // 필터 초기화
  resetFilters: () => {
    const state = get();
    set({
      houseTypes: new Set(state.availableHouseTypes),
      floors: new Set(ALL_FLOORS),
      rooms: new Set(ALL_ROOMS),
      elevator: 'all',
      exclusiveArea: { ...SLIDER_DEFAULTS.exclusiveArea },
      deposit: { ...SLIDER_DEFAULTS.deposit },
      monthly: { ...SLIDER_DEFAULTS.monthly },
      sale: { ...SLIDER_DEFAULTS.sale },
    });
  },
}));

