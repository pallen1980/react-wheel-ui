import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Option } from '../Areas/Main/Options/models';
import { OptionsService, OptionsServiceError } from '../services/OptionsService';


export interface OptionsState {
  options: Option[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: string | null;
  isOfflineMode: boolean;
  retryCount: number;
  lastError: {
    type: string;
    message: string;
    retryable: boolean;
    timestamp: string;
  } | null;
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
  isOfflineMode: false,
  retryCount: 0,
  lastError: null,
};

// Async thunk for loading user options
export const loadOptionsThunk = createAsyncThunk(
  'options/loadOptions',
  async (
    { optionsService, userId }: { optionsService: OptionsService; userId: string },
    { rejectWithValue }
  ) => {
    try {
      if (!userId) {
        throw new OptionsServiceError(
          'auth' as any,
          'User not authenticated',
          false
        );
      }

      const options = await optionsService.loadUserOptions(userId);
      return options;
    } catch (error) {
      if (error instanceof OptionsServiceError) {
        return rejectWithValue({
          type: error.type,
          message: error.message,
          retryable: error.retryable
        });
      }
      
      return rejectWithValue({
        type: 'network',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: false
      });
    }
  }
);

// Async thunk for saving user options
export const saveOptionsThunk = createAsyncThunk(
  'options/saveOptions',
  async (
    { optionsService, userId, options }: { optionsService: OptionsService; userId: string; options: Option[] },
    { rejectWithValue }
  ) => {
    try {
      if (!userId) {
        throw new OptionsServiceError(
          'auth' as any,
          'User not authenticated',
          false
        );
      }

      await optionsService.saveUserOptions(userId, options);
      return { savedAt: new Date().toISOString() };
    } catch (error) {
      if (error instanceof OptionsServiceError) {
        return rejectWithValue({
          type: error.type,
          message: error.message,
          retryable: error.retryable
        });
      }
      
      return rejectWithValue({
        type: 'network',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: false
      });
    }
  }
);

// Async thunk for user-initiated retry operations
export const retryLastOperationThunk = createAsyncThunk(
  'options/retryLastOperation',
  async (
    { optionsService, userId, options, operationType }: { 
      optionsService: OptionsService; 
      userId: string; 
      options?: Option[];
      operationType: 'load' | 'save';
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as { options: OptionsState };
      
      // Check if we should retry based on last error
      if (!state.options.lastError?.retryable) {
        return rejectWithValue({
          type: 'retry',
          message: 'This operation cannot be retried',
          retryable: false
        });
      }

      if (operationType === 'load') {
        const loadedOptions = await optionsService.loadUserOptions(userId);
        return { type: 'load', options: loadedOptions };
      } else {
        if (!options) {
          throw new Error('Options required for save retry');
        }
        await optionsService.saveUserOptions(userId, options);
        return { type: 'save', savedAt: new Date().toISOString() };
      }
    } catch (error) {
      if (error instanceof OptionsServiceError) {
        return rejectWithValue({
          type: error.type,
          message: error.message,
          retryable: error.retryable
        });
      }
      
      return rejectWithValue({
        type: 'network',
        message: error instanceof Error ? error.message : 'Retry failed',
        retryable: false
      });
    }
  }
);

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
    setLastSaved: (state, action: PayloadAction<string | null>) => {
      state.lastSaved = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.lastError = null;
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOfflineMode = action.payload;
      if (action.payload) {
        // Clear loading states when going offline
        state.isLoading = false;
        state.isSaving = false;
      }
    },
    incrementRetryCount: (state) => {
      state.retryCount += 1;
    },
    resetRetryCount: (state) => {
      state.retryCount = 0;
    },
    setLastError: (state, action: PayloadAction<{
      type: string;
      message: string;
      retryable: boolean;
    } | null>) => {
      if (action.payload) {
        state.lastError = {
          ...action.payload,
          timestamp: new Date().toISOString()
        };
      } else {
        state.lastError = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Load options thunk
    builder
      .addCase(loadOptionsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadOptionsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.options = [...action.payload].sort((a, b) => a.sequence - b.sequence);
        state.error = null;
      })
      .addCase(loadOptionsThunk.rejected, (state, action) => {
        state.isLoading = false;
        const errorPayload = action.payload as { type: string; message: string; retryable: boolean };
        const errorMessage = errorPayload?.message || 'Unable to load your saved options';
        
        state.error = errorMessage;
        state.lastError = {
          type: errorPayload?.type || 'unknown',
          message: errorMessage,
          retryable: errorPayload?.retryable || false,
          timestamp: new Date().toISOString()
        };

        // Enable offline mode for network errors
        if (errorPayload?.type === 'network') {
          state.isOfflineMode = true;
        }
      });

    // Save options thunk
    builder
      .addCase(saveOptionsThunk.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveOptionsThunk.fulfilled, (state, action) => {
        state.isSaving = false;
        state.lastSaved = action.payload.savedAt;
        state.error = null;
      })
      .addCase(saveOptionsThunk.rejected, (state, action) => {
        state.isSaving = false;
        const errorPayload = action.payload as { type: string; message: string; retryable: boolean };
        const errorMessage = errorPayload?.message || 'Unable to save your changes';
        
        state.error = errorMessage;
        state.lastError = {
          type: errorPayload?.type || 'unknown',
          message: errorMessage,
          retryable: errorPayload?.retryable || false,
          timestamp: new Date().toISOString()
        };

        // Enable offline mode for network errors
        if (errorPayload?.type === 'network') {
          state.isOfflineMode = true;
        }
      });

    // Retry operation thunk
    builder
      .addCase(retryLastOperationThunk.pending, (state) => {
        state.error = null;
        state.retryCount += 1;
      })
      .addCase(retryLastOperationThunk.fulfilled, (state, action) => {
        const { type, options, savedAt } = action.payload;
        
        if (type === 'load' && options) {
          state.options = [...options].sort((a, b) => a.sequence - b.sequence);
        } else if (type === 'save' && savedAt) {
          state.lastSaved = savedAt;
        }
        
        // Clear error states and disable offline mode on successful retry
        state.error = null;
        state.lastError = null;
        state.isOfflineMode = false;
        state.retryCount = 0;
        state.isLoading = false;
        state.isSaving = false;
      })
      .addCase(retryLastOperationThunk.rejected, (state, action) => {
        const errorPayload = action.payload as { type: string; message: string; retryable: boolean };
        const errorMessage = errorPayload?.message || 'Retry operation failed';
        
        state.error = errorMessage;
        state.lastError = {
          type: errorPayload?.type || 'unknown',
          message: errorMessage,
          retryable: errorPayload?.retryable || false,
          timestamp: new Date().toISOString()
        };
        state.isLoading = false;
        state.isSaving = false;
      });
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
  setOfflineMode,
  incrementRetryCount,
  resetRetryCount,
  setLastError,
} = optionsSlice.actions;

export default optionsSlice.reducer;