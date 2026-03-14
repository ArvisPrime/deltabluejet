import React, { useState, useEffect } from 'react';
import { BRAND } from '../../config/brand';
import { getAboutPageConfig } from '../../services/cms';
import type { CmsAboutValueItem, CmsAboutStatItem, CmsAboutMilestoneItem, CmsAboutLeaderItem } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

/* ── Defaults (shown when CMS has no data) ──────────────────── */
const DEFAULT_VALUES: CmsAboutValueItem[] = [
    { icon: 'shield', title: 'Safety Without Compromise', body: 'Our foundation is built on rigorous international safety standards. We believe that peace of mind is the ultimate luxury in air travel.' },
    { icon: 'eco', title: 'Authentic Hospitality', body: "We don't just transport passengers; we host them. We bring the spirit of The Gambia to the skies, ensuring every guest feels the warmth of our culture from takeoff to landing." },
    { icon: 'diversity_3', title: 'Operational Agility', body: 'In a fast-moving world, we stay ahead through efficiency and innovation, ensuring our schedules are dependable and our services are accessible to all.' },
    { icon: 'lightbulb', title: 'Innovation', body: 'We leverage AI-driven scheduling, real-time disruption management, and a fully digital booking experience to keep you moving seamlessly.' },
];

const DEFAULT_STATS: CmsAboutStatItem[] = [
    { value: '120+', label: 'Destinations', icon: 'public' },
    { value: '85', label: 'Aircraft', icon: 'flight' },
    { value: '14M', label: 'Passengers/Year', icon: 'groups' },
    { value: '99.2%', label: 'On-time Rate', icon: 'schedule' },
];

const DEFAULT_MILESTONES: CmsAboutMilestoneItem[] = [
    { year: '2012', event: 'Founded in New York with 3 leased aircraft serving 8 domestic routes.' },
    { year: '2015', event: 'Expanded to transatlantic service — London, Paris, and Frankfurt added.' },
    { year: '2018', event: 'Fleet grows to 50 aircraft. Deltablue Club loyalty program launched.' },
    { year: '2021', event: 'Full digital transformation — app-based booking, AI disruption engine, and biometric check-in.' },
    { year: '2024', event: '120+ destinations across 6 continents. Named "Best Mid-Size Carrier" by Skyline Awards.' },
];

const DEFAULT_LEADERS: CmsAboutLeaderItem[] = [
    { name: 'Amara Okafor', role: 'Chief Executive Officer', icon: 'person' },
    { name: 'James Whitfield', role: 'Chief Operations Officer', icon: 'person' },
    { name: 'Lina Chen', role: 'Chief Technology Officer', icon: 'person' },
    { name: 'Marcus Rivera', role: 'VP of Customer Experience', icon: 'person' },
];

/**
 * About Us — Public page describing Deltablue Jet Air's story, values, and fleet.
 * All sections are CMS-driven via Firestore `cmsConfig/aboutValues`.
 */
const AboutUs: React.FC = () => {
    /* ── Hero ──────────────────────────────────────────────────── */
    const [heroBadge, setHeroBadge] = useState('Our Story');
    const [heroHeading, setHeroHeading] = useState(`About ${BRAND.shortName}`);
    const [heroSubtitle, setHeroSubtitle] = useState('Redefining aviation with precision, sustainability, and an unwavering commitment to every passenger who trusts us with their journey.');
    /* ── Stats ─────────────────────────────────────────────────── */
    const [stats, setStats] = useState<CmsAboutStatItem[]>(DEFAULT_STATS);
    /* ── Mission ───────────────────────────────────────────────── */
    const [missionBadge, setMissionBadge] = useState('Our Mission');
    const [missionHeading, setMissionHeading] = useState('Connecting People, Bridging Worlds');
    const [missionParagraph1, setMissionParagraph1] = useState(`${BRAND.name} to provide safe, affordable, and exceptional air travel that showcases the warmth of The Gambia. We are dedicated to bridging the gap between West Africa and the global community by investing in a modern fleet, empowering our local workforce, and delivering a travel experience rooted in reliability and 'Smiling Coast' hospitality.`);
    const [missionParagraph2, setMissionParagraph2] = useState("We don't just move passengers — we connect communities with precision, safety, and care at every step.");
    /* ── Values ─────────────────────────────────────────────────── */
    const [valuesLabel, setValuesLabel] = useState('What Drives Us');
    const [valuesTitle, setValuesTitle] = useState('Our Values');
    const [values, setValues] = useState<CmsAboutValueItem[]>(DEFAULT_VALUES);
    /* ── Milestones ─────────────────────────────────────────────── */
    const [milestones, setMilestones] = useState<CmsAboutMilestoneItem[]>(DEFAULT_MILESTONES);
    /* ── Leadership ─────────────────────────────────────────────── */
    const [leadersBadge, setLeadersBadge] = useState('The Team');
    const [leadersTitle, setLeadersTitle] = useState('Leadership');
    const [leaders, setLeaders] = useState<CmsAboutLeaderItem[]>(DEFAULT_LEADERS);
    /* ── CTA ────────────────────────────────────────────────────── */
    const [ctaHeading, setCtaHeading] = useState('Ready to Fly With Us?');
    const [ctaDescription, setCtaDescription] = useState(`Join millions of travellers who trust ${BRAND.name} for seamless, sustainable, and inspired journeys across the globe.`);
    const [ctaButtonText, setCtaButtonText] = useState('Book Your Journey');
    const [ctaButtonLink, setCtaButtonLink] = useState('/book');

    /* ── Load from Firestore ───────────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const config = await getAboutPageConfig();
                if (config) {
                    if (config.heroBadge) setHeroBadge(config.heroBadge);
                    if (config.heroHeading) setHeroHeading(config.heroHeading);
                    if (config.heroSubtitle) setHeroSubtitle(config.heroSubtitle);
                    if (config.stats?.length) setStats(config.stats);
                    if (config.missionBadge) setMissionBadge(config.missionBadge);
                    if (config.missionHeading) setMissionHeading(config.missionHeading);
                    if (config.missionParagraph1) setMissionParagraph1(config.missionParagraph1);
                    if (config.missionParagraph2) setMissionParagraph2(config.missionParagraph2);
                    if (config.sectionLabel) setValuesLabel(config.sectionLabel);
                    if (config.sectionTitle) setValuesTitle(config.sectionTitle);
                    if (config.values?.length) setValues(config.values);
                    if (config.milestones?.length) setMilestones(config.milestones);
                    if (config.leadersBadge) setLeadersBadge(config.leadersBadge);
                    if (config.leadersTitle) setLeadersTitle(config.leadersTitle);
                    if (config.leaders?.length) setLeaders(config.leaders);
                    if (config.ctaHeading) setCtaHeading(config.ctaHeading);
                    if (config.ctaDescription) setCtaDescription(config.ctaDescription);
                    if (config.ctaButtonText) setCtaButtonText(config.ctaButtonText);
                    if (config.ctaButtonLink) setCtaButtonLink(config.ctaButtonLink);
                }
            } catch (err) {
                console.error('Failed to load about page:', err);
                useToastStore.getState().addToast("Failed to load about page", "error");
            }
        })();
    }, []);

    return (
        <div className="bg-white text-navy-950">
            {/* Hero */}
            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-900/40 to-white z-10" />
                    <div
                        className="w-full h-full bg-cover bg-center scale-110"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109db05?auto=format&fit=crop&q=80')" }}
                    />
                </div>
                <div className="relative z-20 text-center px-6 space-y-6 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.4em]">
                        <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                        {heroBadge}
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">
                        {heroHeading}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
                        {heroSubtitle}
                    </p>
                </div>
            </section>

            {/* Stats Band */}
            <section className="bg-navy-950 py-16 -mt-1">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
                    {stats.map((s) => (
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
                            {missionBadge}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9]">
                            {missionHeading.includes(',') ? (
                                <>{missionHeading.split(',')[0]}, <span className="text-primary">{missionHeading.split(',').slice(1).join(',').trim()}</span></>
                            ) : (
                                missionHeading
                            )}
                        </h2>
                        <p className="text-navy-500 text-lg leading-relaxed">
                            {missionParagraph1}
                        </p>
                        <p className="text-navy-500 text-lg leading-relaxed">
                            {missionParagraph2}
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
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{valuesLabel}</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{valuesTitle}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((v) => (
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
                        {milestones.map((m, i) => (
                            <div key={m.year} className="relative flex gap-8 group">
                                {/* Vertical line */}
                                <div className="flex flex-col items-center">
                                    <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/30 z-10 group-hover:scale-125 transition-transform" />
                                    {i < milestones.length - 1 && <div className="w-0.5 flex-1 bg-navy-100" />}
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
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{leadersBadge}</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{leadersTitle}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {leaders.map((l) => (
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
                        {ctaHeading.includes(' ') ? (
                            <>{ctaHeading.split(' ').slice(0, -2).join(' ')} <span className="text-primary">{ctaHeading.split(' ').slice(-2).join(' ')}</span></>
                        ) : (
                            ctaHeading
                        )}
                    </h2>
                    <p className="text-navy-500 text-lg leading-relaxed">
                        {ctaDescription}
                    </p>
                    <a
                        href={ctaButtonLink}
                        className="inline-flex items-center gap-3 bg-primary text-white text-xs font-black uppercase tracking-widest px-10 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                        <span className="material-symbols-outlined">flight_takeoff</span>
                        {ctaButtonText}
                    </a>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
