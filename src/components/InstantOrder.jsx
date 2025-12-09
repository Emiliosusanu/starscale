import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  ShoppingBag,
  User,
  Zap,
  Globe,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";
import { getProducts, initializeStripeCheckout } from "@/api/StripeApi";

const InstantOrder = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [storeProduct, setStoreProduct] = useState(null);
  const [storeError, setStoreError] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    platform: "",
    productUrl: "",
    reviewCount: 10,
    addons: {
      express: false,
      geoTarget: false,
    },
  });

  useEffect(() => {
    const fetchBaseProduct = async () => {
      try {
        const response = await getProducts({ limit: 5 });
        if (response.products && response.products.length > 0) {
          // Find a suitable product (ideally one with low price to allow granular quantity adjustments)
          // Using the first available product/variant as the "base unit"
          const product = response.products[0];
          const variant = product.variants[0];
          setStoreProduct({
            id: product.id,
            variantId: variant.id,
            priceInCents:
              variant.sale_price_in_cents || variant.price_in_cents || 500,
            title: product.title,
            currency: variant.currency || "USD",
          });
        } else {
          setStoreError(true);
        }
      } catch (error) {
        console.error("Failed to fetch store products:", error);
        setStoreError(true);
      }
    };
    fetchBaseProduct();
  }, []);

  useEffect(() => {
    if (user && profile) {
      setFormData((prev) => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: profile.email || prev.email,
      }));
    }
  }, [user, profile]);

  // Display prices in Dollars
  const reviewPrice = storeProduct ? storeProduct.priceInCents / 100 : 5;
  const addonPrices = {
    express: 25,
    geoTarget: 15,
  };

  // Total Cost in Dollars
  const totalCost = useMemo(() => {
    let cost = formData.reviewCount * reviewPrice;
    if (formData.addons.express) cost += addonPrices.express;
    if (formData.addons.geoTarget) cost += addonPrices.geoTarget;
    return cost;
  }, [formData.reviewCount, formData.addons, reviewPrice]);

  const handleNextStep = () => {
    if (step === 1 && (!formData.name || !formData.email)) {
      toast({
        title: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }
    if (step === 2 && (!formData.platform || !formData.productUrl)) {
      toast({
        title: "Please select a platform and enter a URL.",
        variant: "destructive",
      });
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!storeProduct && !storeError) {
      toast({
        title: "Please wait, loading store configuration...",
        variant: "default",
      });
      return;
    }

    setLoading(true);

    try {
      // Critical: Convert total cost to Cents for database and checkout
      const totalCents = Math.round(totalCost * 100);
      const unitPriceCents = storeProduct?.priceInCents || 500;

      // Calculate quantity needed to reach the total price using the base variant
      const effectiveQuantity = Math.max(
        1,
        Math.ceil(totalCents / unitPriceCents)
      );

      const orderDetails = {
        profile_id: profile?.id || null,
        name: formData.name,
        email: formData.email,
        platform: formData.platform,
        product_url: formData.productUrl,
        review_count: formData.reviewCount,
        addons: formData.addons,
        total_cost: totalCents, // Storing CENTS in the database
        payment_status: "unpaid",
        status: "pending",
        items: [
          {
            name: `Review Package (${formData.platform})`,
            variant_id: storeProduct?.variantId || "fallback-id",
            quantity: effectiveQuantity,
            display_quantity: formData.reviewCount,
            unit_price_in_cents: unitPriceCents,
            total_price_in_cents: totalCents,
          },
        ],
        progress_steps: [
          {
            status: "Order Placed",
            timestamp: new Date().toISOString(),
            description: "Your order has been placed and is awaiting payment.",
          },
        ],
      };

      const { data: insertedOrder, error } = await supabase
        .from("orders")
        .insert(orderDetails)
        .select()
        .single();

      if (error) throw error;

      // Stripe Checkout - works with localhost
      const { url } = await initializeStripeCheckout({
        orderId: insertedOrder.id,
        items: [
          {
            variant_id: storeProduct?.variantId,
            quantity: effectiveQuantity,
          },
        ],
        customerEmail: formData.email,
        successUrl: `${window.location.origin}/success?order_id=${insertedOrder.id}`,
        cancelUrl: `${window.location.origin}/dashboard?tab=orders&status=cancelled`,
        discountAmountCents: 0,
      });

      window.location.href = url;
    } catch (checkoutError) {
      setLoading(false);
      console.error(checkoutError);
      toast({
        title: "Order Creation Error",
        description:
          checkoutError.message ||
          "There was a problem creating your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, platform: value }));
  };

  const handleAddonChange = (addon) => {
    setFormData((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        [addon]: !prev.addons[addon],
      },
    }));
  };

  return (
    <section id="buy-now" className="py-24 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="accent-gradient-text">Buy Reviews</span>{" "}
            <span className="text-white">Without an Account.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Need a quick boost? Place an order in minutes. No registration
            required.
          </p>
        </motion.div>

        <div className="glass-card rounded-3xl p-4 sm:p-8 md:p-12">
          <div className="flex justify-between items-start mb-8 text-xs sm:text-sm">
            <div
              className={`flex-1 text-center transition-colors duration-300 ${
                step >= 1 ? "text-cyan-400" : "text-gray-500"
              }`}
            >
              <User className="mx-auto mb-2 w-6 h-6 sm:w-8 sm:h-8" />
              <p className="font-semibold">Contact</p>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-gray-600 mt-4 sm:mt-5"></div>
            <div
              className={`flex-1 text-center transition-colors duration-300 ${
                step >= 2 ? "text-cyan-400" : "text-gray-500"
              }`}
            >
              <ShoppingBag className="mx-auto mb-2 w-6 h-6 sm:w-8 sm:h-8" />
              <p className="font-semibold">Order</p>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-gray-600 mt-4 sm:mt-5"></div>
            <div
              className={`flex-1 text-center transition-colors duration-300 ${
                step >= 3 ? "text-cyan-400" : "text-gray-500"
              }`}
            >
              <CreditCard className="mx-auto mb-2 w-6 h-6 sm:w-8 sm:h-8" />
              <p className="font-semibold">Summary</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-center text-white">
                  Step 1: Your Contact Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="bg-white/5 border-white/10 text-white focus:ring-cyan-400"
                      disabled={!!user}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="bg-white/5 border-white/10 text-white focus:ring-cyan-400"
                      disabled={!!user}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleNextStep}
                  className="w-full bg-white text-black hover:bg-gray-200 py-3 shimmer-button relative overflow-hidden"
                >
                  Next: Order Details
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-center text-white">
                  Step 2: Order Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="platform" className="text-gray-300">
                      Platform
                    </Label>
                    <Select
                      onValueChange={handleSelectChange}
                      value={formData.platform}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-cyan-400">
                        <SelectValue placeholder="Select a platform..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Maps</SelectItem>
                        <SelectItem value="amazon">Amazon</SelectItem>
                        <SelectItem value="trustpilot">Trustpilot</SelectItem>
                        <SelectItem value="fiverr">Fiverr</SelectItem>
                        <SelectItem value="yelp">Yelp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="productUrl" className="text-gray-300">
                      Product/Service URL
                    </Label>
                    <Input
                      id="productUrl"
                      name="productUrl"
                      value={formData.productUrl}
                      onChange={handleChange}
                      placeholder="https://www.amazon.com/dp/your-product"
                      className="bg-white/5 border-white/10 text-white focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewCount" className="text-gray-300">
                      Number of Reviews:{" "}
                      <span className="text-cyan-400 font-bold">
                        {formData.reviewCount}
                      </span>
                    </Label>
                    <Input
                      id="reviewCount"
                      name="reviewCount"
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={formData.reviewCount}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Power-ups</Label>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <Checkbox
                          id="express"
                          checked={formData.addons.express}
                          onCheckedChange={() => handleAddonChange("express")}
                        />
                        <Label
                          htmlFor="express"
                          className="flex items-center cursor-pointer"
                        >
                          <Zap className="w-5 h-5 text-yellow-400 mr-2" />{" "}
                          Express Delivery (+${addonPrices.express})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <Checkbox
                          id="geoTarget"
                          checked={formData.addons.geoTarget}
                          onCheckedChange={() => handleAddonChange("geoTarget")}
                        />
                        <Label
                          htmlFor="geoTarget"
                          className="flex items-center cursor-pointer"
                        >
                          <Globe className="w-5 h-5 text-green-400 mr-2" />{" "}
                          Geo-Targeted Reviewers (+${addonPrices.geoTarget})
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="w-full bg-white text-black hover:bg-gray-200 py-3 shimmer-button relative overflow-hidden"
                  >
                    Next: Summary
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-center text-white">
                  Step 3: Confirm Order
                </h3>

                {storeError && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center gap-3 text-red-200">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">
                      Warning: Could not load store configuration. Payment might
                      fail. Please try again later.
                    </p>
                  </div>
                )}

                <div className="glass-card rounded-xl p-6 border-cyan-400/30">
                  <h4 className="font-bold text-lg text-white mb-4">
                    Order Summary
                  </h4>
                  <div className="space-y-3 text-gray-300">
                    <div className="flex justify-between">
                      <span>Platform:</span>{" "}
                      <span className="font-semibold capitalize text-white">
                        {formData.platform}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Reviews ({formData.reviewCount}):</span>{" "}
                      <span className="font-semibold text-white">
                        ${(formData.reviewCount * reviewPrice).toFixed(2)}
                      </span>
                    </div>
                    {formData.addons.express && (
                      <div className="flex justify-between text-yellow-400">
                        <span>Express Delivery:</span>{" "}
                        <span className="font-semibold">
                          ${addonPrices.express}
                        </span>
                      </div>
                    )}
                    {formData.addons.geoTarget && (
                      <div className="flex justify-between text-green-400">
                        <span>Geo-Targeting:</span>{" "}
                        <span className="font-semibold">
                          ${addonPrices.geoTarget}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-gray-600 my-2"></div>
                    <div className="flex justify-between text-2xl font-bold text-white mt-2">
                      <span>Total:</span> <span>${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-cyan-500 text-white hover:bg-cyan-600 py-4 font-bold text-lg pulse-glow shimmer-button relative overflow-hidden"
                  disabled={loading || storeError}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    `Confirm Order for $${totalCost.toFixed(2)}`
                  )}
                </Button>
                <Button
                  onClick={handlePrevStep}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                  disabled={loading}
                >
                  Go Back
                </Button>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default InstantOrder;
