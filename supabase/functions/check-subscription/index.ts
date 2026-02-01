import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    const activeSubscription = subscriptions.data.find(
      (sub: Stripe.Subscription) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      logStep("No active subscription found");
      
      // Deactivate entitlements if no active subscription
      await supabaseAdmin
        .from('entitlements')
        .update({ active: false })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionEnd = new Date(activeSubscription.current_period_end * 1000).toISOString();
    const priceId = activeSubscription.items.data[0].price.id;
    const productId = activeSubscription.items.data[0].price.product as string;
    
    logStep("Active subscription found", { 
      subscriptionId: activeSubscription.id, 
      status: activeSubscription.status,
      endDate: subscriptionEnd,
      priceId,
      productId
    });

    // Update subscription in database
    await supabaseAdmin.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: activeSubscription.id,
      stripe_price_id: priceId,
      status: activeSubscription.status,
      current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: subscriptionEnd,
      cancel_at_period_end: activeSubscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    });

    // Activate Creator Pro entitlements
    const features = [
      'creator_pro',
      'unlimited_products',
      'unlimited_collections',
      'analytics',
      'verified_badge',
    ];

    for (const feature of features) {
      await supabaseAdmin.from('entitlements').upsert({
        user_id: user.id,
        feature,
        active: true,
        expires_at: subscriptionEnd,
      }, {
        onConflict: 'user_id,feature',
      });
    }

    logStep("Entitlements activated for user");

    return new Response(JSON.stringify({
      subscribed: true,
      subscription_tier: "creator_pro",
      subscription_end: subscriptionEnd,
      status: activeSubscription.status,
      cancel_at_period_end: activeSubscription.cancel_at_period_end
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
