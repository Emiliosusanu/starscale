import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Key, Smartphone, LogOut, Loader2, Laptop, Globe } from 'lucide-react';

const SecurityTab = ({ user, signOut }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
        return;
    }
    if (passwordForm.newPassword.length < 6) {
        toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters." });
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
        if (error) throw error;
        
        toast({ title: "Success", description: "Password updated successfully." });
        setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card-dark p-8 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Key className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">Password</h3>
                <p className="text-gray-400 text-sm">Update your password to keep your account secure.</p>
            </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                    id="newPassword" 
                    type="password" 
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="bg-black/20 border-white/10"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="bg-black/20 border-white/10"
                />
            </div>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Password
            </Button>
        </form>
      </div>

      <div className="glass-card-dark p-8 rounded-2xl border border-white/10">
         <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                <Shield className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">Active Sessions</h3>
                <p className="text-gray-400 text-sm">Manage your active sessions and devices.</p>
            </div>
        </div>

        <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-green-500/30">
                 <div className="flex items-center gap-4">
                     <Laptop className="w-8 h-8 text-gray-400" />
                     <div>
                         <p className="text-white font-medium">Current Session</p>
                         <div className="flex items-center gap-2 text-xs text-green-400">
                            <Globe className="w-3 h-3" />
                            <span>Online Now</span>
                         </div>
                     </div>
                 </div>
                 <span className="text-xs text-gray-500">
                    Last accessed: Just now
                 </span>
             </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
            <Button variant="destructive" onClick={signOut} className="w-full sm:w-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out All Devices
            </Button>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;