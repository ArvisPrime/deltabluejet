import React from 'react';

const TarmacDelayPlan: React.FC = () => {
    const timeline = [
        { time: '0 – 30 min', icon: 'info', color: 'blue', title: 'Delay Notification', description: 'Passengers are informed of the delay reason and estimated duration via the PA system and individual screens.' },
        { time: '30 min', icon: 'water_drop', color: 'cyan', title: 'Water & Lavatory Access', description: 'Complimentary water is distributed to all passengers. Lavatory facilities remain fully accessible throughout the delay.' },
        { time: '1 hour', icon: 'thermostat', color: 'teal', title: 'Climate Control & Updates', description: 'Aircraft climate control is maintained at a comfortable temperature. Updated ETD is communicated every 30 minutes.' },
        { time: '2 hours', icon: 'restaurant', color: 'amber', title: 'Snacks & Refreshments', description: 'Complimentary snacks and additional beverages are provided. Special dietary needs are accommodated where possible.' },
        { time: '3 hours', icon: 'flight_land', color: 'orange', title: 'Deplaning Option (Domestic)', description: 'For domestic flights, passengers are offered the opportunity to deplane if safe and operationally feasible. The aircraft must return to a gate or suitable disembarkation point.' },
        { time: '4 hours', icon: 'door_open', color: 'red', title: 'Deplaning Option (International)', description: 'For international flights, passengers are offered the opportunity to deplane if safe and operationally feasible, subject to customs and immigration requirements.' },
    ];

    const commitments = [
        { icon: 'medical_services', title: 'Medical Assistance', description: 'Medical attention is available for any passenger who requires it during a tarmac delay. Emergency medical services will be summoned if necessary.' },
        { icon: 'accessible', title: 'Special Needs', description: 'Passengers with disabilities, unaccompanied minors, and elderly passengers receive priority attention and assistance throughout the delay.' },
        { icon: 'wifi', title: 'Communication', description: 'Where available, Wi-Fi access is provided free of charge during tarmac delays exceeding 1 hour to allow passengers to contact family or adjust travel plans.' },
        { icon: 'notifications_active', title: 'Rebooking Assistance', description: 'If the flight is ultimately cancelled, rebooking assistance is offered either onboard or immediately upon deplaning, with priority given to connecting passengers.' },
    ];

    return (
        <div className="min-h-screen bg-navy-50 font-display">
            {/* Hero */}
            <div className="bg-navy-950 text-white py-16 md:py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-20 w-64 h-64 rounded-full bg-orange-400/30 blur-3xl" />
                    <div className="absolute bottom-10 right-20 w-56 h-56 rounded-full bg-primary/20 blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-orange-400 text-3xl">flight_land</span>
                        <span className="px-3 py-1 bg-orange-400/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">DOT Compliance</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                        Tarmac Delay <span className="text-primary">Contingency Plan</span>
                    </h1>
                    <p className="text-navy-400 font-bold mt-4 text-sm md:text-base uppercase tracking-wider">
                        In compliance with the U.S. Department of Transportation — 14 CFR §259.4
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
                {/* Introduction */}
                <div className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6 md:p-8">
                    <p className="text-sm text-navy-600 leading-relaxed font-medium">
                        This Contingency Plan for Lengthy Tarmac Delays has been adopted by Deltablue Jet Air in accordance with
                        U.S. Department of Transportation (DOT) regulations. It outlines our commitments to passengers during extended
                        ground delays at U.S. airports and applies to all scheduled and charter flights.
                    </p>
                </div>

                {/* Timeline */}
                <div>
                    <h2 className="text-xs font-black text-navy-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">timeline</span>
                        Delay Response Timeline
                    </h2>
                    <div className="space-y-4">
                        {timeline.map((step, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-navy-100 shadow-sm p-5 md:p-6 flex items-start gap-5">
                                <div className="shrink-0 flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-xl bg-${step.color}-50 border border-${step.color}-100 flex items-center justify-center`}>
                                        <span className={`material-symbols-outlined text-${step.color}-500`}>{step.icon}</span>
                                    </div>
                                    {i < timeline.length - 1 && <div className="w-0.5 h-6 bg-navy-100 mt-2" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2.5 py-1 bg-navy-100 rounded-lg text-[10px] font-black text-navy-600 uppercase tracking-widest">{step.time}</span>
                                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-wider">{step.title}</h3>
                                    </div>
                                    <p className="text-sm text-navy-600 leading-relaxed font-medium">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Commitments */}
                <div>
                    <h2 className="text-xs font-black text-navy-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">volunteer_activism</span>
                        Additional Commitments
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {commitments.map((item) => (
                            <div key={item.title} className="bg-white rounded-2xl border border-navy-100 shadow-sm p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">{item.icon}</span>
                                    <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">{item.title}</h3>
                                </div>
                                <p className="text-sm text-navy-600 leading-relaxed font-medium">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legal Notice */}
                <div className="bg-orange-50/50 rounded-3xl border border-orange-100 p-6 md:p-8 flex items-start gap-4">
                    <span className="material-symbols-outlined text-orange-500 p-3 bg-white rounded-xl shadow-sm text-2xl shrink-0">policy</span>
                    <div>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Regulatory Compliance</h3>
                        <p className="text-xs text-navy-500 font-bold mt-2 leading-relaxed">
                            This plan is filed with the U.S. Department of Transportation and is available on this website and upon request at any airport
                            where Deltablue Jet Air operates. For complaints related to tarmac delays, passengers may contact the DOT Aviation Consumer
                            Protection Division at <span className="text-primary">airconsumer@dot.gov</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TarmacDelayPlan;
