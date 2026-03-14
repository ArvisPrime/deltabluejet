import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { APP_CONFIG } from '../../config/app';

// ── Common countries list ──────────────────────────────────
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh',
  'Belgium', 'Brazil', 'Cameroon', 'Canada', 'China', 'Colombia', 'Congo', 'Côte d\'Ivoire',
  'Denmark', 'Egypt', 'Ethiopia', 'Finland', 'France', 'Gambia', 'Germany', 'Ghana', 'Greece',
  'Guinea', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kenya', 'Lebanon', 'Liberia', 'Libya', 'Malaysia', 'Mali', 'Mexico',
  'Morocco', 'Mozambique', 'Netherlands', 'New Zealand', 'Niger', 'Nigeria', 'Norway',
  'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Sierra Leone', 'Singapore', 'Somalia', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Tanzania',
  'Thailand', 'Togo', 'Tunisia', 'Turkey', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Vietnam', 'Zimbabwe',
];

const PassengerDetails: React.FC = () => {
  const navigate = useNavigate();

  // ── Form State ──────────────────────────────────────────
  const [title, setTitle] = useState('Mr.');
  const [gender, setGender] = useState('Male');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState(APP_CONFIG.phoneCodes?.[0]?.code || '+1');
  const [phone, setPhone] = useState('');
  const [attempted, setAttempted] = useState(false);

  // ── Validation ──────────────────────────────────────────
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!isEmailValid) e.email = 'Please enter a valid email address';
    if (!phone.trim()) e.phone = 'Phone number is required';
    return e;
  }, [firstName, lastName, email, phone, isEmailValid]);

  const isValid = Object.keys(errors).length === 0;

  // ── Handlers ────────────────────────────────────────────
  const onBack = () => navigate(ROUTES.FARE_SELECTION);
  const onNext = () => {
    setAttempted(true);
    if (isValid) {
      navigate(ROUTES.SEAT_SELECTION);
    }
  };

  // ── Input helper ────────────────────────────────────────
  const fieldClass = (field: string) =>
    `w-full h-12 rounded-xl border-2 px-4 font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 transition-all ${attempted && errors[field]
      ? 'border-red-300 bg-red-50/50 focus:border-red-400'
      : 'border-transparent bg-navy-50'
    }`;

  const requiredMark = <span className="text-red-400 ml-0.5">*</span>;

  return (
    <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-right duration-500 font-display">
      <div className="lg:col-span-8 space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-black tracking-tighter text-navy-950">Who is flying?</h2>
            <span className="text-xs font-black text-navy-400 uppercase tracking-widest">Step 2 of 4</span>
          </div>
          <div className="h-2 w-full bg-navy-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/2 rounded-full"></div>
          </div>
          <p className="text-navy-500 font-medium italic">Please enter your name exactly as it appears on your passport or travel document.</p>
        </div>

        <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
          <div className="bg-navy-50/50 px-8 py-5 border-b border-navy-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">person</span>
              <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Passenger 1: Adult</h3>
            </div>
            <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">Primary</span>
          </div>

          <div className="p-8 space-y-12">
            {/* Personal Information */}
            <section className="space-y-6">
              <h4 className="text-xs font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">badge</span> Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Title</label>
                  <select value={title} onChange={e => setTitle(e.target.value)} className="w-full h-12 rounded-xl border-2 border-transparent bg-navy-50 px-4 font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className="w-full h-12 rounded-xl border-2 border-transparent bg-navy-50 px-4 font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">First Name {requiredMark}</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className={fieldClass('firstName')} placeholder="e.g. John" />
                  {attempted && errors.firstName && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Last Name {requiredMark}</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className={fieldClass('lastName')} placeholder="e.g. Doe" />
                  {attempted && errors.lastName && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.lastName}</p>}
                </div>
              </div>
            </section>

            {/* Travel Document */}
            <section className="space-y-6">
              <h4 className="text-xs font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">public</span> Travel Document
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Nationality</label>
                  <select value={nationality} onChange={e => setNationality(e.target.value)} className="w-full h-12 rounded-xl border-2 border-transparent bg-navy-50 px-4 font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Passport Number</label>
                  <input value={passportNumber} onChange={e => setPassportNumber(e.target.value.toUpperCase())} className="w-full h-12 rounded-xl border-2 border-transparent bg-navy-50 px-4 font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 uppercase" placeholder="Enter passport number" />
                </div>
              </div>
            </section>

            {/* Contact Info */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">mail</span> Contact Info
                </h4>
                <span className="text-[10px] font-black text-navy-400 bg-navy-50 px-2 py-1 rounded uppercase" title="Your e-ticket and booking confirmation will be sent to this email">We'll send your ticket here</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Email Address {requiredMark}</label>
                  <div className="relative">
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={`w-full h-12 rounded-xl border-2 px-4 pr-10 font-bold focus:ring-2 transition-all ${attempted && errors.email
                          ? 'border-red-300 bg-red-50/50 text-red-900 focus:ring-red-200'
                          : email && isEmailValid
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 focus:ring-emerald-200'
                            : 'border-transparent bg-navy-50 text-navy-900 focus:ring-primary/20'
                        }`}
                      placeholder="you@example.com"
                    />
                    {email && isEmailValid && (
                      <span className="material-symbols-outlined text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2">check_circle</span>
                    )}
                    {attempted && errors.email && !isEmailValid && email && (
                      <span className="material-symbols-outlined text-red-400 absolute right-4 top-1/2 -translate-y-1/2">error</span>
                    )}
                  </div>
                  {attempted && errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Phone Number {requiredMark}</label>
                  <div className="flex gap-2">
                    <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)} className="w-24 h-12 rounded-xl border-2 border-transparent bg-navy-50 px-3 font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 appearance-none text-xs">
                      {APP_CONFIG.phoneCodes.map((pc) => (
                        <option key={pc.code} value={pc.code}>{pc.code} ({pc.label})</option>
                      ))}
                    </select>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className={`flex-1 ${fieldClass('phone')}`} placeholder="123 456 7890" />
                  </div>
                  {attempted && errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.phone}</p>}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
          <button onClick={onBack} className="flex items-center justify-center gap-2 h-14 px-8 rounded-2xl border-2 border-navy-100 text-navy-700 font-black hover:bg-navy-50 transition-all uppercase text-xs tracking-widest">
            <span className="material-symbols-outlined">arrow_back</span> Back to Fare Selection
          </button>
          <button onClick={onNext} className={`flex items-center justify-center gap-2 h-14 px-10 rounded-2xl font-black shadow-xl transition-all uppercase text-xs tracking-widest ${attempted && !isValid
              ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600 animate-shake'
              : 'bg-primary text-white shadow-primary/20 hover:bg-primary-600'
            }`}>
            {attempted && !isValid ? (
              <><span className="material-symbols-outlined">error_outline</span> Please fill required fields</>
            ) : (
              <>Continue to Seat Selection <span className="material-symbols-outlined">arrow_forward</span></>
            )}
          </button>
        </div>
      </div>

      {/* ═══ Right Sidebar: Flight Summary ═══ */}
      <div className="lg:col-span-4 space-y-6 relative">
        <div className="sticky top-8 space-y-6">
          <div className="bg-white rounded-[2rem] border border-navy-100 shadow-sm overflow-hidden">
            <div className="bg-navy-900 p-8 text-white relative overflow-hidden">
              {/* Abstract Map Background */}
              <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD_VV2pz1mYBO4J4Cx6Y5IK87LFCnLO0FxgIrxgqgUnmdRRYdmmEly-aMPNToc0EckQfcZjJk-Rs5fA5n8cTGtSPppUe3lw_t1X46BOvA8pLfW2NCxiWqbjZ4dE7ksvFa-nygNUpH9wqXojoNi7g1v9uvPZUVN8YN382ceQZAkna_7RuSjnCL7iTGYCAKqkHqYqQRxkyGYPHH8iXf5jWsVTtXsGWAwDpd3v0vh8E3v56Tqg--q2Vf81S_uvUnLWqw3X4ESBXlwuFKo')" }}></div>

              <div className="relative z-10 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50">Your Flight</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-3xl font-black">New York</div>
                    <div className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1">JFK</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center px-4">
                    <span className="text-[10px] opacity-40 uppercase font-black tracking-widest">Direct</span>
                    <div className="w-full h-px bg-white/20 my-2 relative">
                      <span className="material-symbols-outlined text-xs absolute right-0 -top-1.5 rotate-90 text-primary">flight</span>
                    </div>
                    <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">5h 20m</span>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black">London</div>
                    <div className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1">LHR</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex gap-4">
                <div className="bg-navy-50 p-3 rounded-2xl flex flex-col items-center justify-center min-w-[70px] border border-navy-100">
                  <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Oct</span>
                  <span className="text-2xl font-black text-navy-950">24</span>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-sm font-black text-navy-950 uppercase tracking-tight">Thu, 10:30 AM</div>
                  <div className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Flight DJ-102</div>
                </div>
              </div>
              <hr className="border-dashed border-navy-100" />
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold text-navy-500 uppercase tracking-widest text-[10px]">
                  <span>Adult x 1</span>
                  <span className="text-navy-900">$520.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-navy-500 uppercase tracking-widest text-[10px]">
                  <span>Taxes & Fees</span>
                  <span className="text-navy-900">$85.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-500 uppercase tracking-widest text-[10px]">
                  <span>Early Booking Discount</span>
                  <span>-$25.00</span>
                </div>
                <div className="pt-4 border-t border-navy-100 flex justify-between items-end">
                  <span className="text-xs font-black text-navy-400 uppercase tracking-widest pb-1">Total Price</span>
                  <span className="text-4xl font-black text-primary">$580.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
            <span className="material-symbols-outlined text-primary p-2 bg-white rounded-xl shadow-sm">verified_user</span>
            <div>
              <h5 className="text-xs font-black text-navy-900 uppercase tracking-widest">Secure Booking</h5>
              <p className="text-[10px] text-navy-400 font-bold leading-relaxed mt-1 uppercase">Your information is protected with encryption. We never share your personal details with third parties.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;
