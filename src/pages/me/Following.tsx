import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowing } from "@/hooks/useFollow";
import { UserLayout } from "@/components/layout/UserLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FollowButton } from "@/components/ui/FollowButton";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Search, Users } from "lucide-react";
import { useState } from "react";

export default function Following() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: following, isLoading } = useFollowing();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/signin");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const filteredFollowing = following?.filter((f) => {
    const profile = f.profiles as any;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      profile?.name?.toLowerCase().includes(searchLower) ||
      profile?.username?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <UserLayout
      title="Creators que sigo"
      description={`Você segue ${following?.length || 0} creators`}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 md:pl-11"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredFollowing && filteredFollowing.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFollowing.map((follow) => {
              const profile = follow.profiles as any;
              return (
                <div
                  key={follow.id}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <Link
                    to={`/${profile?.username}`}
                    className="flex items-center gap-3 mb-3"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {profile?.name?.[0] || profile?.username?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">
                          {profile?.name || profile?.username}
                        </span>
                        {profile?.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @{profile?.username}
                      </p>
                    </div>
                  </Link>
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {profile.bio}
                    </p>
                  )}
                  <FollowButton creatorId={follow.creator_id} className="w-full" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? "Nenhum creator encontrado" : "Você ainda não segue ninguém"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Tente buscar por outro nome"
                : "Descubra creators incríveis para seguir"}
            </p>
            {!search && (
              <Button onClick={() => navigate("/discover/creators")}>
                Descobrir creators
              </Button>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
