import { HTMLAttributes } from 'react';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  initials?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
