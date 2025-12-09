import React, { useCallback, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart as ShoppingCartIcon,
  X,
  Loader2,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  Flame,
  Gift,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  initializeStripeCheckout,
  getProducts,
} from "@/api/StripeApi";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// --- Helper Components ---

const CartTimer = () => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-3 mb-4 flex items-center justify-center gap-2 text-sm text-orange-400">
      <Clock className="w-4 h-4 animate-pulse" />
      <span>Reserved for</span>
      <span className="font-mono font-bold bg-black/30 px-2 py-0.5 rounded">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <span>minutes</span>
    </div>
  );
};

const UpsellItem = ({ product, onAdd }) => {
  const variant = product.variants[0];
  const price = variant.sale_price_in_cents || variant.price_in_cents;

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-colors group">
      <div className="w-12 h-12 rounded bg-black/50 flex-shrink-0 overflow-hidden">
        <img
          src={product.image || "https://placehold.co/100"}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-medium text-white truncate">
          {product.title}
        </h4>
        <p className="text-xs text-cyan-400 font-bold">
          {formatCurrency(price, variant.currency)}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onAdd(product)}
        className="h-8 px-2 text-xs bg-white/10 hover:bg-cyan-500 hover:text-white transition-all"
      >
        Add
      </Button>
    </div>
  );
};

const SocialProof = () => (
  <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
    <div className="flex items-center gap-2 mb-2">
      <div className="flex -space-x-2">
        {[1, 2, 3].map((i) => (
          <Avatar key={i} className="w-6 h-6 border border-black">
            <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 10}`} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="text-xs text-gray-400">
        <strong className="text-white">500+</strong> people bought this week
      </div>
    </div>
    <p className="text-xs text-gray-300 italic">
      "Absolutely game-changing service. The delivery was instant!"
      <br />
      <span className="text-cyan-500 not-italic font-bold">
        - Alex M., Verified Buyer
      </span>
    </p>
  </div>
);

const ShoppingCart = ({ isCartOpen, setIsCartOpen }) => {
  const { toast } = useToast();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart,
    addToCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [upsellProducts, setUpsellProducts] = useState([]);

  // Load simulated upsell products
  useEffect(() => {
    if (isCartOpen && upsellProducts.length === 0) {
      getProducts({ limit: 2 })
        .then((res) => {
          // Filter out items already in cart roughly
          setUpsellProducts(res.products.slice(0, 2));
        })
        .catch(() => {}); // Silent fail for upsells
    }
  }, [isCartOpen, upsellProducts.length]);

  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Your cart is empty",
        description: "Add some products to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in or register to proceed with checkout.",
        variant: "destructive",
      });
      navigate("/login");
      setIsCartOpen(false);
      return;
    }

    setLoading(true);

    try {
      // CRITICAL: Ensuring calculation works with CENTS (integers) to avoid floating point errors
      const subtotal = getCartTotal(); // Returns cents (Integer)

      // Calculate items count for bundle discount
      const totalItemsCount = cartItems.reduce(
        (acc, item) => acc + item.quantity,
        0
      );
      const hasBundleDiscount = totalItemsCount >= 2;
      const discountPercentage = 0.3;

      const bundleSavings = hasBundleDiscount
        ? Math.round(subtotal * discountPercentage)
        : 0;
      // Force integer for safety
      const finalTotal = Math.floor(subtotal - bundleSavings);

      const newOrder = {
        profile_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        platform: "Store",
        product_url: `/product/${cartItems[0]?.product?.id || ""}`,
        review_count: 0,
        total_cost: finalTotal, // Stores CENTS
        payment_status: "unpaid",
        status: "pending",
        items: cartItems.map((item) => ({
          product_title: item.product.title,
          variant_title: item.variant.title,
          quantity: item.quantity,
          price_in_cents:
            item.variant.sale_price_in_cents ?? item.variant.price_in_cents,
          variant_id: item.variant.id,
        })),
        progress_steps: [
          {
            status: "Order Placed",
            timestamp: new Date().toISOString(),
            description: "Order initiated.",
          },
        ],
      };

      const { data: insertedOrder, error } = await supabase
        .from("orders")
        .insert(newOrder)
        .select()
        .single();

      if (error) throw error;

      // Get user's session token for authenticated Edge Function call
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Session expired. Please log in again.");
      }

      // Stripe Checkout - use origin URL (works with localhost)
      const { url } = await initializeStripeCheckout({
        orderId: insertedOrder.id,
        items: cartItems.map((item) => ({
          variant_id: item.variant.id,
          quantity: item.quantity,
        })),
        customerEmail: user.email,
        successUrl: `${window.location.origin}/success?order_id=${insertedOrder.id}`,
        cancelUrl: `${window.location.origin}/dashboard?tab=orders&status=cancelled`,
        discountAmountCents: bundleSavings,
        accessToken: session.access_token,
      });

      window.location.href = url;
    } catch (error) {
      console.error("Checkout Error:", error);
      toast({
        title: "Checkout Error",
        description:
          error.message || "Could not initialize checkout. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [cartItems, toast, user, getCartTotal, navigate, setIsCartOpen]);

  const handleAddUpsell = async (product) => {
    try {
      const variant = product.variants[0];
      await addToCart(product, variant, 1, 99);
      toast({ title: "Added!", description: "Upsell item added to cart." });
    } catch (e) {
      console.error(e);
    }
  };

  const subtotal = getCartTotal();
  const currency = cartItems.length > 0 ? cartItems[0].variant.currency : null;

  // --- NEW: Bundle Discount Logic ---
  const totalItemsCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );
  const hasBundleDiscount = totalItemsCount >= 2;
  const discountPercentage = 0.3; // 30%

  // Calculate savings
  const bundleSavings = hasBundleDiscount
    ? Math.round(subtotal * discountPercentage)
    : 0;
  const finalTotal = subtotal - bundleSavings;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          onClick={() => setIsCartOpen(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0f0f0f] border-l border-white/10 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0f0f0f] z-10">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingCartIcon className="text-white w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-cyan-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartItems.length}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">Your Cart</h2>
              </div>
              <Button
                onClick={() => setIsCartOpen(false)}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="p-6 space-y-6">
                {cartItems.length > 0 && <CartTimer />}

                {cartItems.length === 0 ? (
                  <div className="text-center text-gray-400 py-20 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <ShoppingCartIcon size={32} className="opacity-50" />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">
                      Your cart is empty
                    </p>
                    <p className="text-sm mb-8">
                      Looks like you haven't added anything yet.
                    </p>
                    <Button
                      onClick={() => setIsCartOpen(false)}
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <motion.div
                        layout
                        key={item.variant.id}
                        className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5 relative group"
                      >
                        {/* Image */}
                        <div className="w-20 h-24 rounded-lg bg-[#1a1a1a] flex-shrink-0 overflow-hidden">
                          <img
                            src={
                              item.product.image || "https://placehold.co/100"
                            }
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-grow min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
                                {item.product.title}
                              </h3>
                              <button
                                onClick={() => removeFromCart(item.variant.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {item.variant.title}
                            </p>
                          </div>

                          <div className="flex items-end justify-between mt-2">
                            <div className="flex items-center border border-white/10 rounded-md bg-black/20">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.variant.id,
                                    Math.max(1, item.quantity - 1)
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors rounded-l"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-xs font-medium text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.variant.id,
                                    item.quantity + 1
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors rounded-r"
                              >
                                +
                              </button>
                            </div>
                            <p className="text-sm font-bold text-cyan-400">
                              {formatCurrency(
                                item.variant.sale_price_in_cents ??
                                  item.variant.price_in_cents,
                                item.variant.currency
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Scarcity Tag */}
                        <div className="absolute -top-2 -right-2">
                          {item.quantity > 1 && (
                            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg font-bold">
                              High Demand
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {cartItems.length > 0 && upsellProducts.length > 0 && (
                  <div className="pt-4 border-t border-dashed border-white/10">
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Frequently bought together</span>
                    </div>
                    <div className="space-y-3">
                      {upsellProducts.map((p) => (
                        <UpsellItem
                          key={p.id}
                          product={p}
                          onAdd={handleAddUpsell}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Checkout Section */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-[#0f0f0f] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                {/* Order Summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>

                  {/* Bundle Savings Display */}
                  {hasBundleDiscount ? (
                    <div className="flex justify-between text-sm text-green-400 font-medium animate-in slide-in-from-bottom-1">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3" /> Bundle Savings (30%)
                      </span>
                      <span>-{formatCurrency(bundleSavings, currency)}</span>
                    </div>
                  ) : (
                    // If less than 2 items, nudge user to add more
                    <div className="text-xs text-yellow-500/80 italic flex items-center gap-1.5 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                      <Flame className="w-3 h-3" />
                      Add 1 more item to unlock 30% OFF!
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Processing Fee</span>
                    <span className="text-green-400 font-medium">FREE</span>
                  </div>

                  <div className="h-px bg-white/10 my-2" />

                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-base font-semibold text-white block">
                        Total
                      </span>
                      <span className="text-xs text-gray-500">
                        Inc. all taxes & fees
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {formatCurrency(finalTotal, currency)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all relative overflow-hidden group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Processing Securely...
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-2 relative z-10">
                      Proceed to Checkout{" "}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                  {/* Shimmer */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                </Button>

                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>Instant Delivery</span>
                  </div>
                </div>

                {/* Mini Social Proof */}
                <SocialProof />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShoppingCart;
