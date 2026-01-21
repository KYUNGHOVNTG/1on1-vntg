export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastProps extends Toast {
  onClose: () => void;
}
