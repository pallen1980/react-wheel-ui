import OptionComponent from "./ListItem";
import { Option } from "../models";

import "../styles/ListComponent.scss";

interface ListProps {
    options: Option[];
    disabled: boolean;
    onDelete: (key: string) => void;
}

export default (props: ListProps) => {

    return (
        <>
            <ul className="c-list">
                {props.options.map(option => {
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