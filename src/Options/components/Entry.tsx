import { useState, useRef } from "react";

import { Option } from "../models";

import "../styles/EntryComponent.scss";

interface EntryProps {
    disabled: boolean;
    initialOption?: Option;
    onSubmit: (newOption: Option) => void;
}

export default (props: EntryProps) => {
    const [ entry, setEntry ] = useState(props.initialOption ? props.initialOption.value : "");
    const inputEl = useRef<HTMLInputElement>(null);

    const isSubmitDisabled: boolean = props.disabled || entry.trim().length == 0;

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        setEntry(e.currentTarget.value);
    }

    const handleSubmitForm: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        handleSubmit();
    }

    const handleSubmitButton: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        handleSubmit();
    }

    const handleSubmit = () => {
        props.onSubmit({
            key: props.initialOption ? props.initialOption.key : "",
            value: entry
        });
        setEntry("");
    }

    return (
        <>
            <form className="c-entry" onSubmit={handleSubmitForm}>
                <input
                    className="c-entry__input" 
                    type="text" 
                    placeholder="Enter some text..." 
                    ref={inputEl} 
                    value={entry}
                    disabled={props.disabled} 
                    onChange={handleChange}
                ></input>
                <button className="c-entry__submit" disabled={isSubmitDisabled} onClick={handleSubmitButton}>Add</button>
            </form>  
        </>
    );
}