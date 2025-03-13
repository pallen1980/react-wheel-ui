import OptionsComponent from "./components/Options"; 
import ListComponent from "./components/List";
import EntryComponent from "./components/Entry";

import { Option } from "./models";
import { generateGuid } from "./helpers";

interface AppProps {
    options: Option[],
    disabled: boolean,
    onChange: (newOptions: Option[]) => void
}

export default (props: AppProps) => {

    function shuffleArray(array: Option[]) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
      }

    const handleShuffle = () => {
        props.onChange([...shuffleArray(props.options)]);
    }

    const handleDuplicate = () => {
        if (props.options.length < 25) {
            props.onChange([...props.options, ...props.options.map(p => { return { key: generateGuid(), value: p.value }; })]);
        }
    }

    const handleDelete = (deletedKey: string) => {
        props.onChange(
            props.options.filter(p => p.key !== deletedKey)
        );
    }

    const handleNewOrChangedOption = (option: Option) => {
        if (!!option.key) {
            props.onChange(
                props.options.map(p => {
                    return p.key === option.key ? 
                        { key: p.key, value: option.value } 
                        : p
                })
            );
        } else {
            props.onChange([...props.options, { key: generateGuid(), value: option.value }]); 
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