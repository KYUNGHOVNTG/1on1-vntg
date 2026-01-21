export type BannerVariant = 'info' | 'warning' | 'success' | 'error';

export interface BannerProps {
  /** 배너 타입 */
  variant?: BannerVariant;
  /** 제목 */
  title?: string;
  /** 메시지 */
  message: string;
  /** 닫기 버튼 표시 여부 */
  dismissible?: boolean;
  /** 닫기 콜백 */
  onDismiss?: () => void;
  /** 액션 버튼 */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** 아이콘 표시 여부 */
  showIcon?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}
