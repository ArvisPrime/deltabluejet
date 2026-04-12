import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { APP_CONFIG } from '../../config/app';
import { useBookingStore } from '../../stores/bookingStore';
import { validatePassportExpiry, validateDocumentFormat, type ExpiryValidation } from '../../services/travelDocService';
import { isValidEmail, isValidPhone, isValidDOB } from '../../utils/validators';

import { useConfigStore } from '../../stores/configStore';



const PassengerDetails: React.FC = () => {
  const navigate = useNavigate();

  // ── Form State ──────────────────────────────────────────
  const [title, setTitle] = useState('Mr.');
  const [gender, setGender] = useState('Male');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [documentType, setDocumentType] = useState('passport');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [issuingCountry, setIssuingCountry] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState(APP_CONFIG.phoneCodes?.[0]?.code || '+1');
  const [phone, setPhone] = useState('');
  const [attempted, setAttempted] = useState(false);

  const setPassengers = useBookingStore(s => s.setPassengers);
  const countriesConfig = useConfigStore(s => s.countries);

  const countriesList = useMemo(() => {
    if (countriesConfig?.countries?.length) {
      return countriesConfig.countries.map(c => c.name).sort();
    }
    return [
      'Canada', 'Gambia', 'Ghana', 'Guinea', 'Kenya', 'Liberia', 'Morocco', 
      'Nigeria', 'Senegal', 'Sierra Leone', 'South Africa', 'United Arab Emirates', 
      'United Kingdom', 'United States'
    ];
  }, [countriesConfig]);

  const phoneCodesList = useMemo(() => {
    if (countriesConfig?.countries?.length) {
      return countriesConfig.countries.map(c => ({ code: c.dialCode, label: c.code })).sort((a,b) => a.label.localeCompare(b.label));
    }
    return APP_CONFIG.phoneCodes || [{ code: '+1', label: 'US' }];
  }, [countriesConfig]);

  // ── Validation ──────────────────────────────────────────
  const isEmailValid = useMemo(() => isValidEmail(email), [email]);
  const isPhoneValid = useMemo(() => isValidPhone(phone), [phone]);
  const isDobValid = useMemo(() => isValidDOB(dateOfBirth), [dateOfBirth]);

  const passportExpiryCheck: ExpiryValidation | null = useMemo(() => {
    if (!passportExpiry) return null;
    // Use a reasonable future travel date (30 days from now if not known)
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 30);
    return validatePassportExpiry(passportExpiry, travelDate.toISOString());
  }, [passportExpiry]);

  const passportFormatCheck = useMemo(() => {
    if (!passportNumber) return null;
    return validateDocumentFormat(passportNumber);
  }, [passportNumber]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    else if (!isDobValid) e.dateOfBirth = 'Invalid date of birth';
    if (!nationality) e.nationality = 'Nationality is required';
    if (!passportNumber.trim()) e.passportNumber = `${documentType === 'passport' ? 'Passport' : 'ID'} number is required`;
    else if (passportFormatCheck && !passportFormatCheck.valid) e.passportNumber = passportFormatCheck.message;
    if (!passportExpiry) e.passportExpiry = 'Expiry date is required';
    else if (passportExpiryCheck && !passportExpiryCheck.valid) e.passportExpiry = passportExpiryCheck.message;
    if (!issuingCountry) e.issuingCountry = 'Issuing country is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!isEmailValid) e.email = 'Please enter a valid email address';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!isPhoneValid) e.phone = 'Please enter a valid phone number';
    return e;
  }, [firstName, lastName, dateOfBirth, isDobValid, nationality, passportNumber, passportExpiry, issuingCountry, email, phone, isEmailValid, isPhoneValid, passportExpiryCheck, passportFormatCheck, documentType]);

  const isValid = Object.keys(errors).length === 0;

  // ── Handlers ────────────────────────────────────────────
  const onBack = () => navigate(ROUTES.FARE_SELECTION);
  const onNext = () => {
    setAttempted(true);
    if (isValid) {
      // Persist to booking store
      setPassengers([{
        title,
        firstName,
        lastName,
        gender,
        dateOfBirth,
        nationality,
        documentType,
        documentNumber: passportNumber,
        passportExpiry,
        issuingCountry,
        email,
        phone: `${phoneCode}${phone}`,
      }]);
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
                  {attempted && errors.firstName && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.firstName}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Last Name {requiredMark}</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className={fieldClass('lastName')} placeholder="e.g. Doe" />
                  {attempted && errors.lastName && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.lastName}</div>
                  )}
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
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Date of Birth {requiredMark}</label>
                  <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={fieldClass('dateOfBirth')} />
                  {attempted && errors.dateOfBirth && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.dateOfBirth}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Nationality {requiredMark}</label>
                  <select value={nationality} onChange={e => setNationality(e.target.value)} className={fieldClass('nationality')}>
                    <option value="">Select country</option>
                    {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {attempted && errors.nationality && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.nationality}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Doc Type {requiredMark}</label>
                  <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full h-12 rounded-xl border-2 border-transparent bg-navy-50 px-4 font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option value="passport">Passport</option>
                    <option value="id_card">National ID / Resident Card</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Document Number {requiredMark}</label>
                  <input value={passportNumber} onChange={e => setPassportNumber(e.target.value.toUpperCase())} className={fieldClass('passportNumber')} placeholder={documentType === 'passport' ? 'E.g. A1234567' : 'Enter ID number'} />
                  {attempted && errors.passportNumber && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.passportNumber}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Expiry Date {requiredMark}</label>
                  <input type="date" value={passportExpiry} onChange={e => setPassportExpiry(e.target.value)} className={fieldClass('passportExpiry')} />
                  {passportExpiryCheck && passportExpiryCheck.severity === 'warning' && (
                    <div className="flex items-start gap-2 mt-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">warning</span>
                      <p className="text-[10px] text-amber-700 font-bold">{passportExpiryCheck.message}</p>
                    </div>
                  )}
                  {attempted && errors.passportExpiry && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.passportExpiry}</div>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Issuing Country {requiredMark}</label>
                  <select value={issuingCountry} onChange={e => setIssuingCountry(e.target.value)} className={fieldClass('issuingCountry')}>
                    <option value="">Select issuing country</option>
                    {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {attempted && errors.issuingCountry && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.issuingCountry}</div>
                  )}
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
                  {attempted && errors.email && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.email}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Phone Number {requiredMark}</label>
                  <div className="flex gap-2 relative">
                    <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)} className="w-24 h-12 rounded-xl border-2 border-transparent bg-navy-50 px-3 font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 appearance-none text-xs">
                      {phoneCodesList.map((pc) => (
                        <option key={`${pc.label}-${pc.code}`} value={pc.code}>{pc.code} ({pc.label})</option>
                      ))}
                    </select>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className={`flex-1 pr-10 ${fieldClass('phone')}`} placeholder="123 456 7890" />
                    {phone && isPhoneValid && (
                      <span className="material-symbols-outlined text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2">check_circle</span>
                    )}
                    {attempted && errors.phone && !isPhoneValid && phone && (
                      <span className="material-symbols-outlined text-red-400 absolute right-4 top-1/2 -translate-y-1/2">error</span>
                    )}
                  </div>
                  {attempted && errors.phone && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">error</span> {errors.phone}</div>
                  )}
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
          <FlightSummarySidebar />

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

// ── Flight Summary Sidebar (reads from store) ─────────────
const FlightSummarySidebar: React.FC = () => {
  const selectedFlight = useBookingStore(s => s.selectedFlight);
  const searchCriteria = useBookingStore(s => s.searchCriteria);

  const originCode = selectedFlight?.origin || '—';
  const destCode = selectedFlight?.destination || '—';
  const flightNum = selectedFlight?.flightNumber || '—';
  const fareClass = selectedFlight?.fareClass || 'economy';
  const unitPrice = selectedFlight?.price || 0;

  // Passenger count from search criteria
  const adults = searchCriteria?.passengers?.adults || 1;
  const children = searchCriteria?.passengers?.children || 0;
  const infants = searchCriteria?.passengers?.infants || 0;
  const totalPax = adults + children + infants;
  const subtotal = unitPrice * totalPax;
  const taxes = Math.round(subtotal * 0.12 * 100) / 100; // ~12% tax estimate
  const total = subtotal + taxes;

  // Parse departure time — may be ISO string or formatted time
  const depDateRaw = selectedFlight?.departureTime ? new Date(selectedFlight.departureTime) : null;
  const depDate = depDateRaw && !isNaN(depDateRaw.getTime()) ? depDateRaw : null;

  // Fallback: use searchCriteria departure date if flight time isn't parseable
  const displayDate = depDate
    ? depDate
    : searchCriteria?.departureDate ? new Date(searchCriteria.departureDate) : null;

  const monthShort = displayDate && !isNaN(displayDate.getTime()) ? displayDate.toLocaleString('en', { month: 'short' }) : '—';
  const dayNum = displayDate && !isNaN(displayDate.getTime()) ? displayDate.getDate() : '—';
  const dayTime = depDate
    ? depDate.toLocaleString('en', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
    : selectedFlight?.departureTime || '—';

  // Duration
  const arrDateRaw = selectedFlight?.arrivalTime ? new Date(selectedFlight.arrivalTime) : null;
  const arrDate = arrDateRaw && !isNaN(arrDateRaw.getTime()) ? arrDateRaw : null;
  const duration = depDate && arrDate
    ? (() => {
        let diff = (arrDate.getTime() - depDate.getTime()) / 60000;
        if (diff < 0) diff += 1440;
        return `${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m`;
      })()
    : '—';

  return (
    <div className="bg-white rounded-[2rem] border border-navy-100 shadow-sm overflow-hidden">
      <div className="bg-navy-900 p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary/30 to-transparent" />
        <div className="relative z-10 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50">Your Flight</h3>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-3xl font-black">{originCode}</div>
            </div>
            <div className="flex-1 flex flex-col items-center px-4">
              <span className="text-[10px] opacity-40 uppercase font-black tracking-widest">Direct</span>
              <div className="w-full h-px bg-white/20 my-2 relative">
                <span className="material-symbols-outlined text-xs absolute right-0 -top-1.5 rotate-90 text-primary">flight</span>
              </div>
              <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">{duration}</span>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black">{destCode}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="flex gap-4">
          <div className="bg-navy-50 p-3 rounded-2xl flex flex-col items-center justify-center min-w-[70px] border border-navy-100">
            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{monthShort}</span>
            <span className="text-2xl font-black text-navy-950">{dayNum}</span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-sm font-black text-navy-950 uppercase tracking-tight">{dayTime}</div>
            <div className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Flight {flightNum}</div>
          </div>
        </div>
        <hr className="border-dashed border-navy-100" />
        <div className="space-y-3">
          {adults > 0 && (
            <div className="flex justify-between text-sm font-bold text-navy-500 uppercase tracking-widest text-[10px]">
              <span>Adult × {adults}</span>
              <span className="text-navy-900">${(unitPrice * adults).toFixed(2)}</span>
            </div>
          )}
          {children > 0 && (
            <div className="flex justify-between text-sm font-bold text-navy-500 uppercase tracking-widest text-[10px]">
              <span>Child × {children}</span>
              <span className="text-navy-900">${(unitPrice * children).toFixed(2)}</span>
            </div>
          )}
          {infants > 0 && (
            <div className="flex justify-between text-sm font-bold text-navy-500 uppercase tracking-widest text-[10px]">
              <span>Infant × {infants}</span>
              <span className="text-navy-900">${(unitPrice * infants * 0.1).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-navy-500 uppercase tracking-widest text-[10px]">
            <span>Taxes & Fees</span>
            <span className="text-navy-900">${taxes.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-navy-500 uppercase tracking-widest text-[10px]">
            <span>Class</span>
            <span className="text-navy-900 capitalize">{fareClass}</span>
          </div>
          <div className="pt-4 border-t border-navy-100 flex justify-between items-end">
            <span className="text-xs font-black text-navy-400 uppercase tracking-widest pb-1">Total Price</span>
            <span className="text-4xl font-black text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;

