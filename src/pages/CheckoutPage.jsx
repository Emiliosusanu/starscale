import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";
import { initializeStripeCheckout } from "@/api/StripeApi";
import { useToast } from "@/components/ui/use-toast";
import { Helmet } from "react-helmet-async";

// This component handles the "Instant Order" flow from the landing page
const CheckoutPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState("Initializing secure checkout...");

  useEffect(() => {
    const processRedirect = async () => {
      try {
        // 1. Fetch the order to get item details
        const { data: order, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (error) throw error;

        if (!order || !order.items || order.items.length === 0) {
          throw new Error("Invalid order data");
        }

        setStatus("Redirecting to Stripe checkout...");

        // Initialize Stripe checkout session
        const { url } = await initializeStripeCheckout({
          orderId: order.id,
          items: order.items.map((item) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
          customerEmail: order.email,
          successUrl: `${window.location.origin}/success?order_id=${order.id}`,
          cancelUrl: `${window.location.origin}/dashboard?tab=orders&status=cancelled`,
          discountAmountCents: 0,
        });

        // 3. Redirect immediately
        window.location.href = url;
      } catch (error) {
        console.error("Error processing checkout redirect:", error);
        toast({
          title: "Checkout Failed",
          description:
            "Could not redirect to payment provider. Please try again.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    };

    if (orderId) {
      processRedirect();
    }
  }, [orderId, navigate, toast]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center">
      <Helmet>
        <title>Processing Checkout...</title>
      </Helmet>

      <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2">Just a moment</h2>
      <p className="text-gray-400">{status}</p>
    </div>
  );
};

export default CheckoutPage;
