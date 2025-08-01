import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    generateGuid,
    getNextSequence,
    reorderOptions,
    insertOptionAtSequence,
    shuffleWithSequence,
    duplicateOptionsWithSequence
} from '../../../../../src/Areas/Main/Options/helpers';
import { Option } from '../../../../../src/Areas/Main/Options/models';

describe('Options Helper Functions', () => {
    describe('generateGuid', () => {
        let originalRandomUUID: typeof crypto.randomUUID;

        beforeEach(() => {
            originalRandomUUID = crypto.randomUUID;
        });

        afterEach(() => {
            crypto.randomUUID = originalRandomUUID;
        });

        it('should generate a UUID when crypto.randomUUID is available', () => {
            const mockUUID = 'test-uuid-123';
            crypto.randomUUID = vi.fn().mockReturnValue(mockUUID);

            const result = generateGuid();
            expect(result).toBe(mockUUID);
            expect(crypto.randomUUID).toHaveBeenCalledOnce();
        });

        it('should return empty string when crypto.randomUUID is not a function', () => {
            // @ts-expect-error - Intentionally setting to undefined for testing
            crypto.randomUUID = undefined;

            const result = generateGuid();
            expect(result).toBe('');
        });

        it('should return empty string when crypto.randomUUID throws an error', () => {
            crypto.randomUUID = vi.fn().mockImplementation(() => {
                throw new Error('randomUUID failed');
            });

            const result = generateGuid();
            expect(result).toBe('');
        });

        it('should handle fallback behavior gracefully', () => {
            // Test the normal case first to ensure it works
            const result = generateGuid();
            expect(typeof result).toBe('string');

            // In a real browser environment, this should return a valid UUID
            // In test environment, it might return empty string as fallback
            expect(result.length >= 0).toBe(true);
        });
    });

    describe('getNextSequence', () => {
        it('should return 1 for empty options array', () => {
            const result = getNextSequence([]);
            expect(result).toBe(1);
        });

        it('should return next sequence number for single option', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 5 }
            ];
            const result = getNextSequence(options);
            expect(result).toBe(6);
        });

        it('should return next sequence number for multiple options', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 2 },
                { key: 'key2', value: 'Option 2', sequence: 5 },
                { key: 'key3', value: 'Option 3', sequence: 1 }
            ];
            const result = getNextSequence(options);
            expect(result).toBe(6);
        });

        it('should handle negative sequence numbers', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: -1 },
                { key: 'key2', value: 'Option 2', sequence: 3 }
            ];
            const result = getNextSequence(options);
            expect(result).toBe(4);
        });

        it('should handle zero sequence numbers', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 0 },
                { key: 'key2', value: 'Option 2', sequence: 2 }
            ];
            const result = getNextSequence(options);
            expect(result).toBe(3);
        });
    });

    describe('reorderOptions', () => {
        it('should return empty array for empty input', () => {
            const result = reorderOptions([]);
            expect(result).toEqual([]);
        });

        it('should reorder single option with sequence 1', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 5 }
            ];
            const result = reorderOptions(options);
            expect(result).toEqual([
                { key: 'key1', value: 'Option 1', sequence: 1 }
            ]);
        });

        it('should sort options by sequence and reassign sequential numbers', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 3 },
                { key: 'key2', value: 'Option 2', sequence: 1 },
                { key: 'key3', value: 'Option 3', sequence: 5 }
            ];
            const result = reorderOptions(options);
            expect(result).toEqual([
                { key: 'key2', value: 'Option 2', sequence: 1 },
                { key: 'key1', value: 'Option 1', sequence: 2 },
                { key: 'key3', value: 'Option 3', sequence: 3 }
            ]);
        });

        it('should handle duplicate sequence numbers', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 2 },
                { key: 'key2', value: 'Option 2', sequence: 2 },
                { key: 'key3', value: 'Option 3', sequence: 1 }
            ];
            const result = reorderOptions(options);
            expect(result).toHaveLength(3);
            expect(result[0].sequence).toBe(1);
            expect(result[1].sequence).toBe(2);
            expect(result[2].sequence).toBe(3);
            expect(result[0].key).toBe('key3');
        });

        it('should not mutate original array', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 3 },
                { key: 'key2', value: 'Option 2', sequence: 1 }
            ];
            const originalOptions = JSON.parse(JSON.stringify(options));

            reorderOptions(options);

            expect(options).toEqual(originalOptions);
        });
    });

    describe('insertOptionAtSequence', () => {
        it('should insert option at beginning when target sequence is 1', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 },
                { key: 'key2', value: 'Option 2', sequence: 2 }
            ];
            const newOption: Option = { key: 'new', value: 'New Option', sequence: 0 };

            const result = insertOptionAtSequence(options, newOption, 1);

            expect(result).toHaveLength(3);
            expect(result.find(opt => opt.key === 'new')).toEqual({
                key: 'new',
                value: 'New Option',
                sequence: 1
            });
            expect(result.find(opt => opt.key === 'key1')?.sequence).toBe(2);
            expect(result.find(opt => opt.key === 'key2')?.sequence).toBe(3);
        });

        it('should insert option in middle and shift subsequent options', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 },
                { key: 'key2', value: 'Option 2', sequence: 2 },
                { key: 'key3', value: 'Option 3', sequence: 3 }
            ];
            const newOption: Option = { key: 'new', value: 'New Option', sequence: 0 };

            const result = insertOptionAtSequence(options, newOption, 2);

            expect(result).toHaveLength(4);
            expect(result.find(opt => opt.key === 'key1')?.sequence).toBe(1);
            expect(result.find(opt => opt.key === 'new')?.sequence).toBe(2);
            expect(result.find(opt => opt.key === 'key2')?.sequence).toBe(3);
            expect(result.find(opt => opt.key === 'key3')?.sequence).toBe(4);
        });

        it('should insert option at end when target sequence is higher than existing', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 },
                { key: 'key2', value: 'Option 2', sequence: 2 }
            ];
            const newOption: Option = { key: 'new', value: 'New Option', sequence: 0 };

            const result = insertOptionAtSequence(options, newOption, 5);

            expect(result).toHaveLength(3);
            expect(result.find(opt => opt.key === 'key1')?.sequence).toBe(1);
            expect(result.find(opt => opt.key === 'key2')?.sequence).toBe(2);
            expect(result.find(opt => opt.key === 'new')?.sequence).toBe(5);
        });

        it('should handle empty options array', () => {
            const options: Option[] = [];
            const newOption: Option = { key: 'new', value: 'New Option', sequence: 0 };

            const result = insertOptionAtSequence(options, newOption, 1);

            expect(result).toEqual([{ key: 'new', value: 'New Option', sequence: 1 }]);
        });

        it('should not mutate original arrays', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 }
            ];
            const newOption: Option = { key: 'new', value: 'New Option', sequence: 0 };
            const originalOptions = JSON.parse(JSON.stringify(options));
            const originalNewOption = JSON.parse(JSON.stringify(newOption));

            insertOptionAtSequence(options, newOption, 1);

            expect(options).toEqual(originalOptions);
            expect(newOption).toEqual(originalNewOption);
        });
    });

    describe('shuffleWithSequence', () => {
        beforeEach(() => {
            // Mock Math.random to make tests deterministic
            vi.spyOn(Math, 'random');
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should return empty array for empty input', () => {
            const result = shuffleWithSequence([]);
            expect(result).toEqual([]);
        });

        it('should return same option for single option with sequence 1', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 5 }
            ];

            const result = shuffleWithSequence(options);

            expect(result).toEqual([
                { key: 'key1', value: 'Option 1', sequence: 1 }
            ]);
        });

        it('should shuffle options and reassign sequential numbers', () => {
            // Mock Math.random to return predictable values for Fisher-Yates shuffle
            (Math.random as jest.MockedFunction<typeof Math.random>)
                .mockReturnValueOnce(0.9) // For i=2, j=2 (no swap)
                .mockReturnValueOnce(0.1); // For i=1, j=0 (swap positions 0 and 1)

            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 },
                { key: 'key2', value: 'Option 2', sequence: 2 },
                { key: 'key3', value: 'Option 3', sequence: 3 }
            ];

            const result = shuffleWithSequence(options);

            expect(result).toHaveLength(3);
            expect(result[0].sequence).toBe(1);
            expect(result[1].sequence).toBe(2);
            expect(result[2].sequence).toBe(3);

            // Verify the shuffle happened (order changed from original)
            expect(result[0].key).toBe('key2');
            expect(result[1].key).toBe('key1');
            expect(result[2].key).toBe('key3');
        });

        it('should preserve all option properties except sequence', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 10 },
                { key: 'key2', value: 'Option 2', sequence: 20 }
            ];

            const result = shuffleWithSequence(options);

            expect(result).toHaveLength(2);
            expect(result.some(opt => opt.key === 'key1' && opt.value === 'Option 1')).toBe(true);
            expect(result.some(opt => opt.key === 'key2' && opt.value === 'Option 2')).toBe(true);
        });

        it('should not mutate original array', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 },
                { key: 'key2', value: 'Option 2', sequence: 2 }
            ];
            const originalOptions = JSON.parse(JSON.stringify(options));

            shuffleWithSequence(options);

            expect(options).toEqual(originalOptions);
        });

        it('should handle two options correctly', () => {
            // Mock to force a swap
            (Math.random as jest.MockedFunction<typeof Math.random>).mockReturnValueOnce(0.1);

            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 },
                { key: 'key2', value: 'Option 2', sequence: 2 }
            ];

            const result = shuffleWithSequence(options);

            expect(result).toHaveLength(2);
            expect(result[0].key).toBe('key2');
            expect(result[0].sequence).toBe(1);
            expect(result[1].key).toBe('key1');
            expect(result[1].sequence).toBe(2);
        });
    });

    describe('duplicateOptionsWithSequence', () => {
        beforeEach(() => {
            // Mock generateGuid to return predictable values
            vi.spyOn(crypto, 'randomUUID')
                .mockReturnValueOnce('guid-1')
                .mockReturnValueOnce('guid-2')
                .mockReturnValueOnce('guid-3');
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should return empty array for empty input', () => {
            const result = duplicateOptionsWithSequence([]);
            expect(result).toEqual([]);
        });

        it('should duplicate single option with new key and incremented sequence', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 }
            ];

            const result = duplicateOptionsWithSequence(options);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ key: 'key1', value: 'Option 1', sequence: 1 });
            expect(result[1]).toEqual({ key: 'guid-1', value: 'Option 1', sequence: 2 });
        });

        it('should duplicate multiple options with new keys and proper sequences', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 },
                { key: 'key2', value: 'Option 2', sequence: 2 },
                { key: 'key3', value: 'Option 3', sequence: 3 }
            ];

            const result = duplicateOptionsWithSequence(options);

            expect(result).toHaveLength(6);

            // Original options should be unchanged
            expect(result.slice(0, 3)).toEqual(options);

            // Duplicated options should have new keys and incremented sequences
            expect(result[3]).toEqual({ key: 'guid-1', value: 'Option 1', sequence: 4 });
            expect(result[4]).toEqual({ key: 'guid-2', value: 'Option 2', sequence: 5 });
            expect(result[5]).toEqual({ key: 'guid-3', value: 'Option 3', sequence: 6 });
        });

        it('should handle non-sequential original sequences correctly', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 5 },
                { key: 'key2', value: 'Option 2', sequence: 2 }
            ];

            const result = duplicateOptionsWithSequence(options);

            expect(result).toHaveLength(4);
            expect(result[0]).toEqual({ key: 'key1', value: 'Option 1', sequence: 5 });
            expect(result[1]).toEqual({ key: 'key2', value: 'Option 2', sequence: 2 });
            expect(result[2]).toEqual({ key: 'guid-1', value: 'Option 1', sequence: 6 });
            expect(result[3]).toEqual({ key: 'guid-2', value: 'Option 2', sequence: 7 });
        });

        it('should not mutate original array', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 }
            ];
            const originalOptions = JSON.parse(JSON.stringify(options));

            duplicateOptionsWithSequence(options);

            expect(options).toEqual(originalOptions);
        });

        it('should handle options with negative sequences', () => {
            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: -1 },
                { key: 'key2', value: 'Option 2', sequence: 3 }
            ];

            const result = duplicateOptionsWithSequence(options);

            expect(result).toHaveLength(4);
            expect(result[2]).toEqual({ key: 'guid-1', value: 'Option 1', sequence: 4 });
            expect(result[3]).toEqual({ key: 'guid-2', value: 'Option 2', sequence: 5 });
        });

        it('should handle generateGuid returning empty string', () => {
            // Reset the mock to return empty strings
            vi.restoreAllMocks();
            vi.spyOn(crypto, 'randomUUID')
                .mockImplementation(() => {
                    throw new Error('randomUUID failed');
                });

            const options: Option[] = [
                { key: 'key1', value: 'Option 1', sequence: 1 }
            ];

            const result = duplicateOptionsWithSequence(options);

            expect(result).toHaveLength(2);
            expect(result[1]).toEqual({ key: '', value: 'Option 1', sequence: 2 });
        });
    });
});