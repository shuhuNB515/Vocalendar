import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Trash2, CalendarDays } from 'lucide-react';
import ScheduleCard from '@/components/ScheduleCard';
import { useScheduleStore } from '@/store/scheduleStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 模拟数据
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
  {
    id: 4, user_id: 1, title: '产品评审会', description: 'V2.0 版本评审',
    location: '线上会议', start_time: '2026-06-18T10:00:00', end_time: '2026-06-18T11:30:00',
    reminder_minutes: 15, created_at: '2026-06-16T08:00:00', updated_at: '2026-06-16T08:00:00',
  },
  {
    id: 5, user_id: 1, title: '健身', description: '',
    location: '健身房', start_time: '2026-06-18T18:00:00', end_time: '2026-06-18T19:00:00',
    reminder_minutes: 10, created_at: '2026-06-16T08:00:00', updated_at: '2026-06-16T08:00:00',
  },
];

export default function Schedule() {
  const { schedules, deleteSchedule } = useScheduleStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    useScheduleStore.setState({ schedules: MOCK_SCHEDULES });
  }, []);

  // 按日期分组
  const groupedSchedules = useMemo(() => {
    const filtered = schedules.filter((s) =>
      searchQuery
        ? s.title.includes(searchQuery) ||
          s.location?.includes(searchQuery) ||
          s.description?.includes(searchQuery)
        : true
    );

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
        label: format(new Date(date), 'M月d日 EEEE', { locale: zhCN }),
        events: events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
      }));
  }, [schedules, searchQuery]);

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const batchDelete = async () => {
    for (const id of selectedIds) {
      await deleteSchedule(id);
    }
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] md:ml-16">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 pb-24">
        {/* 标题 */}
        <header className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-[#1E3A5F]">日程管理</h1>
          <p className="text-sm text-[#6B7B8D] mt-1">共 {schedules.length} 条日程</p>
        </header>

        {/* 搜索栏 */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9BA8B7]" />
          <input
            type="text"
            placeholder="搜索日程..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-[#E8EDF2]
              text-sm text-[#2D3E50] placeholder-[#C4CDD5]
              focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20
              transition-all"
          />
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds(new Set());
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
              ${selectMode ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#6B7B8D] border border-[#E8EDF2]'}`}
          >
            <Filter className="w-4 h-4" />
            {selectMode ? '取消选择' : '批量操作'}
          </button>

          {selectMode && selectedIds.size > 0 && (
            <button
              onClick={batchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                bg-[#E57373]/10 text-[#E57373] hover:bg-[#E57373]/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除 ({selectedIds.size})
            </button>
          )}
        </div>

        {/* 日程列表 */}
        {groupedSchedules.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-[#C4CDD5] mb-3" />
            <p className="text-[#9BA8B7]">没有找到匹配的日程</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedSchedules.map((group) => (
              <div key={group.date}>
                <h3 className="text-sm font-semibold text-[#6B7B8D] mb-3 px-1">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.events.map((event) => (
                    <div key={event.id} className="relative">
                      {selectMode && (
                        <button
                          onClick={() => toggleSelect(event.id)}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full border-2
                            flex items-center justify-center transition-colors
                            ${selectedIds.has(event.id)
                              ? 'bg-[#1E3A5F] border-[#1E3A5F]'
                              : 'bg-white border-[#C4CDD5]'}`}
                        >
                          {selectedIds.has(event.id) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </button>
                      )}
                      <div className={selectMode ? 'pl-8' : ''}>
                        <ScheduleCard event={event} variant="list" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
