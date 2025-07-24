import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';

import Title from "./Title/components/TitleComponent";
import Options from "./Options/App";
import Spinner from "./Spinner/app";

import { Option } from "./Options/models";
import { generateGuid } from "./Options/helpers";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadOptionsThunk, setOptions } from "../../store/optionsSlice";
import { useAuth } from "../../Auth/AuthProvider";

import './App.scss'

function App() {
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAuth();
    const { options, isLoading, error } = useAppSelector((state) => state.options);
    const [ isSpinning, setIsSpinning ] = useState<boolean>(false);

    // Initialize with default options if no options exist and user is not authenticated
    useEffect(() => {
        if (!isAuthenticated && options.length === 0) {
            const defaultOptions: Option[] = [
                { key: generateGuid(), value: "hello", sequence: 1}, 
                { key: generateGuid(), value: "goodbye", sequence: 2}
            ];
            dispatch(setOptions(defaultOptions));
        }
    }, [isAuthenticated, options.length, dispatch]);

    // Load options when user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(loadOptionsThunk());
        }
    }, [isAuthenticated, dispatch]);

    // Show error toast when there's an error
    useEffect(() => {
        if (error) {
            toast.error(`Error: ${error}`);
        }
    }, [error]);

    const displayOptions = options.map((p: Option) => p.value);

    const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    const handleOptionsChanged = (changedOptions: Option[]) => {
        dispatch(setOptions(changedOptions));
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

            {isLoading && (
                <div className="loading-indicator">
                    <p>Loading your options...</p>
                </div>
            )}

            <div className="c-wheel">
                <div className="c-wheel__options">
                    <Options
                        options={options} 
                        disabled={isSpinning || isLoading} 
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
