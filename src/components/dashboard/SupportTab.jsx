
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Loader2, Send, MessageSquare, ArrowLeft, PlusCircle, Check, CheckCircle, 
  AlertCircle, AlertTriangle, Info, Clock
} from 'lucide-react';
import { timeAgo, cn, playMessageSound } from '@/lib/utils';

const PriorityBadge = ({ priority }) => {
  const styles = {
    urgent: "bg-red-500/20 text-red-400 border-red-500/40",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  };
  const icons = { urgent: AlertCircle, high: AlertTriangle, medium: Clock, low: Info };
  const Icon = icons[priority] || icons.medium;
  return (
    <span className={cn("px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-sm border flex items-center gap-1 w-fit", styles[priority] || styles.medium)}>
      <Icon className="w-2.5 h-2.5" /> {priority || 'Medium'}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const statusClasses = {
    open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={cn("px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-sm border", statusClasses[status] || statusClasses.open)}>
      {status || 'Open'}
    </span>
  );
};

const ChatInterface = ({ ticket, onBack, onUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
      if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
      }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (msgs) => {
    if (!msgs || msgs.length === 0) return;
    const idsToUpdate = msgs.filter(m => m.user_id !== user.id && !m.is_read).map(m => m.id);
    if (idsToUpdate.length === 0) return;
    
    const { error } = await supabase.from('ticket_messages').update({ is_read: true }).in('id', idsToUpdate);
    if (error) console.error("Error marking messages as read:", error);
  }, [user.id]);

  // Fetch initial messages
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
        setLoadingMessages(true);
        const { data, error } = await supabase
            .from('ticket_messages')
            .select(`*`)
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });
        
        if (!error && isMounted) {
            setMessages(data);
            markAsRead(data);
        }
        if (isMounted) setLoadingMessages(false);
    };
    fetchMessages();
    return () => { isMounted = false; };
  }, [ticket.id, user.id, markAsRead]);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase.channel(`ticket_chat_${ticket.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'ticket_messages', 
            filter: `ticket_id=eq.${ticket.id}`
        }, (payload) => {
            setMessages(prev => {
                if (prev.find(m => m.id === payload.new.id)) return prev;
                return [...prev, payload.new];
            });
            
            if (payload.new.user_id !== user.id) {
                playMessageSound();
                markAsRead([payload.new]);
            }
            
            setTimeout(() => scrollToBottom("smooth"), 100);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticket.id, user.id, markAsRead, scrollToBottom]);

  // Scroll to bottom when messages load or change
  useEffect(() => {
      if (!loadingMessages) {
          scrollToBottom("auto");
      }
  }, [loadingMessages, scrollToBottom]);

  // Scroll on new message added to list
  useEffect(() => {
      scrollToBottom("smooth");
  }, [messages.length, scrollToBottom]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    
    const msgContent = newMessage;
    setNewMessage('');
    
    // Optimistic UI update
    const tempId = Math.random().toString();
    const optimisticMsg = {
        id: tempId,
        ticket_id: ticket.id,
        user_id: user.id,
        message: msgContent,
        sender_role: isAdmin ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        is_read: false,
        status: 'sending'
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        user_id: user.id,
        message: msgContent,
        sender_role: isAdmin ? 'admin' : 'user',
        is_read: false 
    }).select().single();
    
    if (error) {
        toast({ title: "Failed to send", variant: "destructive" });
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(msgContent);
    } else {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        // Update ticket timestamp
        await supabase.from('tickets').update({ last_reply_at: new Date().toISOString(), status: 'open' }).eq('id', ticket.id);
        if (onUpdate) onUpdate();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleSendMessage();
    }
  };

  const otherParty = isAdmin ? (ticket.profiles?.email || 'User') : 'Support';

  return (
    <div className="flex flex-col h-full w-full bg-[#0f0f0f] rounded-xl border border-white/10 overflow-hidden relative">
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-[#121212] flex items-center justify-between shrink-0 z-10">
         <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
             </Button>
             <div>
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{ticket.subject}</h3>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                </div>
                <p className="text-[10px] text-gray-500">#{ticket.id.slice(0,8)} • {otherParty}</p>
             </div>
         </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A]/50 custom-scrollbar"
      >
        {loadingMessages ? (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
        ) : (
            <>
                {messages.map((msg) => {
                    const isMe = msg.user_id === user.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-xl text-sm shadow-sm ${isMe ? 'bg-cyan-600 text-white rounded-br-sm' : 'bg-[#1F1F1F] text-gray-200 border border-white/5 rounded-bl-sm'}`}>
                                <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                                <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMe ? 'text-cyan-200 justify-end' : 'text-gray-500'}`}>
                                    {timeAgo(msg.created_at)}
                                    {isMe && (msg.is_read ? <CheckCircle className="w-3 h-3 opacity-80" /> : <Check className="w-3 h-3 opacity-60" />)}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} className="h-px w-full" />
            </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#121212] border-t border-white/10 shrink-0">
         <div className="flex gap-2 items-end max-w-full">
             <div className="flex-1 bg-white/5 rounded-xl border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                 <Textarea 
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="bg-transparent border-none text-white min-h-[44px] max-h-[120px] py-3 px-3 resize-none focus-visible:ring-0 text-sm w-full"
                    rows={1}
                 />
             </div>
             <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim()} 
                size="icon" 
                className="h-[44px] w-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg hover:shadow-cyan-500/20 shrink-0 transition-all"
             >
                 <Send className="w-4 h-4" />
             </Button>
         </div>
      </div>
    </div>
  );
};

const SupportTab = ({ onChatOpenChange, onTicketRead }) => {
  const [tickets, setTickets] = useState([]);
  const [view, setView] = useState('list'); // list, new, details
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  // Fetch tickets
  const fetchTickets = useCallback(async () => {
      if(!profile) return;
      let query = supabase.from('tickets').select('*, profiles(email)').order('last_reply_at', { ascending: false });
      if(!isAdmin) query = query.eq('profile_id', profile.id);
      
      const { data } = await query;
      if(data) {
           // Calculate unread messages manually if needed or trust the realtime
           // For efficiency, we can do a separate query for counts
           const { data: unread } = await supabase.from('ticket_messages').select('ticket_id').eq('is_read', false).neq('user_id', user.id);
           const counts = {};
           unread?.forEach(u => counts[u.ticket_id] = (counts[u.ticket_id] || 0) + 1);
           setTickets(data.map(t => ({...t, unread_count: counts[t.id] || 0})));
      }
  }, [profile, isAdmin, user.id]);

  useEffect(() => { 
      fetchTickets(); 

      const channel = supabase.channel('global_tickets')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, (payload) => {
            if (payload.new.user_id !== user.id) {
                fetchTickets(); 
                if (!selectedTicket || selectedTicket.id !== payload.new.ticket_id) {
                   playMessageSound();
                }
            }
        })
        .subscribe();
      
      return () => { supabase.removeChannel(channel); }
  }, [fetchTickets, user.id, selectedTicket]);

  const openTicket = (ticket) => {
      setSelectedTicket(ticket);
      setView('details');
      if(onChatOpenChange) onChatOpenChange(true);
      
      // Optimistically clear count locally
      setTickets(prev => prev.map(t => t.id === ticket.id ? {...t, unread_count: 0} : t));
      
      if(ticket.unread_count > 0 && onTicketRead) onTicketRead(ticket.unread_count);
  };

  const closeTicket = () => {
      setSelectedTicket(null);
      setView('list');
      if(onChatOpenChange) onChatOpenChange(false);
      fetchTickets();
  };

  if (view === 'details' && selectedTicket) {
      return (
        <div className="h-[600px] w-full">
            <ChatInterface ticket={selectedTicket} onBack={closeTicket} onUpdate={fetchTickets} />
        </div>
      );
  }
  
  if (view === 'new') {
      return (
          <div className="max-w-2xl mx-auto pt-8 min-h-[500px]">
              <Button variant="ghost" onClick={() => setView('list')} className="mb-4 text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Tickets</Button>
              <h2 className="text-xl font-bold text-white mb-6">New Support Request</h2>
              <NewTicketForm onCancel={() => setView('list')} onSuccess={() => { setView('list'); fetchTickets(); }} />
          </div>
      );
  }

  return (
      <div className="space-y-4 min-h-[500px]">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  My Tickets
              </h2>
              {!isAdmin && (
                  <Button size="sm" onClick={() => setView('new')} className="bg-cyan-600 hover:bg-cyan-500 h-9 text-xs font-bold shadow-lg shadow-cyan-900/20">
                      <PlusCircle className="w-3.5 h-3.5 mr-1.5"/> New Ticket
                  </Button>
              )}
          </div>
          
          <div className="space-y-3">
              {tickets.length === 0 ? (
                  <div className="text-center py-16 bg-[#121212] rounded-xl border border-dashed border-white/10">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-gray-400">No tickets found.</p>
                      {!isAdmin && <p className="text-xs text-gray-500 mt-1">Create one to get started.</p>}
                  </div>
              ) : (
                  tickets.map(ticket => (
                      <div 
                        key={ticket.id} 
                        onClick={() => openTicket(ticket)} 
                        className={cn(
                            "group flex items-center justify-between p-4 bg-[#121212] border rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                            ticket.unread_count > 0 ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/10 hover:border-white/20"
                        )}
                      >
                          <div className="flex items-center gap-4">
                              <div className="relative">
                                  {ticket.unread_count > 0 ? (
                                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                           <MessageSquare className="w-5 h-5" />
                                           <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] font-bold text-white flex items-center justify-center rounded-full shadow-sm border border-[#121212]">
                                              {ticket.unread_count}
                                           </span>
                                      </div>
                                  ) : (
                                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-white/10 group-hover:text-white transition-colors">
                                          <MessageSquare className="w-5 h-5" />
                                      </div>
                                  )}
                              </div>
                              <div>
                                  <h4 className={cn("text-sm font-semibold mb-0.5 transition-colors", ticket.unread_count > 0 ? "text-white" : "text-gray-300 group-hover:text-white")}>
                                      {ticket.subject}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                      <StatusBadge status={ticket.status} />
                                      <span className="text-[10px] text-gray-500 font-mono">#{ticket.id.slice(0,8)}</span>
                                      <span className="text-[10px] text-gray-500">• {timeAgo(ticket.last_reply_at)}</span>
                                  </div>
                              </div>
                          </div>
                          <div className="text-gray-600 group-hover:text-cyan-400 transition-colors">
                             <div className="p-2 rounded-full group-hover:bg-cyan-400/10">
                                 <ArrowLeft className="w-4 h-4 rotate-180" />
                             </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
  );
};

const NewTicketForm = ({ onCancel, onSuccess }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(false);
    const { user, profile } = useAuth();
    const { toast } = useToast();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!subject || !message) {
        toast({ title: "Please fill all fields.", variant: "destructive" });
        return;
      }
      setLoading(true);
      try {
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            profile_id: profile.id,
            subject,
            status: 'open',
            priority: priority,
            last_reply_at: new Date().toISOString(),
          })
          .select()
          .single();
  
        if (ticketError) throw ticketError;
  
        const { error: messageError } = await supabase.from('ticket_messages').insert({
          ticket_id: ticket.id,
          user_id: user.id,
          message,
          sender_role: profile?.role || 'user',
          is_read: true 
        });
  
        if (messageError) throw messageError;
  
        toast({ title: "Ticket created successfully!" });
        if (onSuccess) onSuccess();
      } catch (error) {
        toast({ title: "Error creating ticket", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    return (
        <div className="glass-card p-8 rounded-2xl border border-white/10 bg-[#121212] w-full shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-400">Subject</label>
                 <Input 
                    placeholder="Brief summary of your issue" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 h-11" 
                 />
              </div>
              
              <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-400">Priority</label>
                 <Select value={priority} onValueChange={setPriority}>
                   <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                     <SelectValue placeholder="Select priority" />
                   </SelectTrigger>
                   <SelectContent className="bg-[#1A1A1A] border-white/10">
                     <SelectItem value="low">Low</SelectItem>
                     <SelectItem value="medium">Medium</SelectItem>
                     <SelectItem value="high">High</SelectItem>
                     <SelectItem value="urgent">Urgent</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
    
              <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-400">Message</label>
                 <Textarea 
                    placeholder="Describe your issue in detail..." 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    className="bg-white/5 border-white/10 text-white min-h-[150px] focus:border-cyan-500/50 resize-none p-4 leading-relaxed" 
                 />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-white/10 text-gray-300 hover:bg-white/5 hover:text-white">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-[2] bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-900/20">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Request
                </Button>
              </div>
            </form>
          </div>
    )
}

export default SupportTab;
