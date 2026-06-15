import { create } from 'zustand';
import type { ScheduleEvent } from '@/types';
import { scheduleApi } from '@/utils/api';

interface ScheduleState {
  schedules: ScheduleEvent[];
  selectedDate: Date;
  loading: boolean;
  error: string | null;

  fetchSchedules: (date?: string, range?: string) => Promise<void>;
  createSchedule: (data: import('@/types').CreateScheduleRequest) => Promise<ScheduleEvent>;
  updateSchedule: (id: number, data: import('@/types').UpdateScheduleRequest) => Promise<void>;
  deleteSchedule: (id: number) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  getSchedulesForDate: (date: Date) => ScheduleEvent[];
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  selectedDate: new Date(),
  loading: false,
  error: null,

  fetchSchedules: async (date, range) => {
    set({ loading: true, error: null });
    try {
      const schedules = await scheduleApi.list(date, range);
      set({ schedules, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createSchedule: async (data) => {
    const event = await scheduleApi.create(data);
    set((state) => ({ schedules: [...state.schedules, event] }));
    return event;
  },

  updateSchedule: async (id, data) => {
    const updated = await scheduleApi.update(id, data);
    set((state) => ({
      schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
    }));
  },

  deleteSchedule: async (id) => {
    await scheduleApi.delete(id);
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    }));
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  getSchedulesForDate: (date) => {
    const { schedules } = get();
    return schedules.filter((s) => {
      const start = new Date(s.start_time);
      return (
        start.getFullYear() === date.getFullYear() &&
        start.getMonth() === date.getMonth() &&
        start.getDate() === date.getDate()
      );
    });
  },
}));
