export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 모달 제목 */
  title?: string;
  /** 모달 내용 */
  children: React.ReactNode;
  /** 모달 크기 */
  size?: ModalSize;
  /** 백드롭 클릭 시 닫기 */
  closeOnBackdropClick?: boolean;
  /** ESC 키로 닫기 */
  closeOnEsc?: boolean;
  /** 푸터 영역 */
  footer?: React.ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

export interface ConfirmModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 확인 콜백 */
  onConfirm: () => void;
  /** 제목 */
  title: string;
  /** 메시지 */
  message: string;
  /** 확인 버튼 텍스트 */
  confirmText?: string;
  /** 취소 버튼 텍스트 */
  cancelText?: string;
  /** 위험 작업 여부 (빨간색 버튼) */
  isDangerous?: boolean;
}
