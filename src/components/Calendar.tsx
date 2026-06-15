import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { generateCalendarDays, getMonthTitle, prevMonth, nextMonth, isSameDate } from '@/utils/date';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function Calendar() {
  const { selectedDate, setSelectedDate, schedules } = useScheduleStore();
  const [viewDate, setViewDate] = useState(new Date());

  const days = useMemo(() => {
    return generateCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  }, [viewDate]);

  // 标记有日程的日期
  const eventDates = useMemo(() => {
    const dateSet = new Set<string>();
    schedules.forEach((s) => {
      const d = new Date(s.start_time);
      dateSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dateSet;
  }, [schedules]);

  const hasEvent = (date: Date) =>
    eventDates.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF2] p-5">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(prevMonth(viewDate))}
          className="p-1.5 rounded-lg hover:bg-[#E8EDF2] transition-colors text-[#6B7B8D]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-[#1E3A5F] font-serif">
          {getMonthTitle(viewDate)}
        </h3>
        <button
          onClick={() => setViewDate(nextMonth(viewDate))}
          className="p-1.5 rounded-lg hover:bg-[#E8EDF2] transition-colors text-[#6B7B8D]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-[#9BA8B7] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const isSelected = isSameDate(day.date, selectedDate);
          const isToday = day.isToday;
          const hasEvt = hasEvent(day.date);

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day.date)}
              className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-xl
                transition-all duration-200 text-sm
                ${!day.isCurrentMonth ? 'text-[#C4CDD5]' : ''}
                ${isSelected && day.isCurrentMonth ? 'bg-[#1E3A5F] text-white shadow-md' : ''}
                ${isToday && !isSelected ? 'text-[#FF8C42] font-bold' : ''}
                ${!isSelected && day.isCurrentMonth ? 'hover:bg-[#E8EDF2] text-[#2D3E50]' : ''}
              `}
            >
              <span>{format(day.date, 'd')}</span>
              {hasEvt && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#FF8C42]'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* 今日按钮 */}
      <button
        onClick={() => {
          setSelectedDate(new Date());
          setViewDate(new Date());
        }}
        className="mt-3 w-full py-2 text-sm text-[#1E3A5F] font-medium rounded-xl
          bg-[#E8EDF2] hover:bg-[#D5DFE9] transition-colors"
      >
        回到今天
      </button>
    </div>
  );
}
