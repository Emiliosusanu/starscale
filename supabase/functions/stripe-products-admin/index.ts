// Supabase Edge Function: Admin Stripe Products Management
// Allows authenticated admins to update product details and pricing in Stripe.

// deno-lint-ignore-file
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // Allow headers used by supabase-js when invoking edge functions
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const authHeader = req.headers.get('Authorization') ?? '';

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, productId, payload } = body || {};

    if (action !== 'update_product' || !productId || !payload) {
      return new Response(JSON.stringify({ error: 'Invalid request payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      name,
      description,
      image,
      subtitle,
      ribbon_text,
      price_id,
      unit_amount,
      sale_price_in_cents,
      features,
    } = payload;

    // 1) Update core product fields
    const productUpdate: Record<string, unknown> = {};

    if (typeof name === 'string') productUpdate.name = name;
    if (typeof description === 'string') productUpdate.description = description;

    // Image handling: Stripe expects real URLs for product images.
    // - If the field is empty: clear images.
    // - If it's an http/https URL: set as the sole image.
    // - For anything else (e.g. base64 data URL): ignore to avoid 500 from Stripe.
    if (typeof image === 'string') {
      const trimmed = image.trim();
      if (!trimmed) {
        productUpdate.images = [];
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        productUpdate.images = [trimmed];
      }
    }

    // Metadata merge for subtitle / ribbon / feature bullets
    const currentProduct = await stripe.products.retrieve(productId);
    const existingMetadata = (currentProduct as any).metadata || {};

    const newMetadata: Record<string, string> = { ...existingMetadata };
    if (typeof subtitle === 'string') newMetadata.subtitle = subtitle;
    if (typeof ribbon_text === 'string') newMetadata.ribbon_text = ribbon_text;

    let cleanedFeatures: string[] | undefined;
    if (Array.isArray(features)) {
      cleanedFeatures = features
        .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
    }

    if (cleanedFeatures && cleanedFeatures.length) {
      newMetadata.features_json = JSON.stringify(cleanedFeatures);
    } else {
      // If no features provided, clear stored specs so storefront can fall back gracefully
      if ('features_json' in newMetadata) {
        delete newMetadata.features_json;
      }
    }

    productUpdate.metadata = newMetadata;

    // Optional: also sync Stripe marketing_features for compatibility
    let marketingFeatures: Array<{ name: string }> | undefined;
    if (cleanedFeatures && cleanedFeatures.length) {
      marketingFeatures = cleanedFeatures.map((name) => ({ name }));
    }

    const updatedProduct = await stripe.products.update(productId, {
      ...(productUpdate as any),
      ...(marketingFeatures ? { marketing_features: marketingFeatures } : {}),
    } as any);

    // 2) Update primary price & sale price metadata if provided
    if (price_id) {
      // Fetch existing price to determine currency/recurring and current metadata
      const existingPrice: any = await stripe.prices.retrieve(price_id);
      const currentPriceMeta = existingPrice.metadata || {};
      const newPriceMeta: Record<string, string> = { ...currentPriceMeta };

      if (sale_price_in_cents === null || sale_price_in_cents === undefined) {
        delete newPriceMeta.sale_price;
      } else if (typeof sale_price_in_cents === 'number' && !Number.isNaN(sale_price_in_cents)) {
        newPriceMeta.sale_price = String(sale_price_in_cents);
      }

      const shouldChangeAmount =
        typeof unit_amount === 'number' &&
        !Number.isNaN(unit_amount) &&
        unit_amount !== existingPrice.unit_amount;

      if (shouldChangeAmount) {
        // 1) Create the replacement price
        const newPrice = await stripe.prices.create({
          product: productId,
          // Use decimal string form to avoid unit_amount parameter issues
          unit_amount_decimal: String(unit_amount),
          currency: existingPrice.currency,
          nickname: existingPrice.nickname || undefined,
          metadata: newPriceMeta,
          recurring: (existingPrice as any).recurring || undefined,
        });

        // 2) If the old price is the product's default, point default_price to the new one
        const isDefaultPrice = (currentProduct as any)?.default_price === price_id;
        if (isDefaultPrice) {
          try {
            await stripe.products.update(productId, { default_price: newPrice.id } as any);
          } catch {
            // If this fails, we still keep both prices active; storefront uses explicit price IDs.
          }
        }

        // 3) Best-effort deactivate the old price, but ignore the
        // specific error about archiving a default price.
        try {
          await stripe.prices.update(price_id, { active: false });
        } catch (err: any) {
          const msg = err?.message || err?.raw?.message || '';
          if (!msg.includes('cannot be archived because it is the default price of its product')) {
            throw err;
          }
        }
      } else {
        // Only metadata / sale price changed
        await stripe.prices.update(price_id, { metadata: newPriceMeta });
      }
    }

    // Reuse transform from read-only function to return unified product shape
    const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
    const productPayload = transformProduct(updatedProduct, prices.data);

    return new Response(JSON.stringify({ product: productPayload }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Admin Stripe Products Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Minimal transform to keep admin and storefront in sync
function transformProduct(product: any, prices: any[]) {
  const sortedPrices = [...prices].sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0));

  // Mirror storefront transform shape, including feature bullets.
  // Prefer metadata.features_json (stored as JSON string), then fall back to marketing_features.
  let features: string[] = [];

  const rawFeatures = product.metadata?.features_json;
  if (typeof rawFeatures === 'string' && rawFeatures.length) {
    try {
      const parsed = JSON.parse(rawFeatures);
      if (Array.isArray(parsed)) {
        features = parsed
          .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0);
      }
    } catch {
      // Ignore parse errors and fall back to marketing_features
    }
  }

  if (!features.length && Array.isArray(product.marketing_features)) {
    features = product.marketing_features
      .map((f: any) => {
        if (typeof f === 'string') return f;
        if (f && typeof f === 'object' && typeof f.name === 'string') return f.name;
        return '';
      })
      .filter((item: string) => item.length > 0);
  }

  return {
    id: product.id,
    title: product.name,
    subtitle: product.metadata?.subtitle || null,
    description: product.description || product.metadata?.description || '',
    ribbon_text: product.metadata?.ribbon_text || null,
    image: product.images?.[0] || null,
    images: product.images?.map((url: string, i: number) => ({ url, order: i, type: 'image' })) || [],
    purchasable: product.active,
    order: parseInt(product.metadata?.order || '0'),
    features,
    variants: sortedPrices.map((price: any) => ({
      id: price.id,
      title: price.nickname || 'Default',
      price_in_cents: price.unit_amount || 0,
      sale_price_in_cents: price.metadata?.sale_price ? parseInt(price.metadata.sale_price) : null,
      currency: price.currency.toUpperCase(),
      price_formatted: formatPrice(price.unit_amount || 0, price.currency),
      sale_price_formatted: price.metadata?.sale_price
        ? formatPrice(parseInt(price.metadata.sale_price), price.currency)
        : null,
    })),
    updated_at: new Date(product.updated * 1000).toISOString(),
  };
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
