import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Instagram, Youtube, Globe, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreatorAboutProps {
  profile: {
    bio?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    youtube_url?: string | null;
    website_url?: string | null;
    categories?: string[] | null;
    created_at: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  fashion: "Moda",
  beauty: "Beleza",
  tech: "Tecnologia",
  food: "Comida",
  fitness: "Fitness",
  travel: "Viagem",
  lifestyle: "Lifestyle",
  home: "Casa",
  gaming: "Games",
  music: "Música",
};

export function CreatorAbout({ profile }: CreatorAboutProps) {
  const socialLinks = [
    {
      url: profile.instagram_url,
      icon: Instagram,
      label: "Instagram",
      color: "hover:bg-pink-100 dark:hover:bg-pink-900/20",
    },
    {
      url: profile.tiktok_url,
      icon: () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      label: "TikTok",
      color: "hover:bg-slate-100 dark:hover:bg-slate-900/20",
    },
    {
      url: profile.youtube_url,
      icon: Youtube,
      label: "YouTube",
      color: "hover:bg-red-100 dark:hover:bg-red-900/20",
    },
    {
      url: profile.website_url,
      icon: Globe,
      label: "Website",
      color: "hover:bg-blue-100 dark:hover:bg-blue-900/20",
    },
  ].filter((link) => link.url);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      {/* Bio */}
      {profile.bio && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Sobre
          </h3>
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Categories */}
      {profile.categories && profile.categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Categorias
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-sm">
                {CATEGORY_LABELS[cat] || cat}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Redes Sociais
          </h3>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${link.color}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Member Since */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Membro desde
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
}
