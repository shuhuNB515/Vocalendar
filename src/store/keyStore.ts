import { create } from 'zustand';
import type { ApiKeyStatus } from '@/types';
import { keyApi } from '@/utils/api';

interface KeyState {
  keyStatus: ApiKeyStatus;
  asrKey: string;
  nlpKey: string;
  ttsKey: string;
  loading: boolean;
  saving: boolean;

  fetchStatus: () => Promise<void>;
  setKey: (type: 'asr' | 'nlp' | 'tts', value: string) => void;
  saveKeys: () => Promise<void>;
  testKey: (type: 'asr' | 'nlp' | 'tts') => Promise<string>;
}

export const useKeyStore = create<KeyState>((set, get) => ({
  keyStatus: { asr_api_key_set: false, nlp_api_key_set: false, tts_api_key_set: false },
  asrKey: '',
  nlpKey: '',
  ttsKey: '',
  loading: false,
  saving: false,

  fetchStatus: async () => {
    set({ loading: true });
    try {
      const status = await keyApi.getStatus();
      set({ keyStatus: status, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setKey: (type, value) => {
    if (type === 'asr') set({ asrKey: value });
    else if (type === 'nlp') set({ nlpKey: value });
    else set({ ttsKey: value });
  },

  saveKeys: async () => {
    const { asrKey, nlpKey, ttsKey } = get();
    set({ saving: true });
    try {
      const keys: Record<string, string> = {};
      if (asrKey) keys.asr_api_key = asrKey;
      if (nlpKey) keys.nlp_api_key = nlpKey;
      if (ttsKey) keys.tts_api_key = ttsKey;
      await keyApi.save(keys);
      set({ saving: false });
      get().fetchStatus();
    } catch {
      set({ saving: false });
    }
  },

  testKey: async (type) => {
    const { asrKey, nlpKey, ttsKey } = get();
    const apiKey = type === 'asr' ? asrKey : type === 'nlp' ? nlpKey : ttsKey;
    try {
      const res = await keyApi.test(type, apiKey);
      return res.message;
    } catch (e) {
      return (e as Error).message;
    }
  },
}));
