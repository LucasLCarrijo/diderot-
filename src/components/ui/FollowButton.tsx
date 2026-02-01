import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsFollowing, useToggleFollow } from "@/hooks/useFollow";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface FollowButtonProps {
  creatorId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function FollowButton({
  creatorId,
  className,
  variant = "default",
  size = "default",
}: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isFollowing, isLoading } = useIsFollowing(creatorId);
  const toggleFollow = useToggleFollow();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    toggleFollow.mutate({ creatorId, isFollowing: !!isFollowing });
  };

  const isPending = toggleFollow.isPending;

  // Determine button text and style based on state
  const getButtonContent = () => {
    if (isPending) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isFollowing ? "Deixando de seguir..." : "Seguindo..."}
        </>
      );
    }

    if (isFollowing) {
      if (isHovered) {
        return (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Deixar de seguir
          </>
        );
      }
      return (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Seguindo
        </>
      );
    }

    return (
      <>
        <UserPlus className="h-4 w-4 mr-2" />
        Seguir
      </>
    );
  };

  const button = (
    <Button
      variant={isFollowing ? (isHovered ? "destructive" : "outline") : variant}
      size={size}
      className={cn(
        "transition-all duration-200 ease-out",
        isFollowing && !isHovered && "border-primary/50",
        className
      )}
      onClick={handleClick}
      disabled={isLoading || isPending}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={isFollowing ? "Deixar de seguir" : "Seguir"}
    >
      {getButtonContent()}
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>
            {isFollowing
              ? "Clique para deixar de seguir"
              : "Clique para seguir este creator"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
