import React from 'react';
import { AvatarProps } from './Avatar.types';
import { cn } from '../../utils/cn';

export const Avatar: React.FC<AvatarProps> = ({
  src,
  initials,
  alt = 'Avatar',
  size = 'md',
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={cn(
        'rounded-full border border-gray-200 flex items-center justify-center overflow-hidden',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
          {initials || '?'}
        </div>
      )}
    </div>
  );
};
