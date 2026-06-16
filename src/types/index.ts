// 日程事件
export interface ScheduleEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  reminder_minutes?: number;
  created_at: string;
  updated_at: string;
}

// 创建日程请求
export interface CreateScheduleRequest {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  reminder_minutes?: number;
}

// 更新日程请求
export interface UpdateScheduleRequest {
  title?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  reminder_minutes?: number;
}

// API Key 配置（统一多模态）
export interface ApiKeyConfig {
  api_url?: string;
  api_key?: string;
  model_name?: string;
}

// 语音处理请求
export interface VoiceProcessRequest {
  audio_base64?: string;
  text_input?: string;
  api_config?: ApiKeyConfig;
  context?: {
    last_event_id?: number;
  };
}

// 语音处理响应
export interface VoiceProcessResponse {
  transcript: string;
  intent: 'create' | 'query' | 'modify' | 'delete' | 'unknown';
  extracted: {
    title?: string;
    datetime?: string;
    location?: string;
    description?: string;
  };
  result?: {
    events?: ScheduleEvent[];
    modified_event?: ScheduleEvent;
    deleted_ids?: number[];
  };
  audio_response_base64?: string;
  confirm_required: boolean;
}

// API Key 状态
export interface ApiKeyStatus {
  is_set: boolean;
  api_url?: string;
  model_name?: string;
}

// 用户
export interface User {
  id: number;
  email: string;
}

// 认证响应
export interface AuthResponse {
  token: string;
  user: User;
}

// 日历日期
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
}

// 语音状态
export type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking';

// 提醒
export interface Reminder {
  id: number;
  schedule_id: number;
  user_id: number;
  remind_at: string;
  is_sent: boolean;
  message?: string;
}
