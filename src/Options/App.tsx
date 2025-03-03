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
            <ListComponent options={props.options} disabled={props.disabled} onDelete={handleDelete}></ListComponent>
            <EntryComponent disabled={props.disabled} onSubmit={handleNewOrChangedOption}></EntryComponent>
        </>
    );
}