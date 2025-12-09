import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Package, Rocket, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { initializeStripeCheckout, getProducts } from "@/api/StripeApi";
import { supabase } from "@/lib/customSupabaseClient";

const packages = [
  {
    id: "pack_launchpad",
    name: "Launchpad Pack",
    icon: Rocket,
    price: 199,
    description: "Everything a new product needs to start strong.",
    features: [
      "25 Reviews on One Platform",
      "Geo-Targeted Reviewers",
      "7-Day Drip Delivery",
    ],
    popular: false,
  },
  {
    id: "pack_reputation",
    name: "Reputation Boost",
    icon: TrendingUp,
    price: 499,
    description: "For established products needing a significant lift.",
    features: [
      "50 Reviews across Two Platforms",
      "Express Delivery (24h start)",
      "Photo/Video Reviews Add-on",
      "Negative Review Suppression",
    ],
    popular: true,
  },
  {
    id: "pack_agency",
    name: "Agency Pro",
    icon: Package,
    price: 999, // Updated to be purchasable based on user feedback
    description: "A monthly retainer for agencies managing multiple clients.",
    features: [
      "Bulk Review Credits (discounted)",
      "Dedicated Account Manager",
      "White-label Reporting",
      "Priority Support",
    ],
    popular: false,
  },
];

const ServicePackages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [loadingPackage, setLoadingPackage] = useState(null);
  const [baseVariant, setBaseVariant] = useState(null);

  // Fetch a base product to enable checkout with variant_id
  useEffect(() => {
    const fetchBase = async () => {
      try {
        const res = await getProducts({ limit: 1 });
        if (res.products?.[0]?.variants?.[0]) {
          setBaseVariant(res.products[0].variants[0]);
        }
      } catch (err) {
        console.error("Failed to load base checkout config", err);
      }
    };
    fetchBase();
  }, []);

  const handlePurchase = async (pkg) => {
    if (pkg.price === "Custom") {
      toast({ title: "Please contact us to discuss custom plans." });
      navigate("/dashboard");
      return;
    }

    if (!user) {
      toast({
        title: "Please log in to purchase a package.",
        description: "You will be redirected to the login page.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!baseVariant) {
      toast({ title: "System initializing, please try again in a moment." });
      return;
    }

    setLoadingPackage(pkg.id);

    try {
      const priceInCents = pkg.price * 100;

      // Create order locally first to ensure correct price recording (CENTS)
      const orderData = {
        profile_id: user.id,
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
        platform: "Service Package",
        product_url: `/store#packages`,
        review_count: 1,
        total_cost: priceInCents, // Saving CENTS to DB
        payment_status: "unpaid",
        status: "pending",
        items: [
          {
            name: pkg.name,
            variant_id: baseVariant.id, // Required for checkout
            quantity: 1,
            price_in_cents: priceInCents,
            features: pkg.features,
          },
        ],
        progress_steps: [
          {
            status: "Order Placed",
            timestamp: new Date().toISOString(),
            description: `Package ${pkg.name} initiated.`,
          },
        ],
      };

      const { data: insertedOrder, error } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Hack: Calculate quantity to match package price using base variant price
      // This ensures the checkout total matches the package price
      const basePrice =
        baseVariant.sale_price_in_cents || baseVariant.price_in_cents || 100;
      const quantity = Math.ceil(priceInCents / basePrice);

      // Stripe Checkout - works with localhost
      const { url } = await initializeStripeCheckout({
        orderId: insertedOrder.id,
        items: [
          {
            variant_id: baseVariant.id,
            quantity: quantity,
          },
        ],
        customerEmail: user.email,
        successUrl: `${window.location.origin}/success?order_id=${insertedOrder.id}`,
        cancelUrl: window.location.origin,
        discountAmountCents: 0,
      });

      window.location.href = url;
    } catch (checkoutError) {
      setLoadingPackage(null);
      console.error(checkoutError);
      toast({
        title: "Checkout Error",
        description:
          checkoutError.message ||
          "There was a problem preparing your checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="packages" className="py-24 px-6 bg-black/20">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="text-white">Supercharge Your Growth with</span>{" "}
            <span className="accent-gradient-text">Power-Up Packs.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Get the best value with our curated service packages designed for
            maximum impact.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                ease: "circOut",
              }}
              className={`product-card glass-card rounded-3xl p-8 flex flex-col ${
                pkg.popular ? "border-cyan-400/50" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                    Best Value
                  </div>
                </div>
              )}

              <div className="flex-grow">
                <div className="text-center mb-8">
                  <pkg.icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-gray-400 mb-6 h-12">{pkg.description}</p>
                  <div className="mb-4">
                    <span className="text-5xl font-extrabold text-white tracking-tight">
                      {typeof pkg.price === "number"
                        ? `$${pkg.price}`
                        : pkg.price}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loadingPackage === pkg.id}
                  className={`w-full py-4 rounded-xl font-bold text-lg shimmer-button relative overflow-hidden ${
                    pkg.popular
                      ? "bg-white text-black hover:bg-gray-200 pulse-glow"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {loadingPackage === pkg.id ? (
                    <Loader2 className="animate-spin" />
                  ) : pkg.price === "Custom" ? (
                    "Contact Sales"
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicePackages;
