import { useState, useImperativeHandle, forwardRef, Ref, useMemo } from "react";

import Wheel from "./WheelComponent";
import { Direction } from "../enums";
import { DelegateFunc } from "../models";

interface SpinnerProps {
  options?: string[];
  direction?: Direction;
  onWin?: (winningIndex: number) => void;
}

export default forwardRef((props: SpinnerProps, ref: Ref<DelegateFunc>) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setSpinning] = useState(false);

  const optionCount = !!props.options ? props.options.length : 0;
  const currentDirection: Direction = !!props.direction ? props.direction : Direction.Clockwise;

  const onStartSpin = () => {
    if (isSpinning)
      return;

    setSpinning(true);

    // Set the number of full rotations and calculate final rotation
    const numFullRotations = Math.random() * 5 + 5; // Between 5 and 10 full rotations
    const totalRotation = numFullRotations * 360;
    const finalRotation = (
      rotation + (currentDirection === Direction.Clockwise ? -totalRotation : totalRotation)
    ) % 360;

    const spinDuration = 6000;
    const easing = (t: number) => {
      // Ease-out cubic
      return 1 - Math.pow(1 - t, 3);
    };

    let startTime: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const t = Math.min(elapsed / spinDuration, 1);
      const easeT = easing(t);
      const currentRotation =
        rotation +
        (currentDirection === Direction.Clockwise ? -totalRotation : totalRotation) * easeT;

      setRotation(currentRotation);

      if (elapsed < spinDuration) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        determineWinner(finalRotation);
      }
    };

    requestAnimationFrame(animate);
  };

  const determineWinner = (finalRotation: number) => {
    
    const sliceAngle = 360 / optionCount; //how many degrees each sector has

    //1. remove any additional rotations past 360 degrees (finalRotation % 360)
    //2. Add on 360 degrees to avoid negative numbers
    //3. Add on 270 degrees, as the indicators is now at the top (270 degrees on from the right hand side where 0 degrees rotation starts from)
    //4. remove an additional rotations the previous 2 rotations applied (% 360)
    const normalizedRotation = ((finalRotation % 360) + 360 + 270) % 360; //top of circle (measure 3/4 round)

    //how many sliceAngles in the final rotation (that is now normalised between 0 and 359)
    //and "floor" it to remove anything right of the decimal point 
    const winningSector = Math.floor((normalizedRotation) / sliceAngle);
    
    // console.log({
    //   finalRotation: finalRotation,
    //   optionCount: optionCount,
    //   sliceAngle: sliceAngle,
    //   normalizedRotation: normalizedRotation,
    //   winningSector: winningSector
    // });

    if (props.onWin) {
      props.onWin(winningSector);
    }
  };

  useImperativeHandle(ref, () => {
    return {
      startSpin() {
        onStartSpin();
      },
    };
  }, [optionCount, currentDirection]);

  return (
    <>
      <Wheel
        options={props.options}
        rotate={rotation}
      ></Wheel>
    </>
  )
});