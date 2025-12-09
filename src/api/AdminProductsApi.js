import { supabase } from '@/lib/customSupabaseClient';
import { getProducts } from '@/api/StripeApi';

// Fetch products for admin view (reuses public products API)
export async function adminListProducts({ limit = 50 } = {}) {
  return getProducts({ limit });
}

// Update a product and its primary price / sale price via Supabase Edge Function
// This function assumes the current user is an admin; the edge function enforces this.
export async function adminUpdateProduct({
  productId,
  name,
  description,
  image,
  subtitle,
  ribbonText,
  features,
  priceId,
  unitAmountCents,
  salePriceCents,
}) {
  const { data, error } = await supabase.functions.invoke('stripe-products-admin', {
    body: {
      action: 'update_product',
      productId,
      payload: {
        name,
        description,
        image,
        subtitle,
        ribbon_text: ribbonText,
        features,
        price_id: priceId,
        unit_amount: unitAmountCents,
        sale_price_in_cents: salePriceCents,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to update product');
  }

  return data?.product || data;
}
