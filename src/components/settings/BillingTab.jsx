import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BillingTab = ({ userId }) => {
  const { toast } = useToast();
  const [methods, setMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvc: ''
  });

  const fetchBillingData = async () => {
    try {
      const { data: methodsData } = await supabase
        .from('user_payment_methods')
        .select('*')
        .order('is_default', { ascending: false });
      
      const { data: invoicesData } = await supabase
        .from('user_invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      setMethods(methodsData || []);
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchBillingData();
  }, [userId]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    const last4 = cardForm.number.slice(-4);
    
    const { error } = await supabase.from('user_payment_methods').insert([{
        user_id: userId,
        card_brand: 'visa',
        last_4: last4,
        exp_month: parseInt(cardForm.expiry.split('/')[0]),
        exp_year: parseInt(cardForm.expiry.split('/')[1]),
        is_default: methods.length === 0
    }]);

    if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
        toast({ title: "Card Added", description: "Payment method saved successfully." });
        setIsDialogOpen(false);
        setCardForm({ number: '', expiry: '', cvc: '' });
        fetchBillingData();
    }
  };

  const handleDeleteMethod = async () => {
      try {
        await supabase.from('user_payment_methods').delete().eq('id', deleteId);
        setMethods(methods.filter(m => m.id !== deleteId));
        toast({ title: "Removed", description: "Payment method removed." });
        setDeleteId(null);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Payment Methods */}
      <div className="glass-card-dark p-8 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-xl font-bold text-white">Payment Methods</h3>
                <p className="text-gray-400 text-sm">Manage your credit cards and payment options.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add Method
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1A1A1A] border-white/10 text-white">
                    <DialogHeader><DialogTitle>Add Payment Method</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddCard} className="space-y-4 mt-4">
                         <div className="space-y-2">
                            <Label>Card Number</Label>
                            <Input 
                                placeholder="0000 0000 0000 0000" 
                                value={cardForm.number}
                                onChange={e => setCardForm({...cardForm, number: e.target.value})}
                                className="bg-black/20 border-white/10"
                                maxLength={19}
                                required
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Expiry (MM/YY)</Label>
                                <Input 
                                    placeholder="MM/YY" 
                                    value={cardForm.expiry}
                                    onChange={e => setCardForm({...cardForm, expiry: e.target.value})}
                                    className="bg-black/20 border-white/10"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input 
                                    placeholder="123" 
                                    value={cardForm.cvc}
                                    onChange={e => setCardForm({...cardForm, cvc: e.target.value})}
                                    className="bg-black/20 border-white/10"
                                    maxLength={4}
                                    required
                                />
                            </div>
                         </div>
                         <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 mt-4">Save Card</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        <div className="space-y-3">
            {methods.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No payment methods saved.</p>
            ) : (
                methods.map(method => (
                    <div key={method.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-medium capitalize">{method.card_brand} ending in {method.last_4}</p>
                                <p className="text-xs text-gray-400">Expires {method.exp_month}/{method.exp_year}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {method.is_default && (
                                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full font-medium">Default</span>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(method.id)} className="hover:bg-red-500/10 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Invoices */}
      <div className="glass-card-dark p-8 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">Invoice History</h3>
          <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-400 font-medium">
                      <tr>
                          <th className="p-4">Invoice ID</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                      {invoices.length === 0 ? (
                           <tr>
                               <td colSpan={5} className="p-8 text-center text-gray-500">No invoices found</td>
                           </tr>
                      ) : (
                          invoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4 font-medium text-white">{inv.invoice_number}</td>
                                  <td className="p-4">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                  <td className="p-4">${(inv.amount / 100).toFixed(2)}</td>
                                  <td className="p-4">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 capitalize">
                                          {inv.status}
                                      </span>
                                  </td>
                                  <td className="p-4 text-right">
                                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                                          <FileText className="w-4 h-4 mr-1" /> Download
                                      </Button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 text-white border-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMethod} className="bg-red-600 hover:bg-red-500 text-white">Remove</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BillingTab;