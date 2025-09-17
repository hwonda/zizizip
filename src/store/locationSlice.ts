import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LocationData } from '@/types';

interface LocationState {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  locations: [],
  selectedLocation: null,
  isLoading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocations: (state, action: PayloadAction<LocationData[]>) => {
      state.locations = action.payload;
      state.error = null;
    },
    setSelectedLocation: (state, action: PayloadAction<LocationData | null>) => {
      state.selectedLocation = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearLocations: (state) => {
      state.locations = [];
      state.selectedLocation = null;
      state.error = null;
    },
  },
});

export const {
  setLocations,
  setSelectedLocation,
  setLoading,
  setError,
  clearError,
  clearLocations,
} = locationSlice.actions;

export default locationSlice.reducer;
