import { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';

import Title from "./Title/components/TitleComponent";
import Options from "./Options/App";
import Spinner from "./Spinner/app";

import { Option } from "./Options/models";

import './App.scss'
import { generateGuid } from "./Options/helpers";

function App() {
    const [ options, setOptions ] = useState<Option[]>([{ key: generateGuid(), value: "hello"}, { key: generateGuid(), value: "goodbye"}]);
    const [ isSpinning, setIsSpinning ] = useState<boolean>(false);

    const displayOptions = options.map(p => p.value);

    const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    const handleOptionsChanged = (changedOptions: Option[]) => {
        setOptions(changedOptions);
    }

    const handleSpinStarted = () => {
        setIsSpinning(true);
    }

    const handleWin = (index: number) => {
        if (index > -1 && options.length > index) {
            toast(`Winner! ${capitalize(options[index].value)}`);
        }
        setIsSpinning(false);
    }

    return (
        <>
            <Title greeting={"Wheel of Dooooooom"}></Title>

            <div className="c-wheel">
                <div className="c-wheel__options">
                    <Options
                        options={options} 
                        disabled={isSpinning} 
                        onChange={handleOptionsChanged}
                    ></Options>
                </div>
                
                <div className="c-wheel__spinner">
                    <Spinner 
                        options={displayOptions} 
                        onWin={handleWin} 
                        onSpinStarted={handleSpinStarted}
                    ></Spinner>
                </div>
            </div>

            <ToastContainer position="top-center"></ToastContainer>
        </>
    )
}

export default App
