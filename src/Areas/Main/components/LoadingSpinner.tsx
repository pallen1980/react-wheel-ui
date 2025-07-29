import './LoadingSpinner.scss';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'medium',
  className = '' 
}: LoadingSpinnerProps) => {
  return (
    <div className={`loading-spinner loading-spinner--${size} ${className}`}>
      <div className="loading-spinner__spinner"></div>
      {message && (
        <p className="loading-spinner__message">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;