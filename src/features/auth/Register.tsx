
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { useToastStore } from '../../stores/toastStore';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface FormData {
  // Phase 1 — Basic Info
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  dobMonth: string;
  dobDay: string;
  dobYear: string;
  gender: string;
  // Phase 2 — Contact
  country: string;
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  confirmEmail: string;
  subscribeEmail: boolean;
  // Phase 3 — Security
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const INITIAL: FormData = {
  firstName: '', middleName: '', lastName: '', suffix: '', dobMonth: '', dobDay: '', dobYear: '', gender: '',
  country: 'US', companyName: '', addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '',
  phoneCountryCode: '+1', phoneNumber: '', email: '', confirmEmail: '', subscribeEmail: false,
  password: '', confirmPassword: '', acceptTerms: false,
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COUNTRIES = [
  { code: 'US', label: 'United States' }, { code: 'GB', label: 'United Kingdom' }, { code: 'CA', label: 'Canada' },
  { code: 'GM', label: 'The Gambia' }, { code: 'GN', label: 'Guinea' }, { code: 'GW', label: 'Guinea-Bissau' },
  { code: 'SL', label: 'Sierra Leone' }, { code: 'SN', label: 'Senegal' }, { code: 'GH', label: 'Ghana' },
  { code: 'NG', label: 'Nigeria' }, { code: 'LR', label: 'Liberia' }, { code: 'BD', label: 'Bangladesh' },
  { code: 'FR', label: 'France' }, { code: 'DE', label: 'Germany' }, { code: 'ES', label: 'Spain' },
];
const PHONE_CODES = [
  { code: '+1', label: 'United States (+1)' }, { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+220', label: 'The Gambia (+220)' }, { code: '+224', label: 'Guinea (+224)' },
  { code: '+245', label: 'Guinea-Bissau (+245)' }, { code: '+232', label: 'Sierra Leone (+232)' },
  { code: '+233', label: 'Ghana (+233)' }, { code: '+234', label: 'Nigeria (+234)' },
  { code: '+880', label: 'Bangladesh (+880)' }, { code: '+33', label: 'France (+33)' },
];
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const STEPS = [
  { label: 'Personal', icon: 'person' },
  { label: 'Contact', icon: 'location_on' },
  { label: 'Security', icon: 'lock' },
];

// ────────────────────────────────────────────────────────────
// Shared input styles
// ────────────────────────────────────────────────────────────
const inputCls = 'w-full h-13 rounded-xl border border-navy-200 bg-white px-4 text-sm font-bold text-navy-950 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const labelCls = 'text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-1.5 block';

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const addToast = useToastStore(s => s.addToast);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showSuffix, setShowSuffix] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [showAddr2, setShowAddr2] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // ── Validation ──────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!form.firstName.trim()) return 'First name is required.';
      if (!form.lastName.trim()) return 'Last name is required.';
      if (!form.dobMonth || !form.dobDay || !form.dobYear) return 'Date of birth is required.';
      if (!form.gender) return 'Please select a gender.';
    }
    if (s === 1) {
      if (!form.addressLine1.trim()) return 'Address is required.';
      if (!form.city.trim()) return 'City is required.';
      if (form.country === 'US' && !form.stateProvince) return 'State is required.';
      if (!form.postalCode.trim()) return 'Postal code is required.';
      if (!form.phoneNumber.trim()) return 'Phone number is required.';
      if (form.phoneNumber.replace(/\D/g, '').length < 7) return 'Please enter a valid phone number (at least 7 digits).';
      if (!form.email.trim()) return 'Email address is required.';
      if (form.email !== form.confirmEmail) return 'Email addresses do not match.';
    }
    if (s === 2) {
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter.';
      if (!/[0-9]/.test(form.password)) return 'Password must contain at least one number.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
      if (!form.acceptTerms) return 'You must accept the terms to continue.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => Math.min(s + 1, 2));
  };
  const prev = () => { setError(null); setStep(s => Math.max(s - 1, 0)); };

  const displayName = useMemo(() =>
    [form.firstName, form.middleName, form.lastName, form.suffix].filter(Boolean).join(' '),
    [form.firstName, form.middleName, form.lastName, form.suffix]
  );

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(2);
    if (err) { setError(err); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      await register(form.email, form.password, displayName);
      navigate(ROUTES.MY_DASHBOARD, { replace: true });
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/email-already-in-use') setError('This email is already registered. Try signing in instead.');
      else if (code === 'auth/weak-password') setError('Password is too weak. Use at least 8 characters with mixed case and numbers.');
      else if (code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await googleLogin();
      navigate(ROUTES.MY_DASHBOARD, { replace: true });
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') setError('Google sign-up failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step Indicator (inline JSX) ──────────────────────────
  const stepIndicator = (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <button
            type="button"
            onClick={() => { if (i < step) { setError(null); setStep(i); } }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all
              ${i === step ? 'bg-primary text-white shadow-lg shadow-primary/25' :
                i < step ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20' :
                  'bg-navy-50 text-navy-300 cursor-default'}`}
          >
            {i < step ? (
              <span className="material-symbols-outlined text-sm">check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-sm">{s.icon}</span>
            )}
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-navy-100'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Phase 1: Basic Info (inline JSX) ─────────────────────
  const phase1 = (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1 mb-8">
        <h2 className="text-2xl font-black tracking-tight uppercase text-navy-950">Personal Information</h2>
        <p className="text-xs font-bold text-navy-400 tracking-wide">Tell us about yourself to get started.</p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First Name *</label>
          <input className={inputCls} placeholder="John" value={form.firstName} onChange={e => set('firstName', e.target.value)} aria-required="true" />
        </div>
        <div>
          <label className={labelCls}>Middle Name <span className="text-navy-300 normal-case tracking-normal">(optional)</span></label>
          <input className={inputCls} placeholder="Alexander" value={form.middleName} onChange={e => set('middleName', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Last Name *</label>
          <input className={inputCls} placeholder="Doe" value={form.lastName} onChange={e => set('lastName', e.target.value)} aria-required="true" />
        </div>
        <div>
          {showSuffix ? (
            <>
              <label className={labelCls}>Suffix</label>
              <input className={inputCls} placeholder="Jr., Sr., III" value={form.suffix} onChange={e => set('suffix', e.target.value)} />
            </>
          ) : (
            <button type="button" onClick={() => setShowSuffix(true)}
              className="mt-6 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:underline underline-offset-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">add</span> Add Suffix
            </button>
          )}
        </div>
      </div>

      {/* Date of Birth */}
      <div>
        <label className={labelCls}>Date of Birth *</label>
        <div className="grid grid-cols-3 gap-3">
          <select className={selectCls} value={form.dobMonth} onChange={e => set('dobMonth', e.target.value)}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
          </select>
          <select className={selectCls} value={form.dobDay} onChange={e => set('dobDay', e.target.value)}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>)}
          </select>
          <select className={selectCls} value={form.dobYear} onChange={e => set('dobYear', e.target.value)}>
            <option value="">Year</option>
            {Array.from({ length: 100 }, (_, i) => {
              const y = new Date().getFullYear() - 16 - i;
              return <option key={y} value={String(y)}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className={labelCls}>Gender *</label>
        <select className={selectCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-Binary</option>
          <option value="undisclosed">Prefer not to say</option>
        </select>
      </div>
    </div>
  ); // end phase1

  // ── Phase 2: Contact Info (inline JSX) ──────────────────
  const phase2 = (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1 mb-8">
        <h2 className="text-2xl font-black tracking-tight uppercase text-navy-950">Contact Information</h2>
        <p className="text-xs font-bold text-navy-400 tracking-wide">All fields required unless noted.</p>
      </div>

      {/* Mailing Address Header */}
      <div className="border-b border-navy-100 pb-2">
        <p className="text-[10px] font-black text-navy-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">home</span>
          Mailing Address
        </p>
      </div>

      <div>
        <label className={labelCls}>Country / Region *</label>
        <select className={selectCls} value={form.country} onChange={e => set('country', e.target.value)}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>

      {!showCompany ? (
        <button type="button" onClick={() => setShowCompany(true)}
          className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:underline underline-offset-4 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">add</span> Add Company Name
        </button>
      ) : (
        <div>
          <label className={labelCls}>Company Name <span className="text-navy-300 normal-case tracking-normal">(optional)</span></label>
          <input className={inputCls} placeholder="Company name" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
        </div>
      )}

      <div>
        <label className={labelCls}>Address Line 1 *</label>
        <input className={inputCls} placeholder="Street address" value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} />
      </div>

      {!showAddr2 ? (
        <button type="button" onClick={() => setShowAddr2(true)}
          className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:underline underline-offset-4 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">add</span> Add Address Line 2
        </button>
      ) : (
        <div>
          <label className={labelCls}>Address Line 2 <span className="text-navy-300 normal-case tracking-normal">(optional)</span></label>
          <input className={inputCls} placeholder="Apt, suite, unit, etc." value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>City *</label>
          <input className={inputCls} placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>State / Province *</label>
          {form.country === 'US' ? (
            <select className={selectCls} value={form.stateProvince} onChange={e => set('stateProvince', e.target.value)}>
              <option value="">Select One</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input className={inputCls} placeholder="Province" value={form.stateProvince} onChange={e => set('stateProvince', e.target.value)} />
          )}
        </div>
        <div>
          <label className={labelCls}>Postal Code *</label>
          <input className={inputCls} placeholder="00000" value={form.postalCode} onChange={e => set('postalCode', e.target.value)} />
        </div>
      </div>

      {/* Phone */}
      <div className="border-b border-navy-100 pb-2 mt-4">
        <p className="text-[10px] font-black text-navy-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">phone</span>
          Phone Number
        </p>
      </div>
      <p className="text-[10px] font-bold text-navy-400 tracking-wide leading-relaxed -mt-2">
        Your cell phone number can be used for {BRAND.loyaltyProgram} account recovery.
      </p>
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Country Code</label>
          <select className={selectCls} value={form.phoneCountryCode} onChange={e => set('phoneCountryCode', e.target.value)}>
            {PHONE_CODES.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
          </select>
        </div>
        <div className="col-span-3">
          <label className={labelCls}>Phone Number *</label>
          <input className={inputCls} type="tel" maxLength={15} placeholder="(555) 123-4567" value={form.phoneNumber}
            onChange={e => { const val = e.target.value.replace(/[^0-9\s\-().+]/g, ''); set('phoneNumber', val); }} />
        </div>
      </div>

      {/* Email */}
      <div className="border-b border-navy-100 pb-2 mt-4">
        <p className="text-[10px] font-black text-navy-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">mail</span>
          Email Address
        </p>
      </div>
      <p className="text-[10px] font-bold text-navy-400 tracking-wide leading-relaxed -mt-2">
        The email address entered will be used for trip updates and {BRAND.shortName} account recovery.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Email Address *</label>
          <input className={inputCls} type="email" placeholder={BRAND.placeholderEmail} value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Confirm Email *</label>
          <input className={inputCls} type="email" placeholder="Confirm email address" value={form.confirmEmail} onChange={e => set('confirmEmail', e.target.value)} />
        </div>
      </div>

      {/* Email Subscribe */}
      <div className="bg-navy-50/60 rounded-2xl border border-navy-100 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <input id="subscribe" type="checkbox" checked={form.subscribeEmail} onChange={e => set('subscribeEmail', e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded-md border-2 border-navy-200 text-primary focus:ring-primary/30 transition-all cursor-pointer" />
          <label htmlFor="subscribe" className="text-[10px] font-bold text-navy-500 uppercase tracking-wide leading-relaxed cursor-pointer">
            <span className="font-black text-navy-700">Subscribe to email notifications</span>
            <br />
            Stay up to date on your account activity, special offers, and travel alerts — and earn <span className="text-primary font-black">100 bonus miles</span> when you opt in to receive emails through the {BRAND.loyaltyProgram}. <a href="#" onClick={e => { e.preventDefault(); addToast('Terms & Conditions page coming soon', 'info'); }} className="text-primary underline underline-offset-2">Terms Apply</a>.
          </label>
        </div>
      </div>
    </div>
  ); // end phase2

  // ── Phase 3: Security (inline JSX) ──────────────────────
  const phase3 = (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1 mb-8">
        <h2 className="text-2xl font-black tracking-tight uppercase text-navy-950">Create Password</h2>
        <p className="text-xs font-bold text-navy-400 tracking-wide">Secure your {BRAND.shortName} account.</p>
      </div>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-navy-50 to-primary/5 rounded-2xl border border-navy-100 p-6 space-y-3">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">badge</span> Your Details
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div><span className="font-black text-navy-400 uppercase tracking-wider text-[9px]">Name</span><p className="font-bold text-navy-900">{displayName || '—'}</p></div>
          <div><span className="font-black text-navy-400 uppercase tracking-wider text-[9px]">Email</span><p className="font-bold text-navy-900">{form.email || '—'}</p></div>
          <div><span className="font-black text-navy-400 uppercase tracking-wider text-[9px]">Phone</span><p className="font-bold text-navy-900">{form.phoneCountryCode} {form.phoneNumber || '—'}</p></div>
          <div><span className="font-black text-navy-400 uppercase tracking-wider text-[9px]">Location</span><p className="font-bold text-navy-900">{form.city ? `${form.city}, ${form.stateProvince || form.country}` : '—'}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Password *</label>
          <div className="relative">
            <input className={inputCls} type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-primary transition-colors p-1" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Confirm Password *</label>
          <div className="relative">
            <input className={inputCls} type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-primary transition-colors p-1" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
              <span className="material-symbols-outlined text-lg">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password strength hint */}
      <div className="flex items-center gap-3 px-1">
        {[8, 12, 16].map((threshold, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${form.password.length >= threshold ? 'bg-primary' : 'bg-navy-100'}`} />
        ))}
        <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest">
          {form.password.length < 8 ? 'Weak' : form.password.length < 12 ? 'Good' : 'Strong'}
        </span>
      </div>

      {/* Password requirements checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1">
        {[
          { label: '8+ characters', met: form.password.length >= 8 },
          { label: 'Uppercase letter', met: /[A-Z]/.test(form.password) },
          { label: 'A number', met: /[0-9]/.test(form.password) },
          { label: 'Passwords match', met: form.password.length > 0 && form.password === form.confirmPassword },
        ].map((req, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-xs ${req.met ? 'text-green-500' : 'text-navy-200'}`}>{req.met ? 'check_circle' : 'radio_button_unchecked'}</span>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${req.met ? 'text-green-600' : 'text-navy-300'}`}>{req.label}</span>
          </div>
        ))}
      </div>

      {/* Terms */}
      <div className="bg-navy-50/50 rounded-2xl border border-navy-100 p-5">
        <div className="flex items-start gap-3">
          <input id="terms" type="checkbox" checked={form.acceptTerms} onChange={e => set('acceptTerms', e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded-md border-2 border-navy-200 text-primary focus:ring-primary/30 transition-all cursor-pointer" />
          <label className="text-[10px] font-bold text-navy-500 uppercase leading-relaxed tracking-wide cursor-pointer" htmlFor="terms">
            I acknowledge the <a className="text-primary font-black underline underline-offset-4 decoration-2" href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); addToast('Terms of Service page coming soon', 'info'); }}>Terms of Service</a> and <a className="text-primary font-black underline underline-offset-4 decoration-2" href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); addToast('Privacy Policy page coming soon', 'info'); }}>Privacy Policy</a> of {BRAND.name}.
          </label>
        </div>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full font-sans text-navy-950 bg-white">
      {/* Left Side: Hero Image */}
      <div className="hidden lg:flex w-[42%] relative bg-navy-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] scale-110"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuALO6V4esqoBr4OpQ653wGJtuM524dSB0-XlcJH-ubpefREbX5MNGfeHo1be4WCknHdpqEEcjljZdox24WoJfYV-1ZSffw1tHu0zG3murm9WnvK2Cw5iyiBoItPkZoBC07ulmSXhXGIPogKQED3UUnvpO20hALA1_ZsiCBnU9xX1PT1eyJU2LTZCEUzCVyxdv0iwOfPKxEW_PN1tP21Ykd75WX0NY_kJrUbjo8j1tf0UhceibcWQtFdQ0DDNnkfdmJte4_DQGIHYo8')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-900/20 to-transparent" />

        <div className="relative z-10 flex flex-col h-full justify-between p-16 text-white">
          <Link to={ROUTES.HOME} className="flex items-center gap-4 group cursor-pointer no-underline">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-white text-2xl font-black">airlines</span>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-white">{BRAND.name}</span>
          </Link>

          <div className="max-w-xl space-y-10">
            <blockquote className="text-5xl font-black leading-tight tracking-tighter uppercase italic opacity-90 drop-shadow-lg">
              "Your next adventure starts here. Create your account and take flight."
            </blockquote>
            <div className="flex items-center gap-4">
              {STEPS.map((s, i) => (
                <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all
                  ${i === step ? 'bg-white/20 text-white' : i < step ? 'text-primary' : 'text-white/30'}`}>
                  {i < step ? <span className="material-symbols-outlined text-sm">check</span> : <span className="material-symbols-outlined text-sm">{s.icon}</span>}
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{BRAND.copyright}</p>
        </div>
      </div>

      {/* Right Side: Multi-Step Form */}
      <div className="flex flex-1 flex-col overflow-y-auto w-full lg:w-[58%]">
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 relative">
          {/* Mobile Header Logo */}
          <Link to={ROUTES.HOME} className="lg:hidden absolute top-8 left-8 flex items-center gap-3 no-underline">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl font-black">airlines</span>
            </div>
            <span className="font-black text-xl tracking-tighter text-navy-950 uppercase">{BRAND.shortName}</span>
          </Link>

          <div className="w-full max-w-[580px] flex flex-col gap-6 mt-16 lg:mt-0">
            {/* Header */}
            <div className="text-center space-y-2 mb-2">
              <h1 className="text-3xl font-black tracking-tight uppercase text-navy-950">Join {BRAND.shortName}</h1>
              <p className="text-xs font-bold text-navy-400 tracking-wide">Create your account in 3 simple steps</p>
            </div>

            {/* Google Signup — only on step 0 */}
            {step === 0 && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-3 h-13 rounded-xl border-2 border-navy-100 hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50 w-full"
                >
                  <span className="material-symbols-outlined text-navy-300 group-hover:text-primary font-black">workspaces</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-700 group-hover:text-navy-950">Continue with Google</span>
                </button>
                <div className="relative flex items-center">
                  <div className="grow border-t border-navy-100" />
                  <span className="mx-6 text-[10px] font-black text-navy-300 uppercase tracking-[0.2em]">Or sign up with email</span>
                  <div className="grow border-t border-navy-100" />
                </div>
              </>
            )}

            {/* Step Indicator */}
            {stepIndicator}

            {/* Error Banner */}
            {error && (
              <div id="register-error" className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-300" role="alert">
                <span className="material-symbols-outlined text-red-500 text-lg mt-0.5">error</span>
                <p className="text-xs font-bold text-red-700 tracking-wide">{error}</p>
              </div>
            )}

            {/* Form Steps */}
            <form onSubmit={handleSubmit} aria-label="Registration form">
              {step === 0 && phase1}
              {step === 1 && phase2}
              {step === 2 && phase3}

              {/* Navigation Buttons */}
              <div className="flex items-center gap-4 mt-10">
                {step > 0 && (
                  <button type="button" onClick={prev}
                    className="flex items-center gap-2 h-14 px-8 rounded-xl border-2 border-navy-100 text-navy-600 text-xs font-black uppercase tracking-[0.2em] hover:border-navy-200 hover:bg-navy-50 transition-all">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back
                  </button>
                )}
                {step < 2 ? (
                  <button type="button" onClick={next}
                    className="flex-1 h-14 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2">
                    Continue
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                ) : (
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 h-14 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating Account...</>
                    ) : (
                      <>Create Account <span className="material-symbols-outlined text-sm">how_to_reg</span></>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="text-center text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] pb-8 mt-6">
              Already a member?
              <Link to={ROUTES.LOGIN} className="text-primary font-black ml-2 hover:underline decoration-2 underline-offset-4">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
