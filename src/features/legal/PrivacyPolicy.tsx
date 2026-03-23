import React from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';

const PrivacyPolicy: React.FC = () => {
    const sections = [
        {
            id: 'collection',
            title: '1. Information We Collect',
            icon: 'database',
            content: [
                { type: 'text', value: 'We collect the following categories of personal data to provide and improve our airline services:' },
                { type: 'list', items: [
                    'Identity Data: Full name, title, gender, date of birth, nationality.',
                    'Travel Document Data: Passport number, passport expiry date, issuing country, visa information.',
                    'Contact Data: Email address, phone number, postal address.',
                    'Booking & Travel Data: Flight itineraries, fare class, seat selections, meal preferences, special assistance requests, baggage information.',
                    'Payment Data: Payment card details (processed via PCI-DSS compliant payment processors — we do not store full card numbers), transaction history.',
                    'Loyalty Data: DeltaBlue Club membership tier, points balance, points history.',
                    'Technical Data: IP address, browser type, device information, cookies and similar technologies.',
                    'Communication Data: Records of correspondence with our customer service team.',
                ]},
            ],
        },
        {
            id: 'usage',
            title: '2. How We Use Your Data',
            icon: 'settings',
            content: [
                { type: 'text', value: 'We process your personal data for the following purposes:' },
                { type: 'list', items: [
                    'Booking & Travel Services: To process and manage your flight bookings, issue tickets, facilitate check-in, and provide boarding passes.',
                    'Legal Compliance: To comply with immigration, customs, and security requirements including Advance Passenger Information System (APIS) submissions to border agencies.',
                    'Safety & Security: To ensure aviation safety and security in compliance with international regulations.',
                    'Customer Service: To respond to your inquiries, process refunds, and manage complaints.',
                    'Marketing: To send promotional offers and loyalty program updates (only with your explicit consent).',
                    'Analytics: To improve our services, website, and customer experience through anonymized data analysis.',
                ]},
            ],
        },
        {
            id: 'sharing',
            title: '3. When We Share Your Data',
            icon: 'share',
            content: [
                { type: 'text', value: 'We may share your personal data with the following categories of recipients:' },
                { type: 'list', items: [
                    'Government Authorities: Immigration, customs, border control, and law enforcement agencies as required by law (APIS, passenger manifests).',
                    'Airport Authorities: For ground handling, security screening, and boarding operations.',
                    'Payment Processors: Stripe and Flutterwave for secure payment processing.',
                    'Communication Providers: SendGrid (email) and Twilio (SMS) for transactional notifications.',
                    'Codeshare Partners: When your itinerary includes flights operated by partner airlines.',
                ]},
                { type: 'text', value: 'We never sell your personal data to third parties for their marketing purposes.' },
            ],
        },
        {
            id: 'retention',
            title: '4. Data Retention',
            icon: 'schedule',
            content: [
                { type: 'text', value: 'We retain your personal data for the following periods:' },
                { type: 'list', items: [
                    'Booking Data: 3 years after the last flight in the booking, or as required by aviation regulations.',
                    'Payment Data: 7 years as required by financial regulations and tax law.',
                    'Loyalty Data: For the duration of your membership plus 2 years after account closure.',
                    'APIS/Immigration Data: As required by the destination country\'s regulations (typically 5 years).',
                    'Marketing Consent: Until you withdraw consent.',
                    'Technical Logs: 12 months.',
                ]},
            ],
        },
        {
            id: 'rights',
            title: '5. Your Rights',
            icon: 'verified_user',
            content: [
                { type: 'text', value: 'Under applicable data protection laws (including GDPR, CCPA, and others), you have the following rights:' },
                { type: 'list', items: [
                    'Right of Access: Request a copy of the personal data we hold about you.',
                    'Right to Rectification: Request correction of inaccurate or incomplete data.',
                    'Right to Erasure: Request deletion of your personal data (subject to legal retention obligations).',
                    'Right to Restrict Processing: Request that we limit how we use your data.',
                    'Right to Data Portability: Receive your data in a machine-readable format.',
                    'Right to Object: Object to processing based on legitimate interests or for direct marketing.',
                    'Right to Withdraw Consent: Withdraw your marketing or analytics consent at any time.',
                ]},
                { type: 'text', value: 'To exercise any of these rights, please contact our Data Protection Officer at dpo@deltabluejet.com. We will respond within 30 days.' },
            ],
        },
        {
            id: 'cookies',
            title: '6. Cookies & Tracking',
            icon: 'cookie',
            content: [
                { type: 'text', value: 'Our website uses cookies and similar technologies:' },
                { type: 'list', items: [
                    'Essential Cookies: Required for website functionality, authentication, and security. Cannot be disabled.',
                    'Analytics Cookies: Help us understand how visitors interact with our website (e.g., page views, navigation patterns). Require consent.',
                    'Marketing Cookies: Used to deliver relevant advertisements and track campaign effectiveness. Require consent.',
                    'Preference Cookies: Remember your settings such as language and currency. Require consent.',
                ]},
                { type: 'text', value: 'You can manage your cookie preferences at any time using the cookie settings link in our website footer.' },
            ],
        },
        {
            id: 'security',
            title: '7. Data Security',
            icon: 'lock',
            content: [
                { type: 'text', value: 'We implement appropriate technical and organizational measures to protect your personal data, including:' },
                { type: 'list', items: [
                    'Encryption of data in transit (TLS 1.3) and at rest.',
                    'PCI-DSS compliant payment processing — we never store full payment card details.',
                    'Role-based access controls limiting data access to authorized personnel.',
                    'Multi-factor authentication for administrative systems.',
                    'Regular security audits and penetration testing.',
                    'Incident response procedures for data breach notification within 72 hours as required by GDPR.',
                ]},
            ],
        },
        {
            id: 'contact',
            title: '8. Contact & DPO',
            icon: 'contact_mail',
            content: [
                { type: 'text', value: 'For any questions about this Privacy Policy or to exercise your data protection rights:' },
                { type: 'list', items: [
                    'Data Protection Officer: dpo@deltabluejet.com',
                    'Customer Relations: legal@deltabluejet.com',
                    'Supervisory Authority: You also have the right to lodge a complaint with your local data protection authority.',
                ]},
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-navy-50 font-display">
            {/* Hero */}
            <div className="bg-navy-950 text-white py-16 md:py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-emerald-400/30 blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-primary/20 blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-emerald-400 text-3xl">shield</span>
                        <span className="px-3 py-1 bg-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Privacy</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                        Privacy <span className="text-primary">Policy</span>
                    </h1>
                    <p className="text-navy-400 font-bold mt-4 text-sm md:text-base uppercase tracking-wider">
                        How we collect, use, and protect your personal data — Last updated March 2026
                    </p>
                </div>
            </div>

            {/* Sections */}
            <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
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
                            {section.content.map((block, i) => {
                                if (block.type === 'text') {
                                    return <p key={i} className="text-sm text-navy-600 leading-relaxed font-medium">{block.value}</p>;
                                }
                                if (block.type === 'list' && block.items) {
                                    return (
                                        <ul key={i} className="space-y-3 ml-1">
                                            {block.items.map((item, j) => (
                                                <li key={j} className="flex items-start gap-3">
                                                    <span className="material-symbols-outlined text-primary text-sm mt-0.5 shrink-0">check_circle</span>
                                                    <span className="text-sm text-navy-600 leading-relaxed font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </section>
                ))}

                {/* CTA */}
                <div className="bg-emerald-50/50 rounded-3xl border border-emerald-100 p-6 md:p-8 flex items-start gap-4">
                    <span className="material-symbols-outlined text-emerald-500 p-3 bg-white rounded-xl shadow-sm text-2xl">privacy_tip</span>
                    <div>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Your data, your control</h3>
                        <p className="text-xs text-navy-500 font-bold mt-2 leading-relaxed">
                            You can manage your data preferences, withdraw consent, or request data deletion at any time from your{' '}
                            <Link to={ROUTES.MY_PROFILE} className="text-primary hover:underline">Account Settings</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
