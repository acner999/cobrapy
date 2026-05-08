'use client';
import { useEffect, useState } from 'react';
import { Icon } from './icon';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cobrapy_theme');
    const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('cobrapy_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <button onClick={toggle} aria-label="Cambiar tema"
      className="p-sm text-on-surface-variant hover:text-primary transition-colors rounded-lg">
      <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
    </button>
  );
}
