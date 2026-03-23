import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';

// ─── FAQ Data ──────────────────────────────────────────────

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const FAQ_DATA: FAQItem[] = [
    // Booking
    { category: 'Booking', question: 'How do I book a flight?', answer: 'Visit our homepage and use the flight search form. Enter your departure and destination cities, travel dates, number of passengers, and preferred cabin class. Click "Search Flights" to see available options, then follow the booking flow to complete your reservation.' },
    { category: 'Booking', question: 'Can I book a multi-city itinerary?', answer: 'Yes! Select "Multi-City" on the flight search page. You can add up to 4 flight segments with different routes and dates. Multi-city bookings follow the same payment and confirmation process.' },
    { category: 'Booking', question: 'How do I modify my booking?', answer: 'Go to "Manage Booking" and enter your booking reference (PNR) and last name. From there you can change dates, routes, or passenger details. Modification fees may apply depending on your fare class.' },
    { category: 'Booking', question: 'What is the cancellation policy?', answer: 'Cancellation policies vary by fare class. Full Economy (Y class) tickets are fully refundable. Economy Standard and below are non-refundable but may receive credit for future travel. You can cancel online via the Manage Booking page.' },
    { category: 'Booking', question: 'How do I book for a group of 10+ people?', answer: 'Visit our Group Booking page for groups of 10 or more passengers. You\'ll receive volume discounts ranging from 5% to 20% depending on group size. Our team will contact you within 24 hours with a personalized quote.' },

    // Baggage
    { category: 'Baggage', question: 'What is the checked baggage allowance?', answer: 'Economy class: 1 bag up to 23kg. Business class: 2 bags up to 32kg each. First class: 3 bags up to 32kg each. Carry-on: 1 bag up to 7kg plus 1 personal item for all classes.' },
    { category: 'Baggage', question: 'How do I add extra baggage?', answer: 'You can add extra baggage during booking, at online check-in, or at the airport. Pre-purchasing online is the most cost-effective option — typically 30-50% cheaper than airport counter fees.' },
    { category: 'Baggage', question: 'What should I do if my baggage is lost or delayed?', answer: 'Report missing baggage immediately at the Baggage Service desk before leaving the airport. You\'ll receive a Property Irregularity Report (PIR) number to track your bag. Use our Baggage Tracking page to monitor status. Most delayed bags are delivered within 24-48 hours.' },
    { category: 'Baggage', question: 'Can I track my checked baggage?', answer: 'Yes, use the Baggage Tracking feature on our website. Enter your PIR number or booking reference. We provide real-time updates on your bag\'s location from check-in to arrival.' },

    // Check-in
    { category: 'Check-in', question: 'When does online check-in open?', answer: 'Online check-in opens 48 hours before departure and closes 2 hours before departure for international flights (1 hour for domestic). Check in early to get the best seat selection.' },
    { category: 'Check-in', question: 'Can I choose my seat during check-in?', answer: 'Yes, you can select or change your seat during online check-in. Standard seats are complimentary; premium seats (extra legroom, exit row) may require an additional fee depending on your fare class.' },
    { category: 'Check-in', question: 'Do I need to print my boarding pass?', answer: 'No, we accept mobile boarding passes on your smartphone. After completing online check-in, your boarding pass will be available in the app and via email. You can also add it to Apple Wallet or Google Wallet.' },

    // Loyalty
    { category: 'Loyalty', question: 'How do I earn miles?', answer: 'Miles are earned on every Deltablue Jet Air flight based on distance flown and fare class. You also earn miles through our partner airlines, hotel bookings, car rentals, and credit card spending with our loyalty partners.' },
    { category: 'Loyalty', question: 'What are the loyalty tier levels?', answer: 'We offer three tiers: Silver (10,000+ miles), Gold (25,000+ miles), and Platinum (50,000+ miles). Each tier offers increasing benefits including lounge access, priority boarding, extra baggage, and upgrade vouchers.' },
    { category: 'Loyalty', question: 'How do I redeem my miles?', answer: 'Visit the Loyalty Redemption page in your account. You can redeem miles for flights, upgrades, extra baggage, or lounge access. Miles + Cash options let you use a combination of miles and money.' },

    // Payments
    { category: 'Payments', question: 'What payment methods do you accept?', answer: 'We accept Visa, Mastercard, American Express, PayPal, bank transfers, and mobile money (for select markets). All payments are processed securely via Stripe with 3D Secure authentication.' },
    { category: 'Payments', question: 'Is my payment information secure?', answer: 'Yes, we use bank-grade encryption and PCI DSS Level 1 compliance. All transactions are processed through Stripe — we never store your full card number. 3D Secure adds an extra layer of authentication.' },
    { category: 'Payments', question: 'Can I pay in my local currency?', answer: 'Yes, we support 10 currencies including USD, EUR, GBP, GMD, XOF, and more. Use the currency selector on any page to switch. Exchange rates are updated hourly from live market data.' },

    // Disruptions
    { category: 'Disruptions', question: 'What happens if my flight is cancelled?', answer: 'We will automatically rebook you on the next available flight at no extra cost. If the delay exceeds 2 hours, you\'re entitled to meal vouchers. For overnight delays, we arrange complimentary hotel accommodation and transport.' },
    { category: 'Disruptions', question: 'Am I entitled to compensation for delays?', answer: 'For delays over 3 hours on arrival, you may be entitled to compensation under EU261-equivalent regulations: up to €250 for short-haul, €400 for medium-haul, and €600 for long-haul flights. Compensation does not apply in extraordinary circumstances.' },
    { category: 'Disruptions', question: 'How will I be notified of flight changes?', answer: 'We send notifications via email, SMS, and push notifications (if enabled). Notifications are sent immediately when disruptions are detected, with rebooking information included when available.' },

    // Special Services
    { category: 'Special Services', question: 'How do I request wheelchair assistance?', answer: 'Add special assistance during booking or through the Special Assistance page. We offer wheelchair assistance to/from the gate, onboard wheelchair, and meet-and-assist services. Request at least 48 hours before departure.' },
    { category: 'Special Services', question: 'Can unaccompanied minors travel on Deltablue?', answer: 'Yes, children aged 5-14 travelling alone can use our Unaccompanied Minor (UMNR) service. The child is supervised from check-in to handoff at the destination. A mandatory fee applies and must be booked through our support team or Special Assistance page.' },
];

const CATEGORIES = ['All', 'Booking', 'Baggage', 'Check-in', 'Loyalty', 'Payments', 'Disruptions', 'Special Services'];

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
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    const filteredFAQs = useMemo(() => {
        let items = FAQ_DATA;
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
    }, [searchQuery, activeCategory]);

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
                {CATEGORIES.map(cat => (
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
                        <span className="material-symbols-outlined text-sm">{CATEGORY_ICONS[cat]}</span>
                        {cat}
                    </button>
                ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-3 max-w-3xl">
                {filteredFAQs.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-navy-200 mb-3">search_off</span>
                        <p className="text-xs font-black text-navy-300 uppercase tracking-widest mb-2">No results found</p>
                        <p className="text-xs text-navy-400">Try a different search term or browse by category</p>
                    </div>
                ) : (
                    filteredFAQs.map((faq, i) => {
                        const isOpen = expandedIdx === i;
                        return (
                            <div key={i} className="bg-white rounded-2xl border border-navy-100 overflow-hidden transition-shadow hover:shadow-md">
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
