import React, { useState, useEffect } from 'react';
import { toaster, ToastType } from '../../utils/toaster';

const toastIcons: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

const toastColors: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
};

export function ToasterContainer() {
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = toaster.subscribe(newToasts => {
      setToasts(newToasts);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[100] space-y-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 w-80 p-4 rounded-xl shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300 ${toastColors[toast.type]}`}
        >
          <span className="material-symbols-outlined text-xl">{toastIcons[toast.type]}</span>
          <p className="font-bold text-sm flex-1">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
