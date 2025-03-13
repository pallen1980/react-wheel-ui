interface OptionsProps {
    disabled?: boolean;
    onShuffle: () => void;
    onDuplicate: () => void;
}

export default (props: OptionsProps) => {
    
    const handleShuffle: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        props.onShuffle();
    }

    const handleDuplicate: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        props.onDuplicate();
    }

    return (
        <>
            <button disabled={props.disabled} onClick={handleShuffle}>Shuffle</button>
            <button disabled={props.disabled} onClick={handleDuplicate}>Duplicate</button>
        </>
    )
}