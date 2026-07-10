import React, { useEffect } from 'react';
import { useCmsAboutStore } from '../../stores/cmsAboutStore';

/**
 * About Us — Public page describing Deltablue Jet Air's story, values, and fleet.
 *
 * Reads all content from the shared `useCmsAboutStore` Zustand store which
 * subscribes to Firestore `onSnapshot`. When the CMS editor saves,
 * this page re-renders automatically — no refresh needed.
 */
const AboutUs: React.FC = () => {
    const store = useCmsAboutStore();
    const loaded = useCmsAboutStore(s => s.loaded);
    const subscribeStore = useCmsAboutStore(s => s.subscribe);

    /* ── Subscribe to real-time Firestore updates ──────────────── */
    useEffect(() => {
        const unsubscribe = subscribeStore();
        return unsubscribe;
    }, [subscribeStore]);

    if (!loaded) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-white">
                <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white text-navy-950">
            {/* Hero */}
            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-900/40 to-white z-10" />
                    <div
                        className="w-full h-full bg-cover bg-center scale-110"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109db05?auto=format&fit=crop&w=1920&q=80')" }}
                    />
                </div>
                <div className="relative z-20 text-center px-6 space-y-6 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.4em]">
                        <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                        {store.heroBadge}
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">
                        {store.heroHeading}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
                        {store.heroSubtitle}
                    </p>
                </div>
            </section>

            {/* Stats Band */}
            <section className="bg-navy-950 py-16 -mt-1">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
                    {store.stats.map((s) => (
                        <div key={s.label} className="text-center space-y-2 group">
                            <span className="material-symbols-outlined text-3xl text-primary group-hover:scale-110 transition-transform inline-block">
                                {s.icon}
                            </span>
                            <p className="text-4xl font-black text-white tracking-tight">{s.value}</p>
                            <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mission */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                            <span className="material-symbols-outlined text-sm">flag</span>
                            {store.missionBadge}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9]">
                            {store.missionHeading.includes(',') ? (
                                <>{store.missionHeading.split(',')[0]}, <span className="text-primary">{store.missionHeading.split(',').slice(1).join(',').trim()}</span></>
                            ) : (
                                store.missionHeading
                            )}
                        </h2>
                        <p className="text-navy-500 text-lg leading-relaxed">
                            {store.missionParagraph1}
                        </p>
                        <p className="text-navy-500 text-lg leading-relaxed">
                            {store.missionParagraph2}
                        </p>
                    </div>
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                        <img
                            src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800"
                            alt="Aircraft on tarmac at golden hour"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/30 to-transparent" />
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 px-6 md:px-12 bg-navy-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center space-y-4 mb-16">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{store.sectionLabel}</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{store.sectionTitle}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {store.values.map((v) => (
                            <div
                                key={v.title}
                                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow group space-y-4 border border-navy-100"
                            >
                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <span className="material-symbols-outlined text-2xl text-primary">{v.icon}</span>
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight">{v.title}</h3>
                                <p className="text-sm text-navy-500 leading-relaxed">{v.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center space-y-4 mb-16">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Our Journey</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Milestones</h2>
                    </div>
                    <div className="space-y-0">
                        {store.milestones.map((m, i) => (
                            <div key={m.year} className="relative flex gap-8 group">
                                {/* Vertical line */}
                                <div className="flex flex-col items-center">
                                    <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/30 z-10 group-hover:scale-125 transition-transform" />
                                    {i < store.milestones.length - 1 && <div className="w-0.5 flex-1 bg-navy-100" />}
                                </div>
                                <div className="pb-12">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">{m.year}</p>
                                    <p className="text-navy-700 text-base leading-relaxed">{m.event}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leadership */}
            <section className="py-24 px-6 md:px-12 bg-navy-950 text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center space-y-4 mb-16">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{store.leadersBadge}</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{store.leadersTitle}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {store.leaders.map((l) => (
                            <div key={l.name} className="text-center space-y-4 group">
                                <div className="w-24 h-24 mx-auto rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors border-2 border-white/10">
                                    <span className="material-symbols-outlined text-4xl text-white/60 group-hover:text-primary transition-colors">{l.icon}</span>
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-tight">{l.name}</p>
                                    <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-1">{l.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 md:px-12 text-center">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                        {store.ctaHeading.includes(' ') ? (
                            <>{store.ctaHeading.split(' ').slice(0, -2).join(' ')} <span className="text-primary">{store.ctaHeading.split(' ').slice(-2).join(' ')}</span></>
                        ) : (
                            store.ctaHeading
                        )}
                    </h2>
                    <p className="text-navy-500 text-lg leading-relaxed">
                        {store.ctaDescription}
                    </p>
                    <a
                        href={store.ctaButtonLink}
                        className="inline-flex items-center gap-3 bg-primary text-white text-xs font-black uppercase tracking-widest px-10 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                        <span className="material-symbols-outlined">flight_takeoff</span>
                        {store.ctaButtonText}
                    </a>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
