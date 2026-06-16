import { MapPin, Clock, Trash2 } from 'lucide-react';
import type { ScheduleEvent } from '@/types';
import { formatTime } from '@/utils/date';
import { useScheduleStore } from '@/store/scheduleStore';

interface ScheduleCardProps {
  event: ScheduleEvent;
  variant?: 'timeline' | 'list';
  onClick?: (event: ScheduleEvent) => void;
}

function getTimeColor(startTime: string): string {
  const hour = new Date(startTime).getHours();
  if (hour < 12) return '#4CAF50';       // 上午绿色
  if (hour < 18) return '#FF8C42';       // 下午橙色
  return '#7E57C2';                       // 晚上紫色
}

function getTimeLabel(startTime: string): string {
  const hour = new Date(startTime).getHours();
  if (hour < 12) return '上午';
  if (hour < 18) return '下午';
  return '晚上';
}

export default function ScheduleCard({ event, variant = 'timeline', onClick }: ScheduleCardProps) {
  const { deleteSchedule } = useScheduleStore();

  const timeStr = formatTime(event.start_time);
  const endStr = event.end_time ? formatTime(event.end_time) : null;
  const color = getTimeColor(event.start_time);
  const timeLabel = getTimeLabel(event.start_time);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSchedule(event.id);
  };

  const handleClick = () => {
    onClick?.(event);
  };

  if (variant === 'list') {
    return (
      <div
        onClick={handleClick}
        className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E8EDF2]
          hover:shadow-md hover:border-[#FF8C42]/30 transition-all duration-200 cursor-pointer"
      >
        <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-semibold text-[#1E3A5F] truncate">{event.title}</h4>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ background: color }}>
                {timeLabel}
              </span>
            </div>
            <button
              onClick={handleDelete}
              className="shrink-0 p-1.5 rounded-lg hover:bg-[#E57373]/10 text-[#E57373] transition-all"
              aria-label="删除日程"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-[#6B7B8D]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeStr}{endStr ? ` - ${endStr}` : ''}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            )}
          </div>
          {event.description && (
            <p className="mt-1.5 text-xs text-[#9BA8B7] line-clamp-2">{event.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3 items-start">
      <div className="flex flex-col items-center flex-shrink-0 w-14">
        <span className="text-sm font-semibold text-[#1E3A5F]">{timeStr}</span>
        {endStr && <span className="text-xs text-[#9BA8B7]">{endStr}</span>}
      </div>
      <div className="w-px self-stretch relative" style={{ background: `${color}40` }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
          style={{ background: color }} />
      </div>
      <div
        onClick={handleClick}
        className="flex-1 p-3 bg-white rounded-xl border border-[#E8EDF2]
          hover:shadow-md hover:border-[#FF8C42]/30 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="font-medium text-[#2D3E50] text-sm truncate">{event.title}</h4>
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ background: color }}>
              {timeLabel}
            </span>
          </div>
          <button
            onClick={handleDelete}
            className="shrink-0 p-1 rounded-lg hover:bg-[#E57373]/10 text-[#E57373] transition-all"
            aria-label="删除日程"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {event.location && (
          <span className="flex items-center gap-1 mt-1 text-xs text-[#6B7B8D]">
            <MapPin className="w-3 h-3" />
            {event.location}
          </span>
        )}
      </div>
    </div>
  );
}
