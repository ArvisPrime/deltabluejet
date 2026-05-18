import React from 'react';

/* ── Types ──────────────────────────────────────────────────── */
export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    /** Custom cell renderer. Falls back to `row[key]`. */
    render?: (row: T, index: number) => React.ReactNode;
    className?: string;
}

export interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    /** Number of skeleton rows to show while loading */
    skeletonRows?: number;
    emptyIcon?: string;
    emptyTitle?: string;
    emptySubtitle?: string;
    /** Key extractor for React keys. Defaults to index. */
    rowKey?: (row: T, index: number) => string | number;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    className?: string;
}

/* ── Skeleton Row ───────────────────────────────────────────── */
const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
    <tr className="animate-pulse">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-3 bg-navy-100 rounded-full w-3/4" />
            </td>
        ))}
    </tr>
);

/* ── Component ──────────────────────────────────────────────── */
function Table<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    skeletonRows = 5,
    emptyIcon = 'inbox',
    emptyTitle = 'No data found',
    emptySubtitle = 'There are no records to display.',
    rowKey,
    onSort,
    sortKey,
    sortDirection,
    className = '',
}: TableProps<T>) {
    const handleSort = (col: Column<T>) => {
        if (!col.sortable || !onSort) return;
        const newDir = sortKey === col.key && sortDirection === 'asc' ? 'desc' : 'asc';
        onSort(col.key, newDir);
    };

    return (
        <div className={`overflow-x-auto rounded-2xl border border-navy-100 ${className}`}>
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-navy-50/80">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={[
                                    'px-5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-navy-500 whitespace-nowrap',
                                    col.sortable && onSort ? 'cursor-pointer hover:text-navy-700 select-none' : '',
                                    col.className || '',
                                ].join(' ')}
                                onClick={() => handleSort(col)}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    {col.label}
                                    {col.sortable && sortKey === col.key && (
                                        <span className="material-symbols-outlined text-xs text-primary">
                                            {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                        </span>
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                    {loading &&
                        Array.from({ length: skeletonRows }).map((_, i) => (
                            <SkeletonRow key={`skel-${i}`} cols={columns.length} />
                        ))}

                    {!loading && data.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="px-5 py-16 text-center">
                                <span className="material-symbols-outlined text-4xl text-navy-200 block mb-2">
                                    {emptyIcon}
                                </span>
                                <p className="text-xs font-bold text-navy-600">{emptyTitle}</p>
                                <p className="text-[10px] text-navy-400 mt-1">{emptySubtitle}</p>
                            </td>
                        </tr>
                    )}

                    {!loading &&
                        data.map((row, idx) => (
                            <tr
                                key={rowKey ? rowKey(row, idx) : idx}
                                className="hover:bg-navy-50/50 transition-colors"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-5 py-3.5 text-xs text-navy-700 ${col.className || ''}`}
                                    >
                                        {col.render ? col.render(row, idx) : (row[col.key] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
