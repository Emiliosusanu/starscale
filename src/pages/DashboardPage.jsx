
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag, DollarSign, LifeBuoy, Shield, User, Settings, Crown, History, Bell, AlertCircle, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersTab from '@/components/dashboard/OrdersTab';
import SupportTab from '@/components/dashboard/SupportTab';
import AdminOrdersTab from '@/components/dashboard/AdminOrdersTab';
import PlatformManagementTab from '@/components/dashboard/PlatformManagementTab';
import AdminActivityLogTab from '@/components/dashboard/AdminActivityLogTab';
import AdminProductsTab from '@/components/dashboard/AdminProductsTab';
import { useSearchParams } from 'react-router-dom';
import { formatPrice, playNotificationSound } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

const DashboardPage = () => {
  const { user, signOut, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [platformData, setPlatformData] = useState({ users: [], totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [unreadTicketCount, setUnreadTicketCount] = useState(0); 
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders');
  const [ordersClientFilterId, setOrdersClientFilterId] = useState(null);

  // Smart Navigation State
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);

  // Use refs to prevent effect cycles while keeping access to latest state
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  // Handle URL Params for Smart Nav (and Tab Switching)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const orderIdFromUrl = searchParams.get('order_id');
    const ticketIdFromUrl = searchParams.get('ticket_id');

    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
      if (tabFromUrl !== 'support') setIsChatOpen(false);
    }

    if (orderIdFromUrl) setHighlightedOrderId(orderIdFromUrl);
    if (ticketIdFromUrl) setHighlightedTicketId(ticketIdFromUrl);

  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('tab', value);
        return newParams;
    });
    if (value !== 'support') setIsChatOpen(false);
  };

	const handleViewClientOrders = (client) => {
		if (!client?.id) return;
		setOrdersClientFilterId(client.id);
		handleTabChange('admin-orders');
	};

  const handleTicketRead = useCallback((count) => {
    setUnreadTicketCount(prev => Math.max(0, prev - count));
  }, []);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!user || !profile) return;
    
    if (!silent) setLoading(true);
    else setSyncing(true);

    try {
      // Fetch Orders with explicit ordering
      let ordersQuery = supabase.from('orders').select(`
        *,
        order_comments (*)
      `);
      
      if (!isAdmin) {
        ordersQuery = ordersQuery.eq('profile_id', profile.id);
      }
      
      const { data: ordersData, error: ordersError } = await ordersQuery.order('created_at', { ascending: false });
      
      if (!ordersError && ordersData) {
          const processedOrders = ordersData.map(order => ({
              ...order,
              order_comments: order.order_comments?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || []
          }));
          setOrders(processedOrders);
      } else if (ordersError) {
          console.error("Error fetching orders:", ordersError);
          if (!silent) toast({ title: "Error", description: "Failed to load orders.", variant: "destructive" });
      }

      // Fetch Unread Tickets Count
      let ticketsQuery = supabase.from('tickets').select('id');
      if (!isAdmin) ticketsQuery = ticketsQuery.eq('profile_id', user.id);
      
      const { data: myTickets } = await ticketsQuery;
      const ticketIds = myTickets?.map(t => t.id) || [];
      
      if (ticketIds.length > 0) {
          const { count } = await supabase
              .from('ticket_messages')
              .select('*', { count: 'exact', head: true })
              .in('ticket_id', ticketIds)
              .neq('user_id', user.id) 
              .eq('is_read', false);
          
          setUnreadTicketCount(count || 0);
      }

      // Admin Data
      if (isAdmin) {
        const { data: usersPayload, error: usersError } = await supabase.functions.invoke('admin-list-users');
        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
        
        if (!usersError && !profilesError) {
            const combinedUsers = usersPayload?.users?.map(u => {
              const p = profilesData?.find(p => p.id === u.id);
              return { ...u, ...p };
            }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const { data: revenueData } = await supabase.from('orders').select('total_cost').eq('payment_status', 'paid');
            const totalRevenue = revenueData ? revenueData.reduce((sum, order) => sum + (order.total_cost || 0), 0) : 0;
            
            setPlatformData({ users: combinedUsers || [], totalRevenue });
        }
      }
    } catch (error) {
      console.error("Unexpected error in fetchDashboardData:", error);
    } finally {
      if (!silent) setLoading(false);
      else setTimeout(() => setSyncing(false), 800); // Min display time for sync indicator
    }
  }, [user, profile, isAdmin, toast]);

	useEffect(() => {
		const tabFromUrl = searchParams.get('tab');
		if (isAdmin && !tabFromUrl && activeTab === 'orders') {
			setActiveTab('admin-orders');
			setSearchParams((prev) => {
				const newParams = new URLSearchParams(prev);
				newParams.set('tab', 'admin-orders');
				return newParams;
			});
		}
	}, [isAdmin, searchParams, setSearchParams, activeTab]);

  useEffect(() => {
    if (!authLoading && profile) {
      fetchDashboardData(false); // Initial load
      
      // SINGLE Consolidated Realtime Subscription for Dashboard
      const channel = supabase.channel('dashboard_main_channel')
        // 1. Ticket Messages (Support)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_messages' }, () => {
            fetchDashboardData(true); 
        })
        // 2. Orders (Status changes, new orders)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            if (payload.eventType === 'UPDATE') {
                 if (!isAdmin && payload.new.profile_id === user.id) {
                     if (payload.old && payload.new.status !== payload.old.status) {
                        playNotificationSound();
                        toast({ title: "Order Updated", description: `Order #${payload.new.id.slice(0,8)} is now ${payload.new.status}.` });
                     }
                }
                setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
            } else if (payload.eventType === 'INSERT') {
                 fetchDashboardData(true); 
            }
        })
        // 3. Order Comments (Notes from admin)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_comments' }, async (payload) => {
             if (payload.new.admin_id && payload.new.order_id) { 
                 const isMyOrder = ordersRef.current.some(o => o.id === payload.new.order_id && o.profile_id === user.id);
                 
                 if (isMyOrder && !isAdmin) {
                     playNotificationSound();
                     toast({ title: "New Order Note", description: "An admin left a note on your order." });
                 }
                 fetchDashboardData(true); 
             }
        })
        // 4. Order Tracking (New tracking numbers)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_tracking' }, () => {
             fetchDashboardData(true);
        })
        // 5. Order Actions (History log updates)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_actions' }, () => {
             if(isAdmin) fetchDashboardData(true);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Dashboard realtime subscription active');
            }
        });

      return () => { supabase.removeChannel(channel); }
      
    } else if (!authLoading && !user) {
      setLoading(false);
    } else if (!authLoading && user && !profile) {
       // Safety valve: if we have user but no profile after auth loads, stop local loading to show error UI
       setLoading(false);
    }
  }, [authLoading, profile, user, fetchDashboardData, isAdmin, toast]); 

  const StatCard = ({ title, value, icon }) => (
    <div className="glass-card px-5 py-4 rounded-xl flex items-center gap-4 border border-white/5 bg-[#121212]">
      <div className="p-2.5 bg-cyan-500/10 rounded-lg shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] md:text-xs uppercase tracking-[0.22em] text-gray-300 font-semibold">{title}</p>
        <p className="text-2xl md:text-3xl font-extrabold text-white mt-0.5 leading-tight">{value}</p>
      </div>
    </div>
  );
  
  const userOrders = isAdmin ? orders : orders.filter(o => o.profile_id === profile?.id);
  const totalSpentCents = userOrders.filter(o => o.payment_status === 'paid').reduce((acc, order) => acc + (order.total_cost || 0), 0);

	const totalOrders = orders.length;
	const paidOrdersCount = orders.filter(o => o.payment_status === 'paid').length;
	const openOrdersCount = orders.filter((o) => o.status && o.status !== 'completed').length;
	const totalUsers = platformData.users?.length || 0;
	const now = new Date();
	const sevenDaysAgo = new Date(now);
	sevenDaysAgo.setDate(now.getDate() - 7);
	const newUsers7d = platformData.users.filter((u) =>
		u?.created_at ? new Date(u.created_at) >= sevenDaysAgo : false,
	).length;

	const tabsCountClass = isAdmin ? 'grid-cols-5' : 'grid-cols-2';
	const focusedClient = isAdmin && ordersClientFilterId
		? platformData.users.find((u) => u.id === ordersClientFilterId)
		: null;

  if (authLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#0A0A0A]">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (user && !profile) {
     return (
       <div className="w-full h-screen flex flex-col justify-center items-center bg-[#0A0A0A] p-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-6 max-w-md">
             We couldn't load your profile information. This might be a temporary issue.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            <Button onClick={signOut}>Sign Out</Button>
          </div>
       </div>
     );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <div className="container mx-auto px-4 py-20 max-w-[112rem] min-h-screen flex flex-col">
        
        <div className={`grid gap-4 mb-8 ${isAdmin ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
          {isAdmin ? (
            <>
              <StatCard title="Total Orders" value={loading ? '-' : totalOrders} icon={<ShoppingBag className="w-5 h-5 text-cyan-400" />} />
              <StatCard title="Paid Orders" value={loading ? '-' : paidOrdersCount} icon={<DollarSign className="w-5 h-5 text-cyan-400" />} />
              <StatCard title="Open Orders" value={loading ? '-' : openOrdersCount} icon={<Shield className="w-5 h-5 text-emerald-400" />} />
              <StatCard title="Total Revenue" value={loading ? '-' : formatPrice(platformData.totalRevenue)} icon={<Zap className="w-5 h-5 text-yellow-400" />} />
              <StatCard title="New Users (7d)" value={loading ? '-' : newUsers7d} icon={<User className="w-5 h-5 text-cyan-400" />} />
            </>
          ) : (
            <>
              <StatCard title="Orders" value={loading ? '-' : userOrders.length} icon={<ShoppingBag className="w-5 h-5 text-cyan-400" />} />
              <StatCard title="Spent" value={loading ? '-' : formatPrice(totalSpentCents)} icon={<DollarSign className="w-5 h-5 text-cyan-400" />} />
              <StatCard title="Rewards" value="0 Pts" icon={<Crown className="w-5 h-5 text-yellow-400" />} />
              <StatCard title="Notifications" value="0" icon={<Bell className="w-5 h-5 text-gray-400" />} />
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
          <TabsList className={`grid w-full ${tabsCountClass} max-w-3xl mx-auto mb-6 bg-[#121212] border border-white/10 h-12 p-1 rounded-xl`}>
            {isAdmin ? (
              <>
                <TabsTrigger value="admin-orders" className="rounded-lg text-xs md:text-sm">
                  <Shield className="w-3.5 h-3.5 mr-1 md:mr-2" /> Admin
                </TabsTrigger>
                <TabsTrigger value="platform-management" className="rounded-lg text-xs md:text-sm">
                  <Settings className="w-3.5 h-3.5 mr-1 md:mr-2" /> Platform
                </TabsTrigger>
                <TabsTrigger value="admin-products" className="rounded-lg text-xs md:text-sm">
                  <ShoppingBag className="w-3.5 h-3.5 mr-1 md:mr-2" /> Products
                </TabsTrigger>
                <TabsTrigger value="activity-log" className="rounded-lg text-xs md:text-sm">
                  <History className="w-3.5 h-3.5 mr-1 md:mr-2" /> Log
                </TabsTrigger>
                <TabsTrigger value="support" className="relative rounded-lg text-xs md:text-sm">
                  <LifeBuoy className="w-3.5 h-3.5 mr-2" />
                  Support
                  {unreadTicketCount > 0 && !isChatOpen && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="orders" className="rounded-lg text-xs md:text-sm">
                  <User className="w-3.5 h-3.5 mr-2" />
                  My Orders
                </TabsTrigger>
                <TabsTrigger value="support" className="relative rounded-lg text-xs md:text-sm">
                  <LifeBuoy className="w-3.5 h-3.5 mr-2" />
                  Support
                  {unreadTicketCount > 0 && !isChatOpen && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="flex-1">
            {!isAdmin && (
              <TabsContent value="orders" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <OrdersTab 
                    orders={userOrders} 
                    loading={loading} 
                    highlightedOrderId={highlightedOrderId} 
                  />
                </motion.div>
              </TabsContent>
            )}
            
            <TabsContent value="support" className="mt-0 h-full">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
                <SupportTab 
                  onChatOpenChange={setIsChatOpen} 
                  onTicketRead={handleTicketRead}
                  initialTicketId={highlightedTicketId} 
                  highlightedOrderId={highlightedOrderId} 
                />
              </motion.div>
            </TabsContent>
          
          {isAdmin && (
            <>
              <TabsContent value="admin-orders" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <AdminOrdersTab 
                    allOrders={orders} 
                    loading={loading} 
                    onUpdate={() => fetchDashboardData(true)} 
                    highlightedOrderId={highlightedOrderId}
                    filterProfileId={ordersClientFilterId}
                    filterLabel={focusedClient?.email || focusedClient?.full_name || ''}
                    onClearFilter={() => setOrdersClientFilterId(null)}
                  />
                </motion.div>
              </TabsContent>
              <TabsContent value="admin-products" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <AdminProductsTab />
                </motion.div>
              </TabsContent>
              <TabsContent value="platform-management" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <PlatformManagementTab 
                    users={platformData.users} 
                    totalRevenue={platformData.totalRevenue} 
                    loading={loading}
                    orders={orders}
                    onUserUpdate={() => fetchDashboardData(true)}
                    onViewClientOrders={handleViewClientOrders}
                  />
                </motion.div>
              </TabsContent>
              <TabsContent value="activity-log" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <AdminActivityLogTab />
                </motion.div>
              </TabsContent>
            </>
          )}
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default DashboardPage;
