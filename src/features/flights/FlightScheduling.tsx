import React, { useState, useEffect, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import type { RouteDoc, AircraftDoc } from '../../types/firestore';
import { subscribeToRoutes, subscribeToAircraft, createSchedule, checkAircraftConflict } from '../../services/firestore';
import { generateFlights, publishFlights, type GeneratedFlight } from '../../services/flightGenerator';
import WizardStepper from '../../components/scheduling/WizardStepper';
import FlightPreviewTable from '../../components/scheduling/FlightPreviewTable';
import { useToastStore } from '../../stores/toastStore';
import { useAuth } from '../../hooks/useAuth';

const STEPS = ['Route', 'Aircraft', 'Schedule', 'Preview', 'Publish'];
const DAYS = [
   { value: 1, label: 'Mon' },
   { value: 2, label: 'Tue' },
   { value: 3, label: 'Wed' },
   { value: 4, label: 'Thu' },
   { value: 5, label: 'Fri' },
   { value: 6, label: 'Sat' },
   { value: 7, label: 'Sun' },
];

const FlightScheduling: React.FC = () => {
   const { user } = useAuth();
   const [step, setStep] = useState(1);

   // Data sources
   const [routes, setRoutes] = useState<RouteDoc[]>([]);
   const [aircraft, setAircraft] = useState<AircraftDoc[]>([]);

   // Step 1: Route
   const [selectedRouteId, setSelectedRouteId] = useState('');

   // Step 2: Aircraft
   const [selectedAircraftId, setSelectedAircraftId] = useState('');
   const [conflictWarning, setConflictWarning] = useState('');

   // Step 3: Schedule
   const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
   const [departureTime, setDepartureTime] = useState('08:30');
   const [arrivalTime, setArrivalTime] = useState('11:45');
   const [effectiveFrom, setEffectiveFrom] = useState('');
   const [effectiveTo, setEffectiveTo] = useState('');
   const [flightPrefix, setFlightPrefix] = useState('DB-1');

   // Step 4 / 5
   const [previewFlights, setPreviewFlights] = useState<GeneratedFlight[]>([]);
   const [publishing, setPublishing] = useState(false);
   const [publishResult, setPublishResult] = useState<{ count: number; scheduleId: string } | null>(null);
   const [error, setError] = useState('');

   // Subscribe to data
   useEffect(() => {
      const unsub1 = subscribeToRoutes((data) => setRoutes(data.filter((r) => r.isActive)));
      const unsub2 = subscribeToAircraft((data) => setAircraft(data.filter((a) => a.status === 'active')));
      return () => { unsub1(); unsub2(); };
   }, []);

   const selectedRoute = useMemo(() => routes.find((r) => r.id === selectedRouteId), [routes, selectedRouteId]);
   const compatibleAircraft = useMemo(() => {
      if (!selectedRoute) return [];
      return aircraft.filter((ac) => ac.range_km >= selectedRoute.distance_km);
   }, [aircraft, selectedRoute]);
   const selectedAc = useMemo(() => aircraft.find((a) => a.id === selectedAircraftId), [aircraft, selectedAircraftId]);

   // Set default dates
   useEffect(() => {
      if (!effectiveFrom) {
         const tomorrow = new Date();
         tomorrow.setDate(tomorrow.getDate() + 1);
         setEffectiveFrom(tomorrow.toISOString().slice(0, 10));
      }
      if (!effectiveTo) {
         const threeMonths = new Date();
         threeMonths.setMonth(threeMonths.getMonth() + 3);
         setEffectiveTo(threeMonths.toISOString().slice(0, 10));
      }
   }, [effectiveFrom, effectiveTo]);

   const toggleDay = (day: number) => {
      setDaysOfWeek((prev) =>
         prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
      );
   };

   const canNext = (): boolean => {
      switch (step) {
         case 1: return !!selectedRouteId;
         case 2: return !!selectedAircraftId;
         case 3: return daysOfWeek.length > 0 && !!effectiveFrom && !!effectiveTo && !!departureTime && !!arrivalTime && !!flightPrefix;
         case 4: return previewFlights.length > 0;
         default: return false;
      }
   };

   const handleNext = async () => {
      setError('');

      if (step === 2 && selectedAircraftId && effectiveFrom && effectiveTo) {
         // Check conflict before proceeding
         const conflict = await checkAircraftConflict(
            selectedAircraftId,
            new Date(effectiveFrom),
            new Date(effectiveTo),
         );
         if (conflict) {
            setConflictWarning(`Aircraft has an existing schedule (${conflict.flightNumberPrefix}) effective in this date range.`);
         } else {
            setConflictWarning('');
         }
      }

      if (step === 3) {
         // Generate flights for preview
         if (!selectedRoute || !selectedAc) return;
         const flights = generateFlights(
            {
               flightNumberPrefix: flightPrefix,
               daysOfWeek,
               departureTime,
               arrivalTime,
               effectiveFrom: new Date(effectiveFrom),
               effectiveTo: new Date(effectiveTo),
            },
            selectedRoute,
            selectedAc,
         );
         if (flights.length === 0) {
            setError('No flights generated for the selected schedule. Check your date range and operating days.');
            return;
         }
         setPreviewFlights(flights);
      }

      setStep((s) => Math.min(s + 1, 5));
   };

   const handlePublish = async () => {
      if (!selectedRoute || !selectedAc || previewFlights.length === 0) return;
      setPublishing(true);
      setError('');

      try {
         // Create the schedule document
         const scheduleId = await createSchedule({
            routeId: selectedRoute.id,
            aircraftId: selectedAc.id,
            flightNumberPrefix: flightPrefix,
            daysOfWeek,
            departureTime,
            arrivalTime,
            effectiveFrom: Timestamp.fromDate(new Date(effectiveFrom)),
            effectiveTo: Timestamp.fromDate(new Date(effectiveTo)),
            status: 'draft',
            publishedFlightCount: 0,
            createdBy: user?.uid || 'unknown',
         });

         // Publish flights
         const count = await publishFlights(previewFlights, scheduleId, user?.uid || 'unknown');
         setPublishResult({ count, scheduleId });
         setStep(5);
      } catch (err) {
         console.error('Publish failed:', err);
         useToastStore.getState().addToast("Publish failed", "error");
         setError('Failed to publish flights. Please try again.');
      } finally {
         setPublishing(false);
      }
   };

   const handleReset = () => {
      setStep(1);
      setSelectedRouteId('');
      setSelectedAircraftId('');
      setDaysOfWeek([1, 3, 5]);
      setDepartureTime('08:30');
      setArrivalTime('11:45');
      setEffectiveFrom('');
      setEffectiveTo('');
      setFlightPrefix('DB-1');
      setPreviewFlights([]);
      setPublishResult(null);
      setError('');
      setConflictWarning('');
   };

   return (
      <div className="space-y-8">
         {/* Header */}
         <div>
            <h1 className="text-3xl font-black text-navy-950 tracking-tight uppercase">Schedule Publisher</h1>
            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
               Generate & Publish Flight Inventory
            </p>
         </div>

         {/* Stepper */}
         <div className="bg-white rounded-2xl border border-navy-100 px-8 py-5">
            <WizardStepper steps={STEPS} currentStep={step} />
         </div>

         {/* Step Content */}
         <div className="bg-white rounded-3xl border border-navy-100 p-8">
            {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
               </div>
            )}

            {/* Step 1: Route Selection */}
            {step === 1 && (
               <div className="space-y-6">
                  <div>
                     <h2 className="text-lg font-black text-navy-950 tracking-tight mb-1">Select Route</h2>
                     <p className="text-xs text-navy-400 font-medium">Choose an active route to create flights for.</p>
                  </div>
                  <div className="grid gap-3">
                     {routes.length === 0 ? (
                        <p className="text-sm text-navy-400 p-8 text-center">No active routes available. Create routes first.</p>
                     ) : (
                        routes.map((rt) => (
                           <button
                              key={rt.id}
                              onClick={() => setSelectedRouteId(rt.id)}
                              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedRouteId === rt.id
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-navy-100 hover:border-navy-200 hover:bg-navy-50/50'
                                 }`}
                           >
                              <div className={`size-10 rounded-xl flex items-center justify-center ${selectedRouteId === rt.id ? 'bg-primary text-white' : 'bg-navy-50 text-navy-400'
                                 }`}>
                                 <span className="material-symbols-outlined text-lg">route</span>
                              </div>
                              <div className="flex-1">
                                 <p className="text-sm font-black text-navy-950">
                                    {rt.origin.code} → {rt.destination.code}
                                 </p>
                                 <p className="text-[10px] text-navy-400 font-medium">
                                    {rt.origin.city} to {rt.destination.city} • {rt.distance_km.toLocaleString()} km • ~{Math.floor(rt.duration_minutes / 60)}h {rt.duration_minutes % 60}m
                                 </p>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs font-black text-emerald-700">${rt.baseFares?.economy}</p>
                                 <p className="text-[9px] text-navy-300 uppercase">economy</p>
                              </div>
                           </button>
                        ))
                     )}
                  </div>
               </div>
            )}

            {/* Step 2: Aircraft Assignment */}
            {step === 2 && (
               <div className="space-y-6">
                  <div>
                     <h2 className="text-lg font-black text-navy-950 tracking-tight mb-1">Assign Aircraft</h2>
                     <p className="text-xs text-navy-400 font-medium">
                        Only aircraft with range ≥ {selectedRoute?.distance_km.toLocaleString()} km are shown.
                     </p>
                  </div>
                  {conflictWarning && (
                     <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        {conflictWarning}
                     </div>
                  )}
                  <div className="grid gap-3">
                     {compatibleAircraft.length === 0 ? (
                        <p className="text-sm text-navy-400 p-8 text-center">No aircraft with sufficient range for this route.</p>
                     ) : (
                        compatibleAircraft.map((ac) => (
                           <button
                              key={ac.id}
                              onClick={() => setSelectedAircraftId(ac.id)}
                              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedAircraftId === ac.id
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-navy-100 hover:border-navy-200 hover:bg-navy-50/50'
                                 }`}
                           >
                              <div className={`size-10 rounded-xl flex items-center justify-center ${selectedAircraftId === ac.id ? 'bg-primary text-white' : 'bg-navy-50 text-navy-400'
                                 }`}>
                                 <span className="material-symbols-outlined text-lg">flight</span>
                              </div>
                              <div className="flex-1">
                                 <p className="text-sm font-black text-navy-950">{ac.registration}</p>
                                 <p className="text-[10px] text-navy-400 font-medium">
                                    {ac.type} • {ac.totalSeats} seats • Range: {ac.range_km.toLocaleString()} km
                                 </p>
                              </div>
                              <div className="text-right space-y-0.5">
                                 {Object.entries(ac.seatConfig).map(([cls, count]) => (
                                    <p key={cls} className="text-[9px] font-bold text-navy-500 capitalize">{cls}: {count}</p>
                                 ))}
                              </div>
                           </button>
                        ))
                     )}
                  </div>
               </div>
            )}

            {/* Step 3: Schedule Configuration */}
            {step === 3 && (
               <div className="space-y-6">
                  <div>
                     <h2 className="text-lg font-black text-navy-950 tracking-tight mb-1">Configure Schedule</h2>
                     <p className="text-xs text-navy-400 font-medium">Set operating days, times, and date range.</p>
                  </div>

                  {/* Flight Number Prefix */}
                  <div>
                     <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Flight Number Prefix</label>
                     <input
                        type="text"
                        value={flightPrefix}
                        onChange={(e) => setFlightPrefix(e.target.value)}
                        placeholder="DB-1"
                        className="w-48 h-11 px-4 rounded-xl border border-navy-100 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none"
                     />
                     <p className="text-[10px] text-navy-300 mt-1">Generated flights: {flightPrefix}01, {flightPrefix}02, …</p>
                  </div>

                  {/* Operating Days */}
                  <div>
                     <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-2">Operating Days</label>
                     <div className="flex gap-2">
                        {DAYS.map((d) => (
                           <button
                              key={d.value}
                              type="button"
                              onClick={() => toggleDay(d.value)}
                              className={`w-14 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${daysOfWeek.includes(d.value)
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-navy-400 border-navy-100 hover:border-primary/50'
                                 }`}
                           >
                              {d.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Times */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Departure Time</label>
                        <input
                           type="time"
                           value={departureTime}
                           onChange={(e) => setDepartureTime(e.target.value)}
                           className="w-full h-11 px-4 rounded-xl border border-navy-100 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Arrival Time</label>
                        <input
                           type="time"
                           value={arrivalTime}
                           onChange={(e) => setArrivalTime(e.target.value)}
                           className="w-full h-11 px-4 rounded-xl border border-navy-100 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                     </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Effective From</label>
                        <input
                           type="date"
                           value={effectiveFrom}
                           onChange={(e) => setEffectiveFrom(e.target.value)}
                           className="w-full h-11 px-4 rounded-xl border border-navy-100 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Effective To</label>
                        <input
                           type="date"
                           value={effectiveTo}
                           onChange={(e) => setEffectiveTo(e.target.value)}
                           className="w-full h-11 px-4 rounded-xl border border-navy-100 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                     </div>
                  </div>
               </div>
            )}

            {/* Step 4: Preview */}
            {step === 4 && (
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div>
                        <h2 className="text-lg font-black text-navy-950 tracking-tight mb-1">Preview Flights</h2>
                        <p className="text-xs text-navy-400 font-medium">
                           Review the flights that will be created. {previewFlights.length} flights generated.
                        </p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                           <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Total Flights</p>
                           <p className="text-xl font-black text-emerald-700">{previewFlights.length}</p>
                        </div>
                     </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-3">
                     <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50 text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Route</p>
                        <p className="text-sm font-black text-navy-800">{selectedRoute?.origin.code} → {selectedRoute?.destination.code}</p>
                     </div>
                     <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50 text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Aircraft</p>
                        <p className="text-sm font-black text-navy-800">{selectedAc?.registration}</p>
                     </div>
                     <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50 text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Seats/Flight</p>
                        <p className="text-sm font-black text-navy-800">{selectedAc?.totalSeats}</p>
                     </div>
                     <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50 text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Economy Fare</p>
                        <p className="text-sm font-black text-navy-800">${selectedRoute?.baseFares?.economy}</p>
                     </div>
                  </div>

                  <FlightPreviewTable flights={previewFlights} />
               </div>
            )}

            {/* Step 5: Published */}
            {step === 5 && publishResult && (
               <div className="text-center py-12 space-y-6">
                  <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                     <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-navy-950 tracking-tight">Flights Published!</h2>
                     <p className="text-sm text-navy-400 font-medium mt-2">
                        Successfully published <strong className="text-emerald-700">{publishResult.count}</strong> flights
                        for <strong>{selectedRoute?.origin.code} → {selectedRoute?.destination.code}</strong>
                     </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                     <div className="p-3 bg-navy-50/30 rounded-xl text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Flights</p>
                        <p className="text-lg font-black text-navy-800">{publishResult.count}</p>
                     </div>
                     <div className="p-3 bg-navy-50/30 rounded-xl text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Aircraft</p>
                        <p className="text-lg font-black text-navy-800">{selectedAc?.registration}</p>
                     </div>
                     <div className="p-3 bg-navy-50/30 rounded-xl text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Total Seats</p>
                        <p className="text-lg font-black text-navy-800">{publishResult.count * (selectedAc?.totalSeats || 0)}</p>
                     </div>
                  </div>
                  <button
                     onClick={handleReset}
                     className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20"
                  >
                     <span className="material-symbols-outlined text-sm mr-2 align-middle">add</span>
                     Publish Another Schedule
                  </button>
               </div>
            )}
         </div>

         {/* Navigation Buttons */}
         {step < 5 && (
            <div className="flex justify-between">
               <button
                  onClick={() => setStep((s) => Math.max(s - 1, 1))}
                  disabled={step === 1}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-navy-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all disabled:opacity-30"
               >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
               </button>
               {step === 4 ? (
                  <button
                     onClick={handlePublish}
                     disabled={publishing || previewFlights.length === 0}
                     className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                     {publishing ? (
                        <>
                           <div className="animate-spin size-4 border-2 border-white/30 border-t-white rounded-full" />
                           Publishing...
                        </>
                     ) : (
                        <>
                           <span className="material-symbols-outlined text-sm">publish</span>
                           Publish {previewFlights.length} Flights
                        </>
                     )}
                  </button>
               ) : (
                  <button
                     onClick={handleNext}
                     disabled={!canNext()}
                     className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                     Next
                     <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
               )}
            </div>
         )}
      </div>
   );
};

export default FlightScheduling;
