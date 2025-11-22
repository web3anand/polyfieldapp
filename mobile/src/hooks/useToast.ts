import { useState, useCallback } from 'react';
import { ToastConfig } from '../components/Toast';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
    const id = `toast-${toastId++}`;
    const newToast: ToastConfig = {
      id,
      ...config,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'error', title, message, duration });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'warning', title, message, duration });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );

  const custom = useCallback(
    (config: Omit<ToastConfig, 'id'>) => {
      return showToast(config);
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    custom,
  };
};
