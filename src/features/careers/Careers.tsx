import React, { useState, useEffect } from 'react';
import { BRAND } from '../../config/brand';
import { subscribeToJobs, type JobListing } from '../../services/careerService';

const BENEFITS = [
    { icon: 'flight', title: 'Free & Discounted Travel', desc: 'Enjoy complimentary flights and heavily discounted travel for you and your family across all our routes.' },
    { icon: 'school', title: 'Training & Development', desc: 'Access world-class aviation training programs, mentorship, and certifications to grow your career.' },
    { icon: 'health_and_safety', title: 'Health & Wellbeing', desc: 'Comprehensive medical, dental, and vision coverage, plus wellness programs for your entire family.' },
    { icon: 'savings', title: 'Competitive Pay', desc: 'Market-leading compensation packages with annual reviews, performance bonuses, and retirement plans.' },
    { icon: 'diversity_3', title: 'Inclusive Workplace', desc: 'A diverse, respectful environment where every team member is valued regardless of background.' },
    { icon: 'public', title: 'Global Opportunities', desc: 'With routes across West Africa and beyond, explore opportunities at any of our stations worldwide.' },
];

const VALUES = [
    { icon: 'shield', text: 'Safety First — Every decision starts with the safety of our passengers and crew.' },
    { icon: 'handshake', text: 'Teamwork — Aviation is a team effort. We rise together.' },
    { icon: 'star', text: 'Excellence — We set the standard for service in West African aviation.' },
    { icon: 'eco', text: 'Sustainability — We are committed to reducing our environmental footprint.' },
];

const Careers: React.FC = () => {
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = subscribeToJobs(data => {
            setJobs(data.filter(j => j.active));
            setLoading(false);
        });
        return unsub;
    }, []);

    return (
        <div className="font-display bg-white">
            {/* ── Hero Section */}
            <section className="relative overflow-hidden bg-navy-950 text-white py-32 px-6">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-blue-400 blur-[100px]" />
                </div>
                <div className="max-w-6xl mx-auto relative z-10 text-center space-y-8">
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
                        <span className="material-symbols-outlined text-primary text-sm">work</span>
                        Careers at {BRAND.shortName}
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                        Join Our <span className="text-primary">Crew</span>
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto font-medium leading-relaxed">
                        Help us connect West Africa to the world. We're building the future of aviation — and we need talented people like you.
                    </p>
                    <a href="#openings" className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined">search</span>
                        View Open Positions
                    </a>
                </div>
            </section>

            {/* ── Why Join Us */}
            <section className="py-28 px-6 bg-navy-50/30">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Why Join Us</span>
                        <h2 className="text-4xl font-black text-navy-950 uppercase tracking-tighter">More Than a Job — A Journey</h2>
                        <p className="text-navy-500 max-w-2xl mx-auto font-medium">
                            At {BRAND.shortName}, you don't just work for an airline — you become part of a mission to connect communities and open new horizons.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {BENEFITS.map((b, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl border border-navy-100 shadow-sm space-y-4 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">{b.icon}</span>
                                </div>
                                <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">{b.title}</h3>
                                <p className="text-sm text-navy-500 leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Our Values */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Our Values</span>
                        <h2 className="text-4xl font-black text-navy-950 uppercase tracking-tighter">What We Stand For</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {VALUES.map((v, i) => (
                            <div key={i} className="flex items-start gap-5 p-6 rounded-2xl bg-navy-50/50 border border-navy-100">
                                <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                                    <span className="material-symbols-outlined text-primary text-xl">{v.icon}</span>
                                </div>
                                <p className="text-sm font-bold text-navy-700 leading-relaxed pt-1">{v.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Open Positions */}
            <section id="openings" className="py-28 px-6 bg-navy-950 text-white">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Open Positions</span>
                        <h2 className="text-4xl font-black uppercase tracking-tighter">Find Your Role</h2>
                        <p className="text-white/50 max-w-xl mx-auto font-medium">
                            We're hiring across flight operations, engineering, customer service, and technology.
                        </p>
                    </div>
                    {loading ? (
                        <div className="flex flex-col items-center py-16">
                            <div className="mb-4 size-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
                            <p className="text-xs font-bold text-white/40">Loading positions...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <p className="text-center text-white/40 py-16 text-sm">No open positions at the moment. Check back soon!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 space-y-4 group hover:bg-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-primary text-xl">{job.icon}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">{job.title}</h3>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{job.department}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 pt-2">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/50">
                                            <span className="material-symbols-outlined text-xs">location_on</span>
                                            {job.location}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/50">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            {job.type}
                                        </span>
                                    </div>
                                    <button className="w-full mt-3 py-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                                        View Details &amp; Apply
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Application Process */}
            <section className="py-28 px-6">
                <div className="max-w-4xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">How to Apply</span>
                        <h2 className="text-4xl font-black text-navy-950 uppercase tracking-tighter">Our Hiring Process</h2>
                    </div>
                    <div className="space-y-0">
                        {[
                            { step: '01', title: 'Submit Your Application', desc: 'Find a role that fits and submit your CV and cover letter through our portal.' },
                            { step: '02', title: 'Initial Screening', desc: 'Our recruitment team reviews your application and reaches out for an initial conversation.' },
                            { step: '03', title: 'Assessment & Interview', desc: 'Depending on the role, you may complete a skills assessment followed by panel interviews.' },
                            { step: '04', title: 'Offer & Onboarding', desc: 'Successful candidates receive an offer and begin our structured onboarding program.' },
                        ].map((s, i) => (
                            <div key={i} className="flex gap-8 items-start group">
                                <div className="flex flex-col items-center">
                                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
                                        {s.step}
                                    </div>
                                    {i < 3 && <div className="w-0.5 h-16 bg-navy-100 my-2" />}
                                </div>
                                <div className="pb-8 space-y-2 pt-2">
                                    <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">{s.title}</h3>
                                    <p className="text-sm text-navy-500 leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section */}
            <section className="py-24 px-6 bg-primary/5">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-4xl font-black text-navy-950 uppercase tracking-tighter">Ready to Take Off?</h2>
                    <p className="text-navy-500 max-w-xl mx-auto font-medium leading-relaxed">
                        Don't see a role that fits? Send us your CV and we'll keep you in mind for future opportunities.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a href={`mailto:careers@${BRAND.domain}`} className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                            <span className="material-symbols-outlined">email</span>Send Your CV
                        </a>
                        <a href="#openings" className="inline-flex items-center gap-3 px-10 py-5 bg-white border-2 border-navy-100 text-navy-700 rounded-2xl font-black uppercase tracking-widest text-sm hover:border-primary hover:text-primary transition-all">
                            <span className="material-symbols-outlined">search</span>Browse Openings
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Careers;
