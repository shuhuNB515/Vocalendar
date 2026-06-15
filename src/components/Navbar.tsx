import { Link, useLocation } from 'react-router-dom';
import { Calendar, List, Settings, Mic } from 'lucide-react';

const navItems = [
  { path: '/', icon: Calendar, label: '日历' },
  { path: '/schedule', icon: List, label: '日程' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl
      border-t border-[#E8EDF2] md:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors
                ${isActive ? 'text-[#1E3A5F]' : 'text-[#9BA8B7] hover:text-[#6B7B8D]'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          to="/"
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[#FF8C42]"
        >
          <div className="w-10 h-10 -mt-5 rounded-full bg-gradient-to-br from-[#FF8C42] to-[#E67330]
            flex items-center justify-center shadow-lg shadow-[#FF8C42]/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-medium">语音</span>
        </Link>
      </div>
    </nav>
  );
}
