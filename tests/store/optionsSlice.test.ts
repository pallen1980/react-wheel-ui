import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import optionsReducer, {
  loadOptionsThunk,
  saveOptionsThunk,
  retryLastOperationThunk,
  setOptions,
  addOption,
  updateOption,
  deleteOption,
  reorderOptions,
  clearError,
  setOfflineMode,
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
const createMockOptions = (): Option[] => [
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
    (auth as { currentUser: typeof mockUser }).currentUser = mockUser;
  });

  afterEach(() => {
    (auth as { currentUser: null }).currentUser = null;
  });

  describe('loadOptionsThunk', () => {
    it('should handle successful options loading', async () => {
      // Arrange
      const mockOptions = createMockOptions();
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);

      // Act
      const result = await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

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
      // Arrange - empty userId simulates unauthenticated user

      // Act
      const result = await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: ''
      }));

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
      const result = await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

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
      const result = await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

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
      const mockOptions = createMockOptions();
      vi.mocked(mockOptionsService.loadUserOptions).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOptions), 100))
      );

      // Act
      const promise = store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

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
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

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
      const mockOptions = createMockOptions();
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();
      const beforeSave = new Date();

      // Act
      const result = await store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, userId: 'test-user-123', options: mockOptions })
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
      // Arrange - empty userId simulates unauthenticated user
      const mockOptions = createMockOptions();

      // Act
      const result = await store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, userId: '', options: mockOptions })
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
      const mockOptions = createMockOptions();
      const serviceError = new OptionsServiceError(
        OptionsErrorType.PERMISSION,
        'Insufficient permissions',
        false
      );
      vi.mocked(mockOptionsService.saveUserOptions).mockRejectedValue(serviceError);

      // Act
      const result = await store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, userId: 'test-user-123', options: mockOptions })
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
      const mockOptions = createMockOptions();
      const unknownError = new Error('Save failed');
      vi.mocked(mockOptionsService.saveUserOptions).mockRejectedValue(unknownError);

      // Act
      const result = await store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, userId: 'test-user-123', options: mockOptions })
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
      const mockOptions = createMockOptions();
      vi.mocked(mockOptionsService.saveUserOptions).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(), 100))
      );

      // Act
      const promise = store.dispatch(
        saveOptionsThunk({ optionsService: mockOptionsService, userId: 'test-user-123', options: mockOptions })
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
      const mockOptions = createMockOptions();
      const newOption: Option = { key: 'new', value: 'New Option', sequence: 4 };

      // Act - mix async and sync actions
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));
      store.dispatch(addOption(newOption));
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();
      await store.dispatch(saveOptionsThunk({ optionsService: mockOptionsService, userId: 'test-user-123', options: [...mockOptions, newOption] }));

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
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));
      expect(store.getState().options.error).toBe('Initial error');

      // Act - start new successful operation
      const mockOptions = createMockOptions();
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValueOnce(mockOptions);
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Assert
      const state = store.getState().options;
      expect(state.error).toBeNull();
      expect(state.options).toEqual(mockOptions);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle service errors properly', async () => {
      // Arrange
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      // Act
      const result = await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Assert - should fail when service fails
      expect(result.type).toBe('options/loadOptions/rejected');
      expect(result.payload).toEqual({
        type: 'network',
        message: 'Service unavailable',
        retryable: false,
      });
    });

    it('should handle non-Error objects thrown', async () => {
      // Arrange
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValue('String error');

      // Act
      const result = await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Assert
      expect(result.type).toBe('options/loadOptions/rejected');
      expect(result.payload).toEqual({
        type: 'network',
        message: 'Unknown error occurred',
        retryable: false,
      });
    });
  });

  describe('retryLastOperationThunk', () => {
    it('should retry load operation when last error was load-related', async () => {
      // Arrange - set up state with load error
      store.dispatch(setOptions([]));
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValueOnce(
        new OptionsServiceError(OptionsErrorType.NETWORK, 'Failed to load options', true)
      );
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Now mock successful retry
      const mockOptions = createMockOptions();
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValueOnce(mockOptions);

      // Act
      const result = await store.dispatch(retryLastOperationThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: [],
        operationType: 'load'
      }));

      // Assert
      expect(result.type).toBe('options/retryLastOperation/fulfilled');
      expect(mockOptionsService.loadUserOptions).toHaveBeenCalledTimes(2);

      const state = store.getState().options;
      expect(state.options).toEqual(mockOptions);
      expect(state.retryCount).toBe(0); // Reset to 0 on successful retry
    });

    it('should retry save operation when last error was save-related', async () => {
      // Arrange - set up state with save error
      const mockOptions = createMockOptions();
      store.dispatch(setOptions(mockOptions));
      vi.mocked(mockOptionsService.saveUserOptions).mockRejectedValueOnce(
        new OptionsServiceError(OptionsErrorType.NETWORK, 'Failed to save options', true)
      );
      await store.dispatch(saveOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: mockOptions
      }));

      // Now mock successful retry
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValueOnce();

      // Act
      const result = await store.dispatch(retryLastOperationThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: mockOptions,
        operationType: 'save'
      }));

      // Assert
      expect(result.type).toBe('options/retryLastOperation/fulfilled');
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledTimes(2);

      const state = store.getState().options;
      expect(state.retryCount).toBe(0); // Reset to 0 on successful retry
    });

    it('should handle retry when no retryable error exists', async () => {
      // Act
      const mockOptions = createMockOptions();
      const result = await store.dispatch(retryLastOperationThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: mockOptions,
        operationType: 'save'
      }));

      // Assert
      expect(result.type).toBe('options/retryLastOperation/rejected');
      expect(result.payload).toEqual({
        type: 'retry',
        message: 'This operation cannot be retried',
        retryable: false,
      });
    });

    it('should handle retry failure', async () => {
      // Arrange - set up state with retryable error
      store.dispatch(setOptions([]));
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValueOnce(
        new OptionsServiceError(OptionsErrorType.NETWORK, 'Failed to load options', true)
      );
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Mock retry failure
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValueOnce(
        new OptionsServiceError(OptionsErrorType.NETWORK, 'Retry failed', true)
      );

      // Act
      const result = await store.dispatch(retryLastOperationThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: [],
        operationType: 'load'
      }));

      // Assert
      expect(result.type).toBe('options/retryLastOperation/rejected');
      expect(result.payload).toEqual({
        type: 'network',
        message: 'Retry failed',
        retryable: true,
      });

      const state = store.getState().options;
      expect(state.retryCount).toBe(1);
    });
  });

  describe('optionsSlice synchronous actions', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          options: optionsReducer,
        },
      });
    });

    describe('setOptions', () => {
      it('should set options and sort by sequence', () => {
        const unsortedOptions: Option[] = [
          { key: 'opt3', value: 'Option 3', sequence: 3 },
          { key: 'opt1', value: 'Option 1', sequence: 1 },
          { key: 'opt2', value: 'Option 2', sequence: 2 },
        ];

        store.dispatch(setOptions(unsortedOptions));

        const state = store.getState().options;
        expect(state.options).toEqual([
          { key: 'opt1', value: 'Option 1', sequence: 1 },
          { key: 'opt2', value: 'Option 2', sequence: 2 },
          { key: 'opt3', value: 'Option 3', sequence: 3 },
        ]);
      });
    });

    describe('addOption', () => {
      it('should add option with correct sequence', () => {
        const mockOptions = createMockOptions();
        store.dispatch(setOptions(mockOptions));

        const newOption: Option = { key: 'new', value: 'New Option', sequence: 4 };
        store.dispatch(addOption(newOption));

        const state = store.getState().options;
        expect(state.options).toHaveLength(4);
        expect(state.options[3]).toEqual(newOption);
      });

      it('should add option to empty list', () => {
        const newOption: Option = { key: 'first', value: 'First Option', sequence: 1 };
        store.dispatch(addOption(newOption));

        const state = store.getState().options;
        expect(state.options).toHaveLength(1);
        expect(state.options[0]).toEqual(newOption);
      });
    });

    describe('updateOption', () => {
      it('should update existing option', () => {
        const mockOptions = createMockOptions();
        store.dispatch(setOptions(mockOptions));

        const updatedOption: Option = { key: 'opt2', value: 'Updated Option 2', sequence: 2 };
        store.dispatch(updateOption(updatedOption));

        const state = store.getState().options;
        expect(state.options[1]).toEqual(updatedOption);
      });

      it('should not update non-existent option', () => {
        const mockOptions = createMockOptions();
        store.dispatch(setOptions(mockOptions));

        const nonExistentOption: Option = { key: 'nonexistent', value: 'Does not exist', sequence: 99 };
        store.dispatch(updateOption(nonExistentOption));

        const state = store.getState().options;
        expect(state.options).toHaveLength(3);
        expect(state.options).toEqual(mockOptions);
      });
    });

    describe('deleteOption', () => {
      it('should delete existing option', () => {
        const mockOptions = createMockOptions();
        store.dispatch(setOptions(mockOptions));

        store.dispatch(deleteOption('opt2'));

        const state = store.getState().options;
        expect(state.options).toHaveLength(2);
        expect(state.options.find(opt => opt.key === 'opt2')).toBeUndefined();
      });

      it('should not affect state when deleting non-existent option', () => {
        const mockOptions = createMockOptions();
        store.dispatch(setOptions(mockOptions));

        store.dispatch(deleteOption('nonexistent'));

        const state = store.getState().options;
        expect(state.options).toHaveLength(3);
        expect(state.options).toEqual(mockOptions);
      });
    });

    describe('reorderOptions', () => {
      it('should reorder options correctly', () => {
        const mockOptions = createMockOptions();
        store.dispatch(setOptions(mockOptions));

        // Move first option to last position
        store.dispatch(reorderOptions({ fromIndex: 0, toIndex: 2 }));

        const state = store.getState().options;
        expect(state.options[0].key).toBe('opt2');
        expect(state.options[1].key).toBe('opt3');
        expect(state.options[2].key).toBe('opt1');

        // Check sequences are updated
        expect(state.options[0].sequence).toBe(1);
        expect(state.options[1].sequence).toBe(2);
        expect(state.options[2].sequence).toBe(3);
      });

      it('should handle invalid indices gracefully', () => {
        const mockOptions = createMockOptions();
        store.dispatch(setOptions(mockOptions));
        const originalOptions = [...mockOptions];

        // Invalid fromIndex
        store.dispatch(reorderOptions({ fromIndex: 10, toIndex: 1 }));
        expect(store.getState().options.options).toEqual(originalOptions);

        // Invalid toIndex
        store.dispatch(reorderOptions({ fromIndex: 1, toIndex: 10 }));
        expect(store.getState().options.options).toEqual(originalOptions);

        // Negative indices
        store.dispatch(reorderOptions({ fromIndex: -1, toIndex: 1 }));
        expect(store.getState().options.options).toEqual(originalOptions);
      });

      it('should handle same index reorder', () => {
        const mockOptions = createMockOptions();
        store.dispatch(setOptions(mockOptions));
        const originalOptions = [...mockOptions];

        store.dispatch(reorderOptions({ fromIndex: 1, toIndex: 1 }));

        expect(store.getState().options.options).toEqual(originalOptions);
      });
    });

    describe('clearError', () => {
      it('should clear error and lastError', async () => {
        // Set up error state by triggering a failed async action
        vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValueOnce(
          new Error('Test error')
        );
        
        await store.dispatch(loadOptionsThunk({
          optionsService: mockOptionsService,
          userId: 'test-user-123'
        }));

        // Verify error state is set
        let state = store.getState().options;
        expect(state.error).toBe('Test error');
        expect(state.lastError).not.toBeNull();

        // Clear the error
        store.dispatch(clearError());

        // Verify error state is cleared
        state = store.getState().options;
        expect(state.error).toBeNull();
        expect(state.lastError).toBeNull();
      });
    });

    describe('setOfflineMode', () => {
      it('should set offline mode to true', () => {
        store.dispatch(setOfflineMode(true));

        const state = store.getState().options;
        expect(state.isOfflineMode).toBe(true);
      });

      it('should set offline mode to false', () => {
        store.dispatch(setOfflineMode(false));

        const state = store.getState().options;
        expect(state.isOfflineMode).toBe(false);
      });
    });

    describe('initial state', () => {
      it('should have correct initial state', () => {
        const state = store.getState().options;

        expect(state).toEqual({
          options: [],
          isLoading: false,
          isSaving: false,
          error: null,
          lastSaved: null,
          isOfflineMode: false,
          retryCount: 0,
          lastError: null,
        });
      });
    });
  });
});
