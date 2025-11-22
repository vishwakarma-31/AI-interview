declare module './components/ToastContainer' {
  import React from 'react';

  interface ToastContextType {
    addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
    removeToast: (id: number) => void;
  }

  export const ToastProvider: React.ComponentType<{ children: React.ReactNode }>;
  export const useToast: () => ToastContextType;
  export { ToastProvider as default };
}