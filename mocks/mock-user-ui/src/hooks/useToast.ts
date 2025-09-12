import { useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../components/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((
    type: ToastType,
    message: string,
    options?: {
      title?: string;
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = {
      id,
      type,
      message,
      title: options?.title,
      duration: options?.duration ?? (type === 'error' ? 0 : 5000), // Errors don't auto-dismiss
      action: options?.action,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast('success', message, options);
  }, [addToast]);

  const showError = useCallback((message: string, options?: { title?: string; action?: { label: string; onClick: () => void } }) => {
    return addToast('error', message, { ...options, duration: 0 });
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast('warning', message, options);
  }, [addToast]);

  const showInfo = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast('info', message, options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};