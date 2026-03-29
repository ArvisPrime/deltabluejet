import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { subscribeToFAQs, type FAQItem } from '../../services/faqService';

const CATEGORY_ICONS: Record<string, string> = {
    All: 'apps',
    Booking: 'confirmation_number',
    Baggage: 'luggage',
    'Check-in': 'check_circle',
    Loyalty: 'stars',
    Payments: 'payment',
    Disruptions: 'flight_land',
    'Special Services': 'accessible',
};

// ─── Component ─────────────────────────────────────────────

const HelpCenter: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    useEffect(() => {
        const unsub = subscribeToFAQs((data) => {
            setFaqs(data.filter(f => f.active));
            setLoading(false);
        });
        return unsub;
    }, []);

    // Derive categories from live data
    const categories = useMemo(() => {
        const cats = Array.from(new Set(faqs.map(f => f.category)));
        return ['All', ...cats];
    }, [faqs]);

    const filteredFAQs = useMemo(() => {
        let items = faqs;
        if (activeCategory !== 'All') {
            items = items.filter(f => f.category === activeCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(f =>
                f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
            );
        }
        return items;
    }, [faqs, searchQuery, activeCategory]);

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Help Center</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Help Center</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        Find answers to common questions about your travel
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">search</span>
                <input
                    type="text"
                    placeholder="Search for help — e.g. 'baggage allowance', 'cancel booking'..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-navy-100 text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20 shadow-sm"
                    aria-label="Search help center"
                />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setExpandedIdx(null); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeCategory === cat
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-white text-navy-500 border border-navy-100 hover:bg-navy-50'
                        }`}
                        aria-pressed={activeCategory === cat}
                    >
                        <span className="material-symbols-outlined text-sm">{CATEGORY_ICONS[cat] || 'help'}</span>
                        {cat}
                    </button>
                ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-3 max-w-3xl">
                {loading ? (
                    <div className="flex flex-col items-center py-16">
                        <div className="mb-4 size-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
                        <p className="text-xs font-bold text-navy-400">Loading FAQs...</p>
                    </div>
                ) : filteredFAQs.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-navy-200 mb-3">search_off</span>
                        <p className="text-xs font-black text-navy-300 uppercase tracking-widest mb-2">No results found</p>
                        <p className="text-xs text-navy-400">Try a different search term or browse by category</p>
                    </div>
                ) : (
                    filteredFAQs.map((faq, i) => {
                        const isOpen = expandedIdx === i;
                        return (
                            <div key={faq.id} className="bg-white rounded-2xl border border-navy-100 overflow-hidden transition-shadow hover:shadow-md">
                                <button
                                    onClick={() => setExpandedIdx(isOpen ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                    aria-expanded={isOpen}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-primary/5 text-primary shrink-0">
                                            {faq.category}
                                        </span>
                                        <span className="text-sm font-bold text-navy-900 truncate">{faq.question}</span>
                                    </div>
                                    <span className={`material-symbols-outlined text-navy-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 pt-0">
                                        <div className="p-4 bg-navy-50/30 rounded-xl">
                                            <p className="text-sm text-navy-700 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Contact CTA */}
            <div className="mt-12 max-w-3xl bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 border border-primary/10">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-primary">support_agent</span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-black text-navy-950 tracking-tighter mb-1">Can't find what you're looking for?</h3>
                        <p className="text-xs text-navy-500">Our support team is available 24/7 to help with any questions.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to={ROUTES.SUPPORT_TICKETS || '#'}
                            className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20">
                            Submit Ticket
                        </Link>
                        <Link to={ROUTES.CALLBACK_REQUEST || '#'}
                            className="px-6 py-3 border-2 border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-colors">
                            Request Callback
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
