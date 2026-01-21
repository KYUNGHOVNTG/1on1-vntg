/**
 * Modal Component
 *
 * 화면 중앙에 표시되는 모달 다이얼로그
 * 삭제, 결제, 승인 등 고위험 작업에 사용
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="확인"
 *   footer={<Button onClick={handleSave}>저장</Button>}
 * >
 *   <p>저장하시겠습니까?</p>
 * </Modal>
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ModalProps } from './Modal.types';
import { cn } from '../../utils/cn';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  footer,
  className,
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4',
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEsc, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={closeOnBackdropClick ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={cn(
                'bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]',
                sizeClasses[size],
                className
              )}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="닫기"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
