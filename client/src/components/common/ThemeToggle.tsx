import React from 'react';

export function ThemeToggle({ theme, toggle }: { theme: string; toggle: () => void }) {
  return (
    <button className="p-2 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all" onClick={toggle} title="Toggle Dark/Light Mode">
      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}
