import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import optionsReducer, {
  loadOptionsThunk,
  saveOptionsThunk,
  OptionsState,
  setOptions,
  addOption,
  updateOption,
  deleteOption,
  clearOptions,
} from '../../src/store/optionsSlice';
import { OptionsService, OptionsServiceError, OptionsErrorType } from '../../src/services/OptionsService';
import { Option } from '../../src/Areas/Main/Options/models';
import { auth } from '../../src/Auth/Firebase/Config/Firebase';

// Mock Firebase auth
vi.mock('../../src/Auth/Firebase/Config/Firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock options service
const mockOptionsService: OptionsService = {
  loadUserOptions: vi.fn(),
  saveUserOptions: vi.fn(),
};

// Test data
const mockOptions: Option[] = [
  { key: 'opt1', value: 'Option 1', sequence: 1 },
  { key: 'opt2', value: 'Option 2', sequence: 2 },
  { key: 'opt3', value: 'Option 3', sequence: 3 },
];

const mockUser = {
  uid: 'test-user-123',
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
};

describe('optionsSlice async thunks', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        options: optionsReducer,
      },
    });
    
    // Reset mocks
    vi.clearAllMocks();
    (auth as any).currentUser = mockUser;
  });

  afterEach(() => {
    (auth as any).currentUser = null;
  });

  describe('loadOptionsThunk', () => {
    it('should handle successful options loading', async () => {
      // Arrange
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);

      // Act
      const result = await store.dispatch(loadOptionsThunk(mockOptionsService));

      // Assert
      expect(result.type).toBe('options/loadOptions/fulfilled');
      expect(result.payload).toEqual(mockOptions);
      
      const state = store.getState().options;
      expect(state.isLoading).toBe(false);
      expect(state.options).toEqual(mockOptions);
      expect(state.error).toBeNull();
      expect(mockOptionsService.loadUserOptions).toHaveBeenCalledWith('test-user-123');
    });

    it('should handle loading when user is not authenticated', async () => {
      // Arrange
      (auth as any).currentUser = null;

      // Act
      const result = await store.dispatch(loadOptionsThunk(mockOptionsService));

      // Assert
      expect(result.type).toBe('options/loadOptions/rejected');
      expect(result.payload).toEqual({
        type: 'auth',
        message: 'User not authenticated',
        retryable: false,
      });
      
      const state = store.getState().options;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('User not authenticated');
      expect(mockOptionsService.loadUserOptions).not.toHaveBeenCalled();
    });

    it('should handle OptionsServiceError during loading', async () => {
      // Arrange
      const serviceError = new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Network connection failed',
        true
      );
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValue(serviceError);

      // Act
      const result = await store.dispatch(loadOptionsThunk(mockOptionsService));

      // Assert
      expect(result.type).toBe('options/loadOptions/rejected');
      expect(result.payload).toEqual({
        type: 'network',
        message: 'Network connection failed',
        retryable: true,
      });
      
      const state = store.getState().options;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network connection failed');
    });

    it('should handle unknown error during loading', async () => {
      // Arrange
      const unknownError = new Error('Unknown error');
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValue(unknownError);

      // Act
      const result = await store.dispatch(loadOptionsThunk(mockOptionsService));

      // Assert
      expect(result.type).toBe('options/loadOptions/rejected');
      expect(result.payload).toEqual({
        type: 'network',
        message: 'Unknown error',
        retryable: false,
      });
      
      const state = store.getState().options;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Unknown error');
    });

    it('should set loading state during pending', async () => {
      // Arrange
      vi.mocked(mockOptionsService.loadUserOptions).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOptions), 100))
      );

      // Act
      const promise = store.dispatch(loadOptionsThunk(mockOptionsService));
      
      // Assert loading state
      const loadingState = store.getState().options;
      expect(loadingState.isLoading).toBe(true);
      expect(loadingState.error).toBeNull();

      // Wait for completion
      await promise;
      
      const finalState = store.getState().options;
      expect(finalState.isLoading).toBe(false);
    });

    it('should sort options by sequence after loading', async () => {
      // Arrange
      const unsortedOptions: Option[] = [
        { key: 'opt3', value: 'Option 3', sequence: 3 },
        { key: 'opt1', value: 'Option 1', sequence: 1 },
        { key: 'opt2', value: 'Option 2', sequence: 2 },
      ];
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(unsortedOptions);

      // Act
      await store.dispatch(loadOptionsThunk(mockOptionsService));

      // Assert
      const state = store.getState().options;
      expect(state.options).toEqual([
        { key: 'opt1', value: 'Option 1', sequence: 1 },
        { key: 'opt2', value: 'Option 2', sequence: 2 },
        { key: 'opt3', value: 'Option 3', sequence: 3 },
      ]);
    });
  });

  describe('saveOptionsThunk', () => {
    it('should handle successful options saving', async () => {
      // Arrange
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();
      const beforeSave = new Date();

      // Act
      const result = await store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, options: mockOptions })
      );

      // Assert
      expect(result.type).toBe('options/saveOptions/fulfilled');
      expect(typeof result.payload.savedAt).toBe('string');
      expect(new Date(result.payload.savedAt).getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      
      const state = store.getState().options;
      expect(state.isSaving).toBe(false);
      expect(typeof state.lastSaved).toBe('string');
      expect(state.error).toBeNull();
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledWith('test-user-123', mockOptions);
    });

    it('should handle saving when user is not authenticated', async () => {
      // Arrange
      (auth as any).currentUser = null;

      // Act
      const result = await store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, options: mockOptions })
      );

      // Assert
      expect(result.type).toBe('options/saveOptions/rejected');
      expect(result.payload).toEqual({
        type: 'auth',
        message: 'User not authenticated',
        retryable: false,
      });
      
      const state = store.getState().options;
      expect(state.isSaving).toBe(false);
      expect(state.error).toBe('User not authenticated');
      expect(mockOptionsService.saveUserOptions).not.toHaveBeenCalled();
    });

    it('should handle OptionsServiceError during saving', async () => {
      // Arrange
      const serviceError = new OptionsServiceError(
        OptionsErrorType.PERMISSION,
        'Insufficient permissions',
        false
      );
      vi.mocked(mockOptionsService.saveUserOptions).mockRejectedValue(serviceError);

      // Act
      const result = await store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, options: mockOptions })
      );

      // Assert
      expect(result.type).toBe('options/saveOptions/rejected');
      expect(result.payload).toEqual({
        type: 'permission',
        message: 'Insufficient permissions',
        retryable: false,
      });
      
      const state = store.getState().options;
      expect(state.isSaving).toBe(false);
      expect(state.error).toBe('Insufficient permissions');
    });

    it('should handle unknown error during saving', async () => {
      // Arrange
      const unknownError = new Error('Save failed');
      vi.mocked(mockOptionsService.saveUserOptions).mockRejectedValue(unknownError);

      // Act
      const result = await store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, options: mockOptions })
      );

      // Assert
      expect(result.type).toBe('options/saveOptions/rejected');
      expect(result.payload).toEqual({
        type: 'network',
        message: 'Save failed',
        retryable: false,
      });
      
      const state = store.getState().options;
      expect(state.isSaving).toBe(false);
      expect(state.error).toBe('Save failed');
    });

    it('should set saving state during pending', async () => {
      // Arrange
      vi.mocked(mockOptionsService.saveUserOptions).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(), 100))
      );

      // Act
      const promise = store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, options: mockOptions })
      );
      
      // Assert saving state
      const savingState = store.getState().options;
      expect(savingState.isSaving).toBe(true);
      expect(savingState.error).toBeNull();

      // Wait for completion
      await promise;
      
      const finalState = store.getState().options;
      expect(finalState.isSaving).toBe(false);
    });
  });

  describe('thunk integration with existing reducers', () => {
    it('should not interfere with synchronous actions', async () => {
      // Arrange
      const newOption: Option = { key: 'new', value: 'New Option', sequence: 4 };

      // Act - mix async and sync actions
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      await store.dispatch(loadOptionsThunk(mockOptionsService));
      store.dispatch(addOption(newOption));
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();
      await store.dispatch(saveOptionsThunk({ optionsService: mockOptionsService, options: [...mockOptions, newOption] }));

      // Assert
      const state = store.getState().options;
      expect(state.options).toHaveLength(4);
      expect(state.options[3]).toEqual(newOption);
      expect(typeof state.lastSaved).toBe('string');
    });

    it('should clear error state when starting new operations', async () => {
      // Arrange - set initial error state
      store.dispatch(setOptions([]));
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValueOnce(
        new Error('Initial error')
      );
      await store.dispatch(loadOptionsThunk(mockOptionsService));
      expect(store.getState().options.error).toBe('Initial error');

      // Act - start new successful operation
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValueOnce(mockOptions);
      await store.dispatch(loadOptionsThunk(mockOptionsService));

      // Assert
      const state = store.getState().options;
      expect(state.error).toBeNull();
      expect(state.options).toEqual(mockOptions);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle auth token retrieval failure', async () => {
      // Arrange
      mockUser.getIdToken.mockRejectedValueOnce(new Error('Token expired'));

      // Act
      const result = await store.dispatch(loadOptionsThunk(mockOptionsService));

      // Assert - should fail when token retrieval fails
      expect(result.type).toBe('options/loadOptions/rejected');
      expect(result.payload).toEqual({
        type: 'auth',
        message: 'Failed to get authentication token',
        retryable: false,
      });
    });

    it('should handle non-Error objects thrown', async () => {
      // Arrange
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValue('String error');

      // Act
      const result = await store.dispatch(loadOptionsThunk(mockOptionsService));

      // Assert
      expect(result.type).toBe('options/loadOptions/rejected');
      expect(result.payload).toEqual({
        type: 'network',
        message: 'Unknown error occurred',
        retryable: false,
      });
    });
  });
});