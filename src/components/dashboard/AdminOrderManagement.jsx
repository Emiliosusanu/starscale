
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter 
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Send, Package, Truck, History, MessageSquare, 
  User, Mail, CreditCard, AlertTriangle, CheckCircle, XCircle, RefreshCcw 
} from 'lucide-react';
import { formatPrice, timeAgo } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminOrderManagement = ({ order, isOpen, onClose, onUpdate }) => {
  const { toast } = useToast();
  const { profile: adminProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [trackingInfo, setTrackingInfo] = useState([]);
  const [actions, setActions] = useState([]);
  const [comments, setComments] = useState(order?.order_comments || []); 
  const [newComment, setNewComment] = useState('');
  const [newTracking, setNewTracking] = useState({ name: '', url: '' });
  
  // Editable fields (local state for immediate UI feedback)
  const [status, setStatus] = useState(order?.status || 'pending');
  const [paymentStatus, setPaymentStatus] = useState(order?.payment_status || 'unpaid');
  const commentsEndRef = useRef(null);

  const fetchDetails = useCallback(async () => {
    if (!order?.id) return;
    setLoadingDetails(true);
    
    try {
      const [trackingRes, actionsRes, commentsRes] = await Promise.all([
        supabase.from('order_tracking').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
        supabase.from('order_actions').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
        supabase.from('order_comments').select('*').eq('order_id', order.id).order('created_at', { ascending: true }) // Changed to ascending for chat-like feel
      ]);

      if (trackingRes.data) setTrackingInfo(trackingRes.data);
      if (actionsRes.data) setActions(actionsRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
    } catch(e) {
      console.error("Error fetching order details", e);
    } finally {
      setLoadingDetails(false);
    }
  }, [order?.id]);

  useEffect(() => {
    if (isOpen && order) {
      setStatus(order.status);
      setPaymentStatus(order.payment_status);
      fetchDetails();
    }
  }, [isOpen, order, fetchDetails]);

  // Auto-scroll to bottom of comments
  useEffect(() => {
    if (activeTab === 'comments' && commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  // Realtime subscription for order-specific changes
  useEffect(() => {
    if (!order?.id || !isOpen) return;

    const channel = supabase.channel(`admin_order_${order.id}`)
      // Watch for main order updates (status, payment)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` }, (payload) => {
          setStatus(payload.new.status);
          setPaymentStatus(payload.new.payment_status);
          onUpdate(); 
      })
      // Watch for new comments (real-time chat)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_comments', filter: `order_id=eq.${order.id}` }, (payload) => {
        setComments(prev => [...prev, payload.new]); // Append to end
        onUpdate(); 
      })
      // Watch for tracking updates
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_tracking', filter: `order_id=eq.${order.id}` }, (payload) => {
        setTrackingInfo(prev => [payload.new, ...prev]);
      })
      // Watch for history/actions
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_actions', filter: `order_id=eq.${order.id}` }, (payload) => {
        setActions(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order?.id, isOpen, onUpdate]);


  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (!error) {
      toast({ title: "Order Status Updated", description: `Changed to ${newStatus}` });
      setStatus(newStatus);
      onUpdate();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handlePaymentUpdate = async (newStatus) => {
    setLoading(true);
    const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', order.id);
    if (!error) {
      toast({ title: "Payment Status Updated", description: `Changed to ${newStatus}` });
      setPaymentStatus(newStatus);
      onUpdate();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !adminProfile?.id) return;
    
    const commentText = newComment;
    setNewComment(''); // Optimistic clear
    
    const { error } = await supabase.from('order_comments').insert({
      order_id: order.id,
      admin_id: adminProfile.id,
      comment: commentText,
      is_read: false // Mark as unread for the user
    });

    if (error) {
      setNewComment(commentText); // Revert on error
      toast({ title: "Error adding note", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Note Sent", description: "User will be notified." });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleAddComment();
    }
  };

  const handleAddTracking = async () => {
    if (!newTracking.name.trim() || !newTracking.url.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter both a sheet name and a Google Sheets URL.",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('order_tracking').insert({
      order_id: order.id,
      sheet_name: newTracking.name.trim(),
      sheet_url: newTracking.url.trim(),
    });

    if (!error) {
      setNewTracking({ name: '', url: '' });
      toast({ title: "Google Sheet linked", description: "Tracking sheet saved for this order." });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRefund = async () => {
    if(!window.confirm("Are you sure you want to mark this order as refunded? This action cannot be undone.")) return;
    setLoading(true);
    const { error } = await supabase.from('orders').update({ payment_status: 'refunded' }).eq('id', order.id);
    if (!error) {
        toast({ title: "Order Refunded", description: "Payment status set to refunded." });
        setPaymentStatus('refunded');
        onUpdate();
    } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl bg-[#121212] border-l border-white/10 text-white flex flex-col h-full p-0" aria-describedby="sheet-description">
        {/* Header Fixed */}
        <SheetHeader className="px-6 py-5 border-b border-white/10 bg-[#141414]">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white flex items-center gap-2">
              Order #{order.id.slice(0,8)}
              <Badge variant="outline" className="ml-2 border-white/20 text-cyan-400">
                {formatPrice(order.total_cost)}
              </Badge>
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={fetchDetails} disabled={loadingDetails} className="h-8 w-8 p-0 text-gray-400 hover:text-white">
               <RefreshCcw className={`w-4 h-4 ${loadingDetails ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <SheetDescription id="sheet-description" className="text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span> Live Sync Active
          </SheetDescription>
        </SheetHeader>

        {/* Main Content - Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-4 bg-[#121212]">
             <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="tracking">Tracking</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
             </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2">
                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Order Status</label>
                    <Select value={status} onValueChange={handleStatusUpdate} disabled={loading}>
                      <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-white/10">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Payment</label>
                    <Select value={paymentStatus} onValueChange={handlePaymentUpdate} disabled={loading}>
                      <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white">
                         <SelectValue placeholder="Select Payment Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-white/10">
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" /> Customer Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="text-white">{order.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">User ID</p>
                      <p className="text-white font-mono text-xs">{order.profile_id}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-400" /> Order Items
                  </h3>
                  <div className="space-y-3">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-white/5 last:border-0 pb-2 last:pb-0">
                        <div className="text-sm">
                          <p className="text-white font-medium">{item.product_title}</p>
                          <p className="text-xs text-gray-400">{item.variant_title}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-400">{item.quantity} x</p>
                          <p className="text-white">{formatPrice(item.price_in_cents)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Refund Action */}
                {paymentStatus === 'paid' && (
                    <Button variant="destructive" onClick={handleRefund} className="w-full" disabled={loading}>
                        <CreditCard className="w-4 h-4 mr-2"/> {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Refund Order'}
                    </Button>
                )}
              </TabsContent>

              {/* TRACKING TAB */}
              <TabsContent value="tracking" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                   <h3 className="text-sm font-bold text-white mb-1">Google Sheet Tracking</h3>
                   <p className="text-xs text-gray-400 mb-4">Attach a live Google Sheets link for this order. Every link you add is kept as history.</p>
                   <div className="grid gap-3">
                     <Input 
                        placeholder="Sheet name (internal)" 
                        value={newTracking.name}
                        onChange={e => setNewTracking({...newTracking, name: e.target.value})}
                        className="bg-[#0A0A0A] border-white/10 text-white text-sm"
                     />
                     <div className="flex gap-2">
                        <Input 
                            placeholder="Google Sheets URL (https://...)" 
                            value={newTracking.url}
                            onChange={e => setNewTracking({...newTracking, url: e.target.value})}
                            className="bg-[#0A0A0A] border-white/10 text-white text-sm"
                        />
                        <Button onClick={handleAddTracking} disabled={!newTracking.url || !newTracking.name || loading} className="shrink-0">
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4"/>}
                        </Button>
                     </div>
                   </div>
                </div>

                <div className="space-y-3">
                   {loadingDetails ? (
                      <div className="flex justify-center items-center h-20"><Loader2 className="animate-spin text-cyan-500" /></div>
                   ) : trackingInfo.length > 0 ? (
                     trackingInfo.map(track => (
                       <div key={track.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                             <Truck className="w-5 h-5 text-cyan-400" />
                             <div>
                                <p className="text-sm font-bold text-white">{track.sheet_name || track.carrier || 'Tracking link'}</p>
                                {track.sheet_url ? (
                                  <a
                                    href={track.sheet_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                                  >
                                    Open Google Sheet
                                  </a>
                                ) : track.tracking_number ? (
                                  <p className="text-xs text-gray-400 font-mono">{track.tracking_number}</p>
                                ) : null}
                             </div>
                          </div>
                          <span className="text-[10px] text-gray-500">{timeAgo(track.created_at)}</span>
                       </div>
                     ))
                   ) : <p className="text-center text-gray-500 text-sm">No tracking links yet.</p>}
                </div>
              </TabsContent>

              {/* COMMENTS TAB */}
              <TabsContent value="comments" className="mt-0 flex flex-col h-full animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
                    {loadingDetails ? (
                       <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-cyan-500" /></div>
                    ) : comments.length > 0 ? (
                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs font-bold text-cyan-400">Admin</span>
                                            <span className="text-[10px] text-gray-500">{timeAgo(comment.created_at)}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg bg-white/5 border ${comment.is_read ? 'border-white/10' : 'border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.4)]'} text-sm text-gray-200`}>
                                            {comment.comment}
                                        </div>
                                        {!comment.is_read && <span className="text-[10px] text-cyan-500">Unread by user</span>}
                                    </div>
                                </div>
                            ))}
                             <div ref={commentsEndRef} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                             <MessageSquare className="w-10 h-10 mb-2 opacity-20"/>
                             <p className="text-sm">No notes yet.</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10 bg-[#121212] sticky bottom-0">
                    <Textarea 
                        placeholder="Add internal note or message to customer..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-[#0A0A0A] border-white/10 text-white min-h-[80px] focus-visible:ring-cyan-500/50"
                    />
                    <Button onClick={handleAddComment} className="w-full mt-3 bg-cyan-600 hover:bg-cyan-500 font-bold" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2"/>} Add Note
                    </Button>
                </div>
              </TabsContent>

              {/* HISTORY TAB */}
              <TabsContent value="history" className="mt-0 animate-in fade-in slide-in-from-bottom-2">
                 <div className="space-y-6 relative pl-4 border-l border-white/10 ml-2 py-2">
                    {loadingDetails ? (
                       <div className="flex justify-center items-center h-20"><Loader2 className="animate-spin text-cyan-500" /></div>
                    ) : actions.length > 0 ? (
                      actions.map((action, i) => (
                          <div key={action.id} className="relative">
                              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-[#121212]" />
                              <div className="text-sm">
                                  <p className="text-white font-medium">{action.action}</p>
                                  <p className="text-xs text-gray-500">{timeAgo(action.created_at)}</p>
                                  {action.details && Object.keys(action.details).length > 0 && (
                                      <div className="mt-1.5 text-[10px] bg-black/30 p-2 rounded border border-white/5 text-gray-400 overflow-x-auto font-mono">
                                          {JSON.stringify(action.details, null, 2).replace(/{|}|"/g, '')}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))
                    ) : <p className="text-center text-gray-500 text-sm">No action history found.</p>}
                 </div>
              </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default AdminOrderManagement;
