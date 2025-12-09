import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, Plus, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
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

const AddressBook = ({ userId }) => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    is_default: false
  });

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (userId) fetchAddresses();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, user_id: userId };
      
      if (payload.is_default) {
        await supabase
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', userId);
      }

      let error;
      if (editingId) {
        const { error: updateError } = await supabase
          .from('user_addresses')
          .update(payload)
          .eq('id', editingId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_addresses')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingId ? "Address Updated" : "Address Added",
        description: "Your address book has been updated successfully."
      });
      
      setIsDialogOpen(false);
      resetForm();
      fetchAddresses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('user_addresses').delete().eq('id', deleteId);
      if (error) throw error;
      
      setAddresses(addresses.filter(a => a.id !== deleteId));
      toast({ title: "Address Deleted", description: "The address has been removed." });
      setDeleteId(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      label: 'Home',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      is_default: false
    });
    setEditingId(null);
  };

  const openEdit = (address) => {
    setFormData(address);
    setEditingId(address.id);
    setIsDialogOpen(true);
  };

  if (loading) return <div className="text-center py-4 text-gray-400">Loading addresses...</div>;

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Address Book</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if(!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1A1A1A] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input 
                    value={formData.label} 
                    onChange={e => setFormData({...formData, label: e.target.value})} 
                    placeholder="e.g. Home, Office"
                    className="bg-black/20 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input 
                    value={formData.country} 
                    onChange={e => setFormData({...formData, country: e.target.value})} 
                    placeholder="Country"
                    className="bg-black/20 border-white/10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input 
                  value={formData.street} 
                  onChange={e => setFormData({...formData, street: e.target.value})} 
                  placeholder="123 Main St"
                  className="bg-black/20 border-white/10"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    placeholder="City"
                    className="bg-black/20 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input 
                    value={formData.state} 
                    onChange={e => setFormData({...formData, state: e.target.value})} 
                    placeholder="State"
                    className="bg-black/20 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input 
                    value={formData.zip_code} 
                    onChange={e => setFormData({...formData, zip_code: e.target.value})} 
                    placeholder="Zip"
                    className="bg-black/20 border-white/10"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isDefault"
                    checked={formData.is_default}
                    onChange={e => setFormData({...formData, is_default: e.target.checked})}
                    className="rounded border-gray-600 bg-black/20 text-cyan-500 focus:ring-cyan-500"
                  />
                  <Label htmlFor="isDefault" className="cursor-pointer">Set as default address</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Address'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
            <div className="col-span-2 p-8 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                No addresses found. Add one to get started!
            </div>
        ) : (
            addresses.map(addr => (
                <div key={addr.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-start group hover:border-cyan-500/30 transition-colors">
                    <div className="flex items-start gap-3">
                        <MapPin className={`w-5 h-5 mt-1 ${addr.is_default ? 'text-cyan-400' : 'text-gray-500'}`} />
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{addr.label}</h4>
                                {addr.is_default && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">Default</span>}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                                {addr.street}<br />
                                {addr.city}, {addr.state} {addr.zip_code}<br />
                                {addr.country}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => openEdit(addr)}>
                            <Edit2 className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10" onClick={() => setDeleteId(addr.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                    </div>
                </div>
            ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 text-white border-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white">Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddressBook;