import { create } from 'zustand';
import { LHRegionCode, LHStatusCode } from '@/constants/lhCodes';

export interface LHFilterState {
  // 필터 값들
  region: LHRegionCode;
  status: LHStatusCode;
  searchKeyword: string;

  // Actions
  setRegion: (region: LHRegionCode) => void;
  setStatus: (status: LHStatusCode) => void;
  setSearchKeyword: (keyword: string) => void;
  resetFilters: () => void;
}

const getInitialState = () => ({
  region: '' as LHRegionCode,
  status: '' as LHStatusCode,
  searchKeyword: '',
});

export const useLHFilterStore = create<LHFilterState>((set) => ({
  ...getInitialState(),

  setRegion: (region) => set({ region }),
  setStatus: (status) => set({ status }),
  setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
  resetFilters: () => set(getInitialState()),
}));

