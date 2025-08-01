import { useEffect, useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useAuth } from '../../../Auth/AuthProvider';
import './OfflineModeIndicator.scss';

interface OfflineModeIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({ 
  className = '',
  showWhenOnline = false
}) => {
  const { isAuthenticated } = useAuth();
  const { isOfflineMode } = useAppSelector((state) => state.options);
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);

  // Listen for network status changes
  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show indicator for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  // Show offline indicator when in offline mode or network is offline
  const shouldShowOffline = isOfflineMode || !isNetworkOnline;
  
  // Show online indicator only if explicitly requested and we're online
  const shouldShowOnline = showWhenOnline && !shouldShowOffline;

  if (!shouldShowOffline && !shouldShowOnline) {
    return null;
  }

  const getIndicatorContent = () => {
    if (!isNetworkOnline) {
      return {
        icon: '📡',
        text: 'No Internet Connection',
        subtext: 'Your changes are saved locally',
        className: 'offline-mode-indicator--network-offline'
      };
    }

    if (isOfflineMode) {
      return {
        icon: '⚠️',
        text: 'Working Offline',
        subtext: 'Unable to sync with server',
        className: 'offline-mode-indicator--app-offline'
      };
    }

    return {
      icon: '✅',
      text: 'Online',
      subtext: 'Changes are being saved',
      className: 'offline-mode-indicator--online'
    };
  };

  const { icon, text, subtext, className: statusClassName } = getIndicatorContent();

  return (
    <div className={`offline-mode-indicator ${statusClassName} ${className}`}>
      <div className="offline-mode-indicator__content">
        <span className="offline-mode-indicator__icon" aria-hidden="true">
          {icon}
        </span>
        <div className="offline-mode-indicator__text">
          <div className="offline-mode-indicator__status">
            {text}
          </div>
          <div className="offline-mode-indicator__subtext">
            {subtext}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineModeIndicator;