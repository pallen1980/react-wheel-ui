import { describe, it, expect, beforeEach } from 'vitest';
import optionsReducer, {
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
} from './optionsSlice';
import { Option } from '../Areas/Main/Options/models';

describe('optionsSlice', () => {
  const initialState = {
    options: [],
    isLoading: false,
    isSaving: false,
    error: null,
    lastSaved: null,
  };

  const mockOptions: Option[] = [
    { key: 'option-1', value: 'First Option', sequence: 1 },
    { key: 'option-2', value: 'Second Option', sequence: 2 },
    { key: 'option-3', value: 'Third Option', sequence: 3 },
  ];

  describe('setOptions', () => {
    it('should set options and sort by sequence', () => {
      const unsortedOptions: Option[] = [
        { key: 'option-3', value: 'Third Option', sequence: 3 },
        { key: 'option-1', value: 'First Option', sequence: 1 },
        { key: 'option-2', value: 'Second Option', sequence: 2 },
      ];

      const state = optionsReducer(initialState, setOptions(unsortedOptions));

      expect(state.options).toHaveLength(3);
      expect(state.options[0].sequence).toBe(1);
      expect(state.options[1].sequence).toBe(2);
      expect(state.options[2].sequence).toBe(3);
    });

    it('should handle empty options array', () => {
      const state = optionsReducer(initialState, setOptions([]));
      expect(state.options).toEqual([]);
    });
  });

  describe('addOption', () => {
    it('should add option with proper sequence when sequence is provided', () => {
      const newOption: Option = { key: 'new-option', value: 'New Option', sequence: 5 };
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        addOption(newOption)
      );

      expect(state.options).toHaveLength(4);
      expect(state.options[3]).toEqual(newOption);
    });

    it('should add option with auto-generated sequence when sequence is not provided', () => {
      const newOption: Option = { key: 'new-option', value: 'New Option', sequence: 0 };
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        addOption(newOption)
      );

      expect(state.options).toHaveLength(4);
      expect(state.options[3].sequence).toBe(4); // Max sequence (3) + 1
    });

    it('should add option to empty array with sequence 1', () => {
      const newOption: Option = { key: 'first-option', value: 'First Option', sequence: 0 };
      const state = optionsReducer(initialState, addOption(newOption));

      expect(state.options).toHaveLength(1);
      expect(state.options[0].sequence).toBe(1);
    });
  });

  describe('updateOption', () => {
    it('should update existing option and maintain sort order', () => {
      const updatedOption: Option = { key: 'option-2', value: 'Updated Second Option', sequence: 2 };
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        updateOption(updatedOption)
      );

      expect(state.options).toHaveLength(3);
      expect(state.options[1]).toEqual(updatedOption);
    });

    it('should not add option if key does not exist', () => {
      const nonExistentOption: Option = { key: 'non-existent', value: 'Does not exist', sequence: 1 };
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        updateOption(nonExistentOption)
      );

      expect(state.options).toHaveLength(3);
      expect(state.options).toEqual(mockOptions);
    });

    it('should update option sequence and resort', () => {
      const updatedOption: Option = { key: 'option-2', value: 'Second Option', sequence: 0.5 };
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        updateOption(updatedOption)
      );

      expect(state.options[0].key).toBe('option-2');
      expect(state.options[0].sequence).toBe(0.5);
      expect(state.options[1].key).toBe('option-1');
      expect(state.options[2].key).toBe('option-3');
    });
  });

  describe('deleteOption', () => {
    it('should delete option by key and resequence remaining options', () => {
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        deleteOption('option-2')
      );

      expect(state.options).toHaveLength(2);
      expect(state.options.find(opt => opt.key === 'option-2')).toBeUndefined();
      
      // Check resequencing
      expect(state.options[0].sequence).toBe(1);
      expect(state.options[1].sequence).toBe(2);
    });

    it('should handle deleting non-existent option', () => {
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        deleteOption('non-existent')
      );

      expect(state.options).toHaveLength(3);
      expect(state.options).toEqual(mockOptions);
    });

    it('should handle deleting from empty array', () => {
      const state = optionsReducer(initialState, deleteOption('any-key'));
      expect(state.options).toEqual([]);
    });
  });

  describe('reorderOptions', () => {
    it('should reorder options and update sequences', () => {
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        reorderOptions({ fromIndex: 0, toIndex: 2 })
      );

      expect(state.options[0].key).toBe('option-2');
      expect(state.options[1].key).toBe('option-3');
      expect(state.options[2].key).toBe('option-1');
      
      // Check sequences are updated
      expect(state.options[0].sequence).toBe(1);
      expect(state.options[1].sequence).toBe(2);
      expect(state.options[2].sequence).toBe(3);
    });

    it('should handle invalid fromIndex', () => {
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        reorderOptions({ fromIndex: -1, toIndex: 1 })
      );

      expect(state.options).toEqual(mockOptions);
    });

    it('should handle invalid toIndex', () => {
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        reorderOptions({ fromIndex: 0, toIndex: 5 })
      );

      expect(state.options).toEqual(mockOptions);
    });

    it('should handle same fromIndex and toIndex', () => {
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        reorderOptions({ fromIndex: 1, toIndex: 1 })
      );

      expect(state.options).toEqual(mockOptions);
    });
  });

  describe('shuffleOptions', () => {
    it('should shuffle options and update sequences', () => {
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        shuffleOptions()
      );

      expect(state.options).toHaveLength(3);
      
      // All original options should still be present
      expect(state.options.map(opt => opt.key).sort()).toEqual(['option-1', 'option-2', 'option-3']);
      
      // Sequences should be 1, 2, 3 in order
      expect(state.options[0].sequence).toBe(1);
      expect(state.options[1].sequence).toBe(2);
      expect(state.options[2].sequence).toBe(3);
    });

    it('should handle empty options array', () => {
      const state = optionsReducer(initialState, shuffleOptions());
      expect(state.options).toEqual([]);
    });

    it('should handle single option', () => {
      const singleOption = [{ key: 'single', value: 'Single Option', sequence: 1 }];
      const state = optionsReducer(
        { ...initialState, options: singleOption },
        shuffleOptions()
      );

      expect(state.options).toEqual(singleOption);
    });
  });

  describe('clearOptions', () => {
    it('should clear all options', () => {
      const state = optionsReducer(
        { ...initialState, options: mockOptions },
        clearOptions()
      );

      expect(state.options).toEqual([]);
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true and clear error', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = optionsReducer(stateWithError, setLoading(true));

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set loading state to false without clearing error', () => {
      const stateWithError = { ...initialState, error: 'Some error', isLoading: true };
      const state = optionsReducer(stateWithError, setLoading(false));

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Some error');
    });
  });

  describe('setSaving', () => {
    it('should set saving state to true and clear error', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = optionsReducer(stateWithError, setSaving(true));

      expect(state.isSaving).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set saving state to false without clearing error', () => {
      const stateWithError = { ...initialState, error: 'Some error', isSaving: true };
      const state = optionsReducer(stateWithError, setSaving(false));

      expect(state.isSaving).toBe(false);
      expect(state.error).toBe('Some error');
    });
  });

  describe('setError', () => {
    it('should set error and clear loading states', () => {
      const loadingState = { ...initialState, isLoading: true, isSaving: true };
      const state = optionsReducer(loadingState, setError('Test error'));

      expect(state.error).toBe('Test error');
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
    });

    it('should clear error when null is passed', () => {
      const errorState = { ...initialState, error: 'Some error' };
      const state = optionsReducer(errorState, setError(null));

      expect(state.error).toBeNull();
    });
  });

  describe('setLastSaved', () => {
    it('should set lastSaved date', () => {
      const testDate = new Date('2023-01-01T12:00:00Z');
      const state = optionsReducer(initialState, setLastSaved(testDate));

      expect(state.lastSaved).toBe(testDate);
    });

    it('should clear lastSaved when null is passed', () => {
      const stateWithDate = { ...initialState, lastSaved: new Date() };
      const state = optionsReducer(stateWithDate, setLastSaved(null));

      expect(state.lastSaved).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const errorState = { ...initialState, error: 'Some error' };
      const state = optionsReducer(errorState, clearError());

      expect(state.error).toBeNull();
    });
  });
});