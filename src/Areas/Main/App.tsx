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

    // Helper function to convert technical errors to user-friendly messages
    const getFriendlyErrorMessage = (error: string): string => {
        // Network/connection errors
        if (error.toLowerCase().includes('network') || 
            error.toLowerCase().includes('connection') ||
            error.toLowerCase().includes('fetch') ||
            error.toLowerCase().includes('cors') ||
            error.toLowerCase().includes('timeout')) {
            return "We're having trouble connecting to our servers. Please check your internet connection and try again.";
        }
        
        // Authentication errors
        if (error.toLowerCase().includes('auth') || 
            error.toLowerCase().includes('token') ||
            error.toLowerCase().includes('unauthorized') ||
            error.toLowerCase().includes('permission')) {
            return "There was an issue with your login. Please try signing in again.";
        }
        
        // Server errors
        if (error.toLowerCase().includes('server') || 
            error.toLowerCase().includes('500') ||
            error.toLowerCase().includes('internal')) {
            return "Our servers are experiencing some issues. Please try again in a few moments.";
        }
        
        // Rate limiting
        if (error.toLowerCase().includes('rate') || 
            error.toLowerCase().includes('limit') ||
            error.toLowerCase().includes('429')) {
            return "You're making requests too quickly. Please wait a moment and try again.";
        }
        
        // Generic load/save errors
        if (error.toLowerCase().includes('failed to load')) {
            return "We couldn't load your wheel options. Your changes are saved locally for now.";
        }
        
        if (error.toLowerCase().includes('failed to save')) {
            return "We couldn't save your changes right now. Don't worry, they're stored locally and we'll try again.";
        }
        
        // Default friendly message for any other technical errors
        return "Something went wrong, but don't worry - your wheel is still working! We'll try to fix this automatically.";
    };

    // Show error toast when there's an error
    useEffect(() => {
        if (error) {
            toast.error(getFriendlyErrorMessage(error));
        }
    }, [error]);

    // Sort options by sequence before displaying in spinner
    const sortedOptions = [...options].sort((a, b) => a.sequence - b.sequence);
    const displayOptions = sortedOptions.map((p: Option) => p.value);

    const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    const handleOptionsChanged = (changedOptions: Option[]) => {
        dispatch(setOptions(changedOptions));
    }

    const handleSpinStarted = () => {
        setIsSpinning(true);
    }

    const handleWin = (index: number) => {
        if (index > -1 && sortedOptions.length > index) {
            toast(`Winner! ${capitalize(sortedOptions[index].value)}`);
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
