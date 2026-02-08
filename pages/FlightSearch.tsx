
import React from 'react';

interface FlightSearchProps {
  onNext: () => void;
}

const FlightSearch: React.FC<FlightSearchProps> = ({ onNext }) => {
  return (
    <div className="min-h-full font-display">
      <section className="relative min-h-[600px] flex flex-col items-center justify-center px-4 py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 z-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/40 via-navy-900/20 to-navy-50 z-10"></div>
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjJj-MwJ6AmcysuwwTNETCCfZSy9zMS8AlprYLY1D4ULiqqiuB7TTioQZXkSXdA2hcKFOnIOmlrj9bySRl367pajGaDw-s8Jm1H0KDq_Pm9DVWVlPcvb-pbUS5GWIUFT5omZRu8zTSZ8WUfC-c37MN5unsCptNWInZQ2eMOqBKy5cfvcCyaP6XgaKneSUg0p9IwN_4PBuagsueI_EpFYH0OKwUMzrLicErvV96JBwj4udVNTFk1kQwf-2-Q5xis1O2revus9n_7Nc')" }}></div>
        </div>
        
        <div className="relative z-20 w-full max-w-6xl flex flex-col gap-8">
          <div className="text-center text-white mb-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-md">Where to next?</h1>
            <p className="text-lg md:text-xl font-medium text-navy-50 drop-shadow-sm max-w-2xl mx-auto">Discover your next adventure with our best price guarantee and flexible options.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-navy-100 backdrop-blur-sm">
            <div className="flex flex-wrap gap-4 mb-6">
              <label className="group cursor-pointer">
                <input defaultChecked type="radio" name="tripType" className="peer sr-only" />
                <div className="px-4 py-2 rounded-full border border-navy-200 text-navy-500 text-sm font-bold peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:border-primary transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">sync_alt</span> Round Trip
                </div>
              </label>
              <label className="group cursor-pointer">
                <input type="radio" name="tripType" className="peer sr-only" />
                <div className="px-4 py-2 rounded-full border border-navy-200 text-navy-500 text-sm font-bold peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:border-primary transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span> One Way
                </div>
              </label>
              <label className="group cursor-pointer">
                <input type="radio" name="tripType" className="peer sr-only" />
                <div className="px-4 py-2 rounded-full border border-navy-200 text-navy-500 text-sm font-bold peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:border-primary transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">call_split</span> Multi-city
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-end">
              <div className="md:col-span-12 lg:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center relative">
                <div className="relative w-full group">
                  <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">From</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">flight_takeoff</span>
                    <input className="w-full h-14 pl-12 pr-4 bg-navy-50 border border-navy-100 rounded-xl text-navy-900 font-bold focus:ring-2 focus:ring-primary/20" defaultValue="New York (JFK)" />
                  </div>
                </div>
                <button className="hidden sm:flex size-10 items-center justify-center rounded-full bg-white border border-navy-100 text-navy-400 hover:text-primary transition-all mt-6 z-10 -ml-3 -mr-3 shadow-sm border-2">
                  <span className="material-symbols-outlined">swap_horiz</span>
                </button>
                <div className="relative w-full group">
                  <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">To</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">flight_land</span>
                    <input className="w-full h-14 pl-12 pr-4 bg-navy-50 border border-navy-100 rounded-xl text-navy-900 font-bold focus:ring-2 focus:ring-primary/20" defaultValue="London (LHR)" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 lg:col-span-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">Departure</label>
                  <input type="date" className="w-full h-14 px-4 bg-navy-50 border border-navy-100 rounded-xl font-bold text-sm" defaultValue="2024-11-15" />
                </div>
                <div>
                  <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">Return</label>
                  <input type="date" className="w-full h-14 px-4 bg-navy-50 border border-navy-100 rounded-xl font-bold text-sm" defaultValue="2024-11-22" />
                </div>
              </div>

              <div className="md:col-span-6 lg:col-span-2">
                <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">Travelers</label>
                <button className="w-full h-14 px-4 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-between group">
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-black text-navy-900">1 Adult</span>
                    <span className="text-[10px] text-navy-400 font-bold uppercase">Economy</span>
                  </div>
                  <span className="material-symbols-outlined text-navy-300 group-hover:text-primary transition-colors">keyboard_arrow_down</span>
                </button>
              </div>

              <div className="md:col-span-12 lg:col-span-2">
                <button onClick={onNext} className="w-full h-14 bg-primary text-white rounded-xl font-black text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                  <span className="material-symbols-outlined">search</span> Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-navy-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'verified_user', title: 'Best Price Guarantee', desc: "Find a lower price? We'll match it." },
              { icon: 'support_agent', title: '24/7 Ops Support', desc: "Our team is here to assist worldwide." },
              { icon: 'cancel', title: 'Free Cancellation', desc: "Flexible options on select bookings." },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-black text-navy-900">{item.title}</h3>
                  <p className="text-xs text-navy-400 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 md:px-10 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-navy-950 mb-2">Popular Destinations</h2>
            <p className="text-navy-400 font-bold text-xs uppercase tracking-widest">Trending flights from New York (JFK)</p>
          </div>
          <button className="hidden md:flex items-center gap-1 text-primary font-black hover:text-blue-700 transition-colors uppercase text-xs tracking-widest">
            View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { city: 'Paris', country: 'France', price: '$450', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3OgLFPSvG3og5n2jLn10OnXCerhNQHw3nUH9NhJqgdCkr59yH6WvQQ2TkSg-GkxT7og7x1KA6-WjEvGAH9Hwmd2VV2_EZrHtz4gN-aBrhbazEPG3KmPOd5jMDAFXxnI3PkSPLzvcMJLyjscNF3LK7Cb7ZvYkJ4lRN-lxUCh9SzMNpCrCbVZZ2Rd1rphx-dHECGg9u2I-gtCHoh1fMVpBkCyF7antYdKyUXCfNgaqqmlcXcq90YeDMTf2PMjR-hhyUPdGMOz9BPnI' },
            { city: 'Tokyo', country: 'Japan', price: '$890', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSOyLldgDNU5OhQoO9e9v08y-A0Bw126Ejdcnck4fm8VDtNeRiifevBKXU7FPeDuuO30mLEYnZiFtGz6-fHc1sahwovCP7Duyn54vkzhDu7OUEUW3dFyiLTC3RsLk017dp_aFEzYaWyCnASPIVANN0nhvyJc3l2FDUPWCKFfb-zEy7_C3uKypIBO6Z-TfSvvZDxUeY5LUu-Vn0u3QTN0xnliqL3nCOnSmZU4Ugw28VaWQ9FxyJ2kW-tcD2R4z2O1GXov9VRxDshj4' },
            { city: 'Dubai', country: 'UAE', price: '$620', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4PsZs-d0yFOQ3xMR4_s0NdQzjlQgcHLIZKZuEJMw7sTstQ9NliBA_w2TP947nhddXD13oqrsx8GoWtqKYOj7bLkeqrUbQ41Esj6igrFU2wVO8xI9z5drEicO3OpV1hkphxG8-TzZuotdNpCymhVO75YkGtCMIzSl8V06wfMOIxMZhK3Vnauy1pUwV08uz3ro4kX3TqPcrHfuOV0JtWZCizZKyDA8-1aErFvgKuJuPiXESyytCOH8t6GEAuZ8u9bHWbCWNiLeFdg0' },
            { city: 'Barcelona', country: 'Spain', price: '$510', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSTXgcaQ2TjzHjwDZjmvtX__V02CFrIWl7RZChuvoRogydlz1u4R_7PV0T7iE2LZf1Pf4PUxFybgxTX6f5p08nCO85_LJuqOzxaMzzuiNkFtgqhlIcnqW2eUKJpENoXAdSLNO0RYzrNJcPIGxSoxYMctpnHLcLxAIiya7RkkCRFPlBfYP-vhIvzP0t764GDiah6-8EZvrdyEt71I_Fbn6UGoFXhD_G34Z3TndmiulpoPDu56XEJRu8PxR4hjZLItrghYr5cBh1uPw' }
          ].map((dest, i) => (
            <div key={i} className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer">
              <div className="aspect-[4/5] w-full bg-navy-100">
                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                     style={{ backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0) 50%), url('${dest.img}')` }}></div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                <h3 className="text-2xl font-black mb-1">{dest.city}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold opacity-70 uppercase tracking-widest">{dest.country}</span>
                  <span className="font-black bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">fr {dest.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 px-4 md:px-10 border-t border-navy-100">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="text-xl font-black text-navy-950 mb-8 flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-primary">history</span> Recent Searches
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-4 p-4 pr-6 rounded-2xl bg-navy-50 border border-navy-100 hover:border-primary transition-all group text-left">
              <div className="bg-white p-2.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-sm">flight</span>
              </div>
              <div>
                <p className="text-sm font-black text-navy-950">JFK <span className="text-navy-300 mx-1">→</span> LHR</p>
                <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">1 Adult • Economy</p>
              </div>
            </button>
            <button className="flex items-center gap-4 p-4 pr-6 rounded-2xl bg-navy-50 border border-navy-100 hover:border-primary transition-all group text-left">
              <div className="bg-white p-2.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-sm">flight</span>
              </div>
              <div>
                <p className="text-sm font-black text-navy-950">SFO <span className="text-navy-300 mx-1">→</span> HND</p>
                <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">2 Adults • Business</p>
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlightSearch;
