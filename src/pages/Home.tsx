import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, List, Settings, Plus, LogOut, Sun, Moon, CloudSun } from 'lucide-react';
import CalendarView from '@/components/Calendar';
import VoiceButton from '@/components/VoiceButton';
import VoiceResultCard from '@/components/VoiceResultCard';
import ScheduleCard from '@/components/ScheduleCard';
import ReminderToast from '@/components/ReminderToast';
import AddScheduleModal from '@/components/AddScheduleModal';
import ScheduleDetailModal from '@/components/ScheduleDetailModal';
import { useScheduleStore } from '@/store/scheduleStore';
import { useVoiceStore } from '@/store/voiceStore';
import { useKeyStore } from '@/store/keyStore';
import { useAuthStore } from '@/store/authStore';
import { formatDateCN } from '@/utils/date';
import type { VoiceProcessResponse, Reminder as ReminderType, ScheduleEvent } from '@/types';

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: '早上好', icon: <Sun className="w-5 h-5 text-[#FF8C42]" /> };
  if (hour < 18) return { text: '下午好', icon: <CloudSun className="w-5 h-5 text-[#FF8C42]" /> };
  return { text: '晚上好', icon: <Moon className="w-5 h-5 text-[#7E57C2]" /> };
}

export default function Home() {
  const { selectedDate, schedules, fetchSchedules, getSchedulesForDate, loading } = useScheduleStore();
  const { transcript, lastResponse } = useVoiceStore();
  const { config: apiConfig } = useKeyStore();
  const { user, logout } = useAuthStore();
  const [voiceResult, setVoiceResult] = useState<VoiceProcessResponse | null>(null);
  const [reminder, setReminder] = useState<ReminderType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null);

  // 从API加载日程
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const todaySchedules = getSchedulesForDate(selectedDate);
  const greeting = getGreeting();

  const handleVoiceResult = (response: VoiceProcessResponse) => {
    setVoiceResult(response);
  };

  const handleConfirm = async () => {
    setVoiceResult(null);
    await fetchSchedules();
  };

  const handleCancel = () => {
    setVoiceResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* 桌面端侧边导航 */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 flex-col items-center
        bg-gradient-to-b from-[#1E3A5F] to-[#0F2744] py-6 gap-6 z-40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF8C42] to-[#E67330]
          flex items-center justify-center text-white font-serif font-bold text-sm shadow-lg shadow-[#FF8C42]/30">
          言
        </div>
        <nav className="flex flex-col gap-3 mt-4">
          <Link to="/" className="p-2.5 rounded-xl bg-white/15 text-white shadow-sm">
            <Calendar className="w-5 h-5" />
          </Link>
          <Link to="/schedule" className="p-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors">
            <List className="w-5 h-5" />
          </Link>
          <Link to="/settings" className="p-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
        </nav>
        <div className="mt-auto">
          <button onClick={logout}
            className="p-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="md:ml-16 pb-24 md:pb-8">
        {/* 顶部渐变导航栏 */}
        <header className="bg-gradient-to-r from-[#1E3A5F] via-[#2D5A8E] to-[#1E3A5F] text-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8C42] to-[#E67330]
                  flex items-center justify-center font-serif font-bold text-sm shadow-lg shadow-[#FF8C42]/30 md:hidden">
                  言
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {greeting.icon}
                    <h1 className="text-xl md:text-2xl font-serif font-bold">
                      {greeting.text}，{user?.email?.split('@')[0] || '用户'}
                    </h1>
                  </div>
                  <p className="text-sm text-white/60 mt-0.5">
                    {formatDateCN(selectedDate)} · {todaySchedules.length} 项日程
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl
                    bg-gradient-to-r from-[#FF8C42] to-[#E67330] text-white text-sm font-semibold
                    hover:shadow-lg hover:shadow-[#FF8C42]/30 transition-all active:scale-95">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">添加日程</span>
                </button>
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左侧：日历 + 语音交互 */}
            <div className="lg:col-span-5 space-y-6">
              <CalendarView />

              {/* 语音交互区 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF2] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF8C42] to-[#E67330] flex items-center justify-center">
                    <span className="text-white text-xs">🎙</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1E3A5F]">语音助手</h3>
                </div>
                <div className="flex flex-col items-center">
                  <VoiceButton onResult={handleVoiceResult} apiConfig={apiConfig} />

                  {transcript && !voiceResult && (
                    <div className="mt-4 w-full p-3 bg-gradient-to-r from-[#E8EDF2]/50 to-[#F0F4F8] rounded-xl">
                      <p className="text-sm text-[#2D3E50]">&ldquo;{transcript}&rdquo;</p>
                    </div>
                  )}

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
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF2] p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#1E3A5F] to-[#FF8C42]" />
                    <h3 className="text-lg font-serif font-semibold text-[#1E3A5F]">
                      今日日程
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                      bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E] text-white text-sm font-medium
                      hover:shadow-md hover:shadow-[#1E3A5F]/20 transition-all active:scale-95">
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 mx-auto border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#9BA8B7] text-sm mt-3">加载中...</p>
                  </div>
                ) : todaySchedules.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#E8EDF2] to-[#F0F4F8]
                      flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-[#9BA8B7]" />
                    </div>
                    <p className="text-[#6B7B8D] text-sm font-medium">今天没有日程安排</p>
                    <p className="text-[#C4CDD5] text-xs mt-1">试试对语音助手说"帮我记一个日程"</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF8C42] to-[#E67330]
                        text-white text-sm font-medium hover:shadow-md transition-all">
                      手动添加
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaySchedules
                      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                      .map((event) => (
                        <ScheduleCard
                          key={event.id}
                          event={event}
                          variant="timeline"
                          onClick={(e) => setDetailEvent(e)}
                        />
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

      {/* 添加日程弹窗 */}
      <AddScheduleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultDate={selectedDate}
      />

      {/* 日程详情弹窗 */}
      <ScheduleDetailModal
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        event={detailEvent}
      />
    </div>
  );
}
