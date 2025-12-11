// Supabase Edge Function: Stripe Refund
// Issues Stripe refunds for orders and updates order state

// deno-lint-ignore-file
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const authHeader = req.headers.get('Authorization') ?? '';

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
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

    // Check admin role
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
    const { order_id, amount_cents, reason } = body || {};

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Missing order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, total_cost, payment_status, status, stripe_payment_intent_id, stripe_checkout_session_id')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.payment_status !== 'paid') {
      return new Response(JSON.stringify({ error: 'Only paid orders can be refunded' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve PaymentIntent
    let paymentIntentId = order.stripe_payment_intent_id as string | null;
    if (!paymentIntentId && order.stripe_checkout_session_id) {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
      paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
    }

    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: 'Missing Stripe Payment Intent for this order' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine refund amount
    const maxAmount = Math.max(0, Number(order.total_cost) || 0);
    let refundAmount: number | undefined = undefined;
    if (typeof amount_cents === 'number' && amount_cents > 0) {
      refundAmount = Math.min(amount_cents, maxAmount);
    } else {
      refundAmount = maxAmount; // full refund
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: (reason as any) || undefined,
      metadata: { order_id: order.id },
    });

    // Update order state based on full/partial
    const isFullRefund = refundAmount >= maxAmount;

    const updates: Record<string, any> = {};
    if (isFullRefund) updates.payment_status = 'refunded';

    if (Object.keys(updates).length > 0) {
      await supabase.from('orders').update(updates).eq('id', order.id);
    }

    // Log action
    await supabase.from('order_actions').insert({
      order_id: order.id,
      action: 'refund_created',
      performed_by: user.id,
      details: {
        refund_id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason || null,
        payment_intent: paymentIntentId,
        full_refund: isFullRefund,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          full_refund: isFullRefund,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Stripe Refund Error:', error);
    const message = error?.raw?.message || error?.message || 'Refund failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
