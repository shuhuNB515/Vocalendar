import { useState } from 'react';
import { Mic, MicOff, Loader2, Volume2, Keyboard, Send } from 'lucide-react';
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
  apiConfig?: import('@/types').ApiKeyConfig;
}

export default function VoiceButton({ onResult, apiConfig }: VoiceButtonProps) {
  const { voiceState, startRecording, stopRecording, processVoice, processText } = useVoiceStore();
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [textProcessing, setTextProcessing] = useState(false);
  const config = stateConfig[voiceState];
  const Icon = config.icon;

  const handleClick = async () => {
    if (voiceState === 'idle') {
      await startRecording();
    } else if (voiceState === 'recording') {
      stopRecording();
      setTimeout(async () => {
        const result = await processVoice(apiConfig);
        if (result && onResult) onResult(result);
      }, 300);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setTextProcessing(true);
    try {
      const result = await processText(textInput.trim(), apiConfig);
      if (result && onResult) {
        onResult(result);
      } else if (onResult) {
        // 降级：本地简单解析
        onResult({
          transcript: textInput.trim(),
          intent: 'create',
          extracted: {
            title: textInput.trim(),
            datetime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
          },
          confirm_required: true,
        });
      }
    } catch {
      // 降级：本地简单解析
      if (onResult) {
        onResult({
          transcript: textInput.trim(),
          intent: 'create',
          extracted: {
            title: textInput.trim(),
            datetime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
          },
          confirm_required: true,
        });
      }
    }
    setTextProcessing(false);
    setTextInput('');
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 模式切换 */}
      <div className="flex items-center gap-1 p-1 bg-[#F0F4F8] rounded-xl">
        <button
          onClick={() => setMode('voice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${mode === 'voice'
              ? 'bg-white text-[#1E3A5F] shadow-sm'
              : 'text-[#9BA8B7] hover:text-[#6B7B8D]'}`}
        >
          <Mic className="w-3.5 h-3.5" />
          语音
        </button>
        <button
          onClick={() => setMode('text')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${mode === 'text'
              ? 'bg-white text-[#1E3A5F] shadow-sm'
              : 'text-[#9BA8B7] hover:text-[#6B7B8D]'}`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          文字
        </button>
      </div>

      {mode === 'voice' ? (
        <>
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
          <p className="text-xs text-[#C4CDD5] text-center">
            {apiConfig?.api_key ? '点击开始录音，再次点击结束' : '需在设置中配置 API Key'}
          </p>
        </>
      ) : (
        <div className="w-full space-y-3">
          <div className="relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="输入日程，如：明天下午3点开会"
              className="w-full px-4 py-3 pr-12 bg-[#F0F4F8] rounded-xl border border-[#E8EDF2]
                text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-all"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || textProcessing}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg
                bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E] text-white
                hover:shadow-md transition-all disabled:opacity-40 active:scale-95"
            >
              {textProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['明天上午9点开会', '后天下午3点见客户', '下周一上午团建'].map((hint) => (
              <button
                key={hint}
                onClick={() => setTextInput(hint)}
                className="px-2.5 py-1 rounded-lg bg-[#E8EDF2] text-[#6B7B8D] text-xs
                  hover:bg-[#D5DFE9] hover:text-[#2D3E50] transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
