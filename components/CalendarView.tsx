import React, { useState, useMemo } from 'react';
import { Entry } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  isToday
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Smile, Meh, Frown, Edit3 } from 'lucide-react';

interface CalendarViewProps {
  entries: Entry[];
  onSelectEntry: (entryId: string) => void;
  onCreateEntry: (date: Date) => void;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const getSentimentIcon = (sentiment?: string) => {
  switch (sentiment) {
    case 'positive':
      return <Smile className="w-4 h-4 text-green-500" />;
    case 'negative':
      return <Frown className="w-4 h-4 text-red-500" />;
    case 'neutral':
      return <Meh className="w-4 h-4 text-yellow-500" />;
    default:
      return null;
  }
};

const getMoodColor = (sentiment?: string) => {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    case 'negative':
      return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    case 'neutral':
      return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700';
    default:
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  }
};

export const CalendarView: React.FC<CalendarViewProps> = ({ entries, onSelectEntry, onCreateEntry }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Create a map of entries by date for quick lookup
  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    entries.forEach(entry => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);

  // Calculate calendar days including padding for proper week alignment
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days for the first week (Monday = 0, Sunday = 6)
    const startDay = getDay(monthStart);
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    
    return { days, paddingDays };
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEntries = entriesByDate.get(dateKey);
    
    if (dayEntries && dayEntries.length > 0) {
      // If there are entries, select the first one
      onSelectEntry(dayEntries[0].id);
    }
  };

  const handleCreateOnDate = (date: Date) => {
    onCreateEntry(date);
  };

  // Get entries for selected date
  const selectedDateEntries = selectedDate 
    ? entriesByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  // Statistics for current month
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const sentimentCounts = monthEntries.reduce((acc, e) => {
      if (e.sentiment) acc[e.sentiment] = (acc[e.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: monthEntries.length,
      positive: sentimentCounts.positive || 0,
      neutral: sentimentCounts.neutral || 0,
      negative: sentimentCounts.negative || 0,
    };
  }, [entries, currentMonth]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-100">日历视图</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">以日历形式浏览你的日记</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
                </h2>
                <button
                  onClick={handleToday}
                  className="text-sm px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                >
                  今天
                </button>
              </div>
              
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding days */}
              {Array.from({ length: calendarDays.paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square p-1" />
              ))}
              
              {/* Actual days */}
              {calendarDays.days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEntries = entriesByDate.get(dateKey) || [];
                const hasEntries = dayEntries.length > 0;
                const primaryEntry = dayEntries[0];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={dateKey}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square p-1 rounded-xl transition-all relative group ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                        : ''
                    }`}
                  >
                    <div
                      className={`w-full h-full rounded-lg border-2 flex flex-col items-center justify-center transition-colors ${
                        hasEntries
                          ? getMoodColor(primaryEntry?.sentiment)
                          : 'bg-white dark:bg-slate-800 border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                      } ${isTodayDate ? 'ring-2 ring-indigo-400' : ''}`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isTodayDate
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : hasEntries
                            ? 'text-slate-700 dark:text-slate-200'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      
                      {hasEntries && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {primaryEntry?.mood && (
                            <span className="text-xs">{primaryEntry.mood}</span>
                          )}
                          {dayEntries.length > 1 && (
                            <span className="text-[10px] text-slate-400">+{dayEntries.length - 1}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hover action button */}
                    {!hasEntries && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 className="w-4 h-4 text-indigo-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Month Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">本月统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">总日记数</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{monthStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Smile className="w-4 h-4 text-green-500" /> 积极
                  </span>
                  <span className="font-semibold text-green-600">{monthStats.positive}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Meh className="w-4 h-4 text-yellow-500" /> 中性
                  </span>
                  <span className="font-semibold text-yellow-600">{monthStats.neutral}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Frown className="w-4 h-4 text-red-500" /> 消极
                  </span>
                  <span className="font-semibold text-red-600">{monthStats.negative}</span>
                </div>
              </div>
            </div>

            {/* Selected Date Entries */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedDate ? format(selectedDate, 'M月d日', { locale: zhCN }) : '选择日期'}
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => handleCreateOnDate(selectedDate)}
                    className="text-sm px-3 py-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    写日记
                  </button>
                )}
              </div>

              {selectedDateEntries.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEntries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => onSelectEntry(entry.id)}
                      className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {entry.mood && <span>{entry.mood}</span>}
                            <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">
                              {entry.title || '无标题'}
                            </h4>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {entry.summary || entry.content.slice(0, 100)}
                          </p>
                        </div>
                        {getSentimentIcon(entry.sentiment)}
                      </div>
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 dark:text-slate-500 mb-4">这一天还没有日记</p>
                  <button
                    onClick={() => handleCreateOnDate(selectedDate)}
                    className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                  >
                    开始写日记
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 text-center py-8">
                  点击日历上的日期查看日记
                </p>
              )}
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4">
              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">图例</h4>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700" />
                  <span className="text-xs text-slate-500">积极</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700" />
                  <span className="text-xs text-slate-500">中性</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700" />
                  <span className="text-xs text-slate-500">消极</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
