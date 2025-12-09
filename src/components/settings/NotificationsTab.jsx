import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail, MessageSquare, Bell } from 'lucide-react';

const NotificationsTab = ({ preferences, updatePreferences }) => {
  const handleChange = (key, value) => {
    const updated = { 
        ...preferences.notifications, 
        [key]: value 
    };
    updatePreferences({ notification_preferences: updated });
  };

  const notificationGroups = [
    {
      title: "Order Updates",
      description: "Get notified about your order status, delivery, and issues.",
      icon: <Bell className="w-5 h-5 text-cyan-400" />,
      items: [
        { id: 'order_confirmation', label: 'Order Confirmation', default: true },
        { id: 'order_shipping', label: 'Shipping Updates', default: true },
        { id: 'order_delivery', label: 'Delivery Notifications', default: true }
      ]
    },
    {
      title: "Marketing",
      description: "Receive news, promotions, and product updates.",
      icon: <Mail className="w-5 h-5 text-purple-400" />,
      items: [
        { id: 'promotions', label: 'Email Newsletters', default: false },
        { id: 'special_offers', label: 'Special Offers', default: false },
        { id: 'sms_marketing', label: 'SMS Marketing', default: false }
      ]
    },
    {
      title: "Security",
      description: "Important alerts about your account security.",
      icon: <MessageSquare className="w-5 h-5 text-green-400" />,
      items: [
        { id: 'login_alerts', label: 'New Device Login', default: true },
        { id: 'password_changes', label: 'Password Changes', default: true }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {notificationGroups.map((group) => (
        <div key={group.title} className="glass-card-dark p-6 rounded-2xl border border-white/10">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-full bg-white/5 border border-white/10">
                {group.icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-white">{group.title}</h3>
                <p className="text-sm text-gray-400">{group.description}</p>
            </div>
          </div>
          
          <div className="space-y-4 pl-16">
            {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <Label htmlFor={item.id} className="flex-1 cursor-pointer text-gray-200 font-medium">
                        {item.label}
                    </Label>
                    <Switch 
                        id={item.id}
                        checked={preferences.notifications?.[item.id] ?? item.default}
                        onCheckedChange={(checked) => handleChange(item.id, checked)}
                    />
                </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsTab;