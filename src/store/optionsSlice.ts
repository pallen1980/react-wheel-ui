import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Option } from '../Areas/Main/Options/models';

export interface OptionsState {
  options: Option[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
}

export interface ReorderPayload {
  fromIndex: number;
  toIndex: number;
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
      state.options = action.payload.sort((a, b) => a.sequence - b.sequence);
    },
    addOption: (state, action: PayloadAction<Option>) => {
      // Ensure new option has proper sequence
      const maxSequence = state.options.reduce((max, option) => 
        Math.max(max, option.sequence), 0);
      const newOption = { 
        ...action.payload, 
        sequence: action.payload.sequence || maxSequence + 1 
      };
      state.options.push(newOption);
      state.options.sort((a, b) => a.sequence - b.sequence);
    },
    updateOption: (state, action: PayloadAction<Option>) => {
      const index = state.options.findIndex(option => option.key === action.payload.key);
      if (index !== -1) {
        state.options[index] = action.payload;
        state.options.sort((a, b) => a.sequence - b.sequence);
      }
    },
    deleteOption: (state, action: PayloadAction<string>) => {
      state.options = state.options.filter(option => option.key !== action.payload);
      // Resequence remaining options to maintain order
      state.options.forEach((option, index) => {
        option.sequence = index + 1;
      });
    },
    reorderOptions: (state, action: PayloadAction<ReorderPayload>) => {
      const { fromIndex, toIndex } = action.payload;
      if (fromIndex >= 0 && fromIndex < state.options.length && 
          toIndex >= 0 && toIndex < state.options.length && 
          fromIndex !== toIndex) {
        
        // Remove the item from the array
        const [movedOption] = state.options.splice(fromIndex, 1);
        // Insert it at the new position
        state.options.splice(toIndex, 0, movedOption);
        
        // Update sequence numbers to match new order
        state.options.forEach((option, index) => {
          option.sequence = index + 1;
        });
      }
    },
    shuffleOptions: (state) => {
      // Fisher-Yates shuffle algorithm
      const shuffled = [...state.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Update sequence numbers to match new order
      shuffled.forEach((option, index) => {
        option.sequence = index + 1;
      });
      
      state.options = shuffled;
    },
    clearOptions: (state) => {
      state.options = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      // Clear error when starting to load
      if (action.payload) {
        state.error = null;
      }
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
      // Clear error when starting to save
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      // Clear loading states when error occurs
      if (action.payload) {
        state.isLoading = false;
        state.isSaving = false;
      }
    },
    setLastSaved: (state, action: PayloadAction<Date | null>) => {
      state.lastSaved = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setOptions,
  addOption,
  updateOption,
  deleteOption,
  reorderOptions,
  shuffleOptions,
  clearOptions,
  setLoading,
  setSaving,
  setError,
  setLastSaved,
  clearError,
} = optionsSlice.actions;

export default optionsSlice.reducer;