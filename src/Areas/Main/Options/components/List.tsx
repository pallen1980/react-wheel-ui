import OptionComponent from "./ListItem";
import { Option } from "../models";

import "../styles/ListComponent.scss";

interface ListProps {
    options: Option[];
    disabled: boolean;
    onDelete: (key: string) => void;
}

export default (props: ListProps) => {
    // Sort options by sequence to ensure proper display order
    const sortedOptions = [...props.options].sort((a, b) => a.sequence - b.sequence);

    return (
        <>
            <ul className="c-list">
                {sortedOptions.map(option => {
                    return (
                        <li
                            className="c-list__item" 
                            key={option.key}
                        >
                            <OptionComponent 
                                option={option} 
                                disabled={props.disabled}
                                onDelete={props.onDelete}
                            ></OptionComponent>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}