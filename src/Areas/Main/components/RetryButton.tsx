import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { retryLastOperationThunk } from '../../../store/optionsSlice';
import { useAuth } from '../../../Auth/hooks';
import { createOptionsService } from '../../../services';
import { logRetryAttempt } from '../../../utils/errorLogger';
import './RetryButton.scss';

interface RetryButtonProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
}

const RetryButton: React.FC<RetryButtonProps> = ({ 
  className = '', 
  size = 'medium',
  variant = 'outline'
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { lastError, retryCount, options } = useAppSelector((state) => state.options);
  const [isRetrying, setIsRetrying] = useState(false);

  // Don't show retry button if no retryable error
  if (!lastError?.retryable) {
    return null;
  }

  const handleRetry = async () => {
    if (!user?.id || isRetrying) return;

    setIsRetrying(true);
    
    try {
      const optionsService = createOptionsService();
      
      // Determine operation type based on error context
      const operationType = lastError.message.toLowerCase().includes('load') ? 'load' : 'save';
      
      // Log retry attempt
      logRetryAttempt(operationType, retryCount + 1, {
        userId: user.id,
        networkStatus: navigator.onLine,
        errorType: lastError.type
      });

      await dispatch(retryLastOperationThunk({
        optionsService,
        userId: user.id,
        options: operationType === 'save' ? options : undefined,
        operationType
      })).unwrap();

    } catch (error) {
      // Error handling is managed by the thunk and error notification component
      console.debug('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getButtonText = () => {
    if (isRetrying) return 'Retrying...';
    if (retryCount > 0) return `Retry (${retryCount + 1})`;
    return 'Retry';
  };

  const getButtonTitle = () => {
    const operation = lastError.message.toLowerCase().includes('load') ? 'loading' : 'saving';
    return `Retry ${operation} your options`;
  };

  return (
    <button
      className={`retry-button retry-button--${size} retry-button--${variant} ${className}`}
      onClick={handleRetry}
      disabled={isRetrying || !navigator.onLine}
      title={getButtonTitle()}
      aria-label={getButtonTitle()}
    >
      <span className="retry-button__icon" aria-hidden="true">
        {isRetrying ? '⟳' : '↻'}
      </span>
      <span className="retry-button__text">
        {getButtonText()}
      </span>
    </button>
  );
};

export default RetryButton;