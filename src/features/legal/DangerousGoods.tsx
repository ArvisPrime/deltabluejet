import React, { useState } from 'react';

interface ItemCategory {
    name: string;
    icon: string;
    color: string;
    items: string[];
}

const DangerousGoods: React.FC = () => {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const prohibited: ItemCategory[] = [
        { name: 'Explosives', icon: 'bomb', color: 'red', items: ['Fireworks & flares', 'Ammunition', 'Detonators', 'Blasting caps', 'Christmas crackers'] },
        { name: 'Flammable Liquids', icon: 'local_fire_department', color: 'orange', items: ['Gasoline / Petrol', 'Lighter fluid (large)', 'Paint thinners', 'Alcohol over 140 proof (70%)', 'Acetone'] },
        { name: 'Flammable Gases', icon: 'propane_tank', color: 'amber', items: ['Butane / Propane', 'Camping stove fuel', 'Aerosol cans (non-toiletry)', 'Fire extinguishers', 'Compressed gas cylinders'] },
        { name: 'Toxic Substances', icon: 'skull', color: 'purple', items: ['Pesticides & Insecticides', 'Rat poison', 'Infectious substances', 'Biological agents', 'Medical waste'] },
        { name: 'Corrosive Materials', icon: 'science', color: 'teal', items: ['Acids (e.g., sulfuric, hydrochloric)', 'Wet-cell batteries', 'Mercury', 'Bleach (industrial)', 'Drain cleaners'] },
        { name: 'Sharp & Bladed Items', icon: 'carpenter', color: 'slate', items: ['Knives & razors (carry-on)', 'Box cutters', 'Scissors over 10cm (carry-on)', 'Swords & machetes', 'Ice axes & ice picks'] },
    ];

    const restricted = [
        { question: 'Can I carry lithium batteries?', answer: 'Lithium-ion batteries under 100Wh are allowed in carry-on baggage only. Spare batteries must have terminals protected against short circuit. Batteries between 100-160Wh require airline approval. Batteries above 160Wh are prohibited.' },
        { question: 'What about e-cigarettes and vaporizers?', answer: 'E-cigarettes and vaping devices must be carried in your hand luggage only — never in checked baggage. Charging the device on board is strictly prohibited.' },
        { question: 'Can I bring lighters or matches?', answer: 'One small lighter or one book of safety matches is permitted on your person only (not in checked or carry-on bags). Torch lighters and windproof lighters are prohibited entirely.' },
        { question: 'Are power banks allowed?', answer: 'Power banks are treated as spare lithium batteries. They must be carried in hand luggage only and must not exceed 100Wh (approximately 27,000mAh at 3.7V). Units between 100-160Wh require airline approval.' },
        { question: 'What about sporting equipment?', answer: 'Bats, clubs, and sticks must be checked. Diving equipment with empty air cylinders is generally allowed. Contact us 48 hours before departure for specialized sporting guns or archery equipment.' },
        { question: 'Can I carry medications?', answer: 'Essential medications are allowed in both carry-on and checked baggage. Carry a doctor\'s letter for controlled substances and injectable medications. Bring medications in their original labeled packaging.' },
        { question: 'What about food and beverages?', answer: 'Solid food items are generally allowed. Liquids over 100ml cannot pass security in carry-on bags (international standard). Alcohol purchased after security in duty-free must remain in sealed, tamper-evident bags.' },
        { question: 'Is dry ice permitted?', answer: 'Dry ice (solid carbon dioxide) up to 2.5 kg is permitted in checked or carry-on baggage when used to pack perishable items. The package must allow the release of CO₂ gas and be clearly labeled.' },
    ];

    const colorMap: Record<string, string> = {
        red: 'bg-red-50 border-red-100 text-red-600',
        orange: 'bg-orange-50 border-orange-100 text-orange-600',
        amber: 'bg-amber-50 border-amber-100 text-amber-600',
        purple: 'bg-purple-50 border-purple-100 text-purple-600',
        teal: 'bg-teal-50 border-teal-100 text-teal-600',
        slate: 'bg-slate-50 border-slate-100 text-slate-600',
    };

    return (
        <div className="min-h-screen bg-navy-50 font-display">
            {/* Hero */}
            <div className="bg-navy-950 text-white py-16 md:py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-red-400/30 blur-3xl" />
                    <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full bg-amber-400/20 blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-red-400 text-3xl">warning</span>
                        <span className="px-3 py-1 bg-red-400/20 text-red-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Safety</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                        Dangerous <span className="text-red-400">Goods</span>
                    </h1>
                    <p className="text-navy-400 font-bold mt-4 text-sm md:text-base uppercase tracking-wider">
                        Prohibited & restricted items for international flights — IATA compliant
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
                {/* Alert */}
                <div className="bg-red-50 rounded-3xl border border-red-200 p-6 md:p-8 flex items-start gap-4">
                    <span className="material-symbols-outlined text-red-500 p-3 bg-white rounded-xl shadow-sm text-2xl shrink-0">report</span>
                    <div>
                        <h3 className="text-sm font-black text-red-800 uppercase tracking-widest">Important</h3>
                        <p className="text-xs text-red-700 font-bold mt-2 leading-relaxed">
                            For the safety of all passengers and crew, the following items are strictly prohibited on all DeltaBlue Jet Air flights.
                            Failure to comply may result in denied boarding, confiscation of items, and possible legal prosecution under international aviation law.
                        </p>
                    </div>
                </div>

                {/* Prohibited Items Grid */}
                <div>
                    <h2 className="text-xs font-black text-navy-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-400">block</span>
                        Prohibited Items — Not Allowed in Any Baggage
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {prohibited.map((cat) => (
                            <div key={cat.name} className={`rounded-2xl border p-5 ${colorMap[cat.color]}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                                    <h3 className="text-xs font-black uppercase tracking-widest">{cat.name}</h3>
                                </div>
                                <ul className="space-y-2">
                                    {cat.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-xs font-bold">
                                            <span className="material-symbols-outlined text-xs mt-0.5 opacity-60">close</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Restricted Items FAQ */}
                <div>
                    <h2 className="text-xs font-black text-navy-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500">help</span>
                        Restricted Items — Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {restricted.map((faq, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-navy-100 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-navy-50/50 transition-colors"
                                >
                                    <span className="text-sm font-bold text-navy-800">{faq.question}</span>
                                    <span className={`material-symbols-outlined text-navy-400 transition-transform duration-200 ${expandedFaq === i ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>
                                {expandedFaq === i && (
                                    <div className="px-6 pb-5 border-t border-navy-50">
                                        <p className="text-sm text-navy-600 leading-relaxed font-medium pt-4">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DangerousGoods;
