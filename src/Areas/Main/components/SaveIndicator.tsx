import { useAppSelector } from '../../../store/hooks';
import './SaveIndicator.scss';

interface SaveIndicatorProps {
  className?: string;
}

const SaveIndicator = ({ className = '' }: SaveIndicatorProps) => {
  const { isSaving, lastSaved, error } = useAppSelector((state) => state.options);

  if (error) {
    return (
      <div className={`save-indicator save-indicator--error ${className}`}>
        <span className="save-indicator__icon">⚠️</span>
        <span className="save-indicator__text">Save failed</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className={`save-indicator save-indicator--saving ${className}`}>
        <span className="save-indicator__spinner"></span>
        <span className="save-indicator__text">Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    const savedDate = new Date(lastSaved);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - savedDate.getTime()) / 1000);
    
    let timeText = '';
    if (diffInSeconds < 60) {
      timeText = 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      timeText = `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      timeText = `${hours}h ago`;
    } else {
      timeText = savedDate.toLocaleDateString();
    }

    return (
      <div className={`save-indicator save-indicator--saved ${className}`}>
        <span className="save-indicator__icon">✓</span>
        <span className="save-indicator__text">Saved {timeText}</span>
      </div>
    );
  }

  return null;
};

export default SaveIndicator;