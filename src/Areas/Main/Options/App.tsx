import OptionsComponent from "./components/Options"; 
import ListComponent from "./components/List";
import EntryComponent from "./components/Entry";

import { Option } from "./models";
import { generateGuid, getNextSequence, shuffleWithSequence, duplicateOptionsWithSequence, reorderOptions } from "./helpers";

interface AppProps {
    options: Option[],
    disabled: boolean,
    onChange: (newOptions: Option[]) => void
}

const OptionsApp = (props: AppProps) => {

    const handleShuffle = () => {
        props.onChange(shuffleWithSequence(props.options));
    }

    const handleDuplicate = () => {
        if (props.options.length < 25) {
            props.onChange(duplicateOptionsWithSequence(props.options));
        }
    }

    const handleDelete = (deletedKey: string) => {
        const filteredOptions = props.options.filter(p => p.key !== deletedKey);
        // Reorder sequences after deletion to maintain proper ordering
        props.onChange(reorderOptions(filteredOptions));
    }

    const handleNewOrChangedOption = (option: Option) => {
        if (option.key) {
            props.onChange(
                props.options.map(p => {
                    return p.key === option.key ? 
                        { key: p.key, value: option.value, sequence: p.sequence } 
                        : p
                })
            );
        } else {
            const nextSequence = getNextSequence(props.options);
            props.onChange([...props.options, { key: generateGuid(), value: option.value, sequence: nextSequence }]); 
        }
    }

    return (
        <>
            <OptionsComponent disabled={props.disabled} onShuffle={handleShuffle} onDuplicate={handleDuplicate}></OptionsComponent>
            <ListComponent options={props.options} disabled={props.disabled} onDelete={handleDelete}></ListComponent>
            <EntryComponent disabled={props.disabled} onSubmit={handleNewOrChangedOption}></EntryComponent>
        </>
    );
}

export default OptionsApp;