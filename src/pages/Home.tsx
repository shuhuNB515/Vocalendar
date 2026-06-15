import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, List, Settings, Plus } from 'lucide-react';
import CalendarView from '@/components/Calendar';
import VoiceButton from '@/components/VoiceButton';
import VoiceResultCard from '@/components/VoiceResultCard';
import ScheduleCard from '@/components/ScheduleCard';
import ReminderToast from '@/components/ReminderToast';
import { useScheduleStore } from '@/store/scheduleStore';
import { useVoiceStore } from '@/store/voiceStore';
import { useKeyStore } from '@/store/keyStore';
import { formatDateCN } from '@/utils/date';
import type { VoiceProcessResponse, Reminder as ReminderType } from '@/types';

// 模拟数据（开发阶段）
const MOCK_SCHEDULES = [
  {
    id: 1, user_id: 1, title: '部门例会', description: '讨论本周工作进展',
    location: '3楼会议室A', start_time: '2026-06-16T14:00:00', end_time: '2026-06-16T15:00:00',
    reminder_minutes: 10, created_at: '2026-06-16T08:00:00', updated_at: '2026-06-16T08:00:00',
  },
  {
    id: 2, user_id: 1, title: '接孩子放学', description: '',
    location: '阳光小学', start_time: '2026-06-16T16:00:00', end_time: '2026-06-16T16:30:00',
    reminder_minutes: 15, created_at: '2026-06-16T08:00:00', updated_at: '2026-06-16T08:00:00',
  },
  {
    id: 3, user_id: 1, title: '和李总谈合同', description: '准备合同草案',
    location: '星巴克', start_time: '2026-06-17T15:00:00', end_time: '2026-06-17T16:00:00',
    reminder_minutes: 30, created_at: '2026-06-16T08:00:00', updated_at: '2026-06-16T08:00:00',
  },
];

export default function Home() {
  const { selectedDate, schedules, fetchSchedules, getSchedulesForDate } = useScheduleStore();
  const { transcript, lastResponse, reset } = useVoiceStore();
  const { asrKey, nlpKey, ttsKey } = useKeyStore();
  const [voiceResult, setVoiceResult] = useState<VoiceProcessResponse | null>(null);
  const [reminder, setReminder] = useState<ReminderType | null>(null);

  // 初始化加载日程（使用模拟数据）
  useEffect(() => {
    useScheduleStore.setState({ schedules: MOCK_SCHEDULES });
  }, []);

  const todaySchedules = getSchedulesForDate(selectedDate);
  const apiKeys = { asr_api_key: asrKey, nlp_api_key: nlpKey, tts_api_key: ttsKey };

  const handleVoiceResult = (response: VoiceProcessResponse) => {
    setVoiceResult(response);
  };

  const handleConfirm = () => {
    setVoiceResult(null);
    reset();
  };

  const handleCancel = () => {
    setVoiceResult(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* 桌面端侧边导航 */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 flex-col items-center
        bg-white border-r border-[#E8EDF2] py-6 gap-6 z-40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E]
          flex items-center justify-center text-white font-serif font-bold text-sm">
          言
        </div>
        <nav className="flex flex-col gap-3 mt-4">
          <Link to="/" className="p-2.5 rounded-xl bg-[#E8EDF2] text-[#1E3A5F]">
            <Calendar className="w-5 h-5" />
          </Link>
          <Link to="/schedule" className="p-2.5 rounded-xl text-[#9BA8B7] hover:bg-[#E8EDF2] hover:text-[#6B7B8D] transition-colors">
            <List className="w-5 h-5" />
          </Link>
          <Link to="/settings" className="p-2.5 rounded-xl text-[#9BA8B7] hover:bg-[#E8EDF2] hover:text-[#6B7B8D] transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="md:ml-16 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          {/* 顶部标题 */}
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1E3A5F]">
              言程
            </h1>
            <p className="text-sm text-[#6B7B8D] mt-1">
              {formatDateCN(selectedDate)} · {todaySchedules.length} 项日程
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左侧：日历 + 语音交互 */}
            <div className="lg:col-span-5 space-y-6">
              <CalendarView />

              {/* 语音交互区 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF2] p-6">
                <h3 className="text-sm font-semibold text-[#1E3A5F] mb-4">语音助手</h3>
                <div className="flex flex-col items-center">
                  <VoiceButton onResult={handleVoiceResult} apiKeys={apiKeys} />

                  {/* 实时文本 */}
                  {transcript && !voiceResult && (
                    <div className="mt-4 w-full p-3 bg-[#E8EDF2]/50 rounded-xl">
                      <p className="text-sm text-[#2D3E50]">&ldquo;{transcript}&rdquo;</p>
                    </div>
                  )}

                  {/* 解析结果卡片 */}
                  {voiceResult && (
                    <div className="mt-4 w-full">
                      <VoiceResultCard
                        response={voiceResult}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：当日日程时间轴 */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF2] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-serif font-semibold text-[#1E3A5F]">
                    今日日程
                  </h3>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                    bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E] text-white text-sm font-medium
                    hover:shadow-md transition-all">
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>

                {todaySchedules.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#E8EDF2] flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-[#9BA8B7]" />
                    </div>
                    <p className="text-[#9BA8B7] text-sm">今天没有日程安排</p>
                    <p className="text-[#C4CDD5] text-xs mt-1">试试对语音助手说"帮我记一个日程"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaySchedules
                      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                      .map((event) => (
                        <ScheduleCard key={event.id} event={event} variant="timeline" />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 提醒浮层 */}
      {reminder && (
        <ReminderToast
          message="日程提醒"
          eventTitle={reminder.message || '即将开始'}
          time={reminder.remind_at}
          onDismiss={() => setReminder(null)}
        />
      )}

      {/* 移动端底部导航 */}
      <nav className="md:hidden">
        {/* Navbar component handles this */}
      </nav>
    </div>
  );
}
