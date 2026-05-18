import React from 'react';

/* ── Types ──────────────────────────────────────────────────── */
export type CardVariant = 'default' | 'glass' | 'bordered';

export interface CardProps {
    variant?: CardVariant;
    hover?: boolean;
    className?: string;
    children: React.ReactNode;
}

export interface CardHeaderProps {
    title?: string;
    subtitle?: string;
    icon?: string;
    action?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

export interface CardBodyProps {
    className?: string;
    children: React.ReactNode;
}

export interface CardFooterProps {
    className?: string;
    children: React.ReactNode;
}

/* ── Variant classes ────────────────────────────────────────── */
const variantClasses: Record<CardVariant, string> = {
    default: 'bg-white border border-navy-100 shadow-sm',
    glass: 'bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg',
    bordered: 'bg-white border-2 border-navy-200',
};

/* ── Card ───────────────────────────────────────────────────── */
const Card: React.FC<CardProps> & {
    Header: React.FC<CardHeaderProps>;
    Body: React.FC<CardBodyProps>;
    Footer: React.FC<CardFooterProps>;
} = ({ variant = 'default', hover = false, className = '', children }) => (
    <div
        className={[
            'rounded-2xl overflow-hidden transition-all duration-200',
            variantClasses[variant],
            hover ? 'hover:shadow-lg hover:-translate-y-0.5' : '',
            className,
        ]
            .filter(Boolean)
            .join(' ')}
    >
        {children}
    </div>
);

/* ── Sub-components ─────────────────────────────────────────── */
const CardHeader: React.FC<CardHeaderProps> = ({
    title,
    subtitle,
    icon,
    action,
    className = '',
    children,
}) => (
    <div className={`px-6 py-5 border-b border-navy-100 flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
            {icon && (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                </div>
            )}
            <div className="min-w-0">
                {title && (
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-navy-900 truncate">
                        {title}
                    </h3>
                )}
                {subtitle && <p className="text-[10px] text-navy-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
        </div>
        {action && <div className="shrink-0 ml-4">{action}</div>}
        {children}
    </div>
);

const CardBody: React.FC<CardBodyProps> = ({ className = '', children }) => (
    <div className={`px-6 py-5 ${className}`}>{children}</div>
);

const CardFooter: React.FC<CardFooterProps> = ({ className = '', children }) => (
    <div className={`px-6 py-4 border-t border-navy-100 bg-navy-50/50 ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
