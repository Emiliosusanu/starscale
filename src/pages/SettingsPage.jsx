import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  CreditCard,
  Loader2
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Import Sub-components
import AccountTab from '@/components/settings/AccountTab';
import PreferencesTab from '@/components/settings/PreferencesTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import SecurityTab from '@/components/settings/SecurityTab';
import BillingTab from '@/components/settings/BillingTab';

const SettingsPage = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'account';

  // Global State for the page to pass down
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    notifications: {}
  });

  useEffect(() => {
    if (profile) {
      if (profile.notification_preferences) {
        setPreferences(prev => ({...prev, notifications: profile.notification_preferences}));
      }
      if (profile.theme_preference) {
        setPreferences(prev => ({...prev, theme: profile.theme_preference}));
      }
    }
  }, [profile]);

  const updateProfile = async (updates) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;
        
        // Optimistic update for local state
        if (updates.notification_preferences) {
             setPreferences(prev => ({...prev, notifications: updates.notification_preferences}));
        }
        if (updates.theme_preference) {
             setPreferences(prev => ({...prev, theme: updates.theme_preference}));
        }

        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        toast({ variant: "destructive", title: "Error", description: "Failed to update settings." });
        return false;
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-[#0A0A0A]"><Loader2 className="animate-spin text-cyan-400" /></div>;

  const menuItems = [
    { id: 'account', label: 'Account', icon: User, desc: 'Personal details & addresses' },
    { id: 'preferences', label: 'Preferences', icon: Settings, desc: 'Theme & language' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email & push alerts' },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Password & 2FA' },
    { id: 'billing', label: 'Billing', icon: CreditCard, desc: 'Payment methods & invoices' },
  ];

  return (
    <>
      <Helmet>
        <title>Settings - Starscale</title>
      </Helmet>
      <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-gray-400">Manage your profile, security preferences, and billing information.</p>
          </motion.div>

          <Tabs defaultValue={defaultTab} className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
                <div className="sticky top-24">
                    <TabsList className="flex flex-col h-auto p-0 bg-transparent space-y-2">
                        {menuItems.map((item) => (
                            <TabsTrigger
                                key={item.id}
                                value={item.id}
                                className="w-full flex items-center justify-start p-4 rounded-xl data-[state=active]:bg-cyan-500/10 data-[state=active]:border-cyan-500/20 border border-transparent hover:bg-white/5 transition-all group"
                            >
                                <div className={`p-2 rounded-lg mr-4 transition-colors group-data-[state=active]:bg-cyan-500 group-data-[state=active]:text-white bg-white/5 text-gray-400`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-sm font-semibold text-gray-300 group-data-[state=active]:text-white">
                                        {item.label}
                                    </span>
                                    <span className="block text-xs text-gray-500 group-data-[state=active]:text-cyan-400/80">
                                        {item.desc}
                                    </span>
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <TabsContent value="account" className="mt-0">
                    <AccountTab 
                        user={user} 
                        profile={profile} 
                        updateProfile={updateProfile} 
                    />
                </TabsContent>

                <TabsContent value="preferences" className="mt-0">
                    <PreferencesTab 
                        preferences={preferences} 
                        updatePreferences={updateProfile} 
                    />
                </TabsContent>

                <TabsContent value="notifications" className="mt-0">
                    <NotificationsTab 
                        preferences={preferences} 
                        updatePreferences={updateProfile} 
                    />
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                    <SecurityTab 
                        user={user} 
                        signOut={signOut} 
                    />
                </TabsContent>

                <TabsContent value="billing" className="mt-0">
                    <BillingTab 
                        userId={user.id} 
                    />
                </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;