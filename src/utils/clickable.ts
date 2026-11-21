import type React from 'react';

export const clickable = (onActivate: () => void, label?: string) => ({
  role: 'button' as const,
  tabIndex: 0,
  'aria-label': label,
  onClick: onActivate,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  }
});
