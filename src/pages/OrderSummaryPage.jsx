
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';

const OrderSummaryPage = () => {
  const { orderId } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (error) {
        toast({ title: "Error", description: "Could not fetch order details.", variant: "destructive" });
        console.error(error);
      } else {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, toast]);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!", description: text });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-32 flex justify-center items-center min-h-screen">
        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-6 py-32 flex flex-col items-center justify-center text-center min-h-screen">
        <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">Order Not Found</h1>
        <p className="text-lg text-gray-300 mb-8">
          We couldn't find the order you're looking for. It might have been removed or the link is incorrect.
        </p>
        <Button asChild><Link to="/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Order Summary - {order.id.substring(0, 8)}</title>
        <meta name="description" content="Summary of your order and payment instructions." />
      </Helmet>
      <div className="container mx-auto px-6 py-32 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'circOut' }}
          className="w-full max-w-2xl"
        >
          <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Order Created Successfully!</h1>
          <p className="text-lg text-gray-300 mb-8">
            Your order is pending payment. Please follow the instructions below to complete your purchase.
          </p>

          <div className="glass-card-dark rounded-2xl p-8 mb-8 text-left space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Order Summary</h2>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-gray-400">Order ID:</span>
              <span className="font-mono text-white">{order.id}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-gray-400">Total Amount:</span>
              {/* Correctly formatting price from cents */}
              <span className="font-bold text-2xl text-cyan-400">
                {formatPrice(order.total_cost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Payment Status:</span>
              <span className={`font-semibold px-3 py-1 rounded-full text-sm ${order.payment_status === 'paid' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="glass-card-dark rounded-2xl p-8 text-left space-y-4">
             <h2 className="text-2xl font-bold text-white text-center">How to Pay</h2>
             <p className="text-gray-300 text-center">To finalize your order, please send the total amount to one of the following crypto addresses. After payment, your order status will be updated automatically.</p>
             
             <div className="space-y-4 pt-4">
                <div>
                    <Label className="text-gray-300 font-bold">Bitcoin (BTC):</Label>
                    <div className="flex items-center gap-2 mt-1 glass-card p-3 rounded-lg">
                        <p className="font-mono text-sm text-white break-all flex-grow">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
                        <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')}><Copy className="w-4 h-4" /></Button>
                    </div>
                </div>
                <div>
                    <Label className="text-gray-300 font-bold">Ethereum (ETH):</Label>
                    <div className="flex items-center gap-2 mt-1 glass-card p-3 rounded-lg">
                        <p className="font-mono text-sm text-white break-all flex-grow">0x9b5a8eE3B3A6D6b4F0AE5B258A366a553832B9B3</p>
                        <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard('0x9b5a8eE3B3A6D6b4F0AE5B258A366a553832B9B3')}><Copy className="w-4 h-4" /></Button>
                    </div>
                </div>
             </div>
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-200">
              <Link to="/dashboard">Go to My Orders</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              <Link to="/store">Continue Shopping</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default OrderSummaryPage;
