import React from 'react';
import { Moon, Sun, Monitor, Globe, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';

const PreferencesTab = ({ preferences, updatePreferences }) => {
  const handleThemeChange = (theme) => {
    updatePreferences({ theme_preference: theme });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card-dark p-8 rounded-2xl border border-white/10 space-y-8">
        <div>
            <h3 className="text-xl font-bold text-white mb-4">Appearance</h3>
            <p className="text-gray-400 mb-6">Customize how Starscale looks on your device.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['light', 'dark', 'system'].map((theme) => (
                    <button
                        key={theme}
                        onClick={() => handleThemeChange(theme)}
                        className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 ${
                            preferences.theme === theme 
                            ? 'border-cyan-500 bg-cyan-500/10' 
                            : 'border-white/5 bg-black/20 hover:border-white/20 hover:bg-white/5'
                        }`}
                    >
                        <div className={`p-3 rounded-full ${preferences.theme === theme ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                            {theme === 'light' && <Sun className="w-6 h-6" />}
                            {theme === 'dark' && <Moon className="w-6 h-6" />}
                            {theme === 'system' && <Monitor className="w-6 h-6" />}
                        </div>
                        <span className="text-sm font-medium text-gray-300 capitalize">{theme} Mode</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="pt-8 border-t border-white/10">
             <h3 className="text-xl font-bold text-white mb-4">Regional Settings</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Language</Label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <select className="w-full h-10 pl-10 pr-3 rounded-md border border-white/10 bg-black/20 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none">
                            <option value="en">English (US)</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <select className="w-full h-10 pl-10 pr-3 rounded-md border border-white/10 bg-black/20 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none">
                            <option value="utc">UTC (GMT+0)</option>
                            <option value="est">EST (GMT-5)</option>
                            <option value="pst">PST (GMT-8)</option>
                            <option value="cet">CET (GMT+1)</option>
                        </select>
                    </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;