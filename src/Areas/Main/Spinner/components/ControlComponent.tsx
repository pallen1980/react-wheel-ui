import { useState } from "react";

interface ControlComponentProps {
    disabled: boolean;
    onDirectionChange: () => void,
    onStartSpin: () => void
}

export default (props: ControlComponentProps) => {
    const [direction, setDirection] = useState(true);

    const clockwiseText = direction ? "Clockwise" : "Anti-Clockwise";

    const handleDirectionChange: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();

        setDirection(!direction);

        props.onDirectionChange();
    }

    const handleStartSpin: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();

        props.onStartSpin();
    }

    return (
        <>
            <div>
                <button disabled={props.disabled} onClick={handleDirectionChange}>{clockwiseText}</button>
                <button disabled={props.disabled} onClick={handleStartSpin}>Spin!</button>
            </div>
        </>
    );
}