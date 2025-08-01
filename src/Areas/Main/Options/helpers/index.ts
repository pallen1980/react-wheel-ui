
import { Option } from '../models';

const generateGuid = () => {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        } else {
            // Fallback to another method when crypto.randomUUID is not available
            return "";
        }
    } catch {
        // Handle any errors that might occur when calling crypto.randomUUID
        return "";
    }
}

// Sequence management helper functions
const getNextSequence = (options: Option[]): number => {
    if (options.length === 0) return 1;
    return Math.max(...options.map(option => option.sequence)) + 1;
};

const reorderOptions = (options: Option[]): Option[] => {
    return [...options]
        .sort((a, b) => a.sequence - b.sequence)
        .map((option, index) => ({
            ...option,
            sequence: index + 1
        }));
};

const insertOptionAtSequence = (options: Option[], newOption: Option, targetSequence: number): Option[] => {
    const updatedOptions = options.map(option =>
        option.sequence >= targetSequence
            ? { ...option, sequence: option.sequence + 1 }
            : option
    );

    return [...updatedOptions, { ...newOption, sequence: targetSequence }];
};

const shuffleWithSequence = (options: Option[]): Option[] => {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Reassign sequence numbers after shuffle
    return shuffled.map((option, index) => ({
        ...option,
        sequence: index + 1
    }));
};

const duplicateOptionsWithSequence = (options: Option[]): Option[] => {
    const maxSequence = Math.max(...options.map(option => option.sequence));
    const duplicated = options.map((option, index) => ({
        key: generateGuid(),
        value: option.value,
        sequence: maxSequence + index + 1
    }));

    return [...options, ...duplicated];
};

export {
    generateGuid,
    getNextSequence,
    reorderOptions,
    insertOptionAtSequence,
    shuffleWithSequence,
    duplicateOptionsWithSequence
}