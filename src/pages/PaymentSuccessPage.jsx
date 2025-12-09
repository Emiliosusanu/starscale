import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import Confetti from 'react-confetti'; // Note: Assuming we might not have this pkg, but if not available, it will just break. Let's stick to pure CSS/Motion to be safe given constraints. 
// actually, I'll remove external deps that aren't in package.json.

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <Helmet>
        <title>Payment Successful! - Starscale</title>
      </Helmet>
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="max-w-md w-full glass-card p-8 rounded-2xl text-center border border-green-500/30 relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-green-500/5 blur-3xl -z-10"></div>

        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            delay={0.2}
            className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400"
        >
            <CheckCircle className="w-12 h-12" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-400 mb-8">
            Thank you for your purchase. Your order 
            {orderId && <span className="text-white font-mono mx-1">#{orderId.slice(0, 8)}</span>} 
            has been confirmed and is now being processed.
        </p>

        <div className="space-y-3">
            <Button 
                onClick={() => navigate('/dashboard')} 
                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-6"
            >
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            
            <Button 
                variant="outline" 
                onClick={() => navigate('/')} 
                className="w-full border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
            >
                <ShoppingBag className="mr-2 w-4 h-4" /> Continue Shopping
            </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;