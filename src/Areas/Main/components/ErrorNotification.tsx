import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { clearError } from '../../../store/optionsSlice';
import RetryButton from './RetryButton';
import { errorLogger } from '../../../utils/errorLogger';

const ErrorNotification = () => {
  const dispatch = useAppDispatch();
  const { error, lastError, isOfflineMode } = useAppSelector((state) => state.options);

  // Helper function to convert technical errors to user-friendly messages
  const getFriendlyErrorMessage = (error: string, errorType?: string): string => {
    // Use error type for more specific messaging
    if (errorType === 'network') {
      if (error.toLowerCase().includes('timeout')) {
        return "The request took too long. Please check your connection and try again.";
      }
      if (error.toLowerCase().includes('fetch') || error.toLowerCase().includes('connection')) {
        return "Can't connect to our servers. Please check your internet connection.";
      }
      return "Network issue detected. Your changes are saved locally.";
    }
    
    if (errorType === 'auth') {
      return "Authentication issue. Please sign in again to sync your options.";
    }
    
    if (errorType === 'permission') {
      return "Permission denied. Please check your account access.";
    }
    
    if (errorType === 'data') {
      return "Data validation error. Some of your options may have invalid data.";
    }

    // Fallback to original logic for backward compatibility
    if (error.toLowerCase().includes('network') || 
        error.toLowerCase().includes('connection') ||
        error.toLowerCase().includes('fetch') ||
        error.toLowerCase().includes('cors') ||
        error.toLowerCase().includes('timeout')) {
      return "We're having trouble connecting to our servers. Please check your internet connection and try again.";
    }
    
    if (error.toLowerCase().includes('auth') || 
        error.toLowerCase().includes('token') ||
        error.toLowerCase().includes('unauthorized') ||
        error.toLowerCase().includes('permission')) {
      return "There was an issue with your login. Please try signing in again.";
    }
    
    if (error.toLowerCase().includes('server') || 
        error.toLowerCase().includes('500') ||
        error.toLowerCase().includes('internal')) {
      return "Our servers are experiencing some issues. Please try again in a few moments.";
    }
    
    if (error.toLowerCase().includes('rate limit') || 
        error.toLowerCase().includes('too many') ||
        error.toLowerCase().includes('429')) {
      return "You're making requests too quickly. Please wait a moment and try again.";
    }
    
    if (error.toLowerCase().includes('failed to load') || 
        error.toLowerCase().includes('unable to load')) {
      return "We couldn't load your wheel options. Your changes are saved locally for now.";
    }
    
    if (error.toLowerCase().includes('failed to save') || 
        error.toLowerCase().includes('unable to save')) {
      return "We couldn't save your changes right now. Don't worry, they're stored locally and we'll try again.";
    }
    
    return "Something went wrong, but don't worry - your wheel is still working! We'll try to fix this automatically.";
  };

  // Create custom toast content with retry button for retryable errors
  const createToastContent = (message: string, isRetryable: boolean) => {
    if (!isRetryable) {
      return message;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <RetryButton size="small" variant="outline" />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (error) {
      const friendlyMessage = getFriendlyErrorMessage(error, lastError?.type);
      const isRetryable = lastError?.retryable || false;
      
      // Log the error display for debugging
      errorLogger.logInfo(
        'Displaying error notification to user',
        'ui',
        {
          originalError: error,
          friendlyMessage,
          errorType: lastError?.type,
          isRetryable,
          isOfflineMode
        }
      );

      // Determine toast type based on error severity
      const toastType = lastError?.type === 'auth' ? 'warning' : 'error';
      const toastContent = createToastContent(friendlyMessage, isRetryable);
      
      // Show appropriate toast
      if (toastType === 'warning') {
        toast.warning(toastContent, {
          position: "top-center",
          autoClose: isRetryable ? false : 7000, // Don't auto-close retryable errors
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => {
            dispatch(clearError());
          }
        });
      } else {
        toast.error(toastContent, {
          position: "top-center",
          autoClose: isRetryable ? false : 5000, // Don't auto-close retryable errors
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => {
            dispatch(clearError());
          }
        });
      }
    }
  }, [error, lastError, isOfflineMode, dispatch]);

  // This component doesn't render anything visible
  return null;
};

export default ErrorNotification;