import { useEffect, useState } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';
import { Toast as ToastType } from '../types';

interface ToastProps {
  toast: ToastType;
  onDone: (id: string) => void;
}

export default function Toast({ toast, onDone }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDone(toast.id), 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast.id, onDone]);

  const colors = {
    success: 'bg-[#1D9E75]',
    error: 'bg-[#E24B4A]',
    info: 'bg-[#0A1F44]',
  };

  const icons = {
    success: <Check className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
  };

  return (
    <div
      className={`${colors[toast.type]} ${exiting ? 'toast-exit' : 'toast-enter'} text-white px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-lg text-sm font-medium`}
    >
      {icons[toast.type]}
      {toast.message}
    </div>
  );
}
