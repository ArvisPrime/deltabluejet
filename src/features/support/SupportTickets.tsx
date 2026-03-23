import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import {
    createTicket, getUserTickets,
    isSLABreached, getSLATimeRemaining, formatSLARemaining,
    type SupportTicket, type TicketCategory, type TicketPriority,
} from '../../services/supportTicketService';

const CATEGORIES: { value: TicketCategory; label: string; icon: string }[] = [
    { value: 'booking', label: 'Booking', icon: 'confirmation_number' },
    { value: 'baggage', label: 'Baggage', icon: 'luggage' },
    { value: 'refund', label: 'Refund', icon: 'payments' },
    { value: 'check_in', label: 'Check-in', icon: 'check_circle' },
    { value: 'flight_disruption', label: 'Flight Disruption', icon: 'flight_land' },
    { value: 'loyalty', label: 'Loyalty', icon: 'stars' },
    { value: 'payment', label: 'Payment', icon: 'credit_card' },
    { value: 'accessibility', label: 'Accessibility', icon: 'accessible' },
    { value: 'complaint', label: 'Complaint', icon: 'feedback' },
    { value: 'other', label: 'Other', icon: 'help' },
];

const SupportTickets: React.FC = () => {
    const user = useAuthStore(s => s.user);
    const addToast = useToastStore(s => s.addToast);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [formData, setFormData] = useState({
        category: 'booking' as TicketCategory,
        priority: 'medium' as TicketPriority,
        subject: '',
        description: '',
        bookingReference: '',
    });

    const loadTickets = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserTickets(user.uid);
            setTickets(data);
        } catch {
            addToast('Failed to load tickets', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, addToast]);

    useEffect(() => { loadTickets(); }, [loadTickets]);

    const handleSubmit = async () => {
        if (!user) return;
        if (!formData.subject || !formData.description) {
            addToast('Subject and description are required', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await createTicket({
                userId: user.uid,
                customerName: user.displayName || 'Customer',
                customerEmail: user.email || '',
                ...formData,
            });
            addToast('Support ticket created', 'success');
            setShowForm(false);
            setFormData({ category: 'booking', priority: 'medium', subject: '', description: '', bookingReference: '' });
            await loadTickets();
        } catch {
            addToast('Failed to create ticket', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const statusColor = (s: string) => {
        const map: Record<string, string> = {
            open: 'text-blue-600 bg-blue-50',
            in_progress: 'text-amber-600 bg-amber-50',
            escalated: 'text-red-600 bg-red-50',
            resolved: 'text-emerald-600 bg-emerald-50',
            closed: 'text-navy-400 bg-navy-50',
        };
        return map[s] || 'text-navy-400 bg-navy-50';
    };

    const inputClass = 'w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2';

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex flex-col gap-4 mb-8 shrink-0">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Support Tickets</span>
                </nav>
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Support Tickets</h1>
                        <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                            Create and track your support requests
                        </p>
                    </div>
                    <button onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">add</span>
                        New Ticket
                    </button>
                </div>
            </div>

            {/* New Ticket Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-navy-900 uppercase text-sm tracking-widest">New Support Ticket</h3>
                            <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-navy-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CATEGORIES.map(c => (
                                        <button key={c.value} onClick={() => setFormData(p => ({ ...p, category: c.value }))}
                                            className={`flex items-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                formData.category === c.value ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
                                            }`}>
                                            <span className="material-symbols-outlined text-sm">{c.icon}</span>
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Priority</label>
                                <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value as TicketPriority }))} className={inputClass}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Subject *</label>
                                <input type="text" placeholder="Brief summary of your issue" value={formData.subject}
                                    onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Booking Reference (optional)</label>
                                <input type="text" placeholder="e.g. DB-ABC123" value={formData.bookingReference}
                                    onChange={e => setFormData(p => ({ ...p, bookingReference: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Description *</label>
                                <textarea rows={4} placeholder="Describe your issue in detail..." value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className={inputClass} />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 border-2 border-navy-100 rounded-xl font-black text-xs uppercase tracking-widest text-navy-500 hover:bg-navy-50">Cancel</button>
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-600 disabled:opacity-50">
                                {submitting ? 'Creating...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">{selectedTicket.ticketNumber}</h3>
                            <button onClick={() => setSelectedTicket(null)} className="text-navy-400 hover:text-navy-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${statusColor(selectedTicket.status)}`}>
                                    {selectedTicket.status.replace(/_/g, ' ')}
                                </span>
                                {isSLABreached(selectedTicket) ? (
                                    <span className="text-[9px] font-black text-red-600">SLA BREACHED</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-navy-400">SLA: {formatSLARemaining(getSLATimeRemaining(selectedTicket))}</span>
                                )}
                            </div>
                            <h4 className="text-lg font-black text-navy-950 tracking-tighter">{selectedTicket.subject}</h4>
                            <p className="text-sm text-navy-600 leading-relaxed">{selectedTicket.description}</p>
                            {selectedTicket.bookingReference && (
                                <p className="text-[10px] font-bold text-navy-400">Booking: <span className="text-primary">{selectedTicket.bookingReference}</span></p>
                            )}
                            {selectedTicket.notes && selectedTicket.notes.length > 0 && (
                                <div className="border-t border-navy-100 pt-3">
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Updates</p>
                                    {selectedTicket.notes.filter(n => !n.isInternal).map((n, i) => (
                                        <div key={i} className="p-3 bg-navy-50/30 rounded-xl mb-2">
                                            <p className="text-xs text-navy-700">{n.content}</p>
                                            <p className="text-[10px] font-bold text-navy-300 mt-1">{n.author}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tickets List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin size-6 border-2 border-navy-200 border-t-primary rounded-full" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-20">
                    <span className="material-symbols-outlined text-5xl text-navy-200 mb-3">support</span>
                    <p className="text-xs font-black text-navy-300 uppercase tracking-widest mb-2">No support tickets yet</p>
                    <p className="text-xs text-navy-400 mb-6">Create a ticket to get help from our support team</p>
                    <button onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Create Your First Ticket
                    </button>
                </div>
            ) : (
                <div className="space-y-3 max-w-3xl">
                    {tickets.map(t => (
                        <button key={t.id} onClick={() => setSelectedTicket(t)}
                            className="w-full text-left bg-white rounded-2xl border border-navy-100 p-5 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{t.ticketNumber}</p>
                                    <p className="text-sm font-black text-navy-950 tracking-tighter mt-1">{t.subject}</p>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${statusColor(t.status)}`}>
                                    {t.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                <span className="text-[10px] font-bold text-navy-300">{t.category.replace(/_/g, ' ')}</span>
                                <span className="text-[10px] font-bold text-navy-300">•</span>
                                <span className={`text-[10px] font-bold ${isSLABreached(t) ? 'text-red-500' : 'text-navy-300'}`}>
                                    {isSLABreached(t) ? 'SLA Breached' : `SLA: ${formatSLARemaining(getSLATimeRemaining(t))}`}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SupportTickets;
