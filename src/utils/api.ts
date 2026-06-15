const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || '请求失败');
  }

  return res.json();
}

// 认证
export const authApi = {
  login: (email: string, password: string) =>
    request<import('@/types').AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    request<import('@/types').AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// 日程
export const scheduleApi = {
  list: (date?: string, range?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (range) params.set('range', range);
    const qs = params.toString();
    return request<import('@/types').ScheduleEvent[]>(`/schedules${qs ? `?${qs}` : ''}`);
  },
  create: (data: import('@/types').CreateScheduleRequest) =>
    request<import('@/types').ScheduleEvent>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: import('@/types').UpdateScheduleRequest) =>
    request<import('@/types').ScheduleEvent>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ success: boolean; message: string }>(`/schedules/${id}`, {
      method: 'DELETE',
    }),
};

// 语音处理
export const voiceApi = {
  process: (data: import('@/types').VoiceProcessRequest) =>
    request<import('@/types').VoiceProcessResponse>('/voice/process', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// API Key
export const keyApi = {
  getStatus: () => request<import('@/types').ApiKeyStatus>('/keys'),
  save: (keys: { asr_api_key?: string; nlp_api_key?: string; tts_api_key?: string }) =>
    request<{ success: boolean }>('/keys', {
      method: 'POST',
      body: JSON.stringify(keys),
    }),
  test: (keyType: string, apiKey: string) =>
    request<{ success: boolean; message: string }>('/keys/test', {
      method: 'POST',
      body: JSON.stringify({ key_type: keyType, api_key: apiKey }),
    }),
};
