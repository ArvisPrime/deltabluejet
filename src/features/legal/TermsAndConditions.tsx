import React from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';

const TermsAndConditions: React.FC = () => {
    const sections = [
        {
            id: 'definitions',
            title: '1. Definitions',
            icon: 'menu_book',
            content: [
                '"Carrier" refers to Deltablue Jet Air Ltd., operating under the trade name DeltaBlue Jet Air.',
                '"Passenger" refers to any person, except members of the crew, carried or to be carried in an aircraft pursuant to a Ticket.',
                '"Ticket" means the electronic document issued by the Carrier confirming a booking, including the e-ticket itinerary/receipt and any boarding pass.',
                '"Booking" means a confirmed reservation for carriage on a specific flight, identified by a Passenger Name Record (PNR).',
                '"Fare" means the price charged for carriage of a Passenger and their baggage, exclusive of taxes, fees, and surcharges unless otherwise specified.',
                '"Days" means calendar days, including Sundays and public holidays.',
            ],
        },
        {
            id: 'tickets',
            title: '2. Tickets & Reservations',
            icon: 'confirmation_number',
            content: [
                'A Ticket is evidence of the contract of carriage between the Carrier and the Passenger named in the Ticket. The Ticket is non-transferable.',
                'Reservations may be made through the Carrier\'s website, mobile application, authorized travel agents, or the Carrier\'s contact center.',
                'A Ticket shall only entitle the Passenger to carriage from the point of origin to the destination via any agreed stopping places.',
                'Each Booking is confirmed with a unique six-character PNR code. Passengers must retain this code for managing, modifying, or cancelling their booking.',
                'The Carrier reserves the right to cancel a reservation if full payment is not received within the specified ticketing time limit.',
            ],
        },
        {
            id: 'fares',
            title: '3. Fares, Taxes & Payment',
            icon: 'payments',
            content: [
                'Fares apply only for carriage from the airport at the point of origin to the airport at the point of destination. Fares do not include ground transport services.',
                'All applicable taxes, airport charges, fuel surcharges, and government-imposed fees are collected in addition to the published fare.',
                'Fares are denominated in the currency specified at time of booking. Payment may be made by credit card, debit card, mobile money, or bank transfer.',
                'The Carrier accepts Visa, Mastercard, and selected mobile money providers. All payment processing is secured via PCI-DSS compliant systems.',
                'Fares are guaranteed only upon receipt of full payment and issuance of an e-ticket. Quoted fares may change prior to completed payment.',
            ],
        },
        {
            id: 'cancellations',
            title: '4. Cancellation & Refund Policy',
            icon: 'event_busy',
            content: [
                'Voluntary cancellations made more than 72 hours before scheduled departure are eligible for a refund based on fare class: Economy (75%), Business (90%), First Class (100% minus administrative fee).',
                'Cancellations made between 24 and 72 hours before departure: Economy (50%), Business (75%), First Class (100% minus administrative fee).',
                'Cancellations made less than 24 hours before departure: Economy (non-refundable), Business (25%), First Class (100% minus administrative fee).',
                'Involuntary cancellations initiated by the Carrier entitle Passengers to a full refund or rebooking on the next available flight at no additional cost.',
                'Refunds are processed to the original form of payment within 7–14 business days. Alternatively, Passengers may opt to receive a travel voucher of equal or greater value.',
                'In the event of significant delays (3+ hours for short-haul, 4+ hours for long-haul), Passengers may be entitled to compensation in accordance with applicable regulations including EU Regulation 261/2004.',
            ],
        },
        {
            id: 'baggage',
            title: '5. Baggage',
            icon: 'luggage',
            content: [
                'Each Passenger is entitled to a free baggage allowance as specified by the fare class and route. Specific allowances are displayed during the booking process.',
                'Carry-on baggage is limited to one bag not exceeding 8 kg and dimensions of 55 × 40 × 20 cm, plus one small personal item.',
                'The Carrier is not liable for fragile, perishable, or valuable items packed in checked baggage. Passengers are advised to carry such items in their hand luggage.',
                'Excess, overweight, or oversized baggage may be accepted subject to availability and payment of applicable excess baggage charges.',
                'The Carrier\'s liability for lost, delayed, or damaged baggage is limited in accordance with the Montreal Convention as applicable.',
                'Dangerous goods, hazardous materials, and prohibited items as defined by IATA regulations must not be packed in either checked or carry-on baggage.',
            ],
        },
        {
            id: 'checkin',
            title: '6. Check-in & Boarding',
            icon: 'how_to_reg',
            content: [
                'Online check-in opens 48 hours and closes 2 hours before scheduled departure for international flights.',
                'Airport check-in counters open 3 hours and close 60 minutes before scheduled departure for international flights.',
                'Passengers must present a valid boarding pass (electronic or printed) and a government-issued photo ID or passport at the boarding gate.',
                'Boarding gates close 20 minutes before scheduled departure. Passengers who fail to present themselves at the gate before closure will be denied boarding.',
                'The Carrier reserves the right to deny boarding to any Passenger who appears to be under the influence of alcohol or drugs, is abusive, or poses a security risk.',
            ],
        },
        {
            id: 'liability',
            title: '7. Liability',
            icon: 'gavel',
            content: [
                'The Carrier\'s liability for death or bodily injury to Passengers is governed by the Montreal Convention. The Carrier shall not limit its liability for proven damages up to 128,821 Special Drawing Rights (SDR) per Passenger.',
                'The Carrier is not liable for any damage caused by compliance with applicable laws, government regulations, orders, or requirements.',
                'The Carrier is not liable for delay or failure to perform caused by circumstances beyond its control, including but not limited to: severe weather, air traffic control restrictions, security threats, strikes, and government actions.',
                'Any claim for damages must be submitted in writing to the Carrier within 21 days of the date of the incident (7 days for baggage damage).',
            ],
        },
        {
            id: 'governing-law',
            title: '8. Governing Law',
            icon: 'balance',
            content: [
                'These Conditions of Carriage shall be governed by and construed in accordance with applicable international aviation conventions including the Montreal Convention (1999) and Warsaw Convention (1929).',
                'In the absence of applicable international convention provisions, these conditions shall be governed by the laws of the jurisdiction of the Carrier\'s registered office.',
                'Any dispute arising from or in connection with these conditions shall be subject to the exclusive jurisdiction of the courts of the Carrier\'s registered office, unless otherwise required by applicable law.',
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-navy-50 font-display">
            {/* Hero */}
            <div className="bg-navy-950 text-white py-16 md:py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary/30 blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-blue-400/20 blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">description</span>
                        <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Legal</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                        Terms & <span className="text-primary">Conditions</span>
                    </h1>
                    <p className="text-navy-400 font-bold mt-4 text-sm md:text-base uppercase tracking-wider">
                        Conditions of Carriage — Effective March 2026
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="bg-white rounded-2xl border border-navy-100 p-4 shadow-sm">
                    <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] mb-3">Quick Navigation</h3>
                    <div className="flex flex-wrap gap-2">
                        {sections.map((s) => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                className="px-3 py-1.5 bg-navy-50 rounded-lg text-[10px] font-bold text-navy-600 uppercase tracking-wider hover:bg-primary/10 hover:text-primary transition-all"
                            >
                                {s.title}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="max-w-4xl mx-auto px-4 pb-20 space-y-6">
                {sections.map((section) => (
                    <section
                        key={section.id}
                        id={section.id}
                        className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden scroll-mt-24"
                    >
                        <div className="bg-navy-50/50 px-6 md:px-8 py-5 border-b border-navy-100 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">{section.icon}</span>
                            <h2 className="text-sm font-black text-navy-900 uppercase tracking-widest">{section.title}</h2>
                        </div>
                        <div className="px-6 md:px-8 py-6 space-y-4">
                            {section.content.map((paragraph, i) => (
                                <p key={i} className="text-sm text-navy-600 leading-relaxed font-medium">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </section>
                ))}

                {/* Contact */}
                <div className="bg-blue-50/50 rounded-3xl border border-blue-100 p-6 md:p-8 flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary p-3 bg-white rounded-xl shadow-sm text-2xl">support_agent</span>
                    <div>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Questions about our terms?</h3>
                        <p className="text-xs text-navy-500 font-bold mt-2 leading-relaxed">
                            If you have any questions about these Conditions of Carriage, please contact our Customer Relations team at{' '}
                            <a href="mailto:legal@deltabluejet.com" className="text-primary hover:underline">legal@deltabluejet.com</a>.
                        </p>
                        <Link
                            to={ROUTES.ABOUT}
                            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm">contact_support</span>
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
