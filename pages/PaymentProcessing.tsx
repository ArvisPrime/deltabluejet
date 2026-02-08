
import React from 'react';

interface PaymentProcessingProps {
  onBack: () => void;
  onNext: () => void;
}

const PaymentProcessing: React.FC<PaymentProcessingProps> = ({ onBack, onNext }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-black text-navy-950 tracking-tighter flex items-center gap-3">
          SECURE PAYMENT <span className="material-symbols-outlined text-emerald-500">lock</span>
        </h1>
        <p className="text-navy-500 font-medium">Verify your transaction details and complete the booking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-navy-400 uppercase tracking-widest">Select Method</h3>
            <div className="space-y-4">
              <label className="flex items-center p-5 rounded-2xl border-2 border-primary bg-primary/5 cursor-pointer">
                <input type="radio" checked className="h-5 w-5 text-primary" name="pm" />
                <div className="ml-4 flex-1 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-black text-navy-950">Credit or Debit Card</span>
                    <span className="block text-[10px] text-navy-400 uppercase font-black tracking-widest">Visa, Mastercard, Amex</span>
                  </div>
                  <span className="material-symbols-outlined text-navy-300">credit_card</span>
                </div>
              </label>
              <label className="flex items-center p-5 rounded-2xl border-2 border-navy-50 hover:border-navy-100 cursor-pointer">
                <input type="radio" className="h-5 w-5 text-primary" name="pm" />
                <div className="ml-4 flex-1 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-black text-navy-950">Alternative Payments</span>
                    <span className="block text-[10px] text-navy-400 uppercase font-black tracking-widest">PayPal, Google Pay</span>
                  </div>
                  <span className="material-symbols-outlined text-navy-300">account_balance_wallet</span>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="text-xs font-black text-navy-400 uppercase tracking-widest">Card Details</h3>
               <div className="flex gap-2">
                 <div className="h-6 w-10 bg-navy-50 rounded flex items-center justify-center text-[10px] font-black text-navy-400">VISA</div>
                 <div className="h-6 w-10 bg-navy-50 rounded flex items-center justify-center text-[10px] font-black text-navy-400">MC</div>
               </div>
            </div>
            
            <form className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Card Number</label>
                 <div className="relative">
                   <input className="w-full h-14 pl-12 pr-4 bg-navy-50 border-none rounded-xl font-bold text-navy-900 focus:ring-2 focus:ring-primary/20" placeholder="0000 0000 0000 0000" />
                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">credit_card</span>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Expiry Date</label>
                   <input className="w-full h-14 px-4 bg-navy-50 border-none rounded-xl font-bold text-navy-900 focus:ring-2 focus:ring-primary/20" placeholder="MM / YY" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">CVV</label>
                   <input className="w-full h-14 px-4 bg-navy-50 border-none rounded-xl font-bold text-navy-900 focus:ring-2 focus:ring-primary/20" placeholder="123" />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Cardholder Name</label>
                 <input className="w-full h-14 px-4 bg-navy-50 border-none rounded-xl font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 uppercase" defaultValue="JOHN DOE" />
               </div>
            </form>
          </div>

          <button onClick={onNext} className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-3">
            Authorise Payment $605.00 <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <div className="space-y-6 sticky top-8">
           <div className="bg-navy-950 rounded-3xl p-8 text-white space-y-8">
             <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Booking Summary</h3>
             <div className="space-y-6">
               <div className="flex gap-4">
                 <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">flight</span>
                 </div>
                 <div>
                   <p className="text-xl font-black">JFK → LHR</p>
                   <p className="text-[10px] font-black uppercase opacity-40">Oct 24, 2024 • DJ-102</p>
                 </div>
               </div>
               <hr className="border-white/10"/>
               <div className="space-y-4">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                   <span>Fare Type</span>
                   <span className="text-white opacity-100">Economy Std</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                   <span>Passenger</span>
                   <span className="text-white opacity-100">John Doe</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                   <span>Seat</span>
                   <span className="text-white opacity-100">4A</span>
                 </div>
               </div>
               <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                 <span className="text-xs font-black uppercase tracking-widest opacity-40">Total Charged</span>
                 <span className="text-3xl font-black">$605.00</span>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;
