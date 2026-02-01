import { supabase } from "@/integrations/supabase/client";

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface TrackClickParams {
  productId: string;
  postId?: string;
  userId?: string;
  utmParams?: UTMParams;
}

// Detect device type from user agent
export function detectDevice(userAgent: string): "mobile" | "desktop" | "tablet" {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) return "mobile";
  return "desktop";
}

// Secure hash function for generating client fingerprint (privacy-first)
// Uses Web Crypto API for proper cryptographic hashing
async function generateClientFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
  ];
  
  const combined = components.join("|");
  
  // Use Web Crypto API for SHA-256 hashing (cryptographically secure)
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Return first 16 chars of hex string (sufficient for fingerprinting while preserving privacy)
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

// Generate tracking link for a product
export function generateTrackingLink(
  productId: string,
  options?: {
    postId?: string;
    utmParams?: UTMParams;
  }
): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({ productId });
  
  if (options?.postId) {
    params.set("postId", options.postId);
  }
  
  if (options?.utmParams) {
    Object.entries(options.utmParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  
  return `${baseUrl}/r/track?${params.toString()}`;
}

// Track a product click
// Note: click_count is now incremented automatically via database trigger
export async function trackClick(params: TrackClickParams): Promise<boolean> {
  try {
    const device = detectDevice(navigator.userAgent);
    const ipHash = await generateClientFingerprint();
    
    const { error } = await supabase.from("clicks").insert({
      product_id: params.productId,
      post_id: params.postId || null,
      user_id: params.userId || null,
      device,
      ip_hash: ipHash,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent || null,
      utm_source: params.utmParams?.utm_source || null,
      utm_medium: params.utmParams?.utm_medium || null,
      utm_campaign: params.utmParams?.utm_campaign || null,
      utm_content: params.utmParams?.utm_content || null,
      utm_term: params.utmParams?.utm_term || null,
    });
    
    if (error) {
      console.error("Error tracking click:", error);
      return false;
    }
    
    // click_count is now incremented via database trigger (increment_product_click_count)
    // No need for read-modify-write pattern which had race condition issues
    
    return true;
  } catch (error) {
    console.error("Error tracking click:", error);
    return false;
  }
}

// Handle product click with redirect
export async function handleProductClick(
  affiliateUrl: string,
  productId: string,
  options?: {
    userId?: string;
    postId?: string;
    utmParams?: UTMParams;
    event?: React.MouseEvent;
  }
): Promise<void> {
  // Prevent default if event provided
  if (options?.event) {
    options.event.preventDefault();
  }
  
  // Track the click
  await trackClick({
    productId,
    postId: options?.postId,
    userId: options?.userId,
    utmParams: options?.utmParams,
  });
  
  // Open the affiliate URL
  window.open(affiliateUrl, "_blank", "noopener,noreferrer");
}
