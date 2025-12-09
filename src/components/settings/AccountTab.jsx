import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Smartphone, Camera, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AddressBook from './AddressBook';

const AccountTab = ({ user, profile, updateProfile }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  const handleAvatarUpload = async (event) => {
    try {
      setLoading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
      toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
      });
      toast({ title: "Saved", description: "Account details updated successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card-dark p-8 rounded-2xl border border-white/10">
        <div className="flex flex-col md:flex-row items-start gap-8 mb-8 border-b border-white/10 pb-8">
            <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white/10 shadow-xl">
                    <AvatarImage src={profile?.avatar_url} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-cyan-900 text-cyan-200 font-bold">
                        {formData.full_name ? formData.full_name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <button 
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 p-2.5 bg-cyan-600 rounded-full text-white shadow-lg hover:bg-cyan-500 transition-all hover:scale-110"
                >
                    <Camera className="w-5 h-5" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload} 
                />
            </div>
            <div className="flex-1 space-y-2">
                <h3 className="text-2xl font-bold text-white">{formData.full_name || 'Anonymous User'}</h3>
                <p className="text-gray-400 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {user.email}
                </p>
                <div className="pt-2 flex gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 uppercase tracking-wider font-bold">
                        {profile?.role || 'User'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-xs text-green-400 uppercase tracking-wider font-bold">
                        Active
                    </span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative group">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <Input 
                        id="fullName" 
                        value={formData.full_name} 
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="pl-10 bg-black/20 border-white/10 focus:border-cyan-500/50" 
                        placeholder="Enter your name"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                        id="email" 
                        value={user.email} 
                        disabled
                        className="pl-10 bg-black/40 border-white/5 text-gray-500 cursor-not-allowed" 
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative group">
                    <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <Input 
                        id="phone" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="pl-10 bg-black/20 border-white/10 focus:border-cyan-500/50" 
                        placeholder="+1 (555) 000-0000"
                    />
                </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
            </Button>
        </div>
      </div>

      <div className="glass-card-dark p-8 rounded-2xl border border-white/10">
          <AddressBook userId={user.id} />
      </div>
    </div>
  );
};

export default AccountTab;