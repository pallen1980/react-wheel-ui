import { Middleware, MiddlewareAPI, Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { 
  addOption, 
  updateOption, 
  deleteOption, 
  reorderOptions, 
  shuffleOptions, 
  setOptions,
  saveOptionsThunk,
  loadOptionsThunk
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
const DEFAULT_CONFIG: AutoSaveConfig = {
  debounceMs: 500,
  optionsService: null as any, // Will be injected when middleware is created
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
 * Check if the current user is authenticated
 */
const isUserAuthenticated = (): boolean => {
  return auth.currentUser !== null;
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
 * Create auto-save middleware with configuration
 */
export const createAutoSaveMiddleware = (config: AutoSaveConfig): Middleware => {
  const saveManager = new DebouncedSaveManager(config.debounceMs);

  return (store) => 
    (next) => 
    (action) => {
      // Process the action first
      const result = next(action);

      // Check if this action should trigger auto-save
      if (shouldTriggerAutoSave(action as UnknownAction)) {
        // Check authentication before attempting save
        if (!isUserAuthenticated()) {
          console.debug('Auto-save skipped: User not authenticated');
          return result;
        }

        // Get current state after action has been processed
        const state = store.getState();
        const { isSaving } = state.options;

        // Skip if already saving to prevent concurrent saves
        if (isSaving) {
          console.debug('Auto-save skipped: Save already in progress');
          return result;
        }

        // Schedule debounced save
        saveManager.scheduleSave(() => {
          // Double-check authentication at save time
          if (!isUserAuthenticated()) {
            console.debug('Auto-save cancelled: User no longer authenticated');
            return;
          }

          // Get fresh state at save time
          const currentState = store.getState();
          const currentOptions = currentState.options.options;

          // Dispatch save thunk with optionsService
          (store.dispatch as any)(saveOptionsThunk({
            optionsService: config.optionsService,
            options: currentOptions
          }));
        });
      }

      // Cancel pending saves when user logs out or options are cleared
      const actionWithType = action as { type: string };
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