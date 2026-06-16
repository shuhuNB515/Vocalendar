import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Bell, User, Check, AlertCircle, Eye, EyeOff, ArrowLeft, Shield, Volume2, LogOut, Sparkles, Globe, Cpu, KeyRound, Zap, Info } from 'lucide-react';
import { useKeyStore } from '@/store/keyStore';
import { useAuthStore } from '@/store/authStore';

export default function Settings() {
  const navigate = useNavigate();
  const { keyStatus, config, fetchStatus, setField, saveKeys, testKey, saving } = useKeyStore();
  const { user, logout } = useAuthStore();
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [reminderType, setReminderType] = useState<'voice' | 'notification'>('voice');
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSave = async () => {
    await saveKeys();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    const result = await testKey();
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-[#E8EDF5] to-[#F5F0FA]">
      {/* 顶部 */}
      <header className="bg-gradient-to-br from-[#1E3A5F] via-[#2D5A8E] to-[#3A6BA5] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#7E57C2]/30" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 md:px-8 pt-4 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-serif font-bold">设置</h1>
              <p className="text-xs text-white/60 mt-0.5">管理您的账户和服务配置</p>
            </div>
          </div>

          {/* 用户信息 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF8C42] to-[#E67330]
              flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shadow-[#FF8C42]/20">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{user?.email || '未登录'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Sparkles className="w-3 h-3 text-[#FFD54F]" />
                <span className="text-xs text-white/60">普通用户</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10">
              <Shield className="w-3.5 h-3.5 text-[#4CAF50]" />
              <span className="text-xs text-white/70">已认证</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-4 pb-24 space-y-5">
        {/* ====== 多模态 API 配置 ====== */}
        <section>
          <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-sm overflow-hidden">
            {/* 标题栏 */}
            <div className="p-4 border-b border-[#F0F4F8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E3A5F]">多模态 API 配置</h2>
                  <p className="text-xs text-[#9BA8B7]">一个 Key 驱动语音识别 + 智能解析 + 语音合成</p>
                </div>
                {keyStatus.is_set && (
                  <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] text-xs font-semibold">
                    <Check className="w-3 h-3" />已配置
                  </span>
                )}
              </div>
            </div>

            {/* 提示信息 */}
            <div className="mx-4 mt-3 p-3 bg-[#FFF8E1] rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 text-[#F9A825] mt-0.5 shrink-0" />
              <div className="text-xs text-[#795548] leading-relaxed">
                <p>仅支持多模态 API Key，语音识别和智能解析共用同一配置。</p>
                <p className="mt-1 font-semibold">常用模型示例：</p>
                <p>OpenAI: <code className="bg-[#F5F0E0] px-1 rounded">gpt-4o-mini</code></p>
                <p>DeepSeek: <code className="bg-[#F5F0E0] px-1 rounded">deepseek-chat</code></p>
                <p>通义千问: <code className="bg-[#F5F0E0] px-1 rounded">qwen-turbo</code></p>
              </div>
            </div>

            {/* 表单 */}
            <div className="p-4 space-y-4">
              {/* API 地址 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7B8D] mb-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  API 地址
                </label>
                <input
                  type="text"
                  value={config.api_url || ''}
                  onChange={(e) => setField('api_url', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FA] rounded-xl border border-[#E8EDF2]
                    text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                    focus:outline-none focus:border-[#1E3A5F] focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/10 transition-all"
                />
                <p className="text-[10px] text-[#C4CDD5] mt-1">留空则默认使用 https://api.openai.com/v1</p>
              </div>

              {/* API Key */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7B8D] mb-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  API Key <span className="text-[#E57373]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={config.api_key || ''}
                    onChange={(e) => setField('api_key', e.target.value)}
                    placeholder={keyStatus.is_set ? '已保存，输入新值可更新' : '请输入 API Key'}
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#F5F7FA] rounded-xl border border-[#E8EDF2]
                      text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                      focus:outline-none focus:border-[#1E3A5F] focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/10 transition-all"
                  />
                  <button onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BA8B7] hover:text-[#6B7B8D]">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 模型名称 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7B8D] mb-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  模型名称
                </label>
                <input
                  type="text"
                  value={config.model_name || ''}
                  onChange={(e) => setField('model_name', e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FA] rounded-xl border border-[#E8EDF2]
                    text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                    focus:outline-none focus:border-[#1E3A5F] focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/10 transition-all"
                />
                <p className="text-[10px] text-[#C4CDD5] mt-1">根据 API 地址填写对应模型，如 gpt-4o-mini / deepseek-chat / qwen-turbo</p>
              </div>

              {/* 测试 + 保存 */}
              <div className="flex gap-3 pt-1">
                <button onClick={handleTest} disabled={testing || !config.api_key}
                  className="flex-1 py-2.5 rounded-xl bg-[#F5F7FA] text-[#6B7B8D] text-sm font-semibold
                    hover:bg-[#E8EDF2] transition-colors disabled:opacity-40 active:scale-[0.99]">
                  {testing ? '测试中...' : '测试连接'}
                </button>
                <button onClick={handleSave} disabled={saving || !config.api_key}
                  className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E]
                    text-white text-sm font-semibold
                    hover:shadow-lg hover:shadow-[#1E3A5F]/20 transition-all
                    disabled:opacity-40 active:scale-[0.99]">
                  {saving ? '保存中...' : saveSuccess ? '已保存 ✓' : '保存配置'}
                </button>
              </div>

              {/* 测试结果 */}
              {testResult && (
                <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium
                  ${testResult.includes('成功')
                    ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                    : 'bg-[#E57373]/10 text-[#E57373]'}`}>
                  {testResult.includes('success') || testResult.includes('成功')
                    ? <Check className="w-3.5 h-3.5" />
                    : <AlertCircle className="w-3.5 h-3.5" />}
                  {testResult}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ====== 提醒偏好 ====== */}
        <section>
          <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#F0F4F8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF8C42] to-[#E67330] flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E3A5F]">提醒偏好</h2>
                  <p className="text-xs text-[#9BA8B7]">设置默认提醒时间和提醒方式</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-5">
              <div>
                <p className="text-sm font-semibold text-[#2D3E50] mb-3">默认提醒时间</p>
                <div className="flex gap-2">
                  {[5, 10, 15, 30, 60].map((min) => (
                    <button key={min} onClick={() => setReminderMinutes(min)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                        ${reminderMinutes === min
                          ? 'bg-[#1E3A5F] text-white shadow-sm'
                          : 'bg-[#F5F7FA] text-[#6B7B8D] hover:bg-[#E8EDF2]'}`}>
                      {min >= 60 ? `${min / 60}h` : `${min}m`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#2D3E50] mb-3">提醒方式</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setReminderType('voice')}
                    className={`p-3 rounded-xl text-center transition-all
                      ${reminderType === 'voice'
                        ? 'bg-gradient-to-br from-[#FF8C42] to-[#E67330] text-white shadow-md shadow-[#FF8C42]/20'
                        : 'bg-[#F5F7FA] text-[#6B7B8D] hover:bg-[#E8EDF2]'}`}>
                    <Volume2 className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-sm font-semibold">语音播报</p>
                    <p className={`text-xs mt-0.5 ${reminderType === 'voice' ? 'text-white/70' : 'text-[#C4CDD5]'}`}>温和语音提醒</p>
                  </button>
                  <button onClick={() => setReminderType('notification')}
                    className={`p-3 rounded-xl text-center transition-all
                      ${reminderType === 'notification'
                        ? 'bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E] text-white shadow-md shadow-[#1E3A5F]/20'
                        : 'bg-[#F5F7FA] text-[#6B7B8D] hover:bg-[#E8EDF2]'}`}>
                    <Bell className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-sm font-semibold">通知提醒</p>
                    <p className={`text-xs mt-0.5 ${reminderType === 'notification' ? 'text-white/70' : 'text-[#C4CDD5]'}`}>系统通知推送</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== 账户管理 ====== */}
        <section>
          <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#F0F4F8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7E57C2] to-[#651FFF] flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E3A5F]">账户管理</h2>
                  <p className="text-xs text-[#9BA8B7]">查看账户信息和退出登录</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E]
                  flex items-center justify-center text-white font-serif font-bold text-lg shadow-md shadow-[#1E3A5F]/20">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2D3E50]">{user?.email || '未登录'}</p>
                  <p className="text-xs text-[#9BA8B7]">注册用户</p>
                </div>
              </div>
              <button onClick={logout}
                className="w-full py-2.5 rounded-xl border border-[#E57373]/30 text-[#E57373] font-semibold text-sm
                  hover:bg-[#E57373]/5 transition-colors active:scale-[0.99] flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
