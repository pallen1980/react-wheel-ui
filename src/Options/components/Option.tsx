import { Option } from "../models";

import "../styles/OptionComponent.scss";

interface OptionProps {
    option: Option;
    disabled: boolean;
    onDelete: (key: string) => void;
}

export default (props: OptionProps) => {
    const handleDelete: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();

        props.onDelete(props.option.key);
    }

    return (
        <>
            <div className="c-option">
                <div className="c-option__label">{props.option.value}</div>
                <button className="c-option__controls" disabled={props.disabled} onClick={handleDelete}>Delete</button>
            </div>
        </>
    );
}
