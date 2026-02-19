import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradePlanCardProps {
  show?: boolean;
}

export function UpgradePlanCard({ show = true }: UpgradePlanCardProps) {
  if (!show) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-b from-orange-50 via-pink-50 to-purple-200 p-5 shadow-sm">
      {/* Decorative blur effect */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-300/30 blur-3xl" />
      
      <div className="relative">
        <h3 className="text-lg font-bold text-[#111111] mb-2">
          Dê um upgrade
        </h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Acompanhe cliques, visitas e desempenho dos seus produtos.
        </p>
        <Button
          asChild
          className="w-full bg-[#111111] text-white hover:bg-black/90 rounded-full h-10"
        >
          <Link to="/reactivate">
            <Sparkles className="h-4 w-4 mr-2" />
            Ver planos
          </Link>
        </Button>
      </div>
    </div>
  );
}

