import React, { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProduct,
  getProductQuantities,
  getProducts,
  formatCurrency,
} from "@/api/StripeApi";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/use-toast";
import {
  ShoppingCart,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Minus,
  Plus,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  ShieldCheck,
  Truck,
  Lock,
  Zap,
  Award,
  ThumbsUp,
  ZoomIn,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

const benefits = [
  { icon: Zap, text: "Instant Delivery" },
  { icon: Award, text: "Premium Quality" },
  { icon: ShieldCheck, text: "Lifetime Warranty" },
  { icon: ThumbsUp, text: "Satisfaction Guaranteed" },
];

const mockReviews = [
  {
    id: 1,
    name: "Alex Thompson",
    rating: 5,
    date: "2 days ago",
    text: "Absolutely amazing service! The delivery was instant and the quality exceeded my expectations.",
    avatar: "",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    rating: 5,
    date: "1 week ago",
    text: "Best purchase I've made this year. Customer support was also very helpful with my questions.",
    avatar: "",
  },
  {
    id: 3,
    name: "Michael Chen",
    rating: 4,
    date: "2 weeks ago",
    text: "Great product, works exactly as described. Would definitely recommend to others.",
    avatar: "",
  },
];

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const imageContainerRef = useRef(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = useCallback(async () => {
    if (product && selectedVariant) {
      const availableQuantity = selectedVariant.inventory_quantity;
      try {
        await addToCart(product, selectedVariant, quantity, availableQuantity);
        toast({
          title: "Added to Cart! 🛒",
          description: `${quantity} x ${product.title} added successfully.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Could not add to cart",
          description: error.message,
        });
      }
    }
  }, [product, selectedVariant, quantity, addToCart, toast]);

  const handleQuantityChange = useCallback(
    (amount) => {
      setQuantity((prevQuantity) => {
        const newQuantity = prevQuantity + amount;
        if (newQuantity < 1) return 1;
        if (
          selectedVariant?.manage_inventory &&
          newQuantity > selectedVariant.inventory_quantity
        )
          return prevQuantity;
        return newQuantity;
      });
    },
    [selectedVariant]
  );

  const handlePrevImage = useCallback(() => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  }, [product?.images?.length]);

  const handleNextImage = useCallback(() => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  }, [product?.images?.length]);

  const handleVariantSelect = useCallback(
    (variant) => {
      setSelectedVariant(variant);
      setQuantity(1); // Reset quantity on variant change

      if (variant.image_url && product?.images?.length > 0) {
        const imageIndex = product.images.findIndex(
          (image) => image.url === variant.image_url
        );

        if (imageIndex !== -1) {
          setCurrentImageIndex(imageIndex);
        }
      }
    },
    [product?.images]
  );

  const handleMouseMove = (e) => {
    if (!imageContainerRef.current || !isZoomed) return;
    const { left, top, width, height } =
      imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    imageContainerRef.current.style.setProperty("--zoom-x", `${x}%`);
    imageContainerRef.current.style.setProperty("--zoom-y", `${y}%`);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Main Product
        let fetchedProduct;
        try {
          fetchedProduct = await getProduct(id);
          if (!fetchedProduct) throw new Error("Product not found");
        } catch (err) {
          throw new Error(err.message || "Product could not be loaded");
        }

        if (!isMounted) return;

        // 2. Fetch Related Products (Safely)
        try {
          const allProductsResponse = await getProducts({ limit: 4 });
          // Ensure we are reading the 'products' array safely
          const productsList = allProductsResponse?.products || [];

          if (isMounted) {
            setRelatedProducts(
              productsList
                .filter((p) => p && p.id !== fetchedProduct.id)
                .slice(0, 3)
            );
          }
        } catch (relatedError) {
          console.warn("Failed to fetch related products:", relatedError);
          // Don't block main product load if related fails
        }

        // 3. Fetch Inventory/Quantities
        try {
          const quantitiesResponse = await getProductQuantities({
            fields: "inventory_quantity",
            product_ids: [fetchedProduct.id],
          });

          const variantQuantityMap = new Map();
          if (quantitiesResponse?.variants) {
            quantitiesResponse.variants.forEach((variant) => {
              variantQuantityMap.set(variant.id, variant.inventory_quantity);
            });
          }

          const productWithQuantities = {
            ...fetchedProduct,
            variants: (fetchedProduct.variants || []).map((variant) => ({
              ...variant,
              inventory_quantity:
                variantQuantityMap.get(variant.id) ??
                variant.inventory_quantity,
            })),
          };

          if (isMounted) {
            setProduct(productWithQuantities);
            if (
              productWithQuantities.variants &&
              productWithQuantities.variants.length > 0
            ) {
              setSelectedVariant(productWithQuantities.variants[0]);
            }
          }
        } catch (quantityError) {
          console.warn("Failed to fetch quantities:", quantityError);
          // Fallback: use product without real-time stock
          if (isMounted) {
            setProduct(fetchedProduct);
            if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
              setSelectedVariant(fetchedProduct.variants[0]);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load product");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProductData();
    window.scrollTo(0, 0);

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#0A0A0A]">
        <Loader2 className="h-16 w-16 text-cyan-400 animate-spin mb-4" />
        <p className="text-gray-400 animate-pulse">
          Loading premium experience...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-24 px-6 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-[#121212] border border-red-500/20 rounded-3xl p-10 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-400 mb-8">
              {error
                ? `Error: ${error}`
                : "We couldn't locate the product you're looking for."}
            </p>
            <Button
              onClick={() => navigate("/store")}
              className="w-full bg-[#1A1A1A] hover:bg-[#252525] text-white border border-white/10 h-12 rounded-xl font-medium"
            >
              Return to Store
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Use helper for price consistency
  const price = selectedVariant
    ? formatCurrency(
        selectedVariant.sale_price_in_cents ?? selectedVariant.price_in_cents,
        selectedVariant.currency
      )
    : "";

  const originalPrice = selectedVariant?.sale_price_in_cents
    ? formatCurrency(selectedVariant.price_in_cents, selectedVariant.currency)
    : null;

  const availableStock = selectedVariant
    ? selectedVariant.inventory_quantity
    : 0;
  const isStockManaged = selectedVariant?.manage_inventory ?? false;
  const canAddToCart = !isStockManaged || availableStock > 0;

  const currentImage = product.images && product.images[currentImageIndex];
  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <>
      <Helmet>
        <title>{product.title} | Starscale Premium</title>
        <meta
          name="description"
          content={product.description?.substring(0, 160) || product.title}
        />
      </Helmet>

      <div className="min-h-screen bg-[#0A0A0A] text-gray-100 pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          {/* Breadcrumb / Back */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link to="/store" className="hover:text-cyan-400 transition-colors">
              Store
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-300 truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Product Gallery Section */}
            <div className="lg:col-span-7 space-y-6">
              <div
                className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-[#121212] group cursor-zoom-in"
                ref={imageContainerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                style={{
                  "--zoom-x": "50%",
                  "--zoom-y": "50%",
                }}
              >
                {product.ribbon_text && (
                  <div className="absolute top-6 left-6 z-20 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                    {product.ribbon_text}
                  </div>
                )}

                <img
                  src={!currentImage?.url ? placeholderImage : currentImage.url}
                  alt={product.title}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isZoomed
                      ? "scale-150 origin-[var(--zoom-x)_var(--zoom-y)]"
                      : "scale-100"
                  }`}
                />

                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-3xl z-10"></div>

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10 z-20"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10 z-20"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-none z-20 flex items-center gap-1">
                      <ZoomIn className="w-3 h-3" /> Hover to Zoom
                    </div>
                  </>
                )}
              </div>

              {hasMultipleImages && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-cyan-500 ring-2 ring-cyan-500/20"
                          : "border-transparent opacity-60 hover:opacity-100 hover:border-white/20"
                      }`}
                    >
                      <img
                        src={!image.url ? placeholderImage : image.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">(128 Reviews)</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight leading-tight">
                  {product.title}
                </h1>
                <p className="text-lg text-gray-400 leading-relaxed">
                  {product.subtitle ||
                    "Experience premium quality and exceptional performance."}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-4xl font-bold text-white">{price}</span>
                  {originalPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through decoration-red-500/50">
                        {originalPrice}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                        SAVE{" "}
                        {Math.round(
                          (1 -
                            selectedVariant.sale_price_in_cents /
                              selectedVariant.price_in_cents) *
                            100
                        )}
                        %
                      </span>
                    </>
                  )}
                </div>

                {product.variants && product.variants.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Select Option
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantSelect(variant)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                            selectedVariant?.id === variant.id
                              ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                              : "bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {variant.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {canAddToCart ? (
                    <div className="flex gap-4">
                      <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-2 h-14">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          className="p-2 hover:text-cyan-400 text-gray-400 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-semibold text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          className="p-2 hover:text-cyan-400 text-gray-400 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <Button
                        onClick={handleAddToCart}
                        className="flex-1 h-14 text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <ShoppingCart className="mr-2 w-5 h-5" /> Add to Cart
                      </Button>
                    </div>
                  ) : (
                    <Button
                      disabled
                      className="w-full h-14 text-lg font-bold bg-gray-800 text-gray-400 rounded-xl border border-white/5 cursor-not-allowed"
                    >
                      Out of Stock
                    </Button>
                  )}

                  {/* Stock Status */}
                  <div className="flex items-center justify-center gap-2 text-sm">
                    {isStockManaged && canAddToCart && (
                      <span className="text-green-400 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        {availableStock <= 5
                          ? `Hurry! Only ${availableStock} left in stock`
                          : "In Stock & Ready to Ship"}
                      </span>
                    )}
                    {!canAddToCart && (
                      <span className="text-red-400 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" /> Currently Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Fast Delivery
                    </h4>
                    <p className="text-xs text-gray-500">2-3 business days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Secure Checkout
                    </h4>
                    <p className="text-xs text-gray-500">SSL Encrypted</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Quality Guarantee
                    </h4>
                    <p className="text-xs text-gray-500">Verified Authentic</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Privacy First
                    </h4>
                    <p className="text-xs text-gray-500">Data Protection</p>
                  </div>
                </div>
              </div>

              {/* Benefits List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Why choose this?
                </h3>
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <benefit.icon className="w-5 h-5 text-cyan-500" />
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details & Reviews Tabs Section */}
          <div className="mt-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  Description
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </h2>
                <div
                  className="prose prose-invert prose-lg max-w-none text-gray-300"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </section>

              {/* Additional Info / Specs */}
              {product.additional_info?.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    Specifications
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {product.additional_info
                      .sort((a, b) => a.order - b.order)
                      .map((info) => (
                        <div
                          key={info.id}
                          className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
                        >
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {info.title}
                          </h3>
                          <div
                            className="prose prose-invert prose-sm text-gray-400"
                            dangerouslySetInnerHTML={{
                              __html: info.description,
                            }}
                          />
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* Reviews */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  Customer Reviews
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </h2>
                <div className="space-y-6">
                  {mockReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-[#121212] border border-white/5 rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-cyan-900 text-cyan-200 font-bold">
                              {review.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-white">
                              {review.name}
                            </h4>
                            <div className="flex text-yellow-400 text-xs">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-3 h-3 fill-current"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {review.date}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        "{review.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Related Products Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6">
                  You might also like
                </h3>
                <div className="space-y-4">
                  {relatedProducts.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-white/10 text-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">More products coming soon.</p>
                    </div>
                  ) : (
                    relatedProducts.map((rp) => (
                      <Link
                        to={`/product/${rp.id}`}
                        key={rp.id}
                        className="flex gap-4 group bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/20 transition-all hover:bg-white/10"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#1A1A1A] flex-shrink-0">
                          <img
                            src={rp.images?.[0]?.url || placeholderImage}
                            alt={rp.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-cyan-400 transition-colors">
                            {rp.title}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {formatCurrency(
                              rp.variants?.[0]?.sale_price_in_cents ??
                                rp.variants?.[0]?.price_in_cents ??
                                0,
                              rp.variants?.[0]?.currency || "EUR"
                            )}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;
