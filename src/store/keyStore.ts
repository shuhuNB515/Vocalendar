import { create } from 'zustand';
import type { ApiKeyStatus, ApiKeyConfig } from '@/types';
import { keyApi } from '@/utils/api';

interface KeyState {
  keyStatus: ApiKeyStatus;
  config: ApiKeyConfig;
  loading: boolean;
  saving: boolean;

  fetchStatus: () => Promise<void>;
  setField: (field: keyof ApiKeyConfig, value: string) => void;
  saveKeys: () => Promise<void>;
  testKey: () => Promise<string>;
}

export const useKeyStore = create<KeyState>((set, get) => ({
  keyStatus: {
    is_set: false,
    api_url: undefined,
    model_name: undefined,
  },
  config: {},
  loading: false,
  saving: false,

  fetchStatus: async () => {
    set({ loading: true });
    try {
      const status = await keyApi.getStatus();
      set({
        keyStatus: status,
        loading: false,
        config: {
          ...get().config,
          api_url: status.api_url || get().config.api_url || '',
          model_name: status.model_name || get().config.model_name || '',
        },
      });
    } catch {
      set({ loading: false });
    }
  },

  setField: (field, value) => {
    set((prev) => ({
      config: { ...prev.config, [field]: value || undefined },
    }));
  },

  saveKeys: async () => {
    const { config } = get();
    set({ saving: true });
    try {
      await keyApi.save(config);
      set({ saving: false });
      get().fetchStatus();
    } catch {
      set({ saving: false });
    }
  },

  testKey: async () => {
    const { config } = get();
    if (!config.api_key) return '请先输入 API Key';
    try {
      const res = await keyApi.test(config as { api_url?: string; api_key: string; model_name?: string });
      return res.message;
    } catch (e) {
      return (e as Error).message;
    }
  },
}));
