// Supabase Edge Function: Stripe Products
// Fetches products from Stripe and transforms to frontend format

// deno-lint-ignore-file
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('id');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (productId) {
      // Single product fetch
      const product = await stripe.products.retrieve(productId, {
        expand: ['default_price'],
      });
      
      const prices = await stripe.prices.list({ 
        product: productId, 
        active: true,
        limit: 100,
      });
      
      return new Response(JSON.stringify({
        product: transformProduct(product, prices.data),
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get optional category filter from query params
    const category = url.searchParams.get('category') || 'starscale';
    
    // List all products (Stripe doesn't support metadata filtering, so we fetch and filter)
    const products = await stripe.products.list({ 
      active: true, 
      limit: 100, // Fetch more to account for filtering
      expand: ['data.default_price'],
    });

    // Filter products by category metadata
    const filteredProducts = products.data.filter((product: any) => 
      product.metadata?.category === category
    );

    // Sort by order metadata (ascending: 1, 2, 3)
    const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
      const orderA = parseInt(a.metadata?.order || '999');
      const orderB = parseInt(b.metadata?.order || '999');
      return orderA - orderB;
    });

    // Apply limit after filtering and sorting
    const limitedProducts = sortedProducts.slice(0, limit);

    // Fetch prices for each filtered product
    const productsWithPrices = await Promise.all(
      limitedProducts.map(async (product: any) => {
        const prices = await stripe.prices.list({ 
          product: product.id, 
          active: true,
          limit: 100,
        });
        return transformProduct(product, prices.data);
      })
    );

    return new Response(JSON.stringify({
      count: filteredProducts.length,
      offset: 0,
      limit,
      products: productsWithPrices,
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Stripe Products Error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Failed to fetch products' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Transform Stripe Product to match frontend format
 */
function transformProduct(product: any, prices: any[]) {
  const sortedPrices = [...prices].sort((a, b) => 
    (a.unit_amount || 0) - (b.unit_amount || 0)
  );

  // Extract marketing features from Stripe product
  const features = product.marketing_features?.map((f: any) => f.name) || [];

  return {
    id: product.id,
    title: product.name,
    subtitle: product.metadata?.subtitle || null,
    description: product.description || product.metadata?.description || '',
    ribbon_text: product.metadata?.ribbon_text || null,
    image: product.images?.[0] || null,
    images: product.images?.map((url: string, i: number) => ({ 
      url, 
      order: i,
      type: 'image',
    })) || [],
    purchasable: product.active,
    order: parseInt(product.metadata?.order || '0'),
    site_product_selection: 'lowest_price_first',
    features, // Marketing features from Stripe
    variants: sortedPrices.map((price: any) => ({
      id: price.id,
      title: price.nickname || 'Default',
      image_url: null,
      sku: price.metadata?.sku || null,
      price_in_cents: price.unit_amount || 0,
      sale_price_in_cents: price.metadata?.sale_price 
        ? parseInt(price.metadata.sale_price) 
        : null,
      currency: price.currency.toUpperCase(),
      currency_info: { 
        code: price.currency.toUpperCase(),
        symbol: getCurrencySymbol(price.currency),
      },
      price_formatted: formatPrice(price.unit_amount || 0, price.currency),
      sale_price_formatted: price.metadata?.sale_price 
        ? formatPrice(parseInt(price.metadata.sale_price), price.currency)
        : null,
      manage_inventory: false,
      weight: null,
      options: [],
      inventory_quantity: null,
    })),
    options: [],
    collections: [],
    additional_info: product.metadata?.additional_info 
      ? JSON.parse(product.metadata.additional_info) 
      : [],
    type: { value: product.metadata?.type || 'physical' },
    custom_fields: [],
    related_products: [],
    updated_at: new Date(product.updated * 1000).toISOString(),
  };
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = { 'eur': '€', 'usd': '$', 'gbp': '£' };
  return symbols[currency.toLowerCase()] || currency.toUpperCase();
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
