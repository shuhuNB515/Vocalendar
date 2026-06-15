import { useState } from 'react';
import { Check, X, Clock, MapPin, CalendarDays } from 'lucide-react';
import type { VoiceProcessResponse } from '@/types';
import { formatDateTime } from '@/utils/date';
import { useScheduleStore } from '@/store/scheduleStore';

interface VoiceResultCardProps {
  response: VoiceProcessResponse;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function VoiceResultCard({ response, onConfirm, onCancel }: VoiceResultCardProps) {
  const { createSchedule } = useScheduleStore();
  const [confirming, setConfirming] = useState(false);
  const { intent, extracted, transcript } = response;

  const handleConfirm = async () => {
    if (intent === 'create' && extracted.datetime) {
      setConfirming(true);
      try {
        await createSchedule({
          title: extracted.title || '未命名日程',
          description: extracted.description,
          location: extracted.location,
          start_time: extracted.datetime,
          reminder_minutes: 15,
        });
      } catch {
        // 错误由 store 处理
      }
      setConfirming(false);
    }
    onConfirm();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[#E8EDF2] p-5
      animate-in slide-in-from-bottom-4 duration-300">
      {/* 识别文本 */}
      <div className="mb-4">
        <p className="text-xs text-[#9BA8B7] mb-1">语音识别</p>
        <p className="text-[#2D3E50] font-medium">&ldquo;{transcript}&rdquo;</p>
      </div>

      {/* 意图标签 */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
          ${intent === 'create' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' :
            intent === 'query' ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]' :
            intent === 'modify' ? 'bg-[#FF8C42]/10 text-[#FF8C42]' :
            intent === 'delete' ? 'bg-[#E57373]/10 text-[#E57373]' :
            'bg-[#9BA8B7]/10 text-[#9BA8B7]'}`}>
          {intent === 'create' ? '创建日程' :
           intent === 'query' ? '查询日程' :
           intent === 'modify' ? '修改日程' :
           intent === 'delete' ? '删除日程' : '未知意图'}
        </span>
      </div>

      {/* 解析结果 */}
      {intent === 'create' && (
        <div className="space-y-2.5 mb-5">
          {extracted.title && (
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-[#1E3A5F] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#9BA8B7]">事件</p>
                <p className="text-sm font-medium text-[#2D3E50]">{extracted.title}</p>
              </div>
            </div>
          )}
          {extracted.datetime && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#FF8C42] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#9BA8B7]">时间</p>
                <p className="text-sm font-medium text-[#2D3E50]">{formatDateTime(extracted.datetime)}</p>
              </div>
            </div>
          )}
          {extracted.location && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#4CAF50] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#9BA8B7]">地点</p>
                <p className="text-sm font-medium text-[#2D3E50]">{extracted.location}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 查询结果 */}
      {intent === 'query' && response.result?.events && (
        <div className="space-y-2 mb-5">
          <p className="text-sm text-[#6B7B8D]">
            找到 {response.result.events.length} 条日程
          </p>
          {response.result.events.map((evt) => (
            <div key={evt.id} className="p-2.5 bg-[#E8EDF2]/50 rounded-lg text-sm">
              <span className="font-medium text-[#2D3E50]">{evt.title}</span>
              <span className="text-[#6B7B8D] ml-2">{formatDateTime(evt.start_time)}</span>
            </div>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      {response.confirm_required && (
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
              bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E] text-white font-medium
              hover:shadow-md transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {confirming ? '保存中...' : '确认'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
              bg-[#E8EDF2] text-[#6B7B8D] font-medium
              hover:bg-[#D5DFE9] transition-all"
          >
            <X className="w-4 h-4" />
            取消
          </button>
        </div>
      )}
    </div>
  );
}
