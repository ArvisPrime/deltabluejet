import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/* ── Types ──────────────────────────────────────────────────── */
export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    size?: ModalSize;
    /** When true, clicking the overlay or pressing Escape does NOT close the modal. */
    persistent?: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

/* ── Size map ───────────────────────────────────────────────── */
const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    full: 'max-w-[90vw] max-h-[90vh]',
};

/* ── Component ──────────────────────────────────────────────── */
const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    subtitle,
    size = 'md',
    persistent = false,
    children,
    footer,
}) => {
    /* Escape key handler */
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !persistent) onClose();
        },
        [onClose, persistent],
    );

    useEffect(() => {
        if (!open) return;
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Dialog'}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={persistent ? undefined : onClose}
            />

            {/* Panel */}
            <div
                className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl border border-navy-100 flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-300`}
            >
                {/* Header */}
                {(title || subtitle) && (
                    <div className="px-6 pt-6 pb-4 border-b border-navy-100 flex items-start justify-between">
                        <div>
                            {title && (
                                <h2 className="text-sm font-black uppercase tracking-[0.15em] text-navy-900">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p className="mt-1 text-xs text-navy-500">{subtitle}</p>
                            )}
                        </div>
                        {!persistent && (
                            <button
                                onClick={onClose}
                                className="text-navy-400 hover:text-navy-700 transition-colors p-1 -mr-1 rounded-lg hover:bg-navy-50"
                                aria-label="Close dialog"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-navy-100 flex items-center justify-end gap-3 bg-navy-50/50">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
};

export default Modal;
