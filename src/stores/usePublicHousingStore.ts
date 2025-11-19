import { create } from 'zustand';

export type HousingType = 'LH' | 'SH' | 'GH';

interface PublicHousingState {
  // 선택된 공고 ID들
  selectedLH: Set<string>;
  selectedSH: Set<string>;
  selectedGH: Set<string>;

  // Actions
  toggleSelection: (type: HousingType, id: string)=> void;
  clearSelections: (type?: HousingType)=> void;
  selectAll: (type: HousingType, ids: string[])=> void;
  isSelected: (type: HousingType, id: string)=> boolean;
}

export const usePublicHousingStore = create<PublicHousingState>((set, get) => ({
  selectedLH: new Set<string>(),
  selectedSH: new Set<string>(),
  selectedGH: new Set<string>(),

  toggleSelection: (type: HousingType, id: string) => {
    set((state) => {
      const key = ('selected' + type) as keyof Pick<PublicHousingState, 'selectedLH' | 'selectedSH' | 'selectedGH'>;
      const newSet = new Set(state[key]);

      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }

      return { [key]: newSet } as Partial<PublicHousingState>;
    });
  },

  clearSelections: (type?: HousingType) => {
    if (type) {
      const key = ('selected' + type) as keyof Pick<PublicHousingState, 'selectedLH' | 'selectedSH' | 'selectedGH'>;
      set({ [key]: new Set<string>() } as Partial<PublicHousingState>);
    } else {
      set({
        selectedLH: new Set<string>(),
        selectedSH: new Set<string>(),
        selectedGH: new Set<string>(),
      });
    }
  },

  selectAll: (type: HousingType, ids: string[]) => {
    const key = ('selected' + type) as keyof Pick<PublicHousingState, 'selectedLH' | 'selectedSH' | 'selectedGH'>;
    set({ [key]: new Set(ids) } as Partial<PublicHousingState>);
  },

  isSelected: (type: HousingType, id: string) => {
    const state = get();
    const key = ('selected' + type) as keyof Pick<PublicHousingState, 'selectedLH' | 'selectedSH' | 'selectedGH'>;
    return state[key].has(id);
  },
}));
