/**
 * Stripe API Module for Starscale
 * Replaces: src/api/EcommerceApi.js (Hostinger)
 *
 * This module provides:
 * - Product fetching from Stripe via Edge Functions
 * - Checkout session creation
 * - Currency formatting utilities
 */

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ogyhuuwutoovkiqcgkmx.supabase.co";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; // Add your Supabase anon key to .env

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format price for display
 * @param {number} priceInCents - Price in smallest currency unit
 * @param {object|string} currencyInfo - Currency code or info object
 * @returns {string} Formatted price string (e.g., "€10.99")
 */
export const formatCurrency = (priceInCents, currencyInfo) => {
  if (priceInCents === null || priceInCents === undefined) return "";

  // Handle both string and object currency info
  let currencyCode = "EUR";
  if (typeof currencyInfo === "string") {
    currencyCode = currencyInfo.toUpperCase();
  } else if (currencyInfo?.code) {
    currencyCode = currencyInfo.code.toUpperCase();
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(priceInCents / 100);
};

// ============================================
// PRODUCTS API (Stripe Products via Edge Function)
// ============================================

/**
 * Fetch products from Stripe via Supabase Edge Function
 * Replaces: getProducts() from EcommerceApi.js
 *
 * @param {Object} params - Query parameters
 * @param {number} [params.limit=10] - Maximum products to return
 * @param {number} [params.offset=0] - Pagination offset
 * @returns {Promise<{count: number, products: Array}>} Products list
 */
export async function getProducts({ limit = 10, offset = 0 } = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/stripe-products?limit=${limit}&offset=${offset}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch products" }));
    throw new Error(error.message || "Failed to fetch products");
  }

  return response.json();
}

/**
 * Fetch single product from Stripe
 * Replaces: getProduct() from EcommerceApi.js
 *
 * @param {string} productId - Stripe Product ID
 * @returns {Promise<Object>} Product object with variants
 */
export async function getProduct(productId) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/stripe-products?id=${productId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Product not found" }));
    throw new Error(error.message || "Product not found");
  }

  const data = await response.json();
  return data.product || data;
}

/**
 * Get product quantities/inventory
 * Note: Stripe doesn't have native inventory tracking
 * Returns null (unlimited) for all variants
 *
 * @param {Object} params - Query parameters
 * @param {string[]} params.product_ids - Array of product IDs
 * @returns {Promise<{variants: Array}>} Variants with inventory info
 */
export async function getProductQuantities({ product_ids }) {
  // Stripe doesn't track inventory by default
  // Return unlimited stock for all variants
  return {
    variants: product_ids.map((id) => ({
      id,
      inventory_quantity: null, // Unlimited
    })),
  };
}

// ============================================
// CHECKOUT API (Stripe Checkout Session)
// ============================================

/**
 * Initialize Stripe Checkout Session
 * Replaces: initializeCheckout() from EcommerceApi.js
 *
 * @param {Object} params - Checkout parameters
 * @param {string} params.orderId - Supabase order ID
 * @param {Array} params.items - Cart items with variant_id and quantity
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.successUrl - URL after successful payment
 * @param {string} params.cancelUrl - URL if payment is cancelled
 * @param {number} [params.discountAmountCents=0] - Discount in cents (for bundle)
 * @param {Object} [params.metadata={}] - Additional metadata
 * @param {string} [params.accessToken] - User's JWT access token for authenticated requests
 * @returns {Promise<{url: string, sessionId: string}>} Checkout session
 */
export async function initializeStripeCheckout({
  orderId,
  items,
  customerEmail,
  successUrl,
  cancelUrl,
  discountAmountCents = 0,
  metadata = {},
  accessToken,
}) {
  // Use user's access token if provided, otherwise fall back to anon key
  const authToken = accessToken || SUPABASE_ANON_KEY;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      orderId,
      items,
      customerEmail,
      successUrl,
      cancelUrl,
      discountAmountCents,
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Checkout failed" }));
    throw new Error(error.message || "Checkout failed");
  }

  return response.json(); // { url, sessionId }
}

// ============================================
// LEGACY COMPATIBILITY
// Keep old function name for backward compatibility
// ============================================
export const initializeCheckout = initializeStripeCheckout;
