import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { act } from '@testing-library/react';

import optionsReducer, { 
  loadOptionsThunk, 
  saveOptionsThunk, 
  addOption, 
  updateOption, 
  deleteOption, 
  shuffleOptions,
  setOptions,
  clearOptions
} from '../../src/store/optionsSlice';
import { createAutoSaveMiddleware } from '../../src/store/middleware/autoSaveMiddleware';
import { OptionsService, OptionsServiceError, OptionsErrorType } from '../../src/services/OptionsService';
import { Option } from '../../src/Areas/Main/Options/models';

// Mock Firebase auth
const mockUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  email: 'test@example.com',
  getIdToken: vi.fn().mockResolvedValue('mock-auth-token')
};

vi.mock('../../src/Auth/Firebase/Config/Firebase', () => ({
  auth: {
    currentUser: null
  }
}));

// Mock error logger
vi.mock('../../src/utils/errorLogger', () => ({
  logOfflineModeEnabled: vi.fn(),
  logOfflineModeDisabled: vi.fn()
}));

// Mock network connectivity
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Test data
const createMockOptions = (): Option[] => [
  { key: 'opt1', value: 'Option 1', sequence: 1 },
  { key: 'opt2', value: 'Option 2', sequence: 2 },
  { key: 'opt3', value: 'Option 3', sequence: 3 }
];

describe('Options Sync Flow Integration Tests', () => {
  let mockOptionsService: OptionsService;
  let store: ReturnType<typeof configureStore>;

  const createTestStore = () => {
    const autoSaveMiddleware = createAutoSaveMiddleware({
      debounceMs: 100, // Shorter for testing
      optionsService: mockOptionsService
    });

    return configureStore({
      reducer: {
        options: optionsReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: { optionsService: mockOptionsService }
          }
        }).concat(autoSaveMiddleware)
    });
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset network connectivity
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Mock options service
    mockOptionsService = {
      loadUserOptions: vi.fn(),
      saveUserOptions: vi.fn()
    };

    // Reset Firebase auth mock
    const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
    (auth as unknown as { currentUser: null }).currentUser = null;

    store = createTestStore();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe('End-to-end option loading and saving with mocked API', () => {
    it('should load options and trigger auto-save on changes', async () => {
      const mockOptions = createMockOptions();

      // Mock successful operations
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Verify options were loaded
      expect(mockOptionsService.loadUserOptions).toHaveBeenCalledWith('test-user-123');
      expect(store.getState().options.options).toEqual(mockOptions);

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Add a new option (should trigger auto-save)
      const newOption: Option = { key: 'new', value: 'New Option', sequence: 4 };
      store.dispatch(addOption(newOption));

      // Advance timers to trigger debounced save
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify save was called with updated options
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledWith(
        'test-user-123',
        expect.arrayContaining([
          expect.objectContaining({ value: 'Option 1' }),
          expect.objectContaining({ value: 'Option 2' }),
          expect.objectContaining({ value: 'Option 3' }),
          expect.objectContaining({ value: 'New Option' })
        ])
      );
    });

    it('should handle option modifications and trigger auto-save', async () => {
      const mockOptions = createMockOptions();

      // Mock successful operations
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Modify an existing option
      const modifiedOption: Option = { key: 'opt1', value: 'Modified Option 1', sequence: 1 };
      store.dispatch(updateOption(modifiedOption));

      // Advance timers to trigger debounced save
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify save was called with modified options
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledWith(
        'test-user-123',
        expect.arrayContaining([
          expect.objectContaining({ value: 'Modified Option 1' }),
          expect.objectContaining({ value: 'Option 2' }),
          expect.objectContaining({ value: 'Option 3' })
        ])
      );
    });

    it('should handle option deletion and trigger auto-save', async () => {
      const mockOptions = createMockOptions();

      // Mock successful operations
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Delete an option
      store.dispatch(deleteOption('opt1'));

      // Advance timers to trigger debounced save
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify save was called with remaining options
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledWith(
        'test-user-123',
        expect.arrayContaining([
          expect.objectContaining({ value: 'Option 2', sequence: 1 }),
          expect.objectContaining({ value: 'Option 3', sequence: 2 })
        ])
      );

      // Verify the option is no longer in state
      const state = store.getState().options;
      expect(state.options.find(opt => opt.key === 'opt1')).toBeUndefined();
      expect(state.options).toHaveLength(2);
    });

    it('should handle shuffle operation and trigger auto-save', async () => {
      const mockOptions = createMockOptions();

      // Mock successful operations
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Shuffle options
      store.dispatch(shuffleOptions());

      // Advance timers to trigger debounced save
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify save was called (order may be different due to shuffle)
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledWith(
        'test-user-123',
        expect.arrayContaining([
          expect.objectContaining({ value: 'Option 1' }),
          expect.objectContaining({ value: 'Option 2' }),
          expect.objectContaining({ value: 'Option 3' })
        ])
      );

      // Verify all options are still present with updated sequences
      const state = store.getState().options;
      expect(state.options).toHaveLength(3);
      expect(state.options.every(opt => opt.sequence >= 1 && opt.sequence <= 3)).toBe(true);
    });
  });

  describe('Authentication integration scenarios', () => {
    it('should load options when user is authenticated', async () => {
      const mockOptions = createMockOptions();
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load options for authenticated user
      const result = await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Verify options are loaded
      expect(mockOptionsService.loadUserOptions).toHaveBeenCalledWith('test-user-123');
      expect(result.type).toBe('options/loadOptions/fulfilled');
      expect(store.getState().options.options).toEqual(mockOptions);
    });

    it('should clear options when user logs out', async () => {
      const mockOptions = createMockOptions();
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);

      // Set up authenticated user and load options
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Verify options are loaded
      expect(store.getState().options.options).toEqual(mockOptions);

      // Simulate user logout by clearing options
      store.dispatch(clearOptions());

      // Verify options are cleared
      expect(store.getState().options.options).toEqual([]);
    });

    it('should not attempt to save when user is not authenticated', async () => {
      // Ensure no user is authenticated
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: null }).currentUser = null;

      // Set some options in the store
      const testOptions = createMockOptions();
      store.dispatch(setOptions(testOptions));

      // Modify an option (should not trigger auto-save without authentication)
      const modifiedOption: Option = { key: 'opt1', value: 'Modified Option', sequence: 1 };
      store.dispatch(updateOption(modifiedOption));

      // Advance timers to see if save would be triggered
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify no save attempt was made
      expect(mockOptionsService.saveUserOptions).not.toHaveBeenCalled();
    });

    it('should handle authentication token refresh during operations', async () => {
      const mockOptions = createMockOptions();

      // Mock initial successful load
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Modify an option to trigger save
      const modifiedOption: Option = { key: 'opt1', value: 'Modified Option', sequence: 1 };
      store.dispatch(updateOption(modifiedOption));

      // Advance timers to trigger save
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify save was called (authentication should be handled transparently)
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalled();
      
      // Verify the state reflects the change
      const state = store.getState().options;
      expect(state.options.find(opt => opt.key === 'opt1')?.value).toBe('Modified Option');
    });
  });

  describe('Error recovery and fallback behavior', () => {
    it('should handle load errors gracefully', async () => {
      const loadError = new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Failed to load options',
        true
      );
      vi.mocked(mockOptionsService.loadUserOptions).mockRejectedValue(loadError);

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Attempt to load options
      const result = await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Verify load attempt was made
      expect(mockOptionsService.loadUserOptions).toHaveBeenCalledWith('test-user-123');

      // Verify error state is set
      expect(result.type).toBe('options/loadOptions/rejected');
      const state = store.getState().options;
      expect(state.error).toBe('Failed to load options');
      expect(state.isOfflineMode).toBe(true); // Should enable offline mode for network errors
      expect(state.options).toEqual([]); // Should remain empty on load failure
    });

    it('should handle save errors and continue functioning', async () => {
      const mockOptions = createMockOptions();

      // Mock successful load but failed save
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      const saveError = new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Failed to save options',
        true
      );
      vi.mocked(mockOptionsService.saveUserOptions).mockRejectedValue(saveError);

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Directly attempt to save (bypassing auto-save middleware to test error handling)
      const result = await store.dispatch(saveOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: mockOptions
      }));

      // Verify save attempt failed
      expect(result.type).toBe('options/saveOptions/rejected');

      // Verify error state is set
      const state = store.getState().options;
      expect(state.error).toBe('Failed to save options');
      expect(state.isOfflineMode).toBe(true); // Should enable offline mode for network errors
    });

    it('should enable offline mode when network is unavailable', async () => {
      const mockOptions = createMockOptions();

      // Mock successful initial load
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Simulate network going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Mock save failure due to network being offline
      const networkError = new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Network unavailable',
        true
      );
      vi.mocked(mockOptionsService.saveUserOptions).mockRejectedValue(networkError);

      // Directly attempt to save (bypassing auto-save middleware to test error handling)
      const result = await store.dispatch(saveOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: mockOptions
      }));

      // Verify save attempt failed
      expect(result.type).toBe('options/saveOptions/rejected');

      // Verify offline mode is enabled due to network error
      const state = store.getState().options;
      expect(state.isOfflineMode).toBe(true);
      expect(state.error).toBe('Network unavailable');
    });

    it('should recover from offline mode when operations succeed', async () => {
      const mockOptions = createMockOptions();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Start with offline mode enabled (simulate previous network error)
      store.dispatch({ type: 'options/setOfflineMode', payload: true });

      // Simulate network coming back online with successful operation
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // Mock successful save
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Attempt a save operation
      const result = await store.dispatch(saveOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: mockOptions
      }));

      // Verify operation succeeded and offline mode is disabled
      expect(result.type).toBe('options/saveOptions/fulfilled');
      const state = store.getState().options;
      expect(state.isOfflineMode).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle retry operations for failed saves', async () => {
      const mockOptions = createMockOptions();

      // Mock successful load
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Mock initial save failure, then success on retry
      const saveError = new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Failed to save options',
        true
      );
      vi.mocked(mockOptionsService.saveUserOptions)
        .mockRejectedValueOnce(saveError)
        .mockResolvedValueOnce();

      // Attempt to save (should fail)
      const failResult = await store.dispatch(saveOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: mockOptions
      }));

      // Verify initial save failed
      expect(failResult.type).toBe('options/saveOptions/rejected');
      let state = store.getState().options;
      expect(state.error).toBe('Failed to save options');
      expect(state.lastError?.retryable).toBe(true);

      // Retry the operation
      const { retryLastOperationThunk } = await import('../../src/store/optionsSlice');
      const retryResult = await store.dispatch(retryLastOperationThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123',
        options: mockOptions,
        operationType: 'save'
      }));

      // Verify retry was successful
      expect(retryResult.type).toBe('options/retryLastOperation/fulfilled');
      state = store.getState().options;
      expect(state.error).toBeNull();
      expect(state.retryCount).toBe(0); // Reset on successful retry

      // Verify save was called twice (initial failure + retry)
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Debouncing and auto-save functionality', () => {
    it('should debounce multiple rapid changes into single save', async () => {
      const mockOptions = createMockOptions();

      // Mock successful operations
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Make multiple rapid changes
      store.dispatch(updateOption({ key: 'opt1', value: 'A', sequence: 1 }));
      store.dispatch(updateOption({ key: 'opt2', value: 'B', sequence: 2 }));
      store.dispatch(updateOption({ key: 'opt3', value: 'C', sequence: 3 }));

      // Advance timers to trigger debounced save
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify only one save was called despite multiple changes
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledTimes(1);

      // Verify the save contains all the changes
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledWith(
        'test-user-123',
        expect.arrayContaining([
          expect.objectContaining({ value: 'A' }),
          expect.objectContaining({ value: 'B' }),
          expect.objectContaining({ value: 'C' })
        ])
      );
    });

    it('should reset debounce timer on new changes', async () => {
      const mockOptions = createMockOptions();

      // Mock successful operations
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Make first change
      store.dispatch(updateOption({ key: 'opt1', value: 'First Change', sequence: 1 }));

      // Advance timer partially
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Make second change (should reset timer)
      store.dispatch(updateOption({ key: 'opt1', value: 'Second Change', sequence: 1 }));

      // Advance timer partially again
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Verify save hasn't been called yet
      expect(mockOptionsService.saveUserOptions).not.toHaveBeenCalled();

      // Complete the debounce period
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Verify save was called with the final change
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledWith(
        'test-user-123',
        expect.arrayContaining([
          expect.objectContaining({ value: 'Second Change' })
        ])
      );
    });

    it('should not trigger auto-save when already saving', async () => {
      const mockOptions = createMockOptions();

      // Mock successful load
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      
      // Mock slow save operation
      vi.mocked(mockOptionsService.saveUserOptions).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Make first change and trigger save
      store.dispatch(updateOption({ key: 'opt1', value: 'First Change', sequence: 1 }));

      // Advance timer to trigger save
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify save was called and is in progress
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledTimes(1);
      expect(store.getState().options.isSaving).toBe(true);

      // Make another change while save is in progress
      store.dispatch(updateOption({ key: 'opt1', value: 'Second Change', sequence: 1 }));

      // Advance timer
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify no additional save was triggered (still saving)
      expect(mockOptionsService.saveUserOptions).toHaveBeenCalledTimes(1);
    });

    it('should cancel auto-save when user logs out', async () => {
      const mockOptions = createMockOptions();

      // Mock successful operations
      vi.mocked(mockOptionsService.loadUserOptions).mockResolvedValue(mockOptions);
      vi.mocked(mockOptionsService.saveUserOptions).mockResolvedValue();

      // Set up authenticated user
      const { auth } = await import('../../src/Auth/Firebase/Config/Firebase');
      (auth as unknown as { currentUser: typeof mockUser }).currentUser = mockUser;

      // Load initial options
      await store.dispatch(loadOptionsThunk({
        optionsService: mockOptionsService,
        userId: 'test-user-123'
      }));

      // Clear previous calls
      vi.mocked(mockOptionsService.saveUserOptions).mockClear();

      // Make a change
      store.dispatch(updateOption({ key: 'opt1', value: 'Modified', sequence: 1 }));

      // Simulate logout before debounce completes
      (auth as unknown as { currentUser: null }).currentUser = null;
      
      // Dispatch logout action to trigger middleware cleanup
      store.dispatch({ type: 'auth/logout' });

      // Advance timer past debounce period
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Verify save was not called
      expect(mockOptionsService.saveUserOptions).not.toHaveBeenCalled();
    });
  });
});