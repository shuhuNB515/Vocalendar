import { MapPin, Clock, Trash2 } from 'lucide-react';
import type { ScheduleEvent } from '@/types';
import { formatTime } from '@/utils/date';
import { useScheduleStore } from '@/store/scheduleStore';

interface ScheduleCardProps {
  event: ScheduleEvent;
  variant?: 'timeline' | 'list';
}

export default function ScheduleCard({ event, variant = 'timeline' }: ScheduleCardProps) {
  const { deleteSchedule } = useScheduleStore();

  const timeStr = formatTime(event.start_time);
  const endStr = event.end_time ? formatTime(event.end_time) : null;

  if (variant === 'list') {
    return (
      <div className="group flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E8EDF2]
        hover:shadow-md hover:border-[#FF8C42]/30 transition-all duration-200">
        <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-[#1E3A5F] to-[#FF8C42] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[#1E3A5F] truncate">{event.title}</h4>
            <button
              onClick={() => deleteSchedule(event.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg
                hover:bg-[#E57373]/10 text-[#E57373] transition-all"
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
      <div className="w-px self-stretch bg-[#E8EDF2] relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full
          bg-[#FF8C42] border-2 border-white shadow-sm" />
      </div>
      <div className="flex-1 p-3 bg-white rounded-xl border border-[#E8EDF2]
        hover:shadow-md hover:border-[#FF8C42]/30 transition-all duration-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-[#2D3E50] text-sm">{event.title}</h4>
          <button
            onClick={() => deleteSchedule(event.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg
              hover:bg-[#E57373]/10 text-[#E57373] transition-all"
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
