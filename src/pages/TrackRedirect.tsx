import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/lib/tracking";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function TrackRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const processRedirect = async () => {
      const productId = searchParams.get("productId");
      const postId = searchParams.get("postId");
      
      if (!productId) {
        navigate("/not-found", { replace: true });
        return;
      }
      
      try {
        // Fetch product to get affiliate URL
        const { data: product, error: fetchError } = await supabase
          .from("products")
          .select("affiliate_url, is_published")
          .eq("id", productId)
          .single();
        
        if (fetchError || !product) {
          navigate("/not-found", { replace: true });
          return;
        }
        
        if (!product.affiliate_url) {
          setError("Este produto não possui link de afiliado.");
          return;
        }
        
        // Extract UTM params
        const utmParams = {
          utm_source: searchParams.get("utm_source") || undefined,
          utm_medium: searchParams.get("utm_medium") || undefined,
          utm_campaign: searchParams.get("utm_campaign") || undefined,
          utm_content: searchParams.get("utm_content") || undefined,
          utm_term: searchParams.get("utm_term") || undefined,
        };
        
        // Track the click
        await trackClick({
          productId,
          postId: postId || undefined,
          userId: user?.id,
          utmParams,
        });
        
        // Redirect to affiliate URL
        window.location.href = product.affiliate_url;
      } catch (err) {
        console.error("Error processing redirect:", err);
        setError("Erro ao processar redirecionamento.");
      }
    };
    
    processRedirect();
  }, [searchParams, navigate, user?.id]);
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="text-primary hover:underline"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Redirecionando para a loja...</p>
      </div>
    </div>
  );
}
