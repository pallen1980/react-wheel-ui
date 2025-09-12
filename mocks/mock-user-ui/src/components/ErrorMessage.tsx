import React from 'react';
import './ErrorMessage.scss';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  retryText = 'Try Again',
  className = ''
}) => {
  // Don't render if message is empty or null
  if (!message) {
    return null;
  }

  return (
    <div className={`error-message ${className}`} role="alert" aria-live="polite">
      <div className="error-content">
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <div className="error-text">
          <p>{message}</p>
        </div>
        <div className="error-actions">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="error-button dismiss-button"
              aria-label="Dismiss error message"
              title="Dismiss error"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="error-button retry-button"
              aria-label={`Retry the failed operation: ${retryText}`}
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};