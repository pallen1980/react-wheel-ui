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
  return (
    <div className={`error-message ${className}`}>
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <p>{message}</p>
        </div>
        <div className="error-actions">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="error-button dismiss-button"
              title="Dismiss error"
            >
              ✕
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="error-button retry-button"
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};