
import React, { useState } from 'react';
import { Booking, Page } from '../types';

interface BookingsProps {
  onNavigate: (page: Page) => void;
}

const mockBookings: Booking[] = [
  { id: '#DJ-12039', customer: 'John Doe', email: 'john@example.com', service: 'DJ 104 Business', date: 'Oct 24, 2024', amount: '$1,240.00', status: 'Confirmed' },
  { id: '#DJ-12040', customer: 'Sarah Smith', email: 'sarah@example.com', service: 'DJ 452 Economy', date: 'Oct 25, 2024', amount: '$450.00', status: 'Pending' },
  { id: '#DJ-12041', customer: 'Acme Corp', email: 'travel@acme.co', service: 'DJ 881 First', date: 'Oct 26, 2024', amount: '$5,200.00', status: 'Paid' },
  { id: '#DJ-12042', customer: 'Robert Fox', email: 'robert@fox.net', service: 'DJ 104 Economy', date: 'Oct 26, 2024', amount: '$380.00', status: 'Canceled' },
  { id: '#DJ-12043', customer: 'Esther Howard', email: 'esther@howard.com', service: 'DJ 202 Business', date: 'Oct 27, 2024', amount: '$950.00', status: 'Confirmed' },
];

const Bookings: React.FC<BookingsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-navy-950 tracking-tight">Booking Management</h1>
          <p className="text-navy-500 font-medium">Analyze and manage customer reservations.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-white border border-navy-100 text-navy-700 font-bold rounded-xl shadow-sm hover:bg-navy-50 transition-all">Export CSV</button>
          <button className="px-6 py-2.5 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all">+ Add Booking</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-navy-100 px-8 flex items-center gap-8 overflow-x-auto">
          {['All', 'Confirmed', 'Pending', 'Canceled', 'Groups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-5 text-sm font-black tracking-tight transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              {tab} Bookings
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="p-6 bg-navy-50/30 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-navy-100">
          <div className="relative w-full max-w-lg group">
             <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 group-focus-within:text-primary transition-colors">search</span>
             <input className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 shadow-sm" placeholder="Search by PNR, Customer, or Email..." />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button className="flex-1 md:flex-none px-4 py-3 bg-white rounded-2xl border border-navy-100 text-xs font-black text-navy-900 flex items-center gap-2 hover:bg-navy-50 transition-all">
               <span className="material-symbols-outlined text-lg">filter_list</span> Filters
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-navy-50/50 border-b border-navy-100 text-[10px] font-black text-navy-400 uppercase tracking-widest">
                <th className="px-8 py-4">Booking ID</th>
                <th className="px-8 py-4">Customer</th>
                <th className="px-8 py-4">Flight / Service</th>
                <th className="px-8 py-4">Travel Date</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {mockBookings.map((b) => (
                <tr key={b.id} className="group hover:bg-navy-50/50 transition-colors cursor-pointer" onClick={() => onNavigate(Page.BOOKING_DETAIL)}>
                  <td className="px-8 py-5">
                    <span className="font-black text-primary hover:underline">{b.id}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-navy-100 bg-cover bg-center shrink-0" style={{backgroundImage: `url(https://picsum.photos/seed/${b.id}/100)`}} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-navy-900 truncate">{b.customer}</span>
                        <span className="text-xs text-navy-400 font-medium truncate">{b.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-navy-700">{b.service}</span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-navy-500">{b.date}</td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-navy-950">{b.amount}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      b.status === 'Confirmed' || b.status === 'Paid' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : b.status === 'Pending' 
                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-navy-300 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-5 bg-navy-50/20 border-t border-navy-100 flex items-center justify-between">
           <p className="text-xs font-bold text-navy-400 uppercase tracking-widest">Showing 1-5 of 1,240 Results</p>
           <div className="flex gap-2">
             <button className="px-4 py-1.5 bg-white border border-navy-100 rounded-lg text-xs font-black text-navy-300 cursor-not-allowed">Previous</button>
             <button className="px-4 py-1.5 bg-white border border-navy-100 rounded-lg text-xs font-black text-navy-700 hover:bg-navy-50">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
