/**
 * ToastContainer Component
 *
 * Toast 메시지들을 담는 컨테이너
 * 우측 하단에 고정되어 여러 Toast를 쌓아서 표시
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { useToastStore } from './toast.store';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
