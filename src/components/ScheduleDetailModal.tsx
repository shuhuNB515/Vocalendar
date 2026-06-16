import { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Bell, Trash2, Pencil, Check } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { formatDateTime, formatTime } from '@/utils/date';
import type { ScheduleEvent, UpdateScheduleRequest } from '@/types';

interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
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

export default function ScheduleDetailModal({ isOpen, onClose, event }: ScheduleDetailModalProps) {
  const { updateSchedule, deleteSchedule } = useScheduleStore();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateScheduleRequest>({});

  if (!isOpen || !event) return null;

  const color = getTimeColor(event.start_time);
  const timeLabel = getTimeLabel(event.start_time);

  const startEdit = () => {
    setForm({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time?.slice(0, 16) || '',
      reminder_minutes: event.reminder_minutes,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSchedule(event.id, {
        ...form,
        end_time: form.end_time || undefined,
        description: form.description || undefined,
        location: form.location || undefined,
      });
      setEditing(false);
    } catch (err) {
      console.error('更新失败:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSchedule(event.id);
      onClose();
    } catch (err) {
      console.error('删除失败:', err);
    } finally {
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof UpdateScheduleRequest>(key: K, value: UpdateScheduleRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl
        shadow-2xl animate-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* 顶部彩色条 */}
        <div className="h-1.5 rounded-t-3xl sm:rounded-t-2xl" style={{ background: color }} />

        {/* 头部 */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl px-6 pt-4 pb-3 border-b border-[#E8EDF2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-medium text-white" style={{ background: color }}>
                {timeLabel}
              </span>
              <h2 className="text-lg font-serif font-bold text-[#1E3A5F]">
                {editing ? '编辑日程' : '日程详情'}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving}
                    className="p-1.5 rounded-xl bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20 transition-colors">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="p-1.5 rounded-xl hover:bg-[#F0F4F8] text-[#9BA8B7] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={startEdit}
                    className="p-1.5 rounded-xl hover:bg-[#1E3A5F]/10 text-[#1E3A5F] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={onClose}
                    className="p-1.5 rounded-xl hover:bg-[#F0F4F8] text-[#9BA8B7] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {editing ? (
            /* 编辑模式 */
            <>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
                  <Calendar className="w-4 h-4 text-[#FF8C42]" />
                  标题
                </label>
                <input type="text" value={form.title || ''} onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                    text-sm text-[#2D3E50] focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
                  <Clock className="w-4 h-4 text-[#4CAF50]" />
                  开始时间
                </label>
                <input type="datetime-local" value={form.start_time || ''} onChange={(e) => updateField('start_time', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                    text-sm text-[#2D3E50] focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
                  <Clock className="w-4 h-4 text-[#9BA8B7]" />
                  结束时间
                </label>
                <input type="datetime-local" value={form.end_time || ''} onChange={(e) => updateField('end_time', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                    text-sm text-[#2D3E50] focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
                  <MapPin className="w-4 h-4 text-[#E57373]" />
                  地点
                </label>
                <input type="text" value={form.location || ''} onChange={(e) => updateField('location', e.target.value)}
                  placeholder="添加地点"
                  className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                    text-sm text-[#2D3E50] placeholder-[#C4CDD5] focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
                  <FileText className="w-4 h-4 text-[#5C6BC0]" />
                  描述
                </label>
                <textarea value={form.description || ''} onChange={(e) => updateField('description', e.target.value)}
                  placeholder="添加描述" rows={3}
                  className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                    text-sm text-[#2D3E50] placeholder-[#C4CDD5] resize-none
                    focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
                  <Bell className="w-4 h-4 text-[#FF8C42]" />
                  提前提醒
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 30, 60].map((min) => (
                    <button key={min} type="button" onClick={() => updateField('reminder_minutes', min)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${form.reminder_minutes === min
                          ? 'bg-[#1E3A5F] text-white shadow-sm'
                          : 'bg-[#F0F4F8] text-[#6B7B8D] hover:bg-[#E8EDF2]'}`}>
                      {min >= 60 ? `${min / 60}小时` : `${min}分钟`}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E]
                  text-white font-semibold text-sm hover:shadow-lg transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? '保存中...' : '保存修改'}
              </button>
            </>
          ) : (
            /* 查看模式 */
            <>
              {/* 标题 */}
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#1E3A5F]">{event.title}</h3>
                  {event.description && (
                    <p className="mt-1 text-sm text-[#6B7B8D]">{event.description}</p>
                  )}
                </div>
              </div>

              {/* 时间 */}
              <div className="bg-[#F0F4F8] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#4CAF50]" />
                  <div>
                    <p className="text-sm font-medium text-[#2D3E50]">
                      {formatDateTime(event.start_time)}
                    </p>
                    {event.end_time && (
                      <p className="text-xs text-[#9BA8B7] mt-0.5">
                        至 {formatTime(event.end_time)}
                      </p>
                    )}
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#E57373]" />
                    <p className="text-sm text-[#2D3E50]">{event.location}</p>
                  </div>
                )}
                {event.reminder_minutes && (
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-[#FF8C42]" />
                    <p className="text-sm text-[#2D3E50]">
                      提前 {event.reminder_minutes >= 60 ? `${event.reminder_minutes / 60}小时` : `${event.reminder_minutes}分钟`}提醒
                    </p>
                  </div>
                )}
              </div>

              {/* 创建时间 */}
              <p className="text-xs text-[#C4CDD5] text-center">
                创建于 {formatDateTime(event.created_at)}
              </p>

              {/* 删除按钮 */}
              <button onClick={handleDelete} disabled={deleting}
                className="w-full py-2.5 rounded-xl bg-[#E57373]/10 text-[#E57373] font-medium text-sm
                  hover:bg-[#E57373]/20 transition-colors flex items-center justify-center gap-1.5
                  disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {deleting ? '删除中...' : '删除此日程'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
