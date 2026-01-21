export type InlineMessageVariant = 'error' | 'warning' | 'success' | 'info';

export interface InlineMessageProps {
  /** 메시지 타입 (error, warning, success, info) */
  variant?: InlineMessageVariant;
  /** 표시할 메시지 */
  message: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 아이콘 표시 여부 */
  showIcon?: boolean;
}
