import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, CalendarDays, Plus, ArrowLeft, Clock, MapPin, Tag, ChevronDown } from 'lucide-react';
import AddScheduleModal from '@/components/AddScheduleModal';
import ScheduleDetailModal from '@/components/ScheduleDetailModal';
import { useScheduleStore } from '@/store/scheduleStore';
import type { ScheduleEvent } from '@/types';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function getTimeColor(startTime: string): string {
  const hour = new Date(startTime).getHours();
  if (hour < 12) return '#4CAF50';
  if (hour < 18) return '#FF8C42';
  return '#7E57C2';
}

function getTimeBg(startTime: string): string {
  const hour = new Date(startTime).getHours();
  if (hour < 12) return 'bg-emerald-50 border-emerald-200';
  if (hour < 18) return 'bg-orange-50 border-orange-200';
  return 'bg-purple-50 border-purple-200';
}

function getTimeIcon(startTime: string): string {
  const hour = new Date(startTime).getHours();
  if (hour < 6) return '🌙';
  if (hour < 12) return '☀️';
  if (hour < 18) return '🌤️';
  return '🌆';
}

function getDateCategory(date: Date): string {
  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  return format(date, 'M月d日 EEEE', { locale: zhCN });
}

export default function Schedule() {
  const navigate = useNavigate();
  const { schedules, deleteSchedule, fetchSchedules, loading } = useScheduleStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const groupedSchedules = useMemo(() => {
    const now = new Date();
    const filtered = schedules.filter((s) => {
      const matchSearch = searchQuery
        ? s.title.includes(searchQuery) || s.location?.includes(searchQuery) || s.description?.includes(searchQuery)
        : true;
      const sDate = new Date(s.start_time);
      const matchFilter = filter === 'all'
        ? true
        : filter === 'today'
        ? isToday(sDate)
        : isThisWeek(sDate, { weekStartsOn: 1 });
      return matchSearch && matchFilter;
    });

    const groups: Record<string, typeof schedules> = {};
    filtered.forEach((s) => {
      const key = format(new Date(s.start_time), 'yyyy-MM-dd');
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, events]) => ({
        date,
        label: getDateCategory(new Date(date)),
        isToday: isToday(new Date(date)),
        events: events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
      }));
  }, [schedules, searchQuery, filter]);

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const batchDelete = async () => {
    for (const id of selectedIds) await deleteSchedule(id);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const todayCount = schedules.filter(s => isToday(new Date(s.start_time))).length;
  const weekCount = schedules.filter(s => isThisWeek(new Date(s.start_time), { weekStartsOn: 1 })).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-[#E8EDF5] to-[#F5F0FA]">
      {/* 顶部渐变区域 */}
      <header className="bg-gradient-to-br from-[#1E3A5F] via-[#2D5A8E] to-[#3A6BA5] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#FF8C42]/30" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 md:px-8 pt-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-serif font-bold">日程管理</h1>
                <p className="text-xs text-white/50 mt-0.5">共 {schedules.length} 条日程</p>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl
                bg-gradient-to-r from-[#FF8C42] to-[#E67330] text-white text-sm font-semibold
                hover:shadow-lg hover:shadow-[#FF8C42]/40 transition-all active:scale-95">
              <Plus className="w-4 h-4" />
              新建
            </button>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{schedules.length}</p>
              <p className="text-xs text-white/60">全部</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-xs text-white/60">今天</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{weekCount}</p>
              <p className="text-xs text-white/60">本周</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-3 pb-24">
        {/* 搜索 + 筛选 */}
        <div className="bg-white rounded-2xl shadow-md shadow-black/5 p-3 mb-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA8B7]" />
            <input
              type="text"
              placeholder="搜索日程标题、地点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F5F7FA] rounded-xl text-sm text-[#2D3E50]
                placeholder-[#C4CDD5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'today', 'week'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${filter === f
                    ? 'bg-[#1E3A5F] text-white shadow-sm'
                    : 'bg-[#F5F7FA] text-[#6B7B8D] hover:bg-[#E8EDF2]'}`}>
                {f === 'all' ? '全部' : f === 'today' ? '今天' : '本周'}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${selectMode ? 'bg-[#E57373]/10 text-[#E57373]' : 'bg-[#F5F7FA] text-[#6B7B8D] hover:bg-[#E8EDF2]'}`}>
              {selectMode ? '取消' : '批量操作'}
            </button>
            {selectMode && selectedIds.size > 0 && (
              <button onClick={batchDelete}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-[#E57373]/10 text-[#E57373] hover:bg-[#E57373]/20 transition-colors">
                <Trash2 className="w-3 h-3" />
                删除({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* 日程列表 */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 mx-auto border-3 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#9BA8B7] text-sm mt-4">加载中...</p>
          </div>
        ) : groupedSchedules.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#E8EDF2] to-[#F0F4F8]
              flex items-center justify-center">
              <CalendarDays className="w-10 h-10 text-[#C4CDD5]" />
            </div>
            <p className="text-[#6B7B8D] font-semibold text-lg">没有找到日程</p>
            <p className="text-[#C4CDD5] text-sm mt-1">试试创建一个新日程吧</p>
            <button onClick={() => setShowAddModal(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8C42] to-[#E67330]
                text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#FF8C42]/30 transition-all active:scale-95">
              创建日程
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedSchedules.map((group) => (
              <div key={group.date}>
                {/* 日期分组头 */}
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    {group.isToday && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FF8C42] text-white text-xs font-bold">今天</span>
                    )}
                    <h3 className="text-sm font-bold text-[#2D3E50]">{group.label}</h3>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#E8EDF2] to-transparent" />
                  <span className="text-xs text-[#C4CDD5] font-medium">{group.events.length}项</span>
                </div>

                {/* 日程卡片 */}
                <div className="space-y-2.5">
                  {group.events.map((event) => {
                    const color = getTimeColor(event.start_time);
                    const bgClass = getTimeBg(event.start_time);
                    const icon = getTimeIcon(event.start_time);
                    const timeStr = format(new Date(event.start_time), 'HH:mm');

                    return (
                      <div key={event.id}
                        onClick={() => !selectMode && setDetailEvent(event)}
                        className={`relative bg-white rounded-2xl border border-[#E8EDF2] shadow-sm
                          hover:shadow-md hover:border-[#D5DFE9] transition-all cursor-pointer
                          active:scale-[0.99] overflow-hidden`}>
                        {/* 左侧彩色条 */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />

                        <div className="flex items-center p-4 pl-5">
                          {selectMode && (
                            <button onClick={(e) => { e.stopPropagation(); toggleSelect(event.id); }}
                              className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                                ${selectedIds.has(event.id) ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'bg-white border-[#D5DFE9]'}`}>
                              {selectedIds.has(event.id) && <span className="text-white text-xs">✓</span>}
                            </button>
                          )}

                          {/* 时间标签 */}
                          <div className="flex-shrink-0 mr-4 text-center">
                            <span className="text-2xl">{icon}</span>
                            <p className="text-sm font-bold text-[#2D3E50] mt-0.5">{timeStr}</p>
                          </div>

                          {/* 内容 */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-[#2D3E50] truncate">{event.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              {event.location && (
                                <span className="flex items-center gap-1 text-xs text-[#9BA8B7]">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </span>
                              )}
                              {event.end_time && (
                                <span className="flex items-center gap-1 text-xs text-[#9BA8B7]">
                                  <Clock className="w-3 h-3" />
                                  至 {format(new Date(event.end_time), 'HH:mm')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 时段标签 */}
                          <span className="px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0"
                            style={{ background: color + '15', color: color }}>
                            {new Date(event.start_time).getHours() < 12 ? '上午' : new Date(event.start_time).getHours() < 18 ? '下午' : '晚上'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddScheduleModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <ScheduleDetailModal isOpen={!!detailEvent} onClose={() => setDetailEvent(null)} event={detailEvent} />
    </div>
  );
}
