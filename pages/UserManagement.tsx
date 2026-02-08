
import React, { useState } from 'react';
import { User } from '../types';

const mockUsers: User[] = [
  { id: 'U-001', name: 'Jane Cooper', email: 'jane.cooper@example.com', role: 'Super Admin', status: 'Active', lastLogin: '2 mins ago', avatar: 'https://i.pravatar.cc/150?u=jane', alertLevel: 'Full Access' },
  { id: 'U-002', name: 'Cody Fisher', email: 'cody.fisher@example.com', role: 'Manager', status: 'Active', lastLogin: 'Yesterday', avatar: 'https://i.pravatar.cc/150?u=cody', alertLevel: 'Config Only' },
  { id: 'U-003', name: 'Esther Howard', email: 'esther.howard@example.com', role: 'Customer', status: 'Pending', lastLogin: '3 days ago', avatar: 'https://i.pravatar.cc/150?u=esther', alertLevel: 'None' },
  { id: 'U-004', name: 'Jenny Wilson', email: 'jenny.wilson@example.com', role: 'Customer', status: 'Inactive', lastLogin: 'Oct 24, 2023', avatar: 'https://i.pravatar.cc/150?u=jenny', alertLevel: 'View Only' },
  { id: 'U-005', name: 'Robert Fox', email: 'robert.fox@example.com', role: 'Manager', status: 'Suspended', lastLogin: 'Sep 12, 2023', avatar: 'https://i.pravatar.cc/150?u=robert', alertLevel: 'Full Access' },
];

const UserManagement: React.FC = () => {
  const [expandedUser, setExpandedUser] = useState<string | null>('U-001');

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">User Hub</h1>
          <p className="text-navy-500 font-medium italic text-sm md:text-base">Manage personnel access and global authentication tiers.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-4 md:px-5 border border-navy-100 bg-white rounded-xl text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">security</span> Alert Roles
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary/20">
            <span className="material-symbols-outlined text-lg">add</span> New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', val: '1,240', trend: '+5%', col: 'text-emerald-600' },
          { label: 'Active Personnel', val: '1,100', trend: '+2%', col: 'text-emerald-600' },
          { label: 'Pending Approval', val: '40', trend: '-10%', col: 'text-orange-600' },
          { label: 'MFA Enrolled', val: '1,024', trend: '83%', col: 'text-indigo-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-navy-100 shadow-sm flex flex-col gap-1 hover:shadow-md transition-all">
            <p className="text-navy-400 font-black text-[10px] uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-2xl font-black text-navy-950 tracking-tighter">{stat.val}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${stat.col} bg-opacity-10 border border-current`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl md:rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 md:p-8 border-b border-navy-100 bg-navy-50/10 flex flex-col xl:flex-row gap-6 justify-between items-center">
          <div className="relative w-full lg:max-w-xl group">
             <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 group-focus-within:text-primary transition-all">search</span>
             <input className="w-full h-12 md:h-14 pl-14 pr-6 bg-white border-2 border-navy-50 rounded-2xl text-sm font-black uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search Identity Pool..." />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full lg:w-auto">
             <select className="flex-1 sm:flex-none h-12 md:h-14 px-4 md:px-8 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-900 appearance-none cursor-pointer">
               <option>All Duty Roles</option>
               <option>Super Admin</option>
               <option>Manager</option>
             </select>
             <div className="flex border-2 border-navy-100 rounded-2xl overflow-hidden shadow-sm">
                <button className="p-3 bg-navy-50 text-navy-300 hover:text-primary transition-all border-r border-navy-100"><span className="material-symbols-outlined text-lg">filter_list</span></button>
                <button className="p-3 bg-white text-navy-950 transition-all"><span className="material-symbols-outlined text-lg">grid_view</span></button>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-navy-50/50 border-b border-navy-50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em]">
                <th className="px-6 md:px-10 py-6">Identity Profile</th>
                <th className="px-6 md:px-10 py-6">Access Cluster</th>
                <th className="px-6 md:px-10 py-6">MFA Security</th>
                <th className="px-6 md:px-10 py-6">Protocol Status</th>
                <th className="px-6 md:px-10 py-6">Last Seq</th>
                <th className="px-6 md:px-10 py-6 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {mockUsers.map((u) => (
                <tr 
                  key={u.id}
                  onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                  className={`group transition-all cursor-pointer ${expandedUser === u.id ? 'bg-primary/5' : 'hover:bg-navy-50/50'}`}
                >
                  <td className="px-6 md:px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl bg-cover bg-center border-2 border-white shadow-md transition-all group-hover:scale-105 ${expandedUser === u.id ? 'ring-2 ring-primary ring-offset-2' : ''}`} style={{backgroundImage: `url(${u.avatar})`}} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-navy-950 uppercase tracking-tight truncate">{u.name}</span>
                        <span className="text-[10px] text-navy-400 font-bold uppercase tracking-widest truncate opacity-60">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      u.role === 'Super Admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-sm ${u.alertLevel.includes('Full') ? 'text-emerald-500' : 'text-navy-200'}`}>lock</span>
                      <span className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Active Hub</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      <span className={`size-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-6 text-[10px] font-black text-navy-400 uppercase tracking-widest italic opacity-70">
                    {u.lastLogin}
                  </td>
                  <td className="px-6 md:px-10 py-6 text-right">
                    <button className={`p-2 transition-all rounded-xl ${expandedUser === u.id ? 'bg-primary text-white' : 'text-navy-200 hover:text-primary'}`}>
                      <span className="material-symbols-outlined">{expandedUser === u.id ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 md:p-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-6">
           <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] text-center sm:text-left">Operational Segment: 5 of 1,240 Registry Nodes</p>
           <div className="flex gap-2">
             <button className="px-6 py-2 bg-white border-2 border-navy-100 rounded-xl text-[10px] font-black uppercase text-navy-300 cursor-not-allowed">Previous Hub</button>
             <button className="px-6 py-2 bg-white border-2 border-navy-100 rounded-xl text-[10px] font-black uppercase text-navy-950 hover:bg-navy-50">Next Sequence</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
