import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getNotificationPrefs, updateNotificationPrefs } from '../../services/cms';
import type { NotificationChannels } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

/* ── Preference category definitions ────────────────────────── */
interface PrefCategory {
   key: 'flightDisruptions' | 'gateChanges' | 'checkinReminders' | 'specialOffers';
   label: string;
   desc: string;
   icon: string;
   section: 'critical' | 'general';
}

const CATEGORIES: PrefCategory[] = [
   {
      key: 'flightDisruptions',
      label: 'Flight Disruptions',
      desc: 'Get notified about delays, cancellations, and route changes.',
      icon: 'flight_takeoff',
      section: 'critical',
   },
   {
      key: 'gateChanges',
      label: 'Gate & Terminal Changes',
      desc: 'Get notified when your gate, terminal, or aircraft changes.',
      icon: 'sensor_door',
      section: 'critical',
   },
   {
      key: 'checkinReminders',
      label: 'Check-in Reminders',
      desc: 'Reminders when online check-in opens and boarding passes are ready.',
      icon: 'assignment_ind',
      section: 'general',
   },
   {
      key: 'specialOffers',
      label: 'Special Offers',
      desc: 'Seasonal discounts, promotions, and exclusive deals.',
      icon: 'campaign',
      section: 'general',
   },
];

const DEFAULT_CHANNELS: NotificationChannels = { email: true, sms: false, push: true };

/* ═════════════════════════════════════════════════════════════
   Notification Settings
   ═════════════════════════════════════════════════════════════ */
const NotificationPreferences: React.FC = () => {
   const { user } = useAuthStore();
   const [loading, setLoading] = useState(true);
   const [pauseAll, setPauseAll] = useState(false);
   const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   // Per-category state
   const [prefs, setPrefs] = useState<Record<string, { enabled: boolean; channels: NotificationChannels }>>({
      flightDisruptions: { enabled: true, channels: { email: true, sms: true, push: true } },
      gateChanges: { enabled: true, channels: { email: false, sms: true, push: true } },
      checkinReminders: { enabled: true, channels: { email: true, sms: false, push: true } },
      specialOffers: { enabled: false, channels: { email: false, sms: false, push: false } },
   });

   /* ── Load from Firestore ─────────────────────────────────── */
   useEffect(() => {
      if (!user) return;
      (async () => {
         try {
            const saved = await getNotificationPrefs(user.uid);
            if (saved) {
               setPauseAll(saved.pauseAll ?? false);
               const keys = ['flightDisruptions', 'gateChanges', 'checkinReminders', 'specialOffers'] as const;
               const loaded: Record<string, { enabled: boolean; channels: NotificationChannels }> = {};
               for (const k of keys) {
                  loaded[k] = saved[k] ?? prefs[k];
               }
               setPrefs(loaded);
            }
         } catch (err) {
            console.error('Failed to load notification prefs:', err);
         } finally {
            setLoading(false);
         }
      })();
   }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

   /* ── Auto-save (debounced) ───────────────────────────────── */
   const savePrefs = useCallback((newPauseAll: boolean, newPrefs: typeof prefs) => {
      if (!user) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
         try {
            await updateNotificationPrefs(user.uid, {
               pauseAll: newPauseAll,
               flightDisruptions: newPrefs.flightDisruptions,
               gateChanges: newPrefs.gateChanges,
               checkinReminders: newPrefs.checkinReminders,
               specialOffers: newPrefs.specialOffers,
            });
            useToastStore.getState().addToast('Settings saved', 'success');
         } catch (err) {
            console.error('Save failed:', err);
            useToastStore.getState().addToast('Failed to save settings', 'error');
         }
      }, 600);
   }, [user]);

   /* ── Handlers ────────────────────────────────────────────── */
   const togglePauseAll = () => {
      const next = !pauseAll;
      setPauseAll(next);
      savePrefs(next, prefs);
   };

   const toggleCategory = (key: string) => {
      setPrefs((prev) => {
         const next = { ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } };
         savePrefs(pauseAll, next);
         return next;
      });
   };

   const toggleChannel = (key: string, channel: keyof NotificationChannels) => {
      setPrefs((prev) => {
         const next = {
            ...prev,
            [key]: {
               ...prev[key],
               channels: { ...prev[key].channels, [channel]: !prev[key].channels[channel] },
            },
         };
         savePrefs(pauseAll, next);
         return next;
      });
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
         </div>
      );
   }

   const criticalPrefs = CATEGORIES.filter((c) => c.section === 'critical');
   const generalPrefs = CATEGORIES.filter((c) => c.section === 'general');

   return (
      <div className="p-8 max-w-[1200px] mx-auto space-y-12 animate-in fade-in duration-500 font-display pb-32">
         {/* Header */}
         <div className="space-y-4 max-w-3xl">
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300 px-1">
               <span>Settings</span>
               <span className="material-symbols-outlined text-xs">chevron_right</span>
               <span className="text-primary">Notifications</span>
            </nav>
            <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Notification Settings</h1>
            <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">Choose which notifications you receive and how.</p>
         </div>

         {/* Contact Summary */}
         <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-md transition-all">
            <div className="flex items-center gap-6">
               <div className="size-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                  <span className="material-symbols-outlined text-3xl font-black">contact_mail</span>
               </div>
               <div>
                  <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] mb-1">Your Email</p>
                  <p className="text-lg font-black text-navy-950 uppercase tracking-tight">{user?.email || 'No email set'}</p>
               </div>
            </div>
         </div>

         {/* Pause All Toggle */}
         <div className={`rounded-[2.5rem] border p-8 flex items-center justify-between shadow-sm relative overflow-hidden group transition-all ${pauseAll ? 'bg-amber-50 border-amber-200' : 'bg-primary/5 border-primary/20'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-primary transition-transform group-hover:scale-110">
               <span className="material-symbols-outlined text-[120px] font-black">pause_circle</span>
            </div>
            <div className="flex items-center gap-6 relative z-10">
               <span className={`material-symbols-outlined text-3xl font-black ${pauseAll ? 'text-amber-500' : 'text-primary'}`}>timer_off</span>
               <div>
                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Pause All Notifications</p>
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">
                     {pauseAll ? 'All notifications are paused except safety alerts.' : 'Pause all notifications except safety alerts for 24 hours.'}
                  </p>
               </div>
            </div>
            <button onClick={togglePauseAll} className="relative inline-flex items-center h-8 w-16 cursor-pointer relative z-10">
               <div className={`w-16 h-8 rounded-full transition-all ${pauseAll ? 'bg-amber-500' : 'bg-navy-200'}`}>
                  <div className={`absolute top-1 left-1 bg-white rounded-full h-6 w-6 transition-all shadow-lg ${pauseAll ? 'translate-x-8' : ''}`} />
               </div>
            </button>
         </div>

         {/* Preferences Grid */}
         <div className="space-y-12">
            {/* Critical Alerts */}
            <div className="space-y-6">
               <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4 px-4">
                  <span className="material-symbols-outlined text-red-500 font-black">priority_high</span>
                  Important Alerts
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {criticalPrefs.map((cat) => renderPrefCard(cat))}
               </div>
            </div>

            {/* General */}
            <div className="space-y-6">
               <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4 px-4">
                  <span className="material-symbols-outlined text-navy-400 font-black">airplane_ticket</span>
                  Promotions & Updates
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {generalPrefs.map((cat) => renderPrefCard(cat))}
               </div>
            </div>
         </div>
      </div>
   );

   /* ── Preference Card Renderer ─────────────────────────────── */
   function renderPrefCard(cat: PrefCategory) {
      const pref = prefs[cat.key];
      const isDisabled = pauseAll && cat.section !== 'critical';

      return (
         <div key={cat.key} className={`bg-white p-10 rounded-[3rem] border border-navy-100 shadow-sm space-y-8 group hover:shadow-xl transition-all ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex justify-between items-start">
               <div className="flex items-start gap-5">
                  <div className="p-3 bg-navy-50 text-navy-700 rounded-2xl shadow-inner group-hover:bg-primary/5 group-hover:text-primary transition-all">
                     <span className="material-symbols-outlined text-2xl font-black">{cat.icon}</span>
                  </div>
                  <div className="space-y-1">
                     <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">{cat.label}</h4>
                     <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60 leading-relaxed">{cat.desc}</p>
                  </div>
               </div>
               <button
                  onClick={() => toggleCategory(cat.key)}
                  disabled={isDisabled}
                  className="relative inline-flex items-center h-7 w-14 cursor-pointer disabled:cursor-not-allowed"
               >
                  <div className={`w-14 h-7 rounded-full transition-all ${pref.enabled ? 'bg-primary' : 'bg-navy-100'}`}>
                     <div className={`absolute top-1 left-1 bg-white rounded-full h-5 w-5 transition-all shadow-md ${pref.enabled ? 'translate-x-7' : ''}`} />
                  </div>
               </button>
            </div>
            <div className="pt-8 border-t border-navy-50 space-y-4">
               <p className="text-[8px] font-black text-navy-300 uppercase tracking-[0.3em]">Send via</p>
               <div className="flex flex-wrap gap-4">
                  {(['email', 'sms', 'push'] as const).map((ch) => {
                     const channelLabel = ch === 'email' ? 'E-Mail' : ch === 'sms' ? 'SMS' : 'App Push';
                     const isChDisabled = isDisabled || !pref.enabled;
                     return (
                        <label key={ch} className={`flex items-center gap-3 ${isChDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer group/ch'}`}>
                           <div className="relative flex items-center">
                              <input
                                 type="checkbox"
                                 checked={pref.channels[ch]}
                                 disabled={isChDisabled}
                                 onChange={() => toggleChannel(cat.key, ch)}
                                 className="peer h-5 w-5 appearance-none rounded-lg border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span className="material-symbols-outlined text-white text-[12px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 font-black pointer-events-none">check</span>
                           </div>
                           <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover/ch:text-navy-950 transition-all">{channelLabel}</span>
                        </label>
                     );
                  })}
               </div>
            </div>
         </div>
      );
   }
};

export default NotificationPreferences;
