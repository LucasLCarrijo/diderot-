import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "admin" | "creator" | "follower";

interface ProfileData {
  name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  website_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRoles: AppRole[];
  signUp: (email: string, password: string, name?: string, handle?: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateUser: (data: ProfileData) => Promise<{ error: Error | null }>;
  switchRole: (newRole: "follower" | "creator") => Promise<{ error: Error | null }>;
  hasRole: (role: AppRole) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// BroadcastChannel for logout sync across tabs
const LOGOUT_CHANNEL = "diderot_logout";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);

  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching roles:", error);
        return;
      }

      setUserRoles((data || []).map((r) => r.role as AppRole));
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  }, []);

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
    }
  }, []);

  useEffect(() => {
    // BroadcastChannel for logout sync across tabs
    let logoutChannel: BroadcastChannel | null = null;

    try {
      logoutChannel = new BroadcastChannel(LOGOUT_CHANNEL);
      logoutChannel.onmessage = (event) => {
        if (event.data === "logout") {
          setSession(null);
          setUser(null);
          setUserRoles([]);
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Defer role fetching to avoid blocking
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
        }

        // Handle session expiration
        if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        }

        if (event === "SIGNED_OUT") {
          // Broadcast logout to other tabs
          try {
            logoutChannel?.postMessage("logout");
          } catch {
            // Ignore broadcast errors
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
    });

    // Auto refresh token before expiration
    const refreshInterval = setInterval(() => {
      if (session?.expires_at) {
        const expiresAt = session.expires_at * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Refresh if less than 5 minutes until expiry
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          refreshSession();
        }
      }
    }, 60 * 1000); // Check every minute

    return () => {
      subscription.unsubscribe();
      logoutChannel?.close();
      clearInterval(refreshInterval);
    };
  }, [fetchUserRoles, refreshSession, session?.expires_at]);

  const signUp = async (email: string, password: string, name?: string, handle?: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name || email.split("@")[0],
          username: handle,
          phone: phone,
        },
      },
    });

    if (!authError && authData.user) {
      // Manually create profile to ensure it exists for the onboarding flow
      try {
        await supabase.from("profiles").upsert({
          id: authData.user.id,
          name: name || email.split("@")[0],
          username: handle || email.split("@")[0],
          categories: [],
        });
      } catch (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    return { error: authError as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Broadcast logout to other tabs before signing out
    try {
      const channel = new BroadcastChannel(LOGOUT_CHANNEL);
      channel.postMessage("logout");
      channel.close();
    } catch {
      // Ignore broadcast errors
    }

    await supabase.auth.signOut();
    setUserRoles([]);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const updateUser = async (data: ProfileData): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error("Usuário não autenticado") };
    }

    try {
      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        return { error: new Error("Perfil não encontrado") };
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      // Also update auth user metadata if name changed
      if (data.name) {
        await supabase.auth.updateUser({
          data: { name: data.name }
        });
      }

      toast.success("Perfil atualizado com sucesso!");
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast.error("Erro ao atualizar perfil: " + error.message);
      return { error };
    }
  };

  const switchRole = async (newRole: "follower" | "creator"): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error("Usuário não autenticado") };
    }

    try {
      // Check if user already has this role
      if (hasRole(newRole)) {
        toast.info(`Você já é ${newRole === "creator" ? "um Creator" : "um Follower"}`);
        return { error: null };
      }

      // If switching to creator, check if profile has required fields
      if (newRole === "creator") {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("username, name, bio")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile?.username || !profile?.name) {
          const msg = "Complete seu perfil antes de se tornar um Creator";
          toast.error(msg);
          return { error: new Error(msg) };
        }
      }

      // Add the new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: newRole,
        });

      if (insertError) {
        // Check if it's a unique constraint violation (role already exists)
        if (insertError.code === "23505") {
          toast.info(`Você já possui a role de ${newRole}`);
          return { error: null };
        }
        throw insertError;
      }

      // Refresh roles
      await fetchUserRoles(user.id);

      toast.success(
        newRole === "creator"
          ? "Parabéns! Você agora é um Creator!"
          : "Role atualizada para Follower"
      );
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast.error("Erro ao trocar role: " + error.message);
      return { error };
    }
  };

  const hasRole = (role: AppRole) => userRoles.includes(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userRoles,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateUser,
        switchRole,
        hasRole,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
