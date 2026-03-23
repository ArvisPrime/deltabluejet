import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useToastStore } from '../../stores/toastStore';
import {
    getAllTickets, updateTicketStatus, addTicketNote,
    isSLABreached, getSLATimeRemaining, formatSLARemaining,
    type SupportTicket, type TicketStatus,
} from '../../services/supportTicketService';

const ComplaintManagement: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [noteText, setNoteText] = useState('');

    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            const all = await getAllTickets(200);
            setTickets(all);
        } catch {
            addToast('Failed to load tickets', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadTickets(); }, [loadTickets]);

    const filtered = useMemo(() => {
        return tickets.filter(t => {
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!t.ticketNumber.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q) && !t.customerEmail.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [tickets, filterStatus, filterPriority, searchQuery]);

    const metrics = useMemo(() => ({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        breached: tickets.filter(t => isSLABreached(t)).length,
        resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    }), [tickets]);

    const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
        try {
            await updateTicketStatus(ticketId, newStatus);
            addToast(`Ticket updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
            await loadTickets();
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch {
            addToast('Failed to update ticket', 'error');
        }
    };

    const handleAddNote = async () => {
        if (!selectedTicket?.id || !noteText.trim()) return;
        try {
            await addTicketNote(selectedTicket.id, 'Support Agent', noteText, true);
            addToast('Note added', 'success');
            setNoteText('');
            await loadTickets();
        } catch {
            addToast('Failed to add note', 'error');
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

    const priorityColor = (p: string) => {
        const map: Record<string, string> = {
            urgent: 'text-red-600', high: 'text-amber-600', medium: 'text-navy-600', low: 'text-navy-400',
        };
        return map[p] || 'text-navy-400';
    };

    return (
        <div className="h-full flex flex-col p-8 overflow-hidden font-display">
            <div className="flex flex-col gap-4 mb-8 shrink-0">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">Admin</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Complaints</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Complaint Management</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">SLA tracking • Escalation workflow • Resolution management</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                {[
                    { label: 'Total Tickets', val: String(metrics.total), icon: 'assignment', color: 'text-primary' },
                    { label: 'Open', val: String(metrics.open), icon: 'pending', color: 'text-blue-500' },
                    { label: 'SLA Breached', val: String(metrics.breached), icon: 'warning', color: 'text-red-500' },
                    { label: 'Resolved', val: String(metrics.resolved), icon: 'check_circle', color: 'text-emerald-500' },
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

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4 shrink-0">
                <input type="text" placeholder="Search ticket #, subject, email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-64 px-4 py-2.5 rounded-xl bg-white border border-navy-100 text-xs font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-navy-100 text-xs font-bold text-navy-800">
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-navy-100 text-xs font-bold text-navy-800">
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Ticket List */}
                <div className="flex-1 bg-white rounded-2xl border border-navy-100 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex items-center justify-center py-20"><div className="animate-spin size-6 border-2 border-navy-200 border-t-primary rounded-full" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center"><span className="material-symbols-outlined text-4xl text-navy-200 mb-2">inbox</span><p className="text-xs font-black text-navy-300 uppercase tracking-widest">No tickets match filters</p></div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-navy-50/80 backdrop-blur-sm">
                                    <tr className="border-b border-navy-100">
                                        {['Ticket', 'Subject', 'Customer', 'Priority', 'SLA', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-navy-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(t => (
                                        <tr key={t.id} className={`border-b border-navy-50 hover:bg-navy-50/20 transition-colors cursor-pointer ${isSLABreached(t) ? 'bg-red-50/20' : ''}`} onClick={() => setSelectedTicket(t)}>
                                            <td className="px-4 py-3 text-[10px] font-mono font-black text-navy-600">{t.ticketNumber}</td>
                                            <td className="px-4 py-3 text-xs font-bold text-navy-900 max-w-[200px] truncate">{t.subject}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-bold text-navy-800">{t.customerName}</p>
                                                <p className="text-[10px] text-navy-400">{t.customerEmail}</p>
                                            </td>
                                            <td className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest ${priorityColor(t.priority)}`}>{t.priority}</td>
                                            <td className="px-4 py-3">
                                                {isSLABreached(t)
                                                    ? <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full">BREACHED</span>
                                                    : <span className="text-[10px] font-bold text-navy-400">{formatSLARemaining(getSLATimeRemaining(t))}</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${statusColor(t.status)}`}>
                                                    {t.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select value={t.status} onClick={e => e.stopPropagation()} onChange={e => handleStatusChange(t.id!, e.target.value as TicketStatus)}
                                                    className="text-[10px] font-bold bg-navy-50 border-none rounded-lg px-2 py-1 text-navy-600">
                                                    <option value="open">Open</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="escalated">Escalate</option>
                                                    <option value="resolved">Resolve</option>
                                                    <option value="closed">Close</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {selectedTicket && (
                    <div className="w-[340px] shrink-0 bg-white rounded-2xl border border-navy-100 overflow-y-auto custom-scrollbar p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono font-black text-navy-400">{selectedTicket.ticketNumber}</p>
                            <button onClick={() => setSelectedTicket(null)} className="text-navy-300 hover:text-navy-600"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        <h3 className="text-lg font-black text-navy-950 tracking-tighter">{selectedTicket.subject}</h3>
                        <div className="flex gap-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${statusColor(selectedTicket.status)}`}>{selectedTicket.status.replace(/_/g, ' ')}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full bg-navy-50 ${priorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</span>
                        </div>
                        <div className="p-3 bg-navy-50/30 rounded-xl">
                            <p className="text-xs text-navy-700 leading-relaxed">{selectedTicket.description}</p>
                        </div>
                        <div className="space-y-2 text-[10px]">
                            <p className="font-bold text-navy-400">Customer: <span className="text-navy-800">{selectedTicket.customerName}</span></p>
                            <p className="font-bold text-navy-400">Email: <span className="text-navy-800">{selectedTicket.customerEmail}</span></p>
                            {selectedTicket.bookingReference && <p className="font-bold text-navy-400">Booking: <span className="text-primary">{selectedTicket.bookingReference}</span></p>}
                        </div>

                        {/* Add Note */}
                        <div className="border-t border-navy-100 pt-3">
                            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Internal Note</p>
                            <textarea rows={3} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add internal note..."
                                className="w-full px-3 py-2 rounded-xl bg-navy-50 border-none text-xs font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20" />
                            <button onClick={handleAddNote} disabled={!noteText.trim()}
                                className="mt-2 w-full py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 disabled:opacity-30">
                                Add Note
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintManagement;
