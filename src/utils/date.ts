import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { CalendarDay } from '@/types';

// 生成日历网格数据
export function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const start = startOfWeek(startOfMonth(new Date(year, month)), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(new Date(year, month)), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const currentMonth = new Date(year, month);

  return days.map((date) => ({
    date,
    isCurrentMonth: isSameMonth(date, currentMonth),
    isToday: isToday(date),
    hasEvents: false, // 由组件根据日程数据设置
  }));
}

// 格式化日期为中文
export function formatDateCN(date: Date): string {
  return format(date, 'M月d日 EEEE', { locale: zhCN });
}

// 格式化时间
export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'HH:mm');
}

// 格式化完整日期时间
export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy年M月d日 HH:mm', { locale: zhCN });
}

// 导航月份
export function prevMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function nextMonth(date: Date): Date {
  return addMonths(date, 1);
}

// 导航周
export function prevWeek(date: Date): Date {
  return subWeeks(date, 1);
}

export function nextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

// 判断是否同一天
export function isSameDate(d1: Date, d2: Date): boolean {
  return isSameDay(d1, d2);
}

// 获取月份标题
export function getMonthTitle(date: Date): string {
  return format(date, 'yyyy年M月', { locale: zhCN });
}

// 获取周标题
export function getWeekTitle(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })}`;
}
