import { create } from 'zustand';
import type { VoiceState, VoiceProcessResponse } from '@/types';
import { voiceApi } from '@/utils/api';

interface VoiceStoreState {
  voiceState: VoiceState;
  transcript: string;
  lastResponse: VoiceProcessResponse | null;
  error: string | null;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];

  startRecording: () => Promise<void>;
  stopRecording: () => void;
  processVoice: (apiKeys: { asr_api_key?: string; nlp_api_key?: string; tts_api_key?: string }) => Promise<VoiceProcessResponse | null>;
  setTranscript: (text: string) => void;
  reset: () => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const useVoiceStore = create<VoiceStoreState>((set, get) => ({
  voiceState: 'idle',
  transcript: '',
  lastResponse: null,
  error: null,
  mediaRecorder: null,
  audioChunks: [],

  startRecording: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.start();
      set({ voiceState: 'recording', mediaRecorder, audioChunks, transcript: '', error: null });
    } catch {
      set({ error: '无法访问麦克风，请检查权限设置' });
    }
  },

  stopRecording: () => {
    const { mediaRecorder } = get();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      set({ voiceState: 'processing' });
    }
  },

  processVoice: async (apiKeys) => {
    const { audioChunks } = get();
    if (audioChunks.length === 0) return null;

    try {
      set({ voiceState: 'processing' });
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioBase64 = await blobToBase64(audioBlob);

      const response = await voiceApi.process({
        audio_base64: audioBase64,
        api_keys: apiKeys,
      });

      set({
        voiceState: response.audio_response_base64 ? 'speaking' : 'idle',
        transcript: response.transcript,
        lastResponse: response,
      });

      // 如果有语音反馈，播放
      if (response.audio_response_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${response.audio_response_base64}`);
        audio.onended = () => set({ voiceState: 'idle' });
        audio.play().catch(() => set({ voiceState: 'idle' }));
      }

      return response;
    } catch (e) {
      set({ voiceState: 'idle', error: (e as Error).message });
      return null;
    }
  },

  setTranscript: (text) => set({ transcript: text }),

  reset: () => {
    const { mediaRecorder } = get();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
    set({
      voiceState: 'idle',
      transcript: '',
      lastResponse: null,
      error: null,
      mediaRecorder: null,
      audioChunks: [],
    });
  },
}));
