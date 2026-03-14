import React from 'react';
import type { GeneratedFlight } from '../../services/flightGenerator';

interface FlightPreviewTableProps {
    flights: GeneratedFlight[];
}

const FlightPreviewTable: React.FC<FlightPreviewTableProps> = ({ flights }) => {
    const formatDate = (d: Date) =>
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    return (
        <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-navy-100">
                            {['#', 'Flight', 'Date', 'Departure', 'Arrival', 'Route', 'Seats', 'Economy Fare'].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-navy-300 uppercase tracking-widest">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {flights.map((f, i) => (
                            <tr key={i} className="border-b border-navy-50 hover:bg-navy-50/30 transition-colors">
                                <td className="px-4 py-2.5 text-[10px] font-bold text-navy-300">{i + 1}</td>
                                <td className="px-4 py-2.5">
                                    <span className="text-xs font-black text-navy-950">{f.flightNumber}</span>
                                </td>
                                <td className="px-4 py-2.5 text-xs font-bold text-navy-700">
                                    {formatDate(f.departureTime)}
                                </td>
                                <td className="px-4 py-2.5 text-xs font-bold text-navy-700">{formatTime(f.departureTime)}</td>
                                <td className="px-4 py-2.5 text-xs font-bold text-navy-700">{formatTime(f.arrivalTime)}</td>
                                <td className="px-4 py-2.5">
                                    <span className="text-xs font-black text-navy-950">
                                        {f.origin.code} → {f.destination.code}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className="text-xs font-bold text-navy-700">
                                        {Object.values(f.seatsAvailable).reduce((s, n) => s + n, 0)}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className="text-xs font-black text-emerald-700">
                                        ${f.baseFare.economy?.toLocaleString() || '—'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-3 bg-navy-50/30 border-t border-navy-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                    {flights.length} flights to be published
                </span>
                <span className="text-[10px] font-bold text-navy-400">
                    {formatDate(flights[0]?.departureTime)} — {formatDate(flights[flights.length - 1]?.departureTime)}
                </span>
            </div>
        </div>
    );
};

export default FlightPreviewTable;
