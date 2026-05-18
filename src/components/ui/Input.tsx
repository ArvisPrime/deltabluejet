import React, { useId } from 'react';

/* ── Types ──────────────────────────────────────────────────── */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    helperText?: string;
    error?: string;
    leadingIcon?: string;
    trailingIcon?: string;
    inputSize?: 'sm' | 'md' | 'lg';
}

/* ── Size map ───────────────────────────────────────────────── */
const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-[11px] rounded-lg',
    md: 'px-4 py-2.5 text-xs rounded-xl',
    lg: 'px-5 py-3.5 text-sm rounded-2xl',
};

/* ── Component ──────────────────────────────────────────────── */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            helperText,
            error,
            leadingIcon,
            trailingIcon,
            inputSize = 'md',
            className = '',
            id: externalId,
            ...rest
        },
        ref,
    ) => {
        const generatedId = useId();
        const inputId = externalId || generatedId;
        const hasError = !!error;

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-600"
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    {leadingIcon && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-navy-400 pointer-events-none">
                            {leadingIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={[
                            'w-full border font-bold transition-all duration-200 outline-none',
                            sizeClasses[inputSize],
                            leadingIcon ? 'pl-10' : '',
                            trailingIcon ? 'pr-10' : '',
                            hasError
                                ? 'border-red-300 text-red-800 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-navy-200 text-navy-800 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-navy-300',
                            'placeholder:text-navy-300 placeholder:font-medium',
                            className,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                        {...rest}
                    />
                    {trailingIcon && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-navy-400 pointer-events-none">
                            {trailingIcon}
                        </span>
                    )}
                </div>

                {hasError && (
                    <p id={`${inputId}-error`} className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {error}
                    </p>
                )}
                {!hasError && helperText && (
                    <p id={`${inputId}-helper`} className="text-[10px] text-navy-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    },
);

Input.displayName = 'Input';
export default Input;
