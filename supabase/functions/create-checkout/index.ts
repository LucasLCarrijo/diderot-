import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@18.5.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');
    logStep("Stripe key verified", { keyPrefix: stripeKey.slice(0, 7) });

    const body = await req.json()
    const { priceId, returnUrl, cancelUrl } = body
    let { userId } = body

    if (!priceId) throw new Error('Missing priceId');
    logStep("Price ID received", { priceId });

    // Derive userId from JWT
    const authHeader = req.headers.get('Authorization')
    if (!userId) {
      if (!authHeader) throw new Error('Missing Authorization header');
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      )
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      if (userError) throw new Error(`Authentication error: ${userError.message}`)
      if (!user) throw new Error('User not found for provided token')
      userId = user.id
      logStep("User authenticated from token", { userId });
    }

    if (!userId) throw new Error('Missing userId');

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion })

    const origin = req.headers.get('origin') || 'https://shopdiderot.com'
    const successUrl = returnUrl ?? `${origin}/onboarding?success=true`
    const cancelUrlFinal = cancelUrl ?? `${origin}/onboarding`

    logStep("Creating Stripe checkout session", { priceId, userId, successUrl });

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
        metadata: { user_id: userId },
      },
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrlFinal,
      client_reference_id: userId,
      metadata: { user_id: userId },
    })

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Log Stripe-specific error details
    if (error && typeof error === 'object' && 'type' in error) {
      logStep("Stripe API ERROR", { type: (error as { type: string }).type, message: errorMessage });
    } else {
      logStep("ERROR in create-checkout", { message: errorMessage });
    }
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
