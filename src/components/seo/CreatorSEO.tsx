import { useEffect } from "react";

interface CreatorSEOProps {
  profile: {
    name: string;
    username: string;
    bio?: string | null;
    avatar_url?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    youtube_url?: string | null;
    website_url?: string | null;
  };
}

export function CreatorSEO({ profile }: CreatorSEOProps) {
  useEffect(() => {
    // Update title
    document.title = `${profile.name} (@${profile.username}) - Creator no Diderot`;

    // Update meta description
    const description = profile.bio
      ? profile.bio.slice(0, 160)
      : `Conheça ${profile.name} no Diderot. Descubra produtos recomendados e looks.`;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    // Update Open Graph tags
    const ogTags = {
      "og:title": `${profile.name} no Diderot`,
      "og:description": description,
      "og:image": profile.avatar_url || "",
      "og:url": `${window.location.origin}/${profile.username}`,
      "og:type": "profile",
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    });

    // Add JSON-LD structured data
    const sameAs = [
      profile.instagram_url,
      profile.tiktok_url,
      profile.youtube_url,
      profile.website_url,
    ].filter(Boolean);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      alternateName: `@${profile.username}`,
      description: profile.bio || "",
      image: profile.avatar_url || "",
      url: `${window.location.origin}/${profile.username}`,
      sameAs,
    };

    let script = document.querySelector('script[type="application/ld+json"][data-creator]');
    if (!script) {
      script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-creator", "true");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    // Cleanup on unmount
    return () => {
      document.title = "Diderot";
    };
  }, [profile]);

  return null;
}
