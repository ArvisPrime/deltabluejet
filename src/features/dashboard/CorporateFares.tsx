import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, Timestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useToastStore } from '../../stores/toastStore';

// ─── Types ─────────────────────────────────────────────────

interface CorporateAgreement {
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    bookingCode: string;
    discountPercent: number;
    routeRestrictions: string;  // 'all' or specific routes
    validFrom: string;
    validUntil: string;
    monthlyVolumeTarget: number;
    status: 'active' | 'expired' | 'suspended';
    totalBookings: number;
    totalRevenue: number;
    createdAt: Timestamp;
}

const CorporateFares: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [agreements, setAgreements] = useState<CorporateAgreement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        companyName: '', contactName: '', contactEmail: '',
        bookingCode: '', discountPercent: 10, routeRestrictions: 'all',
        validFrom: '', validUntil: '', monthlyVolumeTarget: 50,
    });

    const loadAgreements = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'corporate_agreements'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setAgreements(snap.docs.map(d => ({ id: d.id, ...d.data() }) as CorporateAgreement));
        } catch (err) {
            addToast('Failed to load corporate agreements', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadAgreements(); }, [loadAgreements]);

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'DB-';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        setFormData(prev => ({ ...prev, bookingCode: code }));
    };

    const handleSave = async () => {
        if (!formData.companyName || !formData.contactEmail || !formData.bookingCode) {
            addToast('Company name, email, and booking code are required', 'error');
            return;
        }
        try {
            if (editingId) {
                await updateDoc(doc(db, 'corporate_agreements', editingId), {
                    ...formData, updatedAt: Timestamp.now(),
                });
                addToast('Agreement updated', 'success');
            } else {
                await addDoc(collection(db, 'corporate_agreements'), {
                    ...formData, status: 'active', totalBookings: 0, totalRevenue: 0, createdAt: Timestamp.now(),
                });
                addToast('Corporate agreement created', 'success');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({
                companyName: '', contactName: '', contactEmail: '',
                bookingCode: '', discountPercent: 10, routeRestrictions: 'all',
                validFrom: '', validUntil: '', monthlyVolumeTarget: 50,
            });
            await loadAgreements();
        } catch (err) {
            addToast('Failed to save agreement', 'error');
        }
    };

    const handleEdit = (agreement: CorporateAgreement) => {
        setFormData({
            companyName: agreement.companyName,
            contactName: agreement.contactName,
            contactEmail: agreement.contactEmail,
            bookingCode: agreement.bookingCode,
            discountPercent: agreement.discountPercent,
            routeRestrictions: agreement.routeRestrictions,
            validFrom: agreement.validFrom,
            validUntil: agreement.validUntil,
            monthlyVolumeTarget: agreement.monthlyVolumeTarget,
        });
        setEditingId(agreement.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this corporate agreement?')) return;
        try {
            await deleteDoc(doc(db, 'corporate_agreements', id));
            addToast('Agreement deleted', 'success');
            await loadAgreements();
        } catch (err) {
            addToast('Failed to delete', 'error');
        }
    };

    const filtered = agreements.filter(a => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return a.companyName.toLowerCase().includes(q) || a.bookingCode.toLowerCase().includes(q);
    });

    const active = agreements.filter(a => a.status === 'active').length;

    const inputClass = 'w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2';

    return (
        <div className="h-full flex flex-col p-8 overflow-hidden font-display">
            <div className="flex flex-col gap-4 mb-8 shrink-0">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">Admin</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Corporate Fares</span>
                </nav>
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Corporate Fares</h1>
                        <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                            Manage negotiated discounts & company booking codes
                        </p>
                    </div>
                    <button onClick={() => { setShowForm(true); setEditingId(null); }}
                        className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">add</span>
                        New Agreement
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                {[
                    { label: 'Total Agreements', val: String(agreements.length), icon: 'handshake', color: 'text-primary' },
                    { label: 'Active', val: String(active), icon: 'check_circle', color: 'text-emerald-500' },
                    { label: 'Total Bookings', val: String(agreements.reduce((s, a) => s + a.totalBookings, 0)), icon: 'confirmation_number', color: 'text-amber-500' },
                    { label: 'Revenue', val: `$${(agreements.reduce((s, a) => s + a.totalRevenue, 0) / 100).toLocaleString()}`, icon: 'paid', color: 'text-navy-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-navy-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                            <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                        </div>
                        <p className="text-3xl font-black text-navy-950 tracking-tighter leading-none">{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-xl max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-navy-900 uppercase text-sm tracking-widest">{editingId ? 'Edit' : 'New'} Agreement</h3>
                            <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-navy-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Company Name *</label>
                                <input type="text" value={formData.companyName} onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Contact Name</label>
                                <input type="text" value={formData.contactName} onChange={e => setFormData(p => ({ ...p, contactName: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Contact Email *</label>
                                <input type="email" value={formData.contactEmail} onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Booking Code *</label>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.bookingCode} onChange={e => setFormData(p => ({ ...p, bookingCode: e.target.value }))} className={`${inputClass} flex-1`} />
                                    <button onClick={generateCode} className="px-3 py-2 bg-navy-100 rounded-xl text-[10px] font-black text-navy-600 hover:bg-navy-200 transition-colors">
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Discount %</label>
                                <input type="number" min={1} max={50} value={formData.discountPercent} onChange={e => setFormData(p => ({ ...p, discountPercent: parseInt(e.target.value) || 0 }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Valid From</label>
                                <input type="date" value={formData.validFrom} onChange={e => setFormData(p => ({ ...p, validFrom: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Valid Until</label>
                                <input type="date" value={formData.validUntil} onChange={e => setFormData(p => ({ ...p, validUntil: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Route Restrictions</label>
                                <select value={formData.routeRestrictions} onChange={e => setFormData(p => ({ ...p, routeRestrictions: e.target.value }))} className={inputClass}>
                                    <option value="all">All Routes</option>
                                    <option value="domestic">Domestic Only</option>
                                    <option value="regional">Regional Only</option>
                                    <option value="international">International Only</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Monthly Volume Target</label>
                                <input type="number" min={1} value={formData.monthlyVolumeTarget} onChange={e => setFormData(p => ({ ...p, monthlyVolumeTarget: parseInt(e.target.value) || 1 }))} className={inputClass} />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 border-2 border-navy-100 rounded-xl font-black text-xs uppercase tracking-widest text-navy-500 hover:bg-navy-50">Cancel</button>
                            <button onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-600">
                                {editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-4 shrink-0">
                <input type="text" placeholder="Search company or booking code..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full max-w-md px-4 py-3 rounded-xl bg-white border border-navy-100 text-xs font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20" />
            </div>

            {/* Agreements Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin size-6 border-2 border-navy-200 border-t-primary rounded-full" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-navy-200 mb-2">business</span>
                            <p className="text-xs font-black text-navy-300 uppercase tracking-widest">No corporate agreements yet</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-navy-100 bg-navy-50/30">
                                    {['Company', 'Code', 'Discount', 'Routes', 'Valid', 'Bookings', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-navy-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id} className="border-b border-navy-50 hover:bg-navy-50/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-black text-navy-950">{a.companyName}</p>
                                            <p className="text-[10px] font-bold text-navy-400">{a.contactEmail}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-mono font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">{a.bookingCode}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-black text-navy-950">{a.discountPercent}%</td>
                                        <td className="px-4 py-3 text-[10px] font-bold text-navy-500 uppercase">{a.routeRestrictions}</td>
                                        <td className="px-4 py-3 text-[10px] font-bold text-navy-400">{a.validFrom || '—'} → {a.validUntil || '—'}</td>
                                        <td className="px-4 py-3 text-xs font-black text-navy-950">{a.totalBookings}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                a.status === 'active' ? 'text-emerald-600 bg-emerald-50' :
                                                a.status === 'expired' ? 'text-navy-400 bg-navy-50' : 'text-red-600 bg-red-50'
                                            }`}>{a.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEdit(a)} className="size-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-400 hover:text-primary hover:bg-primary/10 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(a.id)} className="size-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CorporateFares;
