import React from 'react';

/* ── Types ──────────────────────────────────────────────────── */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leadingIcon?: string;
    trailingIcon?: string;
    fullWidth?: boolean;
}

/* ── Style maps ─────────────────────────────────────────────── */
const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5',
    secondary:
        'bg-navy-100 text-navy-800 hover:bg-navy-200',
    outline:
        'bg-transparent border border-navy-200 text-navy-700 hover:bg-navy-50 hover:border-navy-300',
    ghost:
        'bg-transparent text-navy-600 hover:bg-navy-50 hover:text-navy-800',
    danger:
        'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:-translate-y-0.5',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-[10px] gap-1.5 rounded-lg',
    md: 'px-5 py-2.5 text-xs gap-2 rounded-xl',
    lg: 'px-7 py-3.5 text-sm gap-2.5 rounded-2xl',
};

const iconSizeMap: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
};

/* ── Component ──────────────────────────────────────────────── */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            leadingIcon,
            trailingIcon,
            fullWidth = false,
            disabled,
            className = '',
            children,
            ...rest
        },
        ref,
    ) => {
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={[
                    'inline-flex items-center justify-center font-black uppercase tracking-[0.15em] transition-all duration-200 select-none',
                    variantClasses[variant],
                    sizeClasses[size],
                    fullWidth ? 'w-full' : '',
                    isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
                    className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                {...rest}
            >
                {loading && (
                    <span className={`material-symbols-outlined animate-spin ${iconSizeMap[size]}`}>
                        progress_activity
                    </span>
                )}
                {!loading && leadingIcon && (
                    <span className={`material-symbols-outlined ${iconSizeMap[size]}`}>{leadingIcon}</span>
                )}
                {children}
                {!loading && trailingIcon && (
                    <span className={`material-symbols-outlined ${iconSizeMap[size]}`}>{trailingIcon}</span>
                )}
            </button>
        );
    },
);

Button.displayName = 'Button';
export default Button;
