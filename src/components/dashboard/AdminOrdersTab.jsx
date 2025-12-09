
import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminOrderManagement from '@/components/dashboard/AdminOrderManagement';

const AdminOrdersTab = ({ allOrders, loading, onUpdate, highlightedOrderId }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (highlightedOrderId && allOrders.length > 0) {
        const order = allOrders.find(o => o.id === highlightedOrderId);
        if (order) {
            handleManage(order);
        }
    }
  }, [highlightedOrderId, allOrders]);


  const handleManage = (order) => {
      setSelectedOrder(order);
      setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
      setIsSheetOpen(false);
      setSelectedOrder(null);
      onUpdate(); // Re-fetch orders when sheet closes to reflect any changes
  };

  return (
    <>
    <div className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 text-xs uppercase h-9">ID</TableHead>
                <TableHead className="text-gray-400 text-xs uppercase h-9">User</TableHead>
                <TableHead className="text-gray-400 text-xs uppercase h-9">Status</TableHead>
                <TableHead className="text-gray-400 text-xs uppercase h-9">Total</TableHead>
                <TableHead className="text-gray-400 text-xs uppercase h-9 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500"/></TableCell></TableRow>
              ) : allOrders.map(order => {
                 const isHighlighted = highlightedOrderId === order.id;
                 return (
                <TableRow key={order.id} className={`border-b-white/5 hover:bg-white/[0.02] ${isHighlighted ? 'bg-cyan-500/10' : ''}`}>
                  <TableCell className="font-mono text-xs text-gray-400">#{order.id.slice(0,8)}</TableCell>
                  <TableCell className="text-sm text-white">{order.email}</TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1">
                         <span className={`w-fit px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {order.status}
                         </span>
                         <span className={`w-fit px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {order.payment_status}
                         </span>
                      </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-cyan-400">${(order.total_cost || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 border-white/10 text-xs" onClick={() => handleManage(order)}>
                              Manage
                          </Button>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white"><MoreHorizontal className="w-3 h-3" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleManage(order)}>
                                      <Eye className="w-3 h-3 mr-2"/> View Details
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
    </div>

    {selectedOrder && (
        <AdminOrderManagement 
            order={selectedOrder} 
            isOpen={isSheetOpen} 
            onClose={handleSheetClose}
            onUpdate={onUpdate} // Pass onUpdate to trigger dashboard re-fetch
        />
    )}
    </>
  );
};

export default AdminOrdersTab;
