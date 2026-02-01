import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type ExportType = "users" | "products" | "posts" | "collections" | "clicks" | "favorites" | "follows";

interface ExportOptions {
  dateRange?: { from?: Date; to?: Date };
  filters?: Record<string, string>;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map(row => row.map(escapeCSV).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export function useAdminExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportUsers = async (options: ExportOptions = {}) => {
    setIsExporting(true);
    try {
      // Fetch users with roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at");
      
      if (rolesError) throw rolesError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, username, bio, avatar_url, is_verified, created_at, updated_at");
      
      if (profilesError) throw profilesError;

      // Fetch subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("user_id, status, stripe_price_id, current_period_end");
      
      if (subsError) throw subsError;

      // Build user map
      const userMap = new Map<string, {
        user_id: string;
        name: string;
        username: string;
        bio: string;
        is_verified: boolean;
        roles: string[];
        subscription_status: string;
        created_at: string;
      }>();

      profiles?.forEach(p => {
        userMap.set(p.user_id!, {
          user_id: p.user_id!,
          name: p.name,
          username: p.username,
          bio: p.bio || "",
          is_verified: p.is_verified || false,
          roles: [],
          subscription_status: "none",
          created_at: p.created_at,
        });
      });

      roles?.forEach(r => {
        const user = userMap.get(r.user_id);
        if (user) {
          user.roles.push(r.role);
        }
      });

      subscriptions?.forEach(s => {
        const user = userMap.get(s.user_id);
        if (user && s.status) {
          user.subscription_status = s.status;
        }
      });

      const headers = [
        "ID",
        "Nome",
        "Username",
        "Bio",
        "Verificado",
        "Roles",
        "Status Assinatura",
        "Criado em",
      ];

      const rows = Array.from(userMap.values()).map(u => [
        u.user_id,
        u.name,
        u.username,
        u.bio,
        u.is_verified ? "Sim" : "Não",
        u.roles.join("; "),
        u.subscription_status,
        format(new Date(u.created_at), "dd/MM/yyyy HH:mm"),
      ]);

      const csv = arrayToCSV(headers, rows);
      const filename = `usuarios-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      downloadCSV(csv, filename);
      toast.success(`${rows.length} usuários exportados!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar usuários");
    } finally {
      setIsExporting(false);
    }
  };

  const exportProducts = async (options: ExportOptions = {}) => {
    setIsExporting(true);
    try {
      let query = supabase
        .from("products")
        .select(`
          id,
          title,
          slug,
          store,
          price,
          currency,
          monetization_type,
          coupon_code,
          status,
          is_published,
          categories,
          click_count,
          favorite_count,
          affiliate_url,
          created_at,
          profiles:creator_id (name, username)
        `);

      if (options.dateRange?.from) {
        query = query.gte("created_at", options.dateRange.from.toISOString());
      }
      if (options.dateRange?.to) {
        query = query.lte("created_at", options.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const headers = [
        "ID",
        "Título",
        "Slug",
        "Loja",
        "Preço",
        "Moeda",
        "Tipo Monetização",
        "Código Cupom",
        "Status",
        "Publicado",
        "Categorias",
        "Cliques",
        "Favoritos",
        "URL Afiliado",
        "Creator",
        "Criado em",
      ];

      const rows = (data || []).map(p => [
        p.id,
        p.title,
        p.slug,
        p.store || "",
        p.price || "",
        p.currency || "BRL",
        p.monetization_type || "affiliate",
        p.coupon_code || "",
        p.status || "published",
        p.is_published ? "Sim" : "Não",
        (p.categories || []).join("; "),
        p.click_count || 0,
        p.favorite_count || 0,
        p.affiliate_url,
        `@${(p.profiles as any)?.username || "unknown"}`,
        format(new Date(p.created_at), "dd/MM/yyyy HH:mm"),
      ]);

      const csv = arrayToCSV(headers, rows);
      const filename = `produtos-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      downloadCSV(csv, filename);
      toast.success(`${rows.length} produtos exportados!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar produtos");
    } finally {
      setIsExporting(false);
    }
  };

  const exportPosts = async (options: ExportOptions = {}) => {
    setIsExporting(true);
    try {
      let query = supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          image_url,
          created_at,
          profiles:creator_id (name, username),
          post_products (id)
        `);

      if (options.dateRange?.from) {
        query = query.gte("created_at", options.dateRange.from.toISOString());
      }
      if (options.dateRange?.to) {
        query = query.lte("created_at", options.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const headers = [
        "ID",
        "Título",
        "Conteúdo",
        "URL Imagem",
        "Nº Pins",
        "Creator",
        "Criado em",
      ];

      const rows = (data || []).map(p => [
        p.id,
        p.title || "",
        (p.content || "").substring(0, 200),
        p.image_url,
        (p.post_products || []).length,
        `@${(p.profiles as any)?.username || "unknown"}`,
        format(new Date(p.created_at), "dd/MM/yyyy HH:mm"),
      ]);

      const csv = arrayToCSV(headers, rows);
      const filename = `posts-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      downloadCSV(csv, filename);
      toast.success(`${rows.length} posts exportados!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar posts");
    } finally {
      setIsExporting(false);
    }
  };

  const exportCollections = async (options: ExportOptions = {}) => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          id,
          name,
          description,
          is_public,
          created_at,
          profiles:creator_id (name, username)
        `);

      if (error) throw error;

      // Get product counts per collection
      const { data: products } = await supabase
        .from("products")
        .select("id, collection_id");

      const productCounts = new Map<string, number>();
      products?.forEach(p => {
        if (p.collection_id) {
          productCounts.set(p.collection_id, (productCounts.get(p.collection_id) || 0) + 1);
        }
      });

      const headers = [
        "ID",
        "Nome",
        "Descrição",
        "Pública",
        "Nº Produtos",
        "Creator",
        "Criado em",
      ];

      const rows = (data || []).map(c => [
        c.id,
        c.name,
        c.description || "",
        c.is_public ? "Sim" : "Não",
        productCounts.get(c.id) || 0,
        `@${(c.profiles as any)?.username || "unknown"}`,
        format(new Date(c.created_at), "dd/MM/yyyy HH:mm"),
      ]);

      const csv = arrayToCSV(headers, rows);
      const filename = `colecoes-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      downloadCSV(csv, filename);
      toast.success(`${rows.length} coleções exportadas!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar coleções");
    } finally {
      setIsExporting(false);
    }
  };

  const exportClicks = async (options: ExportOptions = {}) => {
    setIsExporting(true);
    try {
      let query = supabase
        .from("clicks")
        .select(`
          id,
          product_id,
          post_id,
          user_id,
          device,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign,
          created_at,
          products:product_id (title, slug)
        `)
        .order("created_at", { ascending: false })
        .limit(10000);

      if (options.dateRange?.from) {
        query = query.gte("created_at", options.dateRange.from.toISOString());
      }
      if (options.dateRange?.to) {
        query = query.lte("created_at", options.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const headers = [
        "ID",
        "Produto",
        "Slug",
        "Post ID",
        "Usuário Autenticado",
        "Dispositivo",
        "Referrer",
        "UTM Source",
        "UTM Medium",
        "UTM Campaign",
        "Data/Hora",
      ];

      const rows = (data || []).map(c => [
        c.id,
        (c.products as any)?.title || "",
        (c.products as any)?.slug || "",
        c.post_id || "",
        c.user_id ? "Sim" : "Não",
        c.device || "",
        c.referrer || "",
        c.utm_source || "",
        c.utm_medium || "",
        c.utm_campaign || "",
        format(new Date(c.created_at), "dd/MM/yyyy HH:mm:ss"),
      ]);

      const csv = arrayToCSV(headers, rows);
      const filename = `cliques-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      downloadCSV(csv, filename);
      toast.success(`${rows.length} cliques exportados!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar cliques");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAnalytics = async (options: ExportOptions = {}) => {
    setIsExporting(true);
    try {
      // Aggregate daily metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: clicks, error: clicksError } = await supabase
        .from("clicks")
        .select("created_at, device")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (clicksError) throw clicksError;

      const { data: favorites, error: favError } = await supabase
        .from("favorites")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (favError) throw favError;

      const { data: follows, error: followError } = await supabase
        .from("follows")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (followError) throw followError;

      // Aggregate by day
      const dailyMetrics = new Map<string, { clicks: number; favorites: number; follows: number; mobile: number; desktop: number }>();

      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = format(date, "yyyy-MM-dd");
        dailyMetrics.set(key, { clicks: 0, favorites: 0, follows: 0, mobile: 0, desktop: 0 });
      }

      clicks?.forEach(c => {
        const key = format(new Date(c.created_at), "yyyy-MM-dd");
        const day = dailyMetrics.get(key);
        if (day) {
          day.clicks++;
          if (c.device === "mobile") day.mobile++;
          else day.desktop++;
        }
      });

      favorites?.forEach(f => {
        const key = format(new Date(f.created_at), "yyyy-MM-dd");
        const day = dailyMetrics.get(key);
        if (day) day.favorites++;
      });

      follows?.forEach(f => {
        const key = format(new Date(f.created_at), "yyyy-MM-dd");
        const day = dailyMetrics.get(key);
        if (day) day.follows++;
      });

      const headers = [
        "Data",
        "Cliques",
        "Favoritos",
        "Follows",
        "Mobile",
        "Desktop",
      ];

      const rows = Array.from(dailyMetrics.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, metrics]) => [
          format(new Date(date), "dd/MM/yyyy"),
          metrics.clicks,
          metrics.favorites,
          metrics.follows,
          metrics.mobile,
          metrics.desktop,
        ]);

      const csv = arrayToCSV(headers, rows);
      const filename = `analytics-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      downloadCSV(csv, filename);
      toast.success(`Analytics dos últimos 30 dias exportados!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar analytics");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportUsers,
    exportProducts,
    exportPosts,
    exportCollections,
    exportClicks,
    exportAnalytics,
  };
}
