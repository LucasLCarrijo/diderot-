import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, UserPlus, TrendingUp, Search } from "lucide-react";

interface EmptyFeedProps {
  type: "for_you" | "following" | "trending" | "search";
  searchQuery?: string;
}

export function EmptyFeed({ type, searchQuery }: EmptyFeedProps) {
  const content = {
    for_you: {
      icon: Compass,
      title: "Personalize seu feed",
      description:
        "Explore categorias e siga creators para receber recomendações personalizadas",
      cta: "Descobrir creators",
      ctaLink: "/discover/creators",
    },
    following: {
      icon: UserPlus,
      title: "Siga creators para ver conteúdo",
      description:
        "Seu feed está vazio porque você ainda não segue nenhum creator",
      cta: "Descobrir creators",
      ctaLink: "/discover/creators",
    },
    trending: {
      icon: TrendingUp,
      title: "Nenhum trending no momento",
      description:
        "Não há produtos em alta agora. Volte mais tarde ou explore outras seções",
      cta: "Ver todos os produtos",
      ctaLink: "/discover/creators",
    },
    search: {
      icon: Search,
      title: `Nenhum resultado para "${searchQuery}"`,
      description:
        "Tente usar termos diferentes ou remover alguns filtros",
      cta: "Limpar busca",
      ctaLink: "/me/feed",
    },
  };

  const { icon: Icon, title, description, cta, ctaLink } = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      <Button asChild>
        <Link to={ctaLink}>{cta}</Link>
      </Button>
    </div>
  );
}
