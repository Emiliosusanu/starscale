import React, { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Loader2,
  PackageSearch,
  Star,
  Flame,
  Clock,
  Check,
  ShieldCheck,
  Eye,
  Zap,
  Users,
  Trophy,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/use-toast";
import {
  getProducts,
  getProductQuantities,
  formatCurrency,
} from "@/api/StripeApi";

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

// Extended marketing data helper
const getMarketingData = (productId) => {
  const seed = productId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return {
    views: 15 + (seed % 40),
    rating: (4.7 + (seed % 3) / 10).toFixed(1),
    reviews: 120 + (seed % 500),
    sold: 850 + ((seed * 5) % 2000),
    badge: ["Best Seller", "High Demand", "Selling Fast"][seed % 3],
    stockLeft: 3 + (seed % 12), // Random low stock number
    recentSales: 2 + (seed % 8), // Sold in last hour
  };
};

const UrgencyTimer = () => {
  // Initialize with a time between 10 and 15 minutes for session urgency
  const [timeLeft, setTimeLeft] = useState(
    () => 600 + Math.floor(Math.random() * 300)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0)
    return (
      <span className="text-red-500 font-bold text-xs">Offer Expired</span>
    );

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 animate-in fade-in">
      <Clock className="w-3 h-3 animate-pulse" />
      <span>
        Deal ends in {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
};

const ProductCard = ({ product, index }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const displayVariant = useMemo(
    () => (product.variants ? product.variants[0] : null),
    [product]
  );

  // Price Calculations
  const regularPrice = displayVariant?.price_in_cents || 0;
  const salePrice = displayVariant?.sale_price_in_cents;
  const hasSale =
    salePrice !== null && salePrice !== undefined && salePrice < regularPrice;

  const currentPriceCents = hasSale ? salePrice : regularPrice;
  const originalPriceCents = regularPrice;

  const savingsPercent =
    hasSale && originalPriceCents > 0
      ? Math.round(
          ((originalPriceCents - currentPriceCents) / originalPriceCents) * 100
        )
      : 0;

  const marketing = useMemo(() => getMarketingData(product.id), [product.id]);

  // Use features from Stripe marketing_features, fallback to defaults if not set
  const defaultBenefits = [
    "Instant Activation & Access",
    "24/7 Priority VIP Support",
    "Lifetime Updates Included",
    "Commercial License",
  ];
  const benefits =
    product.features?.length > 0 ? product.features : defaultBenefits;

  const handleAddToCart = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!displayVariant) return;

      if (product.variants.length > 1) {
        navigate(`/product/${product.id}`);
        return;
      }

      try {
        await addToCart(
          product,
          displayVariant,
          1,
          displayVariant.inventory_quantity
        );
        toast({
          title: "Secure Access Reserved! 🔒",
          description: `${product.title} has been added to your cart.`,
        });
      } catch (error) {
        toast({
          title: "Error adding to cart",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [product, displayVariant, addToCart, toast, navigate]
  );

  // Early return moved AFTER all hooks are called
  if (!displayVariant) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative flex flex-col h-full
        rounded-3xl overflow-hidden
        bg-[#0f0f0f] border 
        ${
          product.ribbon_text === "Best Seller"
            ? "border-cyan-500/40 shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)]"
            : "border-white/10"
        }
        hover:border-cyan-500/50 hover:shadow-[0_0_50px_-12px_rgba(6,182,212,0.25)]
        transition-all duration-500 group
      `}
    >
      {/* Header Badges */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
        {product.ribbon_text && (
          <span
            className={`
            px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xl backdrop-blur-md border
            ${
              product.ribbon_text === "Best Seller"
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black border-orange-400"
                : product.ribbon_text === "Best Value"
                ? "bg-gradient-to-r from-emerald-400 to-green-500 text-black border-green-400"
                : "bg-cyan-500 text-black border-cyan-400"
            }
          `}
          >
            {product.ribbon_text}
          </span>
        )}
        {hasSale && (
          <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold shadow-xl border border-red-500 animate-pulse">
            SAVE {savingsPercent}%
          </span>
        )}
      </div>

      {/* Image Area */}
      <div className="relative h-56 overflow-hidden bg-gray-900 group-hover:opacity-90 transition-opacity">
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={product.image || placeholderImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent opacity-90" />
        </Link>

        {/* Viewers Count */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-cyan-300 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
            <Eye className="w-3 h-3 animate-pulse" />
            <span>{marketing.views} people viewing</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-grow flex flex-col relative">
        {/* Title & Rating */}
        <div className="mb-3">
          <div className="flex justify-between items-start gap-2 mb-1">
            <Link
              to={`/product/${product.id}`}
              className="group-hover:text-cyan-400 transition-colors"
            >
              <h3 className="text-lg font-bold text-white leading-tight">
                {product.title}
              </h3>
            </Link>
            <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-white">
                {marketing.rating}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {marketing.sold} sold
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>{marketing.reviews} reviews</span>
          </div>
        </div>

        {/* Stock Urgency Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-[10px] font-semibold mb-1">
            <span className="text-orange-400 flex items-center gap-1">
              <Flame className="w-3 h-3 fill-orange-400" /> Selling Fast
            </span>
            <span className="text-gray-400">
              Only {marketing.stockLeft} left
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              style={{ width: `${(marketing.stockLeft / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Benefits */}
        <ul className="space-y-2 mb-6">
          {benefits.map((benefit, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs text-gray-300"
            >
              <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5 stroke-[3px]" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          {/* Price Section */}
          <div className="flex items-end justify-between mb-4 p-3 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                Total Price
              </span>
              <div className="flex items-baseline gap-2">
                {hasSale && (
                  <span className="text-xs text-gray-500 line-through decoration-red-500/50 decoration-2">
                    {formatCurrency(
                      originalPriceCents,
                      displayVariant.currency
                    )}
                  </span>
                )}
                <span className="text-2xl font-extrabold text-white tracking-tight animate-[pulse_3s_infinite]">
                  {formatCurrency(currentPriceCents, displayVariant.currency)}
                </span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <UrgencyTimer />
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleAddToCart}
            className={`w-full h-14 text-base font-bold relative overflow-hidden transition-all duration-300 rounded-xl
                    ${
                      isHovered
                        ? "shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-[1.02]"
                        : "shadow-lg"
                    }
                    bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-white/10
                `}
          >
            <div className="relative z-10 flex flex-col items-center leading-none py-1">
              <span className="flex items-center gap-2 uppercase tracking-wide">
                Secure Access Now <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-normal opacity-80 mt-1">
                Instant Digital Delivery
              </span>
            </div>

            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent z-0" />
          </Button>

          {/* Risk Reversal Footer */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-gray-400 bg-black/20 py-2 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              <span>60-Day Money Back</span>
            </div>
            <div className="w-px h-3 bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-gray-400" />
              <span>SSL Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProductsWithQuantities = async () => {
      try {
        setLoading(true);
        setError(null);

        const productsResponse = await getProducts();

        // Safe navigation for products array
        if (
          !productsResponse ||
          !productsResponse.products ||
          productsResponse.products.length === 0
        ) {
          if (isMounted) setProducts([]);
          return;
        }

        const productsList = productsResponse.products;
        const productIds = productsList.map((product) => product.id);

        // Fetch quantities in parallel but don't crash if it fails
        let variantQuantityMap = new Map();
        try {
          const quantitiesResponse = await getProductQuantities({
            product_ids: productIds,
          });

          if (quantitiesResponse?.variants) {
            quantitiesResponse.variants.forEach((variant) => {
              variantQuantityMap.set(variant.id, variant.inventory_quantity);
            });
          }
        } catch (qtyError) {
          console.warn(
            "Inventory fetch failed, proceeding with default stock info",
            qtyError
          );
        }

        const productsWithQuantities = productsList.map((product) => ({
          ...product,
          variants: (product.variants || []).map((variant) => ({
            ...variant,
            inventory_quantity:
              variantQuantityMap.get(variant.id) ?? variant.inventory_quantity,
          })),
        }));

        if (isMounted) setProducts(productsWithQuantities);
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load products");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductsWithQuantities();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
          <p className="text-gray-400 animate-pulse">
            Loading premium opportunities...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 p-8 bg-[#121212] rounded-xl border border-red-500/20 shadow-lg">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Connection Error
        </h3>
        <p>
          We couldn't load the products at this moment. Please try again later.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-400 p-16 bg-[#121212] rounded-xl flex flex-col items-center gap-6 border border-white/5">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
          <PackageSearch className="w-12 h-12 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Store Inventory Updating
          </h3>
          <p className="max-w-md mx-auto">
            We're currently restocking our digital shelves. Check back in a few
            minutes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
};

export default ProductsList;
