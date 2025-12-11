// Supabase Edge Function: Stripe Checkout
// Creates Stripe Checkout Session for payments

// deno-lint-ignore-file
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { 
      orderId, 
      items, 
      customerEmail, 
      successUrl, 
      cancelUrl, 
      discountAmountCents = 0,
      metadata = {} 
    } = body;

    if (!orderId || !items?.length || !customerEmail || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lineItems = items.map((item: any) => ({
      price: item.variant_id,
      quantity: item.quantity,
    }));

    const sessionParams: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl.includes('{CHECKOUT_SESSION_ID}') 
        ? successUrl 
        : `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: { order_id: orderId, ...metadata },
      invoice_creation: { enabled: true },
    };

    // Compute automatic sale discount based on price.metadata.sale_price
    let saleDiscountCents = 0;
    try {
      const priceObjs = await Promise.all(items.map((it: any) => stripe.prices.retrieve(it.variant_id)));
      for (let i = 0; i < items.length; i++) {
        const pr: any = priceObjs[i];
        const qty = Math.max(1, Number(items[i].quantity) || 1);
        const base = Number(pr.unit_amount) || 0;
        const saleMeta = pr.metadata?.sale_price ? Number(pr.metadata.sale_price) : null;
        if (saleMeta && !Number.isNaN(saleMeta) && saleMeta < base) {
          saleDiscountCents += (base - saleMeta) * qty;
        }
      }
    } catch (_) {
      // ignore; no sale discount
    }

    const totalDiscountCents = Math.max(0, (discountAmountCents || 0) + saleDiscountCents);
    if (totalDiscountCents > 0) {
      // Use the first price currency (assumes single currency store)
      let couponCurrency = 'eur';
      try {
        const firstPrice = await stripe.prices.retrieve(items[0].variant_id);
        couponCurrency = (firstPrice.currency || 'eur').toLowerCase();
      } catch {}

      const coupon = await stripe.coupons.create({
        amount_off: totalDiscountCents,
        currency: couponCurrency,
        duration: 'once',
        name: 'Promotional Discount',
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await supabase
      .from('orders')
      .update({ 
        stripe_checkout_session_id: session.id,
        checkout_id: session.id,
      })
      .eq('id', orderId);

    return new Response(JSON.stringify({
      url: session.url,
      sessionId: session.id,
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Checkout failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
