import { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { 
  addOption, 
  updateOption, 
  deleteOption, 
  reorderOptions, 
  shuffleOptions, 
  setOptions,
  saveOptionsThunk,
  loadOptionsThunk,
  setOfflineMode
} from '../optionsSlice';
import { OptionsService } from '../../services/OptionsService';
import { auth } from '../../Auth/Firebase/Config/Firebase';

/**
 * Configuration for auto-save middleware
 */
export interface AutoSaveConfig {
  debounceMs: number;
  optionsService: OptionsService;
}

/**
 * Default configuration for auto-save middleware
 */
const DEFAULT_CONFIG: Omit<AutoSaveConfig, 'optionsService'> = {
  debounceMs: 500,
};

/**
 * Debounced save function manager
 */
class DebouncedSaveManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly debounceMs: number;

  constructor(debounceMs: number) {
    this.debounceMs = debounceMs;
  }

  /**
   * Schedule a debounced save operation
   */
  scheduleSave(callback: () => void): void {
    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Schedule new save
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      callback();
    }, this.debounceMs);
  }

  /**
   * Cancel any pending save operation
   */
  cancelSave(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Check if a save is currently scheduled
   */
  hasPendingSave(): boolean {
    return this.timeoutId !== null;
  }
}

/**
 * Get current user ID from Firebase auth
 */
const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

/**
 * Check if the action should trigger an auto-save
 */
const shouldTriggerAutoSave = (action: UnknownAction): boolean => {
  // Don't trigger auto-save for load operations
  if (loadOptionsThunk.fulfilled.match(action)) {
    return false;
  }

  return (
    addOption.match(action) ||
    updateOption.match(action) ||
    deleteOption.match(action) ||
    reorderOptions.match(action) ||
    shuffleOptions.match(action) ||
    setOptions.match(action)
  );
};

/**
 * Network connectivity detection
 */
const checkNetworkConnectivity = (): boolean => {
  return navigator.onLine;
};

/**
 * Create auto-save middleware with configuration
 */
export const createAutoSaveMiddleware = (config: AutoSaveConfig): Middleware => {
  const saveManager = new DebouncedSaveManager(config.debounceMs);

  // Set up network connectivity listeners
  const handleOnline = () => {
    console.debug('Network connectivity restored');
  };

  const handleOffline = () => {
    console.debug('Network connectivity lost');
    saveManager.cancelSave();
  };

  // Add event listeners for network status
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return (store) => 
    (next) => 
    (action) => {
      // Process the action first
      const result = next(action);

      // Monitor network connectivity and update offline mode
      const actionWithType = action as { type: string };
      if (actionWithType.type === 'options/saveOptions/rejected' || 
          actionWithType.type === 'options/loadOptions/rejected') {
        // Check if we should enable offline mode based on network connectivity
        if (!checkNetworkConnectivity()) {
          store.dispatch(setOfflineMode(true));
        }
      }

      // Re-enable online mode when network is restored and operations succeed
      if (actionWithType.type === 'options/saveOptions/fulfilled' || 
          actionWithType.type === 'options/loadOptions/fulfilled') {
        const state = store.getState();
        if (state.options.isOfflineMode && checkNetworkConnectivity()) {
          store.dispatch(setOfflineMode(false));
        }
      }

      // Check if this action should trigger auto-save
      if (shouldTriggerAutoSave(action as UnknownAction)) {
        // Check authentication before attempting save
        const userId = getCurrentUserId();
        if (!userId) {
          console.debug('Auto-save skipped: User not authenticated');
          return result;
        }

        // Get current state after action has been processed
        const state = store.getState();
        const { isSaving, isOfflineMode } = state.options;

        // Skip if already saving to prevent concurrent saves
        if (isSaving) {
          console.debug('Auto-save skipped: Save already in progress');
          return result;
        }

        // Skip auto-save if in offline mode or no network connectivity
        if (isOfflineMode || !checkNetworkConnectivity()) {
          console.debug('Auto-save skipped: Application is in offline mode or no network connectivity');
          return result;
        }

        // Schedule debounced save
        saveManager.scheduleSave(() => {
          // Double-check authentication at save time
          const currentUserId = getCurrentUserId();
          if (!currentUserId) {
            console.debug('Auto-save cancelled: User no longer authenticated');
            return;
          }

          // Get fresh state at save time
          const currentState = store.getState();
          const { options: currentOptions, isOfflineMode: currentOfflineMode } = currentState.options;

          // Skip auto-save if in offline mode or no network connectivity
          if (currentOfflineMode || !checkNetworkConnectivity()) {
            console.debug('Auto-save cancelled: Application is in offline mode or no network connectivity');
            return;
          }

          // Dispatch save thunk with optionsService and userId
          (store.dispatch as any)(saveOptionsThunk({
            optionsService: config.optionsService,
            userId: currentUserId,
            options: currentOptions
          }));
        });
      }

      // Cancel pending saves when user logs out or options are cleared
      if (actionWithType.type === 'auth/logout' || actionWithType.type === 'options/clearOptions') {
        saveManager.cancelSave();
      }

      return result;
    };
};

/**
 * Create auto-save middleware with default configuration
 */
export const createDefaultAutoSaveMiddleware = (optionsService: OptionsService): Middleware => {
  return createAutoSaveMiddleware({
    ...DEFAULT_CONFIG,
    optionsService,
  });
};

/**
 * Export the debounced save manager for testing
 */
export { DebouncedSaveManager };