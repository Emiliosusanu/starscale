import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, History, Search } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const AdminActivityLogTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: "Error", description: "Could not fetch activity logs.", variant: "destructive" });
    } else {
      setLogs(data);
    }
    setLoading(false);
  }, [toast]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) => {
      const admin = (log.admin_email || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const target = ((log.target_user_id || '') + (log.target_order_id || '')).toLowerCase();
      const details = log.details ? JSON.stringify(log.details).toLowerCase() : '';

      return (
        admin.includes(query) ||
        action.includes(query) ||
        target.includes(query) ||
        details.includes(query)
      );
    });
  }, [logs, search]);

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('admin_activity_log_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_activity_log' },
        (payload) => {
          fetchLogs();
          if (payload.eventType === 'INSERT') {
            toast({ title: "New Admin Activity", description: `${payload.new.admin_email} performed action: ${payload.new.action}` });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs, toast]);

  const renderTarget = (log) => {
    if (log.target_user_id) {
        return <span className="font-mono text-xs">User: {log.target_user_id.substring(0,8)}...</span>
    }
    if (log.target_order_id) {
        return <span className="font-mono text-xs">Order: {log.target_order_id.substring(0,8)}...</span>
    }
    return 'N/A';
  }

	const renderDetails = (log) => {
	  if (!log.details) return 'N/A';

	  let data = log.details;
	  if (typeof data === 'string') {
	    try {
	      data = JSON.parse(data);
	    } catch {
	      return data;
	    }
	  }

	  // Simple comment / note payloads
	  if (typeof data.comment === 'string') {
	    return `Comment: "${data.comment}"`;
	  }
	  if (typeof data.note === 'string') {
	    return `Note: "${data.note}"`;
	  }

	  // new/old diff payloads (e.g. profile updates)
	  if (data.new && data.old && typeof data.new === 'object' && typeof data.old === 'object') {
	    const changed = [];
	    for (const key of Object.keys(data.new)) {
	      const before = data.old[key];
	      const after = data.new[key];
	      if (JSON.stringify(before) !== JSON.stringify(after)) {
	        changed.push(key);
	      }
	    }
	    if (changed.length) {
	      const list = changed.slice(0, 4).join(', ');
	      return `Changed: ${list}${changed.length > 4 ? '…' : ''}`;
	    }
	    return 'Profile updated';
	  }

	  // Status-style payloads
	  if (data.status || data.payment_status) {
	    const parts = [];
	    if (data.status) parts.push(`Status → ${data.status}`);
	    if (data.payment_status) parts.push(`Payment → ${data.payment_status}`);
	    return parts.join(' · ');
	  }

	  // Generic fallback: show a couple of key/value pairs
	  const entries = Object.entries(data)
	    .filter(([k]) => k !== 'new' && k !== 'old')
	    .slice(0, 3)
	    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);

	  if (entries.length) return entries.join(' · ');

	  return typeof log.details === 'string'
	    ? log.details
	    : JSON.stringify(log.details);
	};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card-dark rounded-2xl p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Admin Activity Log</h2>
        </div>
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by admin, action, target, details..."
              className="pl-9 h-9 bg-[#111111] border-white/10 text-sm placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No admin activities recorded yet.</p>
      ) : (
        <div className="overflow-x-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow className="border-b-white/10 sticky top-0 bg-black/30 backdrop-blur-sm">
                <TableHead className="text-white">Timestamp</TableHead>
                <TableHead className="text-white">Admin</TableHead>
                <TableHead className="text-white">Action</TableHead>
                <TableHead className="text-white">Target</TableHead>
                <TableHead className="text-white">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(log => (
                <TableRow key={log.id} className="border-b-white/5">
                  <TableCell className="whitespace-nowrap text-xs text-gray-300">{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-sm text-white">{log.admin_email}</TableCell>
                  <TableCell className="text-sm text-gray-100">{log.action}</TableCell>
                  <TableCell>{renderTarget(log)}</TableCell>
                  <TableCell className="text-[11px] max-w-xs truncate text-gray-300">
						<span title={log.details ? JSON.stringify(log.details) : ''}>
							{renderDetails(log)}
						</span>
					</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
};

export default AdminActivityLogTab;