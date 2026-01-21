/**
 * Breadcrumb Component
 *
 * 페이지 경로를 표시하는 브레드크럼 네비게이션
 *
 * @example
 * <Breadcrumb items={[
 *   { label: '시스템 관리', href: '/system' },
 *   { label: '코드 관리' }
 * ]} />
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/core/utils/cn';

export interface BreadcrumbItem {
  /** 표시될 레이블 */
  label: string;
  /** 링크 URL (마지막 항목은 일반적으로 생략) */
  href?: string;
}

interface BreadcrumbProps {
  /** 브레드크럼 항목 목록 */
  items: BreadcrumbItem[];
  /** 추가 CSS 클래스 */
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav className={cn('flex items-center gap-2', className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {/* 구분자 (첫 번째 항목 제외) */}
            {index > 0 && (
              <ChevronRight size={14} className="text-gray-400" />
            )}

            {/* 브레드크럼 항목 */}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'text-xs font-medium',
                  isLast ? 'text-gray-900' : 'text-gray-500'
                )}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
