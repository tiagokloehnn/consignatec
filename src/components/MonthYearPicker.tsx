import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  MONTH_NAMES_PT,
  MONTH_NAMES_SHORT_PT,
  AVAILABLE_YEARS,
  parseMonthYearString,
  getShiftedMonthLabel,
} from '../utils/formatters';

interface MonthYearPickerProps {
  currentMonth: string;
  onMonthChange: (newMonth: string) => void;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  currentMonth,
  onMonthChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse currently active month and year
  const parsed = parseMonthYearString(currentMonth);
  const isAllMonths = currentMonth === 'all';

  // Internal year state for the picker matrix
  const [pickerYear, setPickerYear] = useState<number>(() => {
    if (parsed) return parsed.year;
    return new Date().getFullYear();
  });

  // Keep picker year in sync when currentMonth changes from outside
  useEffect(() => {
    if (parsed) {
      setPickerYear(parsed.year);
    }
  }, [currentMonth]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle previous/next month direct button clicks
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllMonths) {
      // Default to current year and month
      const now = new Date();
      onMonthChange(`${MONTH_NAMES_PT[now.getMonth()]} ${now.getFullYear()}`);
      return;
    }
    const prev = getShiftedMonthLabel(currentMonth, -1);
    onMonthChange(prev);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllMonths) {
      const now = new Date();
      onMonthChange(`${MONTH_NAMES_PT[now.getMonth()]} ${now.getFullYear()}`);
      return;
    }
    const next = getShiftedMonthLabel(currentMonth, 1);
    onMonthChange(next);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const fullMonthName = MONTH_NAMES_PT[monthIndex];
    onMonthChange(`${fullMonthName} ${pickerYear}`);
    setIsOpen(false);
  };

  const handleSelectCurrentRealMonth = () => {
    const now = new Date();
    const currentM = MONTH_NAMES_PT[now.getMonth()];
    const currentY = now.getFullYear();
    setPickerYear(currentY);
    onMonthChange(`${currentM} ${currentY}`);
    setIsOpen(false);
  };

  const handleSelectAllMonths = () => {
    onMonthChange('all');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Navigator Bar with Left/Right chevrons & Central Compact Trigger */}
      <div className="flex items-center bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/90 p-0.5 shadow-2xs transition-colors">
        {/* Previous Month */}
        <button
          type="button"
          onClick={handlePrevMonth}
          title="Mês anterior"
          aria-label="Mês anterior"
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Center Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            isOpen
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-800 hover:bg-white hover:text-slate-900'
          }`}
          title="Clique para escolher mês e ano em lista reduzida"
        >
          <Calendar className="h-3.5 w-3.5 text-teal-700 shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-none">
            {isAllMonths ? 'Todos os Meses' : currentMonth}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-teal-800' : ''
            }`}
          />
        </button>

        {/* Next Month */}
        <button
          type="button"
          onClick={handleNextMonth}
          title="Próximo mês"
          aria-label="Próximo mês"
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Compact Popover Picker (Reduces the 36-item dropdown to a 12-month mini grid) */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 animate-fadeIn text-slate-800">
          {/* Header: Year Stepper / Selector */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Ano anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Year Selector Dropdown (Small list: only relevant years) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ano:
              </span>
              <select
                value={pickerYear}
                onChange={(e) => setPickerYear(parseInt(e.target.value, 10))}
                className="bg-slate-100 hover:bg-slate-200 font-bold text-sm text-slate-900 py-1 px-2.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
              >
                {AVAILABLE_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Próximo ano"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 12-Month Matrix Grid (Ultra-compact & fast 1-click selection) */}
          <div className="py-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Selecione o Mês ({pickerYear})
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTH_NAMES_SHORT_PT.map((shortName, index) => {
                const monthFullName = MONTH_NAMES_PT[index];
                const isSelected =
                  !isAllMonths &&
                  parsed?.month === index + 1 &&
                  parsed?.year === pickerYear;

                return (
                  <button
                    key={shortName}
                    type="button"
                    onClick={() => handleSelectMonth(index)}
                    title={`${monthFullName} de ${pickerYear}`}
                    className={`py-2 px-1 text-xs rounded-xl font-semibold transition-all text-center ${
                      isSelected
                        ? 'bg-teal-800 text-white shadow-xs font-bold ring-2 ring-teal-700/50'
                        : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-900 border border-slate-200/50'
                    }`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Shortcuts */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectCurrentRealMonth}
              className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold transition-colors flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Mês Atual</span>
            </button>

            <button
              type="button"
              onClick={handleSelectAllMonths}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                isAllMonths
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Todos os Meses</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
