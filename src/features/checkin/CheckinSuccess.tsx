import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';
import { encodeBCBP, fareClassToCompartment } from '../../utils/boardingPassEncoder';
import type { BookingDoc, FlightDoc, CheckinDoc } from '../../types/firestore';

/* ── Component ───────────────────────────────────────────────── */
const CheckinSuccess: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const routerState = location.state as {
        pnr: string;
        booking: BookingDoc;
        flight: FlightDoc;
        checkinRecord: CheckinDoc;
        seatNumber: string;
        boardingGroup: string;
    } | null;

    const pnr = routerState?.pnr || '—';
    const booking = routerState?.booking;
    const flight = routerState?.flight;
    const checkinRecord = routerState?.checkinRecord;
    const seat = routerState?.seatNumber || '—';
    const boardingGroup = routerState?.boardingGroup || 'A';
    const passengerName = (booking as any)?.passengerName || (booking as any)?.passengers?.[0]?.name || 'Passenger';
    const boardingTime = flight?.departureTime
        ? new Date((flight.departureTime as any)?.toDate?.() || flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—';
    const flightDate = (booking as any)?.departureDate
        ? new Date((booking as any).departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—';

    // Use stored BCBP data from checkin record, or generate on-the-fly as fallback
    const bcbpData = checkinRecord?.bcbpData || (() => {
        try {
            return encodeBCBP({
                passengerName: passengerName.toUpperCase(),
                pnr: pnr.replace('—', 'XXXXXX'),
                origin: booking?.origin?.code || '---',
                destination: booking?.destination?.code || '---',
                carrierCode: 'DB',
                flightNumber: flight?.flightNumber || '0000',
                departureDate: new Date(),
                compartment: fareClassToCompartment(booking?.fareClass || 'economy'),
                seatNumber: seat,
                sequenceNumber: Date.now() % 10000,
            });
        } catch { return `PNR:${pnr}|SEAT:${seat}`; }
    })();

    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-16 font-display animate-in zoom-in duration-500 bg-gradient-to-br from-navy-50 to-white">
            <div className="w-full max-w-5xl space-y-10 text-center">

                {/* ── Success Header ──────────────────────────────────── */}
                <div className="space-y-3">
                    <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                        <span className="material-symbols-outlined text-emerald-500 text-4xl">check_circle</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-navy-950 tracking-tighter uppercase">Check-in Complete</h1>
                    <p className="text-navy-400 font-medium italic text-sm md:text-base uppercase tracking-widest">
                        You are cleared for boarding on the {BRAND.shortName} network.
                    </p>
                </div>

                {/* ── Boarding Pass ────────────────────────────────────── */}
                <div className="flex rounded-2xl overflow-hidden shadow-2xl border border-navy-100 text-left mx-auto max-w-4xl print:shadow-none print:border print:border-navy-200">

                    {/* ─ Gold sidebar with vertical airline name ─── */}
                    <div className="w-12 md:w-14 bg-primary flex items-center justify-center shrink-0 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.3em] whitespace-nowrap"
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                {BRAND.name}
                            </span>
                        </div>
                    </div>

                    {/* ─ Main body ──────────────────────────────── */}
                    <div className="flex-1 bg-white flex flex-col min-w-0">

                        {/* Top dark navy header band */}
                        <div className="bg-navy-950 px-6 md:px-8 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-white text-xl">flight</span>
                                <span className="text-sm md:text-base font-black text-white uppercase tracking-wider">Boarding Pass</span>
                            </div>
                            <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.25em]">{BRAND.name}</span>
                        </div>

                        {/* Passenger + flight info area */}
                        <div className="px-6 md:px-8 pt-6 pb-4 flex flex-col md:flex-row gap-4 md:gap-0">
                            {/* Left info block */}
                            <div className="flex-1 space-y-4 min-w-0">
                                {/* Passenger name */}
                                <div>
                                    <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest">Passenger</p>
                                    <p className="text-lg md:text-xl font-black text-navy-950 tracking-tight uppercase truncate">{passengerName}</p>
                                </div>

                                {/* Boarding Time / Gate / Flight row */}
                                <div className="border-t border-dashed border-navy-100 pt-3">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Boarding Time</p>
                                            <p className="text-sm md:text-base font-black text-navy-950">{boardingTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Gate</p>
                                            <p className="text-sm md:text-base font-black text-navy-950">—</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Flight</p>
                                            <p className="text-sm md:text-base font-black text-primary">{flight?.flightNumber || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center airplane icon */}
                            <div className="flex items-center justify-center px-4 md:px-8">
                                <div className="relative">
                                    <span className="material-symbols-outlined text-navy-900 text-6xl md:text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        flight
                                    </span>
                                </div>
                            </div>

                            {/* Right destination block */}
                            <div className="flex-1 space-y-4 min-w-0">
                                <div>
                                    <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest">To</p>
                                    <p className="text-lg md:text-xl font-black text-navy-950 tracking-tight">{booking?.destination?.city || '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom row: Date / From / Seat / Group */}
                        <div className="px-6 md:px-8 pb-6 pt-2">
                            <div className="border-t border-dashed border-navy-100 pt-3">
                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Date</p>
                                        <p className="text-sm font-black text-navy-950">{flightDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">From</p>
                                        <p className="text-sm font-black text-navy-950">{booking?.origin?.city || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Seat</p>
                                        <p className="text-sm font-black text-primary">{seat}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Group</p>
                                        <p className="text-sm font-black text-navy-950">{boardingGroup}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─ QR Code strip ──────────────────────────── */}
                    <div className="w-24 md:w-28 bg-white flex flex-col items-center justify-center py-4 px-2 border-l border-dashed border-navy-200 shrink-0">
                        <QRCodeSVG
                            value={bcbpData}
                            size={80}
                            level="M"
                            bgColor="#ffffff"
                            fgColor="#0a1628"
                        />
                        <p className="text-[7px] font-bold text-navy-300 uppercase tracking-wider mt-2 text-center">Scan to board</p>
                    </div>

                    {/* ─ Right tear-off stub ────────────────────── */}
                    <div className="hidden md:flex w-52 bg-white flex-col border-l-2 border-dashed border-navy-200 shrink-0">
                        {/* Stub header */}
                        <div className="bg-navy-950 px-4 py-3">
                            <p className="text-xs font-black text-white uppercase tracking-wider">Boarding Pass</p>
                        </div>

                        {/* Stub QR code */}
                        <div className="px-4 py-3 border-b border-navy-100 flex items-center justify-center">
                            <QRCodeSVG
                                value={bcbpData}
                                size={120}
                                level="M"
                                bgColor="#ffffff"
                                fgColor="#0a1628"
                                includeMargin
                            />
                        </div>

                        {/* Stub info */}
                        <div className="px-4 py-3 space-y-3 flex-1">
                            <div>
                                <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Passenger</p>
                                <p className="text-xs font-black text-navy-950 uppercase truncate">{passengerName}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">Boarding</p>
                                    <p className="text-[10px] font-black text-navy-950">{boardingTime}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">Gate</p>
                                    <p className="text-[10px] font-black text-navy-950">—</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">Flight</p>
                                    <p className="text-[10px] font-black text-primary">{flight?.flightNumber || '—'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-navy-100 pt-2">
                                <div>
                                    <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">From</p>
                                    <p className="text-[10px] font-black text-navy-950">{booking?.origin?.city || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">To</p>
                                    <p className="text-[10px] font-black text-navy-950">{booking?.destination?.city || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── PNR reference badge ──────────────────────── */}
                <div className="flex items-center justify-center gap-3">
                    <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Booking Reference</span>
                    <span className="px-4 py-2 bg-primary text-white font-mono text-sm font-black tracking-[0.3em] rounded-lg">{pnr}</span>
                </div>

                {/* ── Actions ──────────────────────────────────── */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <button
                        onClick={handlePrint}
                        className="px-10 py-4 bg-navy-950 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-navy-800 transition-all flex items-center gap-3 shadow-lg shadow-navy-950/20"
                    >
                        <span className="material-symbols-outlined text-sm">print</span> Print Boarding Pass
                    </button>
                    <button
                        onClick={() => navigate(ROUTES.HOME)}
                        className="px-10 py-4 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-sm">home</span> Return Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckinSuccess;
