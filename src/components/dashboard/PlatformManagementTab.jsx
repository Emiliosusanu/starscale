
import React from 'react';
import { Loader2, Users, DollarSign, Activity } from 'lucide-react';

const PlatformManagementTab = ({ users, totalRevenue, loading }) => {
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-cyan-500"/></div>;

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#121212] border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-gray-400 mb-1">
                    <Users className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Total Users</span>
                </div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <div className="bg-[#121212] border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-gray-400 mb-1">
                    <DollarSign className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">${totalRevenue.toFixed(2)}</p>
            </div>
             <div className="bg-[#121212] border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-gray-400 mb-1">
                    <Activity className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Platform Health</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">98%</p>
            </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden">
            <div className="p-4 border-b border-white/5"><h3 className="text-sm font-bold text-white">Recent Users</h3></div>
            <div className="divide-y divide-white/5">
                {users.slice(0, 10).map(user => (
                    <div key={user.id} className="flex justify-between items-center p-4 text-sm">
                        <div>
                            <p className="text-white font-medium">{user.email}</p>
                            <p className="text-[10px] text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-700/50 text-gray-400'}`}>
                            {user.role}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default PlatformManagementTab;
