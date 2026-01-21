/**
 * ConfirmModal Component
 *
 * 확인/취소 액션이 있는 모달
 * 삭제, 승인 등 되돌릴 수 없는 작업에 사용
 *
 * @example
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 *   title="삭제 확인"
 *   message="정말 삭제하시겠습니까?"
 *   isDangerous
 * />
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import type { ConfirmModalProps } from './Modal.types';
import { cn } from '../../utils/cn';

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  isDangerous = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all',
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100'
                : 'bg-[#5B5FED] hover:bg-[#4f53d1] text-white shadow-indigo-100'
            )}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        {isDangerous && (
          <div className="shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};
