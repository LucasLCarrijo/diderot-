import { useEffect } from "react";

interface ProductSEOProps {
  title: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  store?: string;
  creatorName?: string;
  url: string;
}

export function ProductSEO({
  title,
  description,
  imageUrl,
  price,
  currency = "BRL",
  store,
  creatorName,
  url,
}: ProductSEOProps) {
  useEffect(() => {
    // Update document title
    const previousTitle = document.title;
    document.title = `${title} | Diderot`;

    // Helper to set meta tag
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Basic meta tags
    if (description) {
      setMetaTag("description", description);
    }

    // Open Graph tags
    setMetaTag("og:title", title, true);
    setMetaTag("og:type", "product", true);
    setMetaTag("og:url", url, true);
    if (description) {
      setMetaTag("og:description", description, true);
    }
    if (imageUrl) {
      setMetaTag("og:image", imageUrl, true);
    }
    setMetaTag("og:site_name", "Diderot", true);

    // Twitter Card tags
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    if (description) {
      setMetaTag("twitter:description", description);
    }
    if (imageUrl) {
      setMetaTag("twitter:image", imageUrl);
    }

    // Product-specific Open Graph
    if (price) {
      setMetaTag("product:price:amount", price.toString(), true);
      setMetaTag("product:price:currency", currency, true);
    }
    if (store) {
      setMetaTag("product:retailer", store, true);
    }

    // JSON-LD Structured Data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: title,
      description: description || undefined,
      image: imageUrl || undefined,
      brand: store
        ? {
            "@type": "Brand",
            name: store,
          }
        : undefined,
      offers: price
        ? {
            "@type": "Offer",
            price: price,
            priceCurrency: currency,
            availability: "https://schema.org/InStock",
            url: url,
          }
        : undefined,
      review: creatorName
        ? {
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: "5",
              bestRating: "5",
            },
            author: {
              "@type": "Person",
              name: creatorName,
            },
          }
        : undefined,
    };

    // Remove undefined values
    const cleanStructuredData = JSON.parse(
      JSON.stringify(structuredData, (_, value) =>
        value === undefined ? undefined : value
      )
    );

    // Add JSON-LD script
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(cleanStructuredData);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // Cleanup on unmount
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, imageUrl, price, currency, store, creatorName, url]);

  // This component doesn't render anything
  return null;
}
