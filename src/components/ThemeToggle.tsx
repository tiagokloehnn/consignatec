import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-300 hover:text-amber-200 shadow-xs'
          : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
      } ${className}`}
      title={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 animate-fadeIn" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 animate-fadeIn" />
      )}
      {showLabel && (
        <span className="hidden sm:inline">
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </span>
      )}
    </button>
  );
};
