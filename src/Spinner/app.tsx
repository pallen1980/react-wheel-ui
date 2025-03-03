import { useState, useRef } from "react";

import SpinWheelComponent from "./components/SpinWheelComponent";

import { Direction } from "./enums";
import { DelegateFunc } from "./models";
import ControlComponent from "./components/ControlComponent";

interface AppProps {
    options?: string[],
    onWin?: (winningIndex: number) => void,
    onSpinStarted?: () => void,
}

export default (props: AppProps) => {
    const [spinDirection, setSpinDirection] = useState<Direction>(Direction.Clockwise);
    const [isSpinning, setIsSpinning] = useState<boolean>(false);

    const delegateRef = useRef<DelegateFunc>(null);

    const handleDirectionChange = () => {
        setSpinDirection(spinDirection === Direction.Clockwise ? Direction.AnitClockwise : Direction.Clockwise);
    }

    const handleStartSpin = () => {
        setIsSpinning(true);
        delegateRef.current && delegateRef.current.startSpin();

        props.onSpinStarted && props.onSpinStarted();
    }

    const handleWin = (winningIndex: number) => {
        setIsSpinning(false);

        !!props.onWin && props.onWin(winningIndex);
    }

    return (
        <>
            <SpinWheelComponent options={props.options} direction={spinDirection} onWin={handleWin} ref={delegateRef}></SpinWheelComponent>
            <ControlComponent disabled={isSpinning} onDirectionChange={handleDirectionChange} onStartSpin={handleStartSpin}></ControlComponent>
        </>
    );
}