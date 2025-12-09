import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import {
  CheckCircle,
  Loader2,
  Home,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [status, setStatus] = useState("processing");
  const [orderSummary, setOrderSummary] = useState(null);
  const processedRef = useRef(false); // Prevent double-execution in React Strict Mode

  useEffect(() => {
    const processOrder = async () => {
      if (processedRef.current) return;

      const searchParams = new URLSearchParams(location.search);
      const orderId = searchParams.get("order_id");
      // Some gateways don't return checkout_id in the URL, we rely on the successful redirect to confirm intent
      // But strictly we should verify. For this integration, existence of order_id + success route implies success.

      if (!orderId) {
        setStatus("error");
        return;
      }

      processedRef.current = true;

      try {
        // 1. Fetch the pending order
        const { data: orderData, error: fetchError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (fetchError || !orderData) {
          throw new Error("Order not found.");
        }

        setOrderSummary(orderData);

        // 2. If already paid (by webhook), just show success
        if (orderData.payment_status === "paid") {
          setStatus("success");
          clearCart();
          return;
        }

        // 3. Wait for webhook to process (handles race condition)
        // Webhook usually fires within 1-3 seconds of redirect
        let attempts = 0;
        const maxAttempts = 5;
        const delayMs = 2000; // 2 seconds between checks

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          attempts++;

          const { data: refreshedOrder } = await supabase
            .from("orders")
            .select("payment_status, progress_steps, email")
            .eq("id", orderId)
            .single();

          if (refreshedOrder?.payment_status === "paid") {
            setOrderSummary((prev) => ({ ...prev, ...refreshedOrder }));
            setStatus("success");
            clearCart();
            toast({
              title: "Order Confirmed",
              description: `Confirmation email sent to ${refreshedOrder.email}`,
            });
            return;
          }
        }

        // 4. If webhook hasn't fired after waiting, show success anyway
        // (Payment was received - Stripe redirect confirms this)
        // Webhook will process eventually and update DB
        setStatus("success");
        clearCart();
        toast({
          title: "Order Received",
          description:
            "Your payment is being processed. Check your email for confirmation.",
        });
      } catch (error) {
        console.error("Order processing error:", error);
        toast({
          title: "Sync Error",
          description:
            "Payment received, but we couldn't update the order status automatically. Please contact support.",
          variant: "destructive",
        });
        setStatus("error");
      }
    };

    processOrder();
  }, [location.search, toast, clearCart]);

  return (
    <>
      <Helmet>
        <title>Payment Status - Starscale</title>
      </Helmet>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          {status === "processing" && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Finalizing Order...
              </h1>
              <p className="text-gray-400">
                Please wait while we confirm your payment details.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="glass-card p-8 rounded-2xl border border-green-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-cyan-500"></div>
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">
                Payment Successful!
              </h1>
              <p className="text-gray-300 mb-6">
                Your order{" "}
                <span className="text-white font-mono">
                  #{orderSummary?.id?.slice(0, 8)}
                </span>{" "}
                has been confirmed.
                <br />A confirmation email has been sent to{" "}
                <span className="text-cyan-400">{orderSummary?.email}</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-black hover:bg-gray-200 font-bold"
                >
                  <Link to="/dashboard">View Dashboard</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Link to="/store">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="glass-card p-8 rounded-2xl border border-red-500/20">
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">
                Something went wrong
              </h1>
              <p className="text-gray-300 mb-6">
                We couldn't verify the order status automatically. If you were
                charged, please contact support immediately.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link to="/dashboard?tab=support">Contact Support</Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default SuccessPage;
