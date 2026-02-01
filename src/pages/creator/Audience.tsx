import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

export default function Audience() {
  const { user, isLoading: authLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/signin");
    }
  }, [user, authLoading, navigate]);

  // Get creator profile
  const { data: creatorProfile } = useQuery({
    queryKey: ["creator-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get followers
  const { data: followers, isLoading } = useQuery({
    queryKey: ["creator-followers", creatorProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          id,
          created_at,
          follower:follower_id (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq("creator_id", creatorProfile!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!creatorProfile?.id,
  });

  // Calculate stats
  const now = new Date();
  const last7Days = followers?.filter(
    (f) => new Date(f.created_at) >= subDays(now, 7)
  ).length || 0;
  const last30Days = followers?.filter(
    (f) => new Date(f.created_at) >= subDays(now, 30)
  ).length || 0;

  const filteredFollowers = followers?.filter((f) => {
    if (!search) return true;
    const follower = f.follower as any;
    const searchLower = search.toLowerCase();
    return (
      follower?.name?.toLowerCase().includes(searchLower) ||
      follower?.username?.toLowerCase().includes(searchLower)
    );
  });

  const handleExportCSV = () => {
    if (!followers) return;

    const csvContent = [
      ["Nome", "Username", "Data de Follow"],
      ...followers.map((f) => {
        const follower = f.follower as any;
        return [
          follower?.name || "",
          follower?.username || "",
          new Date(f.created_at).toLocaleDateString("pt-BR"),
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `seguidores_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <CreatorLayout title="Meus Seguidores">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Meus Seguidores</h1>
            <p className="text-muted-foreground">
              {followers?.length || 0} seguidores no total
            </p>
          </div>
          <Button variant="outline" onClick={handleExportCSV} disabled={!followers?.length}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold">{followers?.length || 0}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Últimos 7 dias</span>
            </div>
            <p className="text-2xl font-bold text-green-600">+{last7Days}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Últimos 30 dias</span>
            </div>
            <p className="text-2xl font-bold text-green-600">+{last30Days}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar seguidores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 md:pl-11"
          />
        </div>

        {/* Followers Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFollowers && filteredFollowers.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seguidor</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Seguindo desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFollowers.map((follow) => {
                  const follower = follow.follower as any;
                  return (
                    <TableRow key={follow.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={follower?.avatar_url || ""} />
                            <AvatarFallback>
                              {follower?.name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {follower?.name || "Usuário"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        @{follower?.username || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(follow.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {follower?.username && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/${follower.username}`}>Ver perfil</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? "Nenhum seguidor encontrado" : "Você ainda não tem seguidores"}
            </h3>
            <p className="text-muted-foreground">
              {search
                ? "Tente buscar por outro nome"
                : "Compartilhe seu perfil para ganhar seguidores"}
            </p>
          </div>
        )}
      </div>
    </CreatorLayout>
  );
}
