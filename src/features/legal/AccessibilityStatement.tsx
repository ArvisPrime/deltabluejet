import React from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';

const AccessibilityStatement: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Accessibility</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Accessibility Statement</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        Our commitment to accessible travel for all passengers
                    </p>
                </div>
            </div>

            <div className="max-w-3xl space-y-8 text-navy-700 text-sm leading-relaxed">
                {/* Commitment */}
                <section>
                    <h2 className="text-lg font-black text-navy-950 tracking-tighter mb-3">Our Commitment</h2>
                    <p className="mb-3">
                        Deltablue Jet Air is committed to ensuring digital accessibility for people with disabilities.
                        We are continually improving the user experience for everyone, and applying the relevant
                        accessibility standards.
                    </p>
                    <p>
                        We strive to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>,
                        published by the World Wide Web Consortium (W3C). These guidelines explain how to make web
                        content more accessible to people with a wide array of disabilities.
                    </p>
                </section>

                {/* Standards */}
                <section className="bg-white rounded-2xl border border-navy-100 p-6">
                    <h2 className="text-lg font-black text-navy-950 tracking-tighter mb-3">Conformance Status</h2>
                    <p className="mb-4">
                        Deltablue Jet Air is <strong>partially conformant</strong> with WCAG 2.1 Level AA. Partially conformant
                        means that some parts of the content do not fully conform to the accessibility standard.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Perceivable', icon: 'visibility', desc: 'Text alternatives, captions, adaptable content, distinguishable elements' },
                            { label: 'Operable', icon: 'keyboard', desc: 'Keyboard accessible, sufficient time, seizure-safe, navigable' },
                            { label: 'Understandable', icon: 'menu_book', desc: 'Readable content, predictable interactions, input assistance' },
                            { label: 'Robust', icon: 'build', desc: 'Compatible with current and future assistive technologies' },
                        ].map(p => (
                            <div key={p.label} className="p-4 bg-navy-50/30 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-primary text-sm">{p.icon}</span>
                                    <p className="text-xs font-black text-navy-900 uppercase tracking-widest">{p.label}</p>
                                </div>
                                <p className="text-xs text-navy-500">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* What We've Done */}
                <section>
                    <h2 className="text-lg font-black text-navy-950 tracking-tighter mb-3">Measures We've Taken</h2>
                    <ul className="space-y-2">
                        {[
                            'ARIA landmarks and labels on all interactive elements',
                            'Keyboard navigation support throughout the booking flow',
                            'Color contrast ratios meeting WCAG AA requirements',
                            'Meaningful alt text for all images and icons',
                            'Logical heading hierarchy on every page',
                            'Focus indicators visible on all focusable elements',
                            'Form error messages linked to their respective inputs',
                            'Skip-to-content navigation link',
                            'Responsive design that functions on all screen sizes',
                            'Screen reader compatible flight search and booking forms',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5 shrink-0">check_circle</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Known Issues */}
                <section className="bg-amber-50/50 rounded-2xl border border-amber-100 p-6">
                    <h2 className="text-lg font-black text-navy-950 tracking-tighter mb-3">Known Limitations</h2>
                    <p className="mb-3 text-navy-600">
                        Despite our best efforts, some content may not yet be fully accessible. The following known
                        issues are being addressed:
                    </p>
                    <ul className="space-y-2 text-navy-600">
                        {[
                            'Some interactive maps may not be fully accessible via screen reader',
                            'PDF documents generated for boarding passes may not meet all accessibility standards',
                            'Third-party payment forms may have limited accessibility support',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">warning</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Special Assistance */}
                <section>
                    <h2 className="text-lg font-black text-navy-950 tracking-tighter mb-3">In-Flight & Airport Accessibility</h2>
                    <p className="mb-3">
                        Beyond our digital platform, Deltablue Jet Air provides comprehensive accessibility services:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { icon: 'accessible', label: 'Wheelchair assistance from check-in to arrival' },
                            { icon: 'child_care', label: 'Unaccompanied minor supervision service' },
                            { icon: 'pets', label: 'Service animal accommodation on all flights' },
                            { icon: 'medical_services', label: 'Medical equipment and oxygen provisions' },
                            { icon: 'hearing_disabled', label: 'Visual announcements for hearing-impaired passengers' },
                            { icon: 'visibility_off', label: 'Meet-and-assist for visually impaired passengers' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-navy-100">
                                <span className="material-symbols-outlined text-primary">{s.icon}</span>
                                <span className="text-xs font-bold text-navy-700">{s.label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3">
                        Request special assistance via our{' '}
                        <Link to={ROUTES.SPECIAL_ASSISTANCE || '#'} className="text-primary font-bold hover:underline">
                            Special Assistance page
                        </Link>{' '}
                        or contact our support team at least 48 hours before your flight.
                    </p>
                </section>

                {/* Contact */}
                <section className="bg-primary/5 rounded-2xl border border-primary/10 p-6">
                    <h2 className="text-lg font-black text-navy-950 tracking-tighter mb-3">Feedback & Contact</h2>
                    <p className="mb-4">
                        We welcome your feedback on the accessibility of the Deltablue Jet Air website. If you
                        encounter any accessibility barriers or have suggestions for improvement, please contact us:
                    </p>
                    <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-primary text-sm">email</span>
                            <span className="font-bold">accessibility@deltabluejet.com</span>
                        </p>
                        <p className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-primary text-sm">phone</span>
                            <span className="font-bold">+220 123 4567 (option 3)</span>
                        </p>
                        <p className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                            <span>We aim to respond to accessibility feedback within 5 business days</span>
                        </p>
                    </div>
                </section>

                {/* Last Updated */}
                <p className="text-xs text-navy-400 border-t border-navy-100 pt-4">
                    This statement was last updated on March 23, 2026. We review this statement annually and update
                    it as our accessibility practices evolve.
                </p>
            </div>
        </div>
    );
};

export default AccessibilityStatement;
