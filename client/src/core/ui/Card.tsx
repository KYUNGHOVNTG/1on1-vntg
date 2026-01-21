/**
 * Card Component (Skeleton)
 *
 * 콘텐츠를 담는 카드 컴포넌트
 *
 * @example
 * <Card>
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 *   <CardFooter>Footer</CardFooter>
 * </Card>
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-50 bg-gray-50/30 ${className}`}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-50 bg-gray-50/30 ${className}`}>
      {children}
    </div>
  );
};
