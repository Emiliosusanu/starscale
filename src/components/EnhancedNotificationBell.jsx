
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { playNotificationSound } from '@/lib/utils';

const EnhancedNotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user?.id}` 
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound(); 
        toast({
          title: "New Notification",
          description: payload.new.message,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, toast]);

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllRead = async () => {
     const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

     if(!error) {
        setNotifications(prev => prev.map(n => ({...n, is_read: true})));
        setUnreadCount(0);
     }
  };

  const handleNotificationClick = async (notification) => {
      // 1. Mark as read immediately
      if (!notification.is_read) {
          markAsRead(notification.id);
      }

      // 2. Close dropdown
      setIsOpen(false);

      // 3. Smart Navigation
      if (notification.link) {
          // If the link contains params, we might want to navigate cleanly
          navigate(notification.link);
      }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300">
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3, duration: 0.5 }}
          >
            <Bell className="h-5 w-5" />
          </motion.div>
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-1.5 right-1.5 h-2.5 w-2.5 flex items-center justify-center"
              >
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                 <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500 border border-black"></span>
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-[#121212] border border-white/10 shadow-2xl backdrop-blur-xl z-50">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <h4 className="font-semibold text-white">Notifications</h4>
            {unreadCount > 0 && (
                <button 
                    onClick={markAllRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                    Mark all read
                </button>
            )}
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                    {notifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-white/5 transition-colors relative group cursor-pointer ${!notification.is_read ? 'bg-cyan-500/5' : ''}`}
                        >
                            <div className="flex gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-cyan-500' : 'bg-gray-600'}`} />
                                <div className="flex-grow">
                                    <p className={`text-sm ${!notification.is_read ? 'text-white font-medium' : 'text-gray-400'}`}>
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs text-gray-600">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </span>
                                        {notification.link && (
                                            <span className="flex items-center text-xs text-cyan-500 hover:text-cyan-400">
                                                View <ExternalLink className="w-3 h-3 ml-1" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!notification.is_read && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                    }}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                                    title="Mark as read"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="p-2 border-t border-white/10 bg-white/5">
            <Link 
                to="/settings?tab=notifications" 
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
                Notification Settings
            </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedNotificationBell;
