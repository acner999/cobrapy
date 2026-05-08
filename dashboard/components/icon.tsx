import { CSSProperties } from 'react';

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
}

export function Icon({ name, className = '', filled = false, style }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${filled ? 'icon-fill' : ''} ${className}`} style={style}>
      {name}
    </span>
  );
}
