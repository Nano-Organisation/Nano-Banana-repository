
import React, { useEffect, useState } from 'react';
import { User, CreditCard, Activity, ShieldCheck, Zap, Clock, Coins, Star } from 'lucide-react';
import { getUserProfile } from '../utils/supabase';

interface ActivityItem {
  id: string;
  action: string;
  date: string;
  cost: number;
}

const UserDashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const adminSession = localStorage.getItem('is_admin_session') === 'true';
    setIsAdmin(adminSession);

    if (adminSession) {
      // Mock data for admin
      setProfile({
        email: 'admin@digitalgentry.ai',
        credit_balance: 999999,
        tier: 'Administrator'
      });
      setActivityLog([
        { id: '1', action: 'System Login (Admin)', date: 'Just now', cost: 0 },
        { id: '2', action: 'Unlimited Access Granted', date: 'Session Start', cost: 0 }
      ]);
    } else {
      const userId = localStorage.getItem('supabase_user_id');
      if (userId) {
        try {
          const data = await getUserProfile(userId);
          if (data) {
            setProfile(data);
          } else {
            // Fallback if profile fetch fails but ID exists
            setProfile({ email: 'User', credit_balance: 0 });
          }
        } catch (e) {
          console.error("Failed to load profile", e);
        }
      } else {
        // No user logged in via Supabase
        setProfile({ email: 'Guest Session', credit_balance: 0 });
      }

      // Mock Activity for non-admins (since we don't have a real activity DB table yet)
      // In a real app, this would be `await supabase.from('activity_log').select('*')...`
      setActivityLog([
        { id: '1', action: 'Account Verified', date: new Date().toLocaleDateString(), cost: 0 }
      ]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-xl">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <User className="w-10 h-10" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {profile?.email || 'Unknown User'}
            </h2>
            {isAdmin && (
              <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Member ID: <span className="font-mono text-xs opacity-70">{localStorage.getItem('supabase_user_id') || 'Local-Session'}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 ${isAdmin ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <Star className="w-4 h-4" /> {profile?.tier || (isAdmin ? 'Administrator' : 'Free Tier')}
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Credits */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Coins className="w-32 h-32 text-white" />
           </div>
           <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-widest mb-2">
                 <CreditCard className="w-4 h-4" /> Balance
              </div>
              <div className="text-4xl font-black text-white">
                 {isAdmin ? '∞' : profile?.credit_balance?.toLocaleString() || 0}
              </div>
              <div className="text-slate-500 text-xs font-medium">Available Credits</div>
           </div>
        </div>

        {/* Status */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap className="w-32 h-32 text-white" />
           </div>
           <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest mb-2">
                 <Activity className="w-4 h-4" /> Status
              </div>
              <div className="text-4xl font-black text-white">Active</div>
              <div className="text-slate-500 text-xs font-medium">System Operational</div>
           </div>
        </div>

        {/* Action */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl flex flex-col justify-center items-center text-center shadow-lg shadow-indigo-900/20">
           <h3 className="text-white font-bold text-lg mb-1">Need more power?</h3>
           <p className="text-indigo-100 text-xs mb-4 opacity-80">Upgrade your plan to unlock higher limits.</p>
           <button 
             onClick={() => window.open('https://buy.stripe.com/dRmeVe0jL1mL6qc4sqdIA00', '_blank')}
             className="bg-white text-indigo-900 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors w-full"
           >
              Get Credits
           </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-lg">
         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
         </h3>
         
         <div className="space-y-4">
            {activityLog.length > 0 ? (
               activityLog.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                           <Zap className="w-5 h-5" />
                        </div>
                        <div>
                           <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.action}</div>
                           <div className="text-xs text-slate-500">{item.date}</div>
                        </div>
                     </div>
                     <div className="text-xs font-mono font-bold text-slate-400">
                        {item.cost === 0 ? 'FREE' : `-${item.cost} CR`}
                     </div>
                  </div>
               ))
            ) : (
               <div className="text-center py-10 text-slate-500">
                  <p>No recent activity recorded.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default UserDashboard;
