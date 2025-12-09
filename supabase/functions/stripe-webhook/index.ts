// Supabase Edge Function: Stripe Webhook
// Handles Stripe webhook events for payment confirmations

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

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message);
    return new Response(`Webhook Error: ${err?.message}`, { status: 400 });
  }

  console.log('Received Stripe event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return new Response(JSON.stringify({ error: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const { data: order } = await supabase
    .from('orders')
    .select('progress_steps, payment_status')
    .eq('id', orderId)
    .single();

  if (order?.payment_status === 'paid') return;

  const amountFormatted = session.amount_total 
    ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}`
    : 'Unknown amount';

  await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
      stripe_payment_intent_id: session.payment_intent as string,
      progress_steps: [
        ...(order?.progress_steps || []),
        { status: 'Payment Confirmed', timestamp: new Date().toISOString(), description: `Payment of ${amountFormatted} received via Stripe.` },
        { status: 'Processing Started', timestamp: new Date().toISOString(), description: 'Your order is now being processed.' },
      ],
    })
    .eq('id', orderId);

  console.log(`Order ${orderId} marked as paid`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  await supabase
    .from('orders')
    .update({ payment_status: 'expired', status: 'cancelled' })
    .eq('id', orderId)
    .eq('payment_status', 'unpaid');

  console.log(`Order ${orderId} marked as expired`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) return;

  const { data: order } = await supabase
    .from('orders')
    .select('progress_steps')
    .eq('id', orderId)
    .single();

  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      progress_steps: [
        ...(order?.progress_steps || []),
        { status: 'Payment Failed', timestamp: new Date().toISOString(), description: paymentIntent.last_payment_error?.message || 'Payment could not be processed.' },
      ],
    })
    .eq('id', orderId);

  console.log(`Order ${orderId} marked as failed`);
}
