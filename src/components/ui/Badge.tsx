import React from 'react';

/* ── Types ──────────────────────────────────────────────────── */
export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
    status?: BadgeStatus;
    size?: BadgeSize;
    dot?: boolean;
    icon?: string;
    className?: string;
    children: React.ReactNode;
}

/* ── Style maps ─────────────────────────────────────────────── */
const statusClasses: Record<BadgeStatus, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-navy-50 text-navy-600 border-navy-200',
};

const dotClasses: Record<BadgeStatus, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-navy-400',
};

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
};

/* ── Component ──────────────────────────────────────────────── */
const Badge: React.FC<BadgeProps> = ({
    status = 'neutral',
    size = 'md',
    dot = false,
    icon,
    className = '',
    children,
}) => (
    <span
        className={[
            'inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.1em] rounded-full border',
            statusClasses[status],
            sizeClasses[size],
            className,
        ].join(' ')}
    >
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[status]}`} />}
        {icon && <span className="material-symbols-outlined text-xs">{icon}</span>}
        {children}
    </span>
);

export default Badge;
