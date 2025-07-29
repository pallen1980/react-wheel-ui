import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { clearError } from '../../../store/optionsSlice';

const ErrorNotification = () => {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.options);

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
    if (error.toLowerCase().includes('rate limit') || 
        error.toLowerCase().includes('too many') ||
        error.toLowerCase().includes('429')) {
      return "You're making requests too quickly. Please wait a moment and try again.";
    }
    
    // Generic load/save errors
    if (error.toLowerCase().includes('failed to load') || 
        error.toLowerCase().includes('unable to load')) {
      return "We couldn't load your wheel options. Your changes are saved locally for now.";
    }
    
    if (error.toLowerCase().includes('failed to save') || 
        error.toLowerCase().includes('unable to save')) {
      return "We couldn't save your changes right now. Don't worry, they're stored locally and we'll try again.";
    }
    
    // Default friendly message for any other technical errors
    return "Something went wrong, but don't worry - your wheel is still working! We'll try to fix this automatically.";
  };

  useEffect(() => {
    if (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      
      toast.error(friendlyMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: () => {
          // Clear the error from Redux store when toast is closed
          dispatch(clearError());
        }
      });
    }
  }, [error, dispatch]);

  // This component doesn't render anything visible
  return null;
};

export default ErrorNotification;