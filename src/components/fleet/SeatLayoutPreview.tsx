import React from 'react';
import type { SeatMapDoc } from '../../types/firestore';

interface SeatLayoutPreviewProps {
    seatConfig: Record<string, number>;
    aircraftType?: string;
    compact?: boolean;
}

const CLASS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
    first: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', label: 'First' },
    business: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', label: 'Business' },
    economy: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', label: 'Economy' },
};

/**
 * Compact visual preview of an aircraft's seat configuration.
 * Shows class sections with proportional bars and seat counts.
 */
const SeatLayoutPreview: React.FC<SeatLayoutPreviewProps> = ({ seatConfig, aircraftType, compact = false }) => {
    const totalSeats = Object.values(seatConfig).reduce((sum, n) => sum + n, 0);
    const classes = Object.entries(seatConfig).filter(([, count]) => count > 0);

    if (totalSeats === 0) {
        return <div className="text-xs text-navy-400 italic">No seat config</div>;
    }

    return (
        <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
            {aircraftType && !compact && (
                <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sm text-navy-400">airline_seat_recline_normal</span>
                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                        Seat Layout — {totalSeats} Total
                    </span>
                </div>
            )}

            {/* Proportional bar */}
            <div className="flex h-3 rounded-full overflow-hidden border border-navy-100">
                {classes.map(([cls, count]) => {
                    const style = CLASS_COLORS[cls] || CLASS_COLORS.economy;
                    const pct = (count / totalSeats) * 100;
                    return (
                        <div
                            key={cls}
                            className={`${style.bg} ${style.border} border-r last:border-r-0 transition-all`}
                            style={{ width: `${pct}%` }}
                            title={`${style.label}: ${count} seats (${Math.round(pct)}%)`}
                        />
                    );
                })}
            </div>

            {/* Legend */}
            <div className={`flex flex-wrap gap-3 ${compact ? 'gap-2' : 'gap-4'}`}>
                {classes.map(([cls, count]) => {
                    const style = CLASS_COLORS[cls] || CLASS_COLORS.economy;
                    return (
                        <div key={cls} className="flex items-center gap-1.5">
                            <div className={`size-2.5 rounded-sm ${style.bg} ${style.border} border`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${style.text}`}>
                                {style.label}
                            </span>
                            <span className="text-[10px] font-bold text-navy-600">{count}</span>
                        </div>
                    );
                })}
            </div>

            {/* Mini seat grid for non-compact mode */}
            {!compact && (
                <div className="bg-navy-50/30 rounded-xl p-3 border border-navy-50">
                    <div className="flex flex-col gap-1.5">
                        {classes.map(([cls, count]) => {
                            const style = CLASS_COLORS[cls] || CLASS_COLORS.economy;
                            const seatsPerRow = cls === 'first' ? 4 : cls === 'business' ? 4 : 6;
                            const rows = Math.ceil(count / seatsPerRow);
                            const displayRows = Math.min(rows, 4); // Cap at 4 rows for preview
                            return (
                                <div key={cls}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${style.text}`}>
                                            {style.label}
                                        </span>
                                        <div className="flex-1 h-px bg-navy-100" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {Array.from({ length: displayRows }).map((_, row) => (
                                            <div key={row} className="flex gap-0.5 justify-center">
                                                {Array.from({ length: Math.min(seatsPerRow, count - row * seatsPerRow) }).map((_, seat) => {
                                                    const half = Math.floor(seatsPerRow / 2);
                                                    const isAisle = seat === half;
                                                    return (
                                                        <React.Fragment key={seat}>
                                                            {isAisle && <div className="w-1" />}
                                                            <div className={`size-2.5 rounded-[2px] ${style.bg} ${style.border} border`} />
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                        {rows > 4 && (
                                            <div className="text-center">
                                                <span className="text-[8px] text-navy-300 font-bold">+{rows - 4} more rows</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatLayoutPreview;
