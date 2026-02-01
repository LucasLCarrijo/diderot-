import { useAuth } from "@/contexts/AuthContext";
import { handleProductClick, UTMParams } from "@/lib/tracking";

export function useTrackProductClick() {
  const { user } = useAuth();
  
  const trackAndRedirect = async (
    affiliateUrl: string,
    productId: string,
    options?: {
      postId?: string;
      utmParams?: UTMParams;
      event?: React.MouseEvent;
    }
  ) => {
    await handleProductClick(affiliateUrl, productId, {
      userId: user?.id,
      postId: options?.postId,
      utmParams: options?.utmParams,
      event: options?.event,
    });
  };
  
  return { trackAndRedirect };
}
