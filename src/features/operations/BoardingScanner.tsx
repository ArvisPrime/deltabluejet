import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, query, where, getDocs, limit, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { decodeBCBP } from '../../utils/boardingPassEncoder';
import { BRAND } from '../../config/brand';
import type { CheckinDoc, BookingDoc, FlightDoc } from '../../types/firestore';

type ScanResult = {
    status: 'approved' | 'denied' | 'already_boarded';
    message: string;
    passengerName?: string;
    pnr?: string;
    flight?: string;
    seat?: string;
    boardingGroup?: string;
    origin?: string;
    destination?: string;
    checkinId?: string;
};

/**
 * BoardingScanner — Admin-side gate operations page.
 * Uses device camera or manual PNR entry to scan boarding pass QR codes,
 * validate against Firestore check-in records, and mark passengers as boarded.
 */
const BoardingScanner: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [manualPnr, setManualPnr] = useState('');
    const [scanCount, setScanCount] = useState(0);
    const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const processingRef = useRef(false);

    // ── Start Camera Scanner ──────────────────────────────────
    const startScanner = useCallback(async () => {
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch { /* already stopped */ }
        }
        setScanResult(null);
        const html5Qr = new Html5Qrcode('qr-reader');
        scannerRef.current = html5Qr;
        setIsScanning(true);

        try {
            await html5Qr.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => handleScan(decodedText),
                () => { /* ignore scan errors */ }
            );
        } catch (err) {
            console.error('[Scanner] Camera error:', err);
            setIsScanning(false);
            setScanResult({
                status: 'denied',
                message: 'Camera access denied. Please allow camera permissions or use manual PNR entry.',
            });
        }
    }, []);

    // ── Stop Camera ──────────────────────────────────────────
    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch { /* */ }
            scannerRef.current = null;
        }
        setIsScanning(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    // ── Handle QR Scan Data ──────────────────────────────────
    const handleScan = async (data: string) => {
        if (processingRef.current) return;
        processingRef.current = true;

        // Pause the scanner while processing
        if (scannerRef.current) {
            try { await scannerRef.current.pause(); } catch { /* */ }
        }

        try {
            // Try to decode as BCBP data
            const bcbp = decodeBCBP(data);
            let pnr: string | undefined;

            if (bcbp) {
                pnr = bcbp.pnr;
            } else if (data.includes('PNR:')) {
                // Fallback: parse PNR from structured string
                const match = data.match(/PNR:([A-Z0-9]+)/i);
                pnr = match?.[1];
            } else if (/^[A-Z0-9]{6}$/i.test(data.trim())) {
                // Raw PNR string
                pnr = data.trim().toUpperCase();
            }

            if (!pnr) {
                const result: ScanResult = {
                    status: 'denied',
                    message: 'Invalid boarding pass. Could not extract PNR from scanned data.',
                };
                setScanResult(result);
                setScanHistory(prev => [result, ...prev].slice(0, 20));
                return;
            }

            await validateAndBoard(pnr);
        } catch {
            setScanResult({
                status: 'denied',
                message: 'Error processing scan. Please try again.',
            });
        } finally {
            processingRef.current = false;
            // Resume scanner after a delay
            setTimeout(() => {
                if (scannerRef.current) {
                    try { scannerRef.current.resume(); } catch { /* */ }
                }
            }, 2000);
        }
    };

    // ── Validate PNR & Update Boarding Status ────────────────
    const validateAndBoard = async (pnr: string) => {
        try {
            // Look up the check-in record
            const checkinSnap = await getDocs(
                query(collection(db, 'checkins'), where('pnr', '==', pnr.toUpperCase()), limit(1))
            );

            if (checkinSnap.empty) {
                const result: ScanResult = {
                    status: 'denied',
                    message: `No check-in record found for PNR: ${pnr}`,
                    pnr,
                };
                setScanResult(result);
                setScanHistory(prev => [result, ...prev].slice(0, 20));
                return;
            }

            const checkinDoc = checkinSnap.docs[0];
            const checkin = { id: checkinDoc.id, ...checkinDoc.data() } as CheckinDoc & {
                boarded?: boolean;
                boardedAt?: Timestamp;
            };

            // Check if already boarded
            if (checkin.boarded) {
                const result: ScanResult = {
                    status: 'already_boarded',
                    message: `Passenger already boarded (PNR: ${pnr})`,
                    pnr: checkin.pnr,
                    seat: checkin.seatNumber,
                    boardingGroup: checkin.boardingGroup,
                    checkinId: checkin.id,
                };
                setScanResult(result);
                setScanHistory(prev => [result, ...prev].slice(0, 20));
                return;
            }

            // Fetch booking for passenger name + flight details
            let passengerName = 'Passenger';
            let flight = '';
            let origin = '';
            let destination = '';

            try {
                const bookingSnap = await getDocs(
                    query(collection(db, 'bookings'), where('pnr', '==', pnr.toUpperCase()), limit(1))
                );
                if (!bookingSnap.empty) {
                    const bookingData = bookingSnap.docs[0].data() as BookingDoc;
                    passengerName = (bookingData as any).passengerName || (bookingData as any).passengers?.[0]?.name || 'Passenger';
                    flight = bookingData.flightNumber || '';
                    origin = bookingData.origin?.city || bookingData.origin?.code || '';
                    destination = bookingData.destination?.city || bookingData.destination?.code || '';
                }
            } catch { /* proceed without booking details */ }

            // Mark as boarded
            await updateDoc(doc(db, 'checkins', checkin.id), {
                boarded: true,
                boardedAt: Timestamp.now(),
            });

            setScanCount(prev => prev + 1);
            const result: ScanResult = {
                status: 'approved',
                message: 'Boarding approved',
                passengerName,
                pnr: checkin.pnr,
                flight,
                seat: checkin.seatNumber,
                boardingGroup: checkin.boardingGroup,
                origin,
                destination,
                checkinId: checkin.id,
            };
            setScanResult(result);
            setScanHistory(prev => [result, ...prev].slice(0, 20));

        } catch (err) {
            console.error('[Scanner] Validation error:', err);
            setScanResult({
                status: 'denied',
                message: 'Database error during validation. Please try again.',
                pnr,
            });
        }
    };

    // ── Manual PNR Lookup ────────────────────────────────────
    const handleManualLookup = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualPnr.trim().length >= 5) {
            validateAndBoard(manualPnr.trim().toUpperCase());
            setManualPnr('');
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/30">
                        <span className="material-symbols-outlined text-white text-2xl">qr_code_scanner</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-navy-950 uppercase tracking-tight">Boarding Scanner</h1>
                        <p className="text-xs text-navy-400 font-bold uppercase tracking-wider">Gate Operations — {BRAND.shortName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-5 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Boarded</p>
                        <p className="text-2xl font-black text-emerald-600 font-mono">{scanCount}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── Left: Scanner Area ─────────────────────────────── */}
                <div className="space-y-6">
                    {/* Camera viewport */}
                    <div className="bg-navy-950 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="px-5 py-3 flex items-center justify-between border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-navy-500'}`} />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {isScanning ? 'Camera Active' : 'Camera Off'}
                                </span>
                            </div>
                            <button
                                onClick={isScanning ? stopScanner : startScanner}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isScanning
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                    }`}
                            >
                                {isScanning ? 'Stop' : 'Start Camera'}
                            </button>
                        </div>
                        <div id="qr-reader" className="w-full aspect-square bg-navy-900 flex items-center justify-center">
                            {!isScanning && (
                                <div className="text-center space-y-4 p-8">
                                    <span className="material-symbols-outlined text-6xl text-navy-700">qr_code_scanner</span>
                                    <p className="text-sm text-navy-500 font-bold">Press "Start Camera" to begin scanning</p>
                                    <p className="text-[10px] text-navy-600">Or use manual PNR entry below</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Manual PNR Entry */}
                    <form onSubmit={handleManualLookup} className="flex gap-3">
                        <div className="flex-1 relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-lg">search</span>
                            <input
                                type="text"
                                value={manualPnr}
                                onChange={e => setManualPnr(e.target.value.toUpperCase())}
                                placeholder="ENTER PNR MANUALLY"
                                maxLength={7}
                                className="w-full h-12 pl-12 pr-4 bg-white border-2 border-navy-200 rounded-xl text-sm font-black text-navy-950 uppercase tracking-widest placeholder:text-navy-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={manualPnr.trim().length < 5}
                            className="h-12 px-6 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                        >
                            Validate
                        </button>
                    </form>
                </div>

                {/* ── Right: Result & History ───────────────────────── */}
                <div className="space-y-6">

                    {/* Validation Result Card */}
                    {scanResult ? (
                        <div className={`rounded-2xl overflow-hidden shadow-2xl border-2 transition-all ${scanResult.status === 'approved'
                                ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white'
                                : scanResult.status === 'already_boarded'
                                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white'
                                    : 'border-red-300 bg-gradient-to-br from-red-50 to-white'
                            }`}>
                            {/* Status Banner */}
                            <div className={`px-6 py-4 flex items-center gap-3 ${scanResult.status === 'approved'
                                    ? 'bg-emerald-500'
                                    : scanResult.status === 'already_boarded'
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                }`}>
                                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {scanResult.status === 'approved' ? 'check_circle'
                                        : scanResult.status === 'already_boarded' ? 'warning'
                                            : 'cancel'}
                                </span>
                                <div>
                                    <p className="text-lg font-black text-white uppercase tracking-wider">
                                        {scanResult.status === 'approved' ? 'Approved'
                                            : scanResult.status === 'already_boarded' ? 'Already Boarded'
                                                : 'Denied'}
                                    </p>
                                    <p className="text-[10px] text-white/70 font-bold">{scanResult.message}</p>
                                </div>
                            </div>

                            {/* Details */}
                            {scanResult.passengerName && (
                                <div className="px-6 py-5 space-y-4">
                                    <div>
                                        <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Passenger</p>
                                        <p className="text-xl font-black text-navy-950 uppercase tracking-tight">{scanResult.passengerName}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-t border-dashed pt-3">
                                        <div>
                                            <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">PNR</p>
                                            <p className="text-sm font-black text-primary font-mono tracking-wider">{scanResult.pnr}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">Seat</p>
                                            <p className="text-sm font-black text-primary">{scanResult.seat || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">Group</p>
                                            <p className="text-sm font-black text-navy-950">{scanResult.boardingGroup || '—'}</p>
                                        </div>
                                    </div>
                                    {(scanResult.origin || scanResult.destination) && (
                                        <div className="grid grid-cols-2 gap-4 border-t border-dashed pt-3">
                                            <div>
                                                <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">From</p>
                                                <p className="text-sm font-black text-navy-950">{scanResult.origin}</p>
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-bold text-navy-300 uppercase tracking-widest">To</p>
                                                <p className="text-sm font-black text-navy-950">{scanResult.destination}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white border-2 border-dashed border-navy-200 p-8 text-center space-y-3">
                            <span className="material-symbols-outlined text-5xl text-navy-200">qr_code_2</span>
                            <p className="text-sm font-bold text-navy-300">Scan a boarding pass or enter a PNR</p>
                            <p className="text-[10px] text-navy-400">Results will appear here</p>
                        </div>
                    )}

                    {/* Recent Scans History */}
                    {scanHistory.length > 0 && (
                        <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden shadow-lg">
                            <div className="px-5 py-3 border-b border-navy-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Recent Scans</span>
                                <span className="text-[10px] font-bold text-navy-300">{scanHistory.length} scanned</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-navy-50">
                                {scanHistory.map((item, i) => (
                                    <div key={i} className="px-5 py-2.5 flex items-center gap-3 hover:bg-navy-50/50 transition-colors">
                                        <span className={`material-symbols-outlined text-sm ${item.status === 'approved' ? 'text-emerald-500'
                                                : item.status === 'already_boarded' ? 'text-amber-500'
                                                    : 'text-red-500'
                                            }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {item.status === 'approved' ? 'check_circle'
                                                : item.status === 'already_boarded' ? 'warning'
                                                    : 'cancel'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-navy-800 truncate">
                                                {item.passengerName || item.pnr || 'Unknown'}
                                            </p>
                                            <p className="text-[10px] text-navy-400">{item.message}</p>
                                        </div>
                                        {item.seat && (
                                            <span className="text-[10px] font-black text-primary">{item.seat}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BoardingScanner;
