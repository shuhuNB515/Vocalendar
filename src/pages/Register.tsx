import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
    } catch (err) {
      setError((err as Error).message || '注册失败');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E]
            flex items-center justify-center shadow-lg shadow-[#1E3A5F]/20">
            <span className="text-white font-serif font-bold text-2xl">言</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1E3A5F]">创建账户</h1>
          <p className="text-sm text-[#6B7B8D] mt-1">开始使用言程，让语音管理日程</p>
        </div>

        {/* 注册表单 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[#E8EDF2] p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#E57373]/10 text-[#E57373] text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-[#2D3E50] mb-1.5 block">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9BA8B7]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-[#E8EDF2]
                  text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                  focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#2D3E50] mb-1.5 block">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9BA8B7]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6个字符"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-[#E8EDF2]
                  text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                  focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#2D3E50] mb-1.5 block">确认密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9BA8B7]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#F0F4F8] rounded-xl border border-[#E8EDF2]
                  text-sm text-[#2D3E50] placeholder-[#C4CDD5]
                  focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8E]
              text-white font-medium hover:shadow-lg hover:shadow-[#1E3A5F]/20
              transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? '注册中...' : '注册'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <p className="text-center text-sm text-[#9BA8B7]">
            已有账户？{' '}
            <Link to="/login" className="text-[#1E3A5F] font-medium hover:underline">
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
