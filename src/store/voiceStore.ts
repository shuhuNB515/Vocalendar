import { create } from 'zustand';
import type { VoiceState, VoiceProcessResponse, ApiKeyConfig } from '@/types';
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
  processVoice: (apiConfig?: ApiKeyConfig) => Promise<VoiceProcessResponse | null>;
  processText: (text: string, apiConfig?: ApiKeyConfig) => Promise<VoiceProcessResponse | null>;
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

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        set({ audioChunks, voiceState: 'processing' });
      };

      mediaRecorder.start();
      set({ mediaRecorder, audioChunks: [], voiceState: 'recording', error: null });
    } catch (err) {
      set({ error: '无法访问麦克风', voiceState: 'idle' });
    }
  },

  stopRecording: () => {
    const { mediaRecorder } = get();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  },

  processVoice: async (apiConfig?: ApiKeyConfig) => {
    const { audioChunks } = get();
    if (!audioChunks.length) return null;

    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const base64 = await blobToBase64(audioBlob);
      const response = await voiceApi.process({
        audio_base64: base64,
        api_config: apiConfig,
      });
      set({ lastResponse: response, transcript: response.transcript, voiceState: 'idle' });
      return response;
    } catch (err) {
      set({ error: (err as Error).message, voiceState: 'idle' });
      return null;
    }
  },

  processText: async (text: string, apiConfig?: ApiKeyConfig) => {
    try {
      set({ voiceState: 'processing' });
      const response = await voiceApi.process({
        text_input: text,
        api_config: apiConfig,
      });
      set({ lastResponse: response, transcript: response.transcript, voiceState: 'idle' });
      return response;
    } catch (err) {
      set({ error: (err as Error).message, voiceState: 'idle' });
      return null;
    }
  },
}));

async function blobToBase64(blob: Blob): Promise<string> {
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
