import { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Bell } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import type { CreateScheduleRequest } from '@/types';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

export default function AddScheduleModal({ isOpen, onClose, defaultDate }: AddScheduleModalProps) {
  const { createSchedule } = useScheduleStore();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateScheduleRequest>({
    title: '',
    description: '',
    location: '',
    start_time: defaultDate
      ? `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}T09:00`
      : new Date().toISOString().slice(0, 16),
    end_time: '',
    reminder_minutes: 15,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await createSchedule({
        ...form,
        end_time: form.end_time || undefined,
        description: form.description || undefined,
        location: form.location || undefined,
        reminder_minutes: form.reminder_minutes || undefined,
      });
      setForm({
        title: '',
        description: '',
        location: '',
        start_time: new Date().toISOString().slice(0, 16),
        end_time: '',
        reminder_minutes: 15,
      });
      onClose();
    } catch (err) {
      console.error('创建日程失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof CreateScheduleRequest>(key: K, value: CreateScheduleRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}>
      {/* 毛玻璃背景 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl
        shadow-2xl animate-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl rounded-t-3xl sm:rounded-t-2xl
          px-6 pt-5 pb-3 border-b border-[#E8EDF2]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[#1E3A5F]">新建日程</h2>
            <button onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#F0F4F8] text-[#9BA8B7] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* 标题 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
              <Calendar className="w-4 h-4 text-[#FF8C42]" />
              日程标题
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="例如：部门例会"
              required
              className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all"
            />
          </div>

          {/* 开始时间 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
              <Clock className="w-4 h-4 text-[#4CAF50]" />
              开始时间
            </label>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => updateField('start_time', e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                text-sm text-[#2D3E50]
                focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all"
            />
          </div>

          {/* 结束时间 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
              <Clock className="w-4 h-4 text-[#9BA8B7]" />
              结束时间（可选）
            </label>
            <input
              type="datetime-local"
              value={form.end_time || ''}
              onChange={(e) => updateField('end_time', e.target.value || undefined)}
              className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                text-sm text-[#2D3E50]
                focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all"
            />
          </div>

          {/* 地点 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
              <MapPin className="w-4 h-4 text-[#E57373]" />
              地点（可选）
            </label>
            <input
              type="text"
              value={form.location || ''}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="例如：3楼会议室A"
              className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
              <FileText className="w-4 h-4 text-[#5C6BC0]" />
              描述（可选）
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="添加备注..."
              rows={3}
              className="w-full px-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-transparent
                text-sm text-[#2D3E50] placeholder-[#C4CDD5] resize-none
                focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all"
            />
          </div>

          {/* 提醒时间 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#2D3E50] mb-1.5">
              <Bell className="w-4 h-4 text-[#FF8C42]" />
              提前提醒
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 30, 60].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => updateField('reminder_minutes', min)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${form.reminder_minutes === min
                      ? 'bg-[#1E3A5F] text-white shadow-sm'
                      : 'bg-[#F0F4F8] text-[#6B7B8D] hover:bg-[#E8EDF2]'}`}
                >
                  {min >= 60 ? `${min / 60}小时` : `${min}分钟`}
                </button>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={submitting || !form.title.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E]
              text-white font-semibold text-sm
              hover:shadow-lg hover:shadow-[#1E3A5F]/20 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '创建中...' : '创建日程'}
          </button>
        </form>
      </div>
    </div>
  );
}
