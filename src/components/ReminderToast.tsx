import { Bell, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ReminderToastProps {
  message: string;
  eventTitle: string;
  time: string;
  onDismiss: () => void;
}

export default function ReminderToast({ message, eventTitle, time, onDismiss }: ReminderToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300
      ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-[#E8EDF2] p-4
        flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FF8C42]/10 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-[#FF8C42]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#2D3E50]">{message}</p>
          <p className="text-sm text-[#1E3A5F] font-semibold mt-0.5">{eventTitle}</p>
          <p className="text-xs text-[#9BA8B7] mt-0.5">{time}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-[#E8EDF2] text-[#9BA8B7] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
