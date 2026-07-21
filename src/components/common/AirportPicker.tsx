
import React, { useState, useEffect, useRef } from 'react';
import { getRoutes } from '../../services/firestore';
import type { RouteDoc } from '../../types/firestore';

export interface AirportOption {
  code: string;
  name: string;
  city: string;
  country: string;
}

/**
 * Fetches unique airports from active routes in Firestore.
 * Returns a sorted array of AirportOption.
 */
export function useAirports() {
  const [airports, setAirports] = useState<AirportOption[]>([]);
  useEffect(() => {
    getRoutes().then((routes: RouteDoc[]) => {
      const map = new Map<string, AirportOption>();
      for (const r of routes) {
        if (!map.has(r.origin.code)) map.set(r.origin.code, { code: r.origin.code, name: r.origin.name, city: r.origin.city, country: r.origin.country });
        if (!map.has(r.destination.code)) map.set(r.destination.code, { code: r.destination.code, name: r.destination.name, city: r.destination.city, country: r.destination.country });
      }
      setAirports(Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city)));
    });
  }, []);
  return airports;
}

/** Searchable airport dropdown — supports two visual variants */
const AirportPicker: React.FC<{
  label: string;
  icon: string;
  value: string;
  airports: AirportOption[];
  onChange: (code: string) => void;
  /** 'default' = compact (FlightSearch), 'hero' = larger/bolder (LandingHome) */
  variant?: 'default' | 'hero';
}> = ({ label, icon, value, airports, onChange, variant = 'default' }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = airports.find(a => a.code === value);
  const displayText = selected ? `${selected.city} (${selected.code})` : '';

  const filtered = airports.filter(a => {
    const q = filter.toLowerCase();
    return a.city.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q);
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isHero = variant === 'hero';

  return (
    <div className="relative w-full group" ref={ref}>
      {!isHero && (
        <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">{label}</label>
      )}
      {isHero && (
        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-2">{label}</label>
      )}
      <div className="relative group/field">
        <span className={`material-symbols-outlined absolute ${isHero ? 'left-5' : 'left-4'} top-1/2 -translate-y-1/2 text-navy-300 ${isHero ? 'group-focus-within/field:text-primary transition-colors' : ''}`}>{icon}</span>
        <input
          className={isHero
            ? 'w-full h-16 pl-14 pr-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase tracking-tighter focus:ring-8 focus:ring-primary/5 transition-all shadow-inner'
            : 'w-full h-14 pl-12 pr-4 bg-navy-50 border border-navy-100 rounded-xl text-navy-900 font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer'
          }
          value={open ? filter : displayText}
          placeholder={`Select ${label.toLowerCase()}`}
          onFocus={() => { setOpen(true); setFilter(''); }}
          onChange={(e) => setFilter(e.target.value)}
          readOnly={false}
        />
        {open && (
          <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white rounded-xl border border-navy-100 shadow-2xl max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-navy-400 text-center">No airports found</p>
            ) : (
              filtered.map(a => (
                <button
                  key={a.code}
                  type="button"
                  className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center gap-3 ${value === a.code ? 'bg-primary/10 text-primary' : 'text-navy-700'}`}
                  onClick={() => { onChange(a.code); setOpen(false); setFilter(''); }}
                >
                  <span className="text-xs font-black bg-navy-50 px-2 py-1 rounded-lg border border-navy-100 uppercase">{a.code}</span>
                  <div>
                    <p className="text-sm font-bold">{a.city}</p>
                    <p className="text-[10px] text-navy-400">{a.name}, {a.country}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AirportPicker;
