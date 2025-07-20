import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Option } from '../Areas/Main/Options/models';

interface OptionsState {
  options: Option[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
}

const initialState: OptionsState = {
  options: [],
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
};

const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setOptions: (state, action: PayloadAction<Option[]>) => {
      state.options = action.payload;
    },
    addOption: (state, action: PayloadAction<Option>) => {
      state.options.push(action.payload);
    },
    updateOption: (state, action: PayloadAction<Option>) => {
      const index = state.options.findIndex(option => option.key === action.payload.key);
      if (index !== -1) {
        state.options[index] = action.payload;
      }
    },
    deleteOption: (state, action: PayloadAction<string>) => {
      state.options = state.options.filter(option => option.key !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLastSaved: (state, action: PayloadAction<Date | null>) => {
      state.lastSaved = action.payload;
    },
  },
});

export const {
  setOptions,
  addOption,
  updateOption,
  deleteOption,
  setLoading,
  setSaving,
  setError,
  setLastSaved,
} = optionsSlice.actions;

export default optionsSlice.reducer;