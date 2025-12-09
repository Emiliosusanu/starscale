import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, History } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const AdminActivityLogTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card-dark rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">Admin Activity Log</h2>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
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
              {logs.map(log => (
                <TableRow key={log.id} className="border-b-white/5">
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{log.admin_email}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{renderTarget(log)}</TableCell>
                  <TableCell className="font-mono text-xs max-w-xs truncate">{log.details ? JSON.stringify(log.details) : 'N/A'}</TableCell>
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