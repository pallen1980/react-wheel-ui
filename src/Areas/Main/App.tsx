import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';

import Title from "./Title/components/TitleComponent";
import Options from "./Options/App";
import Spinner from "./Spinner/app";
import LoadingSpinner from "./components/LoadingSpinner";
import SaveIndicator from "./components/SaveIndicator";
import ErrorNotification from "./components/ErrorNotification";
import OfflineModeIndicator from "./components/OfflineModeIndicator";
import RetryButton from "./components/RetryButton";

import { Option } from "./Options/models";
import { generateGuid } from "./Options/helpers";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadOptionsThunk, setOptions, clearOptions, setOfflineMode } from "../../store/optionsSlice";
import { useAuth } from "../../Auth/hooks";
import { logOfflineModeEnabled, logOfflineModeDisabled } from "../../utils/errorLogger";

import './App.scss'

function App() {
    const dispatch = useAppDispatch();
    const { isAuthenticated, user } = useAuth();
    const { options, isLoading, isSaving, isOfflineMode, lastError } = useAppSelector((state) => state.options);
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

    // Monitor network connectivity
    useEffect(() => {
        const handleOnline = () => {
            if (isOfflineMode) {
                logOfflineModeDisabled({ userId: user?.id });
                dispatch(setOfflineMode(false));
            }
        };

        const handleOffline = () => {
            if (!isOfflineMode) {
                logOfflineModeEnabled('Network connectivity lost', { userId: user?.id });
                dispatch(setOfflineMode(true));
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial network status
        if (!navigator.onLine && !isOfflineMode) {
            dispatch(setOfflineMode(true));
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOfflineMode, user?.id, dispatch]);

    // Handle authentication state changes
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            // User logged in - load their options
            import('../../services/HttpOptionsService').then(({ HttpOptionsService }) => {
                // Create auth token getter function
                const getAuthToken = async () => {
                    const { auth } = await import('../../Auth/Firebase/Config/Firebase');
                    const firebaseUser = auth.currentUser;
                    if (!firebaseUser) return null;
                    try {
                        return await firebaseUser.getIdToken();
                    } catch (error) {
                        console.error('Failed to get auth token:', error);
                        return null;
                    }
                };
                
                const optionsService = new HttpOptionsService(getAuthToken);
                dispatch(loadOptionsThunk({ optionsService, userId: user.id }));
            });
        } else if (!isAuthenticated) {
            // User logged out - clear options from store
            dispatch(clearOptions());
        }
    }, [isAuthenticated, user?.id, dispatch]);



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

            {/* Error notification handler */}
            <ErrorNotification />

            {/* Offline mode indicator */}
            {isAuthenticated && (
                <div className="c-wheel__status-indicators">
                    <OfflineModeIndicator className="offline-indicator" />
                    {lastError?.retryable && (
                        <RetryButton className="retry-button-main" />
                    )}
                </div>
            )}

            {/* Loading state for initial options load */}
            {isLoading && (
                <LoadingSpinner 
                    message="Loading your options..." 
                    size="medium"
                    className="initial-load-spinner"
                />
            )}

            {/* Main wheel interface - only show when not loading */}
            {!isLoading && (
                <div className="c-wheel">
                    <div className="c-wheel__options">
                        {/* Save indicator for authenticated users */}
                        {isAuthenticated && (
                            <SaveIndicator className="options-save-indicator" />
                        )}
                        
                        <Options
                            options={options} 
                            disabled={isSpinning || isSaving || (isOfflineMode && isAuthenticated)} 
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
            )}

            <ToastContainer 
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </>
    )
}

export default App
