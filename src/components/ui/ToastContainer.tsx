import React from 'react';
import { useToastStore, type ToastType } from '../../stores/toastStore';

const iconMap: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning',
};

const colorMap: Record<ToastType, string> = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-primary',
    warning: 'bg-orange-500',
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none" role="status" aria-live="polite" aria-label="Notifications">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl text-white shadow-2xl animate-in slide-in-from-right-5 fade-in duration-300 ${colorMap[toast.type]}`}
                    role="alert"
                >
                    <span className="material-symbols-outlined text-xl mt-0.5 shrink-0">
                        {iconMap[toast.type]}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-widest leading-relaxed flex-1">
                        {toast.message}
                    </p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-white/60 hover:text-white transition-colors shrink-0"
                        aria-label="Dismiss notification"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
