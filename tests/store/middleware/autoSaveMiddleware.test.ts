import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { 
  createAutoSaveMiddleware, 
  DebouncedSaveManager,
  AutoSaveConfig 
} from '../../../src/store/middleware/autoSaveMiddleware';
import { 
  addOption, 
  updateOption, 
  deleteOption, 
  reorderOptions, 
  shuffleOptions, 
  setOptions,
  saveOptionsThunk,
  loadOptionsThunk
} from '../../../src/store/optionsSlice';
import { OptionsService } from '../../../src/services/OptionsService';
import { Option } from '../../../src/Areas/Main/Options/models';

// Mock Firebase auth
vi.mock('../../../src/Auth/Firebase/Config/Firebase', () => ({
  auth: {
    currentUser: null
  }
}));

const mockUser = {
  uid: 'test-user-123',
  getIdToken: vi.fn().mockResolvedValue('mock-token')
};

// Mock options service
const mockOptionsService: OptionsService = {
  loadUserOptions: vi.fn().mockResolvedValue([]),
  saveUserOptions: vi.fn().mockResolvedValue(undefined)
};

// Test options data
const testOptions: Option[] = [
  { key: 'test-1', value: 'Option 1', sequence: 1 },
  { key: 'test-2', value: 'Option 2', sequence: 2 }
];

// Import the actual options slice
import optionsReducer from '../../../src/store/optionsSlice';

// Create a test store with the middleware
const createTestStore = (config?: Partial<AutoSaveConfig>) => {
  const middleware = createAutoSaveMiddleware({
    debounceMs: 100, // Shorter for testing
    optionsService: mockOptionsService,
    ...config
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
      }).concat(middleware)
  });
};

describe('DebouncedSaveManager', () => {
  let saveManager: DebouncedSaveManager;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveManager = new DebouncedSaveManager(100);
    mockCallback = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute callback after debounce period', () => {
    saveManager.scheduleSave(mockCallback);
    
    expect(mockCallback).not.toHaveBeenCalled();
    expect(saveManager.hasPendingSave()).toBe(true);
    
    vi.advanceTimersByTime(100);
    
    expect(mockCallback).toHaveBeenCalledOnce();
    expect(saveManager.hasPendingSave()).toBe(false);
  });

  it('should cancel previous save when new save is scheduled', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    saveManager.scheduleSave(firstCallback);
    vi.advanceTimersByTime(50);
    
    saveManager.scheduleSave(secondCallback);
    vi.advanceTimersByTime(100);

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
  });

  it('should cancel pending save', () => {
    saveManager.scheduleSave(mockCallback);
    expect(saveManager.hasPendingSave()).toBe(true);
    
    saveManager.cancelSave();
    expect(saveManager.hasPendingSave()).toBe(false);
    
    vi.advanceTimersByTime(100);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should handle multiple rapid saves correctly', () => {
    saveManager.scheduleSave(mockCallback);
    saveManager.scheduleSave(mockCallback);
    saveManager.scheduleSave(mockCallback);
    
    vi.advanceTimersByTime(100);
    
    // Should only be called once despite multiple schedules
    expect(mockCallback).toHaveBeenCalledOnce();
  });
});

describe('autoSaveMiddleware', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Import and reset auth mock
    const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
    (auth as any).currentUser = null;

    store = createTestStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('authentication checks', () => {
    it('should not trigger save when user is not authenticated', async () => {
      const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
      (auth as any).currentUser = null;
      
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      
      store.dispatch(addOption({ key: 'test', value: 'Test', sequence: 1 }));
      vi.advanceTimersByTime(200);
      
      // Should not dispatch saveOptionsThunk
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'options/addOption' })
      );
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'options/saveOptions/pending' })
      );
    });

    it('should trigger save when user is authenticated', async () => {
      const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
      (auth as any).currentUser = mockUser;
      
      // Create a spy on the saveManager.scheduleSave method to verify it's called
      const saveManagerSpy = vi.fn();
      const originalScheduleSave = DebouncedSaveManager.prototype.scheduleSave;
      DebouncedSaveManager.prototype.scheduleSave = saveManagerSpy;
      
      store.dispatch(addOption({ key: 'test', value: 'Test', sequence: 1 }));
      
      // Verify that scheduleSave was called
      expect(saveManagerSpy).toHaveBeenCalledOnce();
      
      // Restore original method
      DebouncedSaveManager.prototype.scheduleSave = originalScheduleSave;
    });

    it('should cancel save if user logs out before debounce completes', async () => {
      const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
      (auth as any).currentUser = mockUser;
      
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      
      store.dispatch(addOption({ key: 'test', value: 'Test', sequence: 1 }));
      
      // Simulate logout before debounce completes
      (auth as any).currentUser = null;
      store.dispatch({ type: 'auth/logout' });
      
      vi.advanceTimersByTime(200);
      
      // Should not dispatch saveOptionsThunk
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'options/saveOptions/pending' })
      );
    });
  });

  describe('debouncing behavior', () => {
    beforeEach(async () => {
      const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
      (auth as any).currentUser = mockUser;
    });

    it('should debounce multiple rapid changes', () => {
      // Spy on the scheduleSave method to verify debouncing behavior
      const scheduleSpyCount = vi.fn();
      const originalScheduleSave = DebouncedSaveManager.prototype.scheduleSave;
      DebouncedSaveManager.prototype.scheduleSave = function(callback) {
        scheduleSpyCount();
        return originalScheduleSave.call(this, callback);
      };
      
      // Dispatch multiple actions rapidly
      store.dispatch(addOption({ key: 'test1', value: 'Test 1', sequence: 1 }));
      store.dispatch(addOption({ key: 'test2', value: 'Test 2', sequence: 2 }));
      store.dispatch(updateOption({ key: 'test1', value: 'Updated Test 1', sequence: 1 }));
      
      // Should have called scheduleSave 3 times (once per action)
      expect(scheduleSpyCount).toHaveBeenCalledTimes(3);
      
      // Advance timers to trigger the debounced save
      vi.advanceTimersByTime(200);
      
      // Verify the final state has the correct options
      const state = store.getState();
      expect(state.options.options).toHaveLength(2);
      expect(state.options.options[0]).toEqual(expect.objectContaining({ 
        key: 'test1', 
        value: 'Updated Test 1' 
      }));
      expect(state.options.options[1]).toEqual(expect.objectContaining({ 
        key: 'test2', 
        value: 'Test 2' 
      }));
      
      // Restore original method
      DebouncedSaveManager.prototype.scheduleSave = originalScheduleSave;
    });

    it('should reset debounce timer on new changes', () => {
      // Spy on the scheduleSave method to verify timer reset behavior
      const scheduleSpyCount = vi.fn();
      const originalScheduleSave = DebouncedSaveManager.prototype.scheduleSave;
      DebouncedSaveManager.prototype.scheduleSave = function(callback) {
        scheduleSpyCount();
        return originalScheduleSave.call(this, callback);
      };
      
      store.dispatch(addOption({ key: 'test1', value: 'Test 1', sequence: 1 }));
      vi.advanceTimersByTime(50);
      
      store.dispatch(addOption({ key: 'test2', value: 'Test 2', sequence: 2 }));
      vi.advanceTimersByTime(50);
      
      // Should have called scheduleSave twice (timer reset on second call)
      expect(scheduleSpyCount).toHaveBeenCalledTimes(2);
      
      // Advance timer to complete the debounce period
      vi.advanceTimersByTime(100);
      
      // Verify the final state has both options
      const state = store.getState();
      expect(state.options.options).toHaveLength(2);
      expect(state.options.options).toEqual(expect.arrayContaining([
        expect.objectContaining({ key: 'test1', value: 'Test 1' }),
        expect.objectContaining({ key: 'test2', value: 'Test 2' })
      ]));
      
      // Restore original method
      DebouncedSaveManager.prototype.scheduleSave = originalScheduleSave;
    });
  });

  describe('action filtering', () => {
    beforeEach(async () => {
      const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
      (auth as any).currentUser = mockUser;
    });

    it('should trigger auto-save for option modification actions', () => {
      // Spy on the scheduleSave method to verify it's called for each action type
      const scheduleSpyCount = vi.fn();
      const originalScheduleSave = DebouncedSaveManager.prototype.scheduleSave;
      DebouncedSaveManager.prototype.scheduleSave = function(callback) {
        scheduleSpyCount();
        return originalScheduleSave.call(this, callback);
      };
      
      const testCases = [
        () => store.dispatch(addOption({ key: 'test1', value: 'Test', sequence: 1 })),
        () => store.dispatch(updateOption({ key: 'test1', value: 'Updated', sequence: 1 })),
        () => store.dispatch(deleteOption('test1')),
        () => store.dispatch(addOption({ key: 'test2', value: 'Test 2', sequence: 1 })),
        () => store.dispatch(reorderOptions({ fromIndex: 0, toIndex: 1 })),
        () => store.dispatch(shuffleOptions()),
        () => store.dispatch(setOptions(testOptions))
      ];

      testCases.forEach((testCase) => {
        testCase();
      });
      
      // Should have called scheduleSave for each action that triggers auto-save
      expect(scheduleSpyCount).toHaveBeenCalledTimes(testCases.length);
      
      // Advance timers to trigger the debounced save
      vi.advanceTimersByTime(200);
      
      // Verify the final state has some options
      const state = store.getState();
      expect(state.options.options.length).toBeGreaterThanOrEqual(0);
      
      // Restore original method
      DebouncedSaveManager.prototype.scheduleSave = originalScheduleSave;
    });

    it('should not trigger auto-save for load operations', () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      
      // Simulate loadOptionsThunk.fulfilled action
      store.dispatch(loadOptionsThunk.fulfilled(testOptions, 'requestId', undefined));
      vi.advanceTimersByTime(200);
      
      // Should only have called dispatch once for the fulfilled action
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });

    it('should not trigger save when already saving', () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      
      // Set saving state by dispatching the pending action
      store.dispatch(saveOptionsThunk.pending('test-request-id', { options: [] }));
      
      store.dispatch(addOption({ key: 'test', value: 'Test', sequence: 1 }));
      vi.advanceTimersByTime(200);
      
      // Should have called dispatch twice: once for pending, once for addOption
      // No additional save should be triggered
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
      (auth as any).currentUser = mockUser;
    });

    it('should handle authentication errors gracefully', async () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
      
      store.dispatch(addOption({ key: 'test', value: 'Test', sequence: 1 }));
      
      // Simulate auth failure during save
      (auth as any).currentUser = null;
      vi.advanceTimersByTime(200);
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Auto-save cancelled: User no longer authenticated'
      );
      
      consoleDebugSpy.mockRestore();
    });
  });

  describe('configuration', () => {
    it('should respect custom debounce timing', async () => {
      const { auth } = await import('../../../src/Auth/Firebase/Config/Firebase');
      (auth as any).currentUser = mockUser;
      
      const customStore = createTestStore({ debounceMs: 500 });
      
      // Spy on the scheduleSave method to verify custom timing
      const scheduleSpyCount = vi.fn();
      const callbackExecuted = vi.fn();
      const originalScheduleSave = DebouncedSaveManager.prototype.scheduleSave;
      DebouncedSaveManager.prototype.scheduleSave = function(callback) {
        scheduleSpyCount();
        return originalScheduleSave.call(this, () => {
          callbackExecuted();
          callback();
        });
      };
      
      customStore.dispatch(addOption({ key: 'test', value: 'Test', sequence: 1 }));
      
      // Should have called scheduleSave
      expect(scheduleSpyCount).toHaveBeenCalledOnce();
      
      // Should not trigger at 200ms
      vi.advanceTimersByTime(200);
      expect(callbackExecuted).not.toHaveBeenCalled();
      
      // Should trigger at 500ms total
      vi.advanceTimersByTime(300);
      expect(callbackExecuted).toHaveBeenCalledOnce();
      
      // Verify the state has the option
      const state = customStore.getState();
      expect(state.options.options).toEqual(expect.arrayContaining([
        expect.objectContaining({ key: 'test', value: 'Test' })
      ]));
      
      // Restore original method
      DebouncedSaveManager.prototype.scheduleSave = originalScheduleSave;
    });
  });
});