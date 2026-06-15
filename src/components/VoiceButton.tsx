import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';
import type { VoiceState } from '@/types';

const stateConfig: Record<VoiceState, { icon: typeof Mic; label: string; color: string; ring: string }> = {
  idle: { icon: Mic, label: '点击说话', color: 'bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E]', ring: '' },
  recording: { icon: MicOff, label: '正在录音...', color: 'bg-gradient-to-br from-[#FF8C42] to-[#E67330]', ring: 'animate-pulse-ring' },
  processing: { icon: Loader2, label: '识别中...', color: 'bg-gradient-to-br from-[#4CAF50] to-[#388E3C]', ring: '' },
  speaking: { icon: Volume2, label: '播报中...', color: 'bg-gradient-to-br from-[#7C4DFF] to-[#651FFF]', ring: 'animate-pulse' },
};

interface VoiceButtonProps {
  onResult?: (response: import('@/types').VoiceProcessResponse) => void;
  apiKeys?: { asr_api_key?: string; nlp_api_key?: string; tts_api_key?: string };
}

export default function VoiceButton({ onResult, apiKeys }: VoiceButtonProps) {
  const { voiceState, startRecording, stopRecording, processVoice } = useVoiceStore();
  const config = stateConfig[voiceState];
  const Icon = config.icon;

  const handleClick = async () => {
    if (voiceState === 'idle') {
      await startRecording();
    } else if (voiceState === 'recording') {
      stopRecording();
      // 延迟处理，等待音频数据收集
      setTimeout(async () => {
        const result = await processVoice(apiKeys || {});
        if (result && onResult) onResult(result);
      }, 300);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClick}
        className={`relative w-20 h-20 rounded-full ${config.color} text-white shadow-lg
          hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95
          flex items-center justify-center ${config.ring}`}
        aria-label={config.label}
      >
        <Icon className={`w-8 h-8 ${voiceState === 'processing' ? 'animate-spin' : ''}`} />
        {voiceState === 'recording' && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#FF8C42]/30 animate-ping" />
            <span className="absolute inset-[-4px] rounded-full border-2 border-[#FF8C42]/40 animate-pulse" />
          </>
        )}
      </button>
      <span className="text-sm text-[#6B7B8D] font-medium">{config.label}</span>
    </div>
  );
}
