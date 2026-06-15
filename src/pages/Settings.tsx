import { useState, useEffect } from 'react';
import { Key, Bell, User, Shield, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useKeyStore } from '@/store/keyStore';
import { useAuthStore } from '@/store/authStore';

export default function Settings() {
  const { keyStatus, asrKey, nlpKey, ttsKey, fetchStatus, setKey, saveKeys, testKey, saving } = useKeyStore();
  const { user, logout } = useAuthStore();
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [reminderType, setReminderType] = useState<'voice' | 'notification'>('voice');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestKey = async (type: 'asr' | 'nlp' | 'tts') => {
    const result = await testKey(type);
    setTestResults((prev) => ({ ...prev, [type]: result }));
  };

  const toggleShowKey = (type: string) => {
    setShowKeys((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const keyConfigs = [
    { type: 'asr' as const, label: '语音识别 (ASR)', desc: 'Whisper API / 讯飞语音等', isSet: keyStatus.asr_api_key_set, value: asrKey },
    { type: 'nlp' as const, label: '自然语言处理 (NLP)', desc: 'OpenAI GPT / 通义千问等', isSet: keyStatus.nlp_api_key_set, value: nlpKey },
    { type: 'tts' as const, label: '语音合成 (TTS)', desc: 'Edge TTS / 讯飞语音等', isSet: keyStatus.tts_api_key_set, value: ttsKey },
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F8] md:ml-16">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 pb-24">
        <header className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-[#1E3A5F]">设置</h1>
          <p className="text-sm text-[#6B7B8D] mt-1">管理您的账户和服务配置</p>
        </header>

        {/* API Key 配置 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">API 密钥配置</h2>
          </div>
          <div className="space-y-3">
            {keyConfigs.map((config) => (
              <div key={config.type} className="bg-white rounded-xl border border-[#E8EDF2] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#2D3E50]">{config.label}</h3>
                    <p className="text-xs text-[#9BA8B7]">{config.desc}</p>
                  </div>
                  {config.isSet && (
                    <span className="flex items-center gap-1 text-xs text-[#4CAF50]">
                      <Check className="w-3.5 h-3.5" />
                      已配置
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeys[config.type] ? 'text' : 'password'}
                      placeholder={config.isSet ? '已保存，输入新值可更新' : '请输入 API Key'}
                      value={config.value}
                      onChange={(e) => setKey(config.type, e.target.value)}
                      className="w-full px-3 py-2 pr-9 bg-[#F0F4F8] rounded-lg border border-[#E8EDF2]
                        text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                        focus:outline-none focus:border-[#1E3A5F] transition-colors"
                    />
                    <button
                      onClick={() => toggleShowKey(config.type)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8B7] hover:text-[#6B7B8D]"
                    >
                      {showKeys[config.type] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleTestKey(config.type)}
                    className="px-3 py-2 rounded-lg bg-[#E8EDF2] text-[#6B7B8D] text-sm font-medium
                      hover:bg-[#D5DFE9] transition-colors"
                  >
                    测试
                  </button>
                </div>
                {testResults[config.type] && (
                  <p className={`mt-2 text-xs flex items-center gap-1
                    ${testResults[config.type].includes('成功') ? 'text-[#4CAF50]' : 'text-[#E57373]'}`}>
                    {testResults[config.type].includes('成功') ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {testResults[config.type]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={saveKeys}
            disabled={saving}
            className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E]
              text-white font-medium hover:shadow-md transition-all disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存密钥'}
          </button>
        </section>

        {/* 提醒偏好 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">提醒偏好</h2>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EDF2] p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-[#2D3E50]">默认提醒时间</label>
              <div className="flex gap-2 mt-2">
                {[5, 10, 15, 30].map((min) => (
                  <button
                    key={min}
                    onClick={() => setReminderMinutes(min)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${reminderMinutes === min
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-[#E8EDF2] text-[#6B7B8D] hover:bg-[#D5DFE9]'}`}
                  >
                    {min}分钟
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#2D3E50]">提醒方式</label>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setReminderType('voice')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${reminderType === 'voice'
                      ? 'bg-[#FF8C42] text-white'
                      : 'bg-[#E8EDF2] text-[#6B7B8D] hover:bg-[#D5DFE9]'}`}
                >
                  语音播报
                </button>
                <button
                  onClick={() => setReminderType('notification')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${reminderType === 'notification'
                      ? 'bg-[#1E3A5F] text-white'
                      : 'bg-[#E8EDF2] text-[#6B7B8D] hover:bg-[#D5DFE9]'}`}
                >
                  通知提醒
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 账户管理 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">账户管理</h2>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EDF2] p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E]
                flex items-center justify-center text-white font-serif font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-[#2D3E50]">{user?.email || '未登录'}</p>
                <p className="text-xs text-[#9BA8B7]">普通用户</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2.5 rounded-xl bg-[#E57373]/10 text-[#E57373] font-medium
                hover:bg-[#E57373]/20 transition-colors"
            >
              退出登录
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
