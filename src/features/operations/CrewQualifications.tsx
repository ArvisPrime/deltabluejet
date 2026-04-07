import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    subscribeToCrew, updateCrewMember,
    ROLE_META, AIRCRAFT_TYPES, getExpiryStatus, getExpiringQualifications,
    type CrewMember, type TypeRating, type MedicalCertificate,
} from '../../services/crewService';

// ─── Status colors ──────────────────────────────────────────

const STATUS_COLORS = {
    valid:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    expiring: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
    expired:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
    none:     { bg: 'bg-navy-50/30', text: 'text-navy-300',    border: 'border-navy-50',     dot: 'bg-navy-200' },
};

const CrewQualifications: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
    const [saving, setSaving] = useState(false);
    const [warningDays, setWarningDays] = useState(60);

    // ── Edit state ──────────────────────────────────────────
    const [editRatings, setEditRatings] = useState<TypeRating[]>([]);
    const [editMedical, setEditMedical] = useState<MedicalCertificate>({ class: 'Class 1', issueDate: '', expiryDate: '', status: 'valid' });
    const [editPassport, setEditPassport] = useState('');
    const [editRecency, setEditRecency] = useState({ lastLandingDate: '', landingsLast90Days: 0 });

    useEffect(() => {
        const unsub = subscribeToCrew(data => {
            setCrew(data.filter(c => c.status !== 'inactive'));
            setLoading(false);
        });
        return unsub;
    }, []);

    const expiring = useMemo(() => getExpiringQualifications(crew, warningDays), [crew, warningDays]);
    const pilots = crew.filter(c => c.role === 'captain' || c.role === 'first_officer');

    const openDetail = (m: CrewMember) => {
        setSelectedMember(m);
        setEditRatings(m.typeRatings?.length ? [...m.typeRatings] : []);
        setEditMedical(m.medicalCertificate || { class: 'Class 1', issueDate: '', expiryDate: '', status: 'valid' });
        setEditPassport(m.passportExpiry || '');
        setEditRecency(m.recency || { lastLandingDate: '', landingsLast90Days: 0 });
    };

    const addRating = () => {
        setEditRatings([...editRatings, { aircraftType: AIRCRAFT_TYPES[0], issueDate: '', expiryDate: '', status: 'valid' }]);
    };

    const removeRating = (idx: number) => {
        setEditRatings(editRatings.filter((_, i) => i !== idx));
    };

    const updateRating = (idx: number, field: keyof TypeRating, value: string) => {
        const updated = [...editRatings];
        (updated[idx] as any)[field] = value;
        if (field === 'expiryDate' && value) {
            updated[idx].status = getExpiryStatus(value);
        }
        setEditRatings(updated);
    };

    const handleSave = async () => {
        if (!selectedMember) return;
        setSaving(true);
        try {
            await updateCrewMember(selectedMember.id, {
                typeRatings: editRatings.map(r => ({ ...r, status: r.expiryDate ? getExpiryStatus(r.expiryDate) : 'valid' })),
                medicalCertificate: editMedical.expiryDate ? { ...editMedical, status: getExpiryStatus(editMedical.expiryDate) } : undefined,
                passportExpiry: editPassport || undefined,
                recency: editRecency.lastLandingDate ? { ...editRecency, current: editRecency.landingsLast90Days >= 3 } : undefined,
            } as any);
            addToast(`${selectedMember.name}'s qualifications updated`, 'success');
            setSelectedMember(null);
        } catch (err) {
            console.error('Save quals error:', err);
            addToast('Failed to save qualifications', 'error');
        } finally { setSaving(false); }
    };

    // Helper: get rating status for matrix cell
    const getRatingStatus = (member: CrewMember, aircraft: string): 'valid' | 'expiring' | 'expired' | 'none' => {
        const rating = member.typeRatings?.find(r => r.aircraftType === aircraft);
        if (!rating) return 'none';
        return getExpiryStatus(rating.expiryDate);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display">
            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Qualification Matrix</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                        Type Ratings • Medical Certs • Recency Tracking
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={warningDays}
                        onChange={e => setWarningDays(Number(e.target.value))}
                        className="h-10 px-4 bg-white border border-navy-100 rounded-xl font-bold text-xs text-navy-700"
                    >
                        <option value={30}>30-day warning</option>
                        <option value={60}>60-day warning</option>
                        <option value={90}>90-day warning</option>
                    </select>
                </div>
            </div>

            {/* ── Expiry Alerts ───────────────────────────── */}
            {expiring.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">notifications_active</span>
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                            {expiring.length} Expiring Within {warningDays} Days
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {expiring.slice(0, 9).map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                                <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm text-amber-600">schedule</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-navy-950 truncate">{item.member.name}</p>
                                    <p className="text-[9px] font-bold text-amber-600">{item.type} — {item.daysRemaining}d left</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Qualification Matrix Grid ───────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-navy-50 flex items-center justify-between">
                    <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">grid_view</span>
                        Type Rating Matrix — Flight Crew
                    </h2>
                    <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{pilots.length} pilots</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-navy-50">
                                <th className="px-6 py-3 text-left text-[9px] font-black text-navy-400 uppercase tracking-widest sticky left-0 bg-white z-10">Crew Member</th>
                                <th className="px-3 py-3 text-left text-[9px] font-black text-navy-400 uppercase tracking-widest">Medical</th>
                                {AIRCRAFT_TYPES.map(type => (
                                    <th key={type} className="px-3 py-3 text-center text-[9px] font-black text-navy-400 uppercase tracking-widest whitespace-nowrap">{type}</th>
                                ))}
                                <th className="px-4 py-3 text-center text-[9px] font-black text-navy-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-50">
                            {pilots.map(member => {
                                const medStatus = member.medicalCertificate
                                    ? getExpiryStatus(member.medicalCertificate.expiryDate)
                                    : 'none';
                                const medColors = STATUS_COLORS[medStatus];
                                return (
                                    <tr key={member.id} className="hover:bg-navy-50/20 transition-all">
                                        <td className="px-6 py-3 sticky left-0 bg-white z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-8 rounded-xl flex items-center justify-center ${ROLE_META[member.role].color}`}>
                                                    <span className="material-symbols-outlined text-sm">{ROLE_META[member.role].icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-navy-950">{member.name}</p>
                                                    <p className="text-[8px] font-bold text-navy-400">{ROLE_META[member.role].label} • {member.baseAirport || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${medColors.bg} ${medColors.text} border ${medColors.border}`}>
                                                <span className={`size-1.5 rounded-full ${medColors.dot}`} />
                                                {medStatus === 'none' ? 'N/A' : medStatus}
                                            </span>
                                        </td>
                                        {AIRCRAFT_TYPES.map(type => {
                                            const status = getRatingStatus(member, type);
                                            const colors = STATUS_COLORS[status];
                                            return (
                                                <td key={type} className="px-3 py-3 text-center">
                                                    {status !== 'none' ? (
                                                        <span className={`inline-flex size-6 rounded-lg items-center justify-center ${colors.bg} border ${colors.border}`}>
                                                            <span className={`size-2 rounded-full ${colors.dot}`} />
                                                        </span>
                                                    ) : (
                                                        <span className="text-navy-200 text-xs">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => openDetail(member)}
                                                className="p-2 hover:bg-blue-50 rounded-xl text-navy-300 hover:text-blue-600 transition-all"
                                                title="Edit qualifications"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {pilots.length === 0 && (
                    <div className="text-center py-16 space-y-3">
                        <span className="material-symbols-outlined text-5xl text-navy-200">school</span>
                        <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No flight crew found</p>
                    </div>
                )}

                {/* Legend */}
                <div className="px-8 py-4 border-t border-navy-50 flex items-center gap-6">
                    {(['valid', 'expiring', 'expired', 'none'] as const).map(status => {
                        const colors = STATUS_COLORS[status];
                        return (
                            <div key={status} className="flex items-center gap-2">
                                <span className={`size-3 rounded-full ${colors.dot}`} />
                                <span className="text-[8px] font-black text-navy-500 uppercase tracking-widest">{status === 'none' ? 'Not Rated' : status}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── All Crew Qualifications Summary ─────────── */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-navy-50">
                    <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">badge</span>
                        All Crew — Qualification Summary
                    </h2>
                </div>
                <div className="divide-y divide-navy-50">
                    {crew.map(m => {
                        const ratingsCount = m.typeRatings?.length || 0;
                        const medStatus = m.medicalCertificate ? getExpiryStatus(m.medicalCertificate.expiryDate) : 'none';
                        const passStatus = m.passportExpiry ? getExpiryStatus(m.passportExpiry) : 'none';
                        const recCurrent = m.recency ? m.recency.landingsLast90Days >= 3 : false;

                        return (
                            <div key={m.id} className="px-8 py-4 flex items-center justify-between hover:bg-navy-50/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`size-10 rounded-xl flex items-center justify-center ${ROLE_META[m.role].color}`}>
                                        <span className="material-symbols-outlined text-lg">{ROLE_META[m.role].icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-navy-950">{m.name}</p>
                                        <p className="text-[9px] font-bold text-navy-400">{ROLE_META[m.role].label} • {m.employeeId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${ratingsCount > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-navy-50 text-navy-400 border-navy-100'}`}>
                                        {ratingsCount} rating{ratingsCount !== 1 ? 's' : ''}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${STATUS_COLORS[medStatus].bg} ${STATUS_COLORS[medStatus].text} ${STATUS_COLORS[medStatus].border}`}>
                                        Med: {medStatus === 'none' ? 'N/A' : medStatus}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${STATUS_COLORS[passStatus].bg} ${STATUS_COLORS[passStatus].text} ${STATUS_COLORS[passStatus].border}`}>
                                        Pass: {passStatus === 'none' ? 'N/A' : passStatus}
                                    </span>
                                    {(m.role === 'captain' || m.role === 'first_officer') && (
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${recCurrent ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            {recCurrent ? 'Current' : 'Not Current'}
                                        </span>
                                    )}
                                    <button onClick={() => openDetail(m)} className="p-2 hover:bg-blue-50 rounded-xl text-navy-300 hover:text-blue-600 transition-all">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Edit Qualifications Modal ───────────────── */}
            {selectedMember && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-navy-950 tracking-tight">{selectedMember.name}</h3>
                                <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{ROLE_META[selectedMember.role].label} • {selectedMember.employeeId}</p>
                            </div>
                            <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-navy-50 rounded-xl text-navy-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Type Ratings */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-navy-600 uppercase tracking-widest">Type Ratings</h4>
                                <button onClick={addRating} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">add</span> Add Rating
                                </button>
                            </div>
                            {editRatings.length === 0 && (
                                <p className="text-xs text-navy-300 italic">No type ratings recorded</p>
                            )}
                            {editRatings.map((r, idx) => (
                                <div key={idx} className="grid grid-cols-4 gap-3 items-end p-3 bg-navy-50/30 rounded-xl border border-navy-50">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-navy-400 uppercase">Aircraft</label>
                                        <select value={r.aircraftType} onChange={e => updateRating(idx, 'aircraftType', e.target.value)} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100">
                                            {AIRCRAFT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-navy-400 uppercase">Issue Date</label>
                                        <input type="date" value={r.issueDate} onChange={e => updateRating(idx, 'issueDate', e.target.value)} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-navy-400 uppercase">Expiry Date</label>
                                        <input type="date" value={r.expiryDate} onChange={e => updateRating(idx, 'expiryDate', e.target.value)} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        {r.expiryDate && (
                                            <span className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase ${STATUS_COLORS[getExpiryStatus(r.expiryDate)].bg} ${STATUS_COLORS[getExpiryStatus(r.expiryDate)].text}`}>
                                                {getExpiryStatus(r.expiryDate)}
                                            </span>
                                        )}
                                        <button onClick={() => removeRating(idx)} className="p-1.5 hover:bg-red-50 text-navy-300 hover:text-red-500 rounded-lg">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Medical Certificate */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-navy-600 uppercase tracking-widest">Medical Certificate</h4>
                            <div className="grid grid-cols-3 gap-3 p-3 bg-navy-50/30 rounded-xl border border-navy-50">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-navy-400 uppercase">Class</label>
                                    <select value={editMedical.class} onChange={e => setEditMedical({ ...editMedical, class: e.target.value })} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100">
                                        <option value="Class 1">Class 1</option>
                                        <option value="Class 2">Class 2</option>
                                        <option value="Class 3">Class 3</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-navy-400 uppercase">Issue Date</label>
                                    <input type="date" value={editMedical.issueDate} onChange={e => setEditMedical({ ...editMedical, issueDate: e.target.value })} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-navy-400 uppercase">Expiry Date</label>
                                    <input type="date" value={editMedical.expiryDate} onChange={e => setEditMedical({ ...editMedical, expiryDate: e.target.value })} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                </div>
                            </div>
                        </div>

                        {/* Passport & Recency */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-navy-600 uppercase tracking-widest">Passport Expiry</h4>
                                <input type="date" value={editPassport} onChange={e => setEditPassport(e.target.value)} className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-xs text-navy-950 border border-navy-50" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-navy-600 uppercase tracking-widest">Landing Recency</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-navy-400 uppercase">Last Landing</label>
                                        <input type="date" value={editRecency.lastLandingDate} onChange={e => setEditRecency({ ...editRecency, lastLandingDate: e.target.value })} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-navy-400 uppercase">Landings (90d)</label>
                                        <input type="number" min={0} value={editRecency.landingsLast90Days} onChange={e => setEditRecency({ ...editRecency, landingsLast90Days: Number(e.target.value) })} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-2">
                            <button onClick={() => setSelectedMember(null)} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 flex items-center gap-2">
                                {saving ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>) : 'Save Qualifications'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrewQualifications;
