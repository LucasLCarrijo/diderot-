import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signUpSchema, SignUpFormData } from "@/lib/validations/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-diderot.svg";
import logoLight from "@/assets/logo-diderot-white.svg";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { resolvedTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle availability state
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);

  const logoSrc = resolvedTheme === "dark" ? logoLight : logoDark;

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      acceptTerms: false,
      handle: "",
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const { watch, handleSubmit, control } = form;

  const handleValue = watch("handle");

  // Debounce check handle
  useEffect(() => {
    const checkHandle = async () => {
      if (!handleValue || handleValue.length < 3) {
        setHandleAvailable(null);
        return;
      }

      // Local regex check before server check
      if (!/^[a-z0-9-]+$/.test(handleValue)) {
        setHandleAvailable(false);
        return;
      }

      setCheckingHandle(true);
      try {
        // Check availability in profiles table
        // We use maybeSingle() to avoid 406 errors, but we also need to handle RLS 401s gracefully.
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", handleValue.toLowerCase())
          .maybeSingle();

        if (error) {
          // If it's a 401, it means RLS is blocking us (User not logged in), 
          // but we can assume the handle might be free or just fail open.
          // Ideally we should fix RLS, but for now let's not block the UI.
          console.warn("Handle check error (likely RLS):", error);
          // If we can't check, we assume it's available? Or we just stop checking.
          // Let's assume available to not block the user, the DB unique constraint will catch it on save.
          setHandleAvailable(true);
        } else {
          setHandleAvailable(!data);
        }
      } catch (error) {
        console.error("Error checking handle:", error);
        setHandleAvailable(true); // Fail open
      } finally {
        setCheckingHandle(false);
      }
    };

    const timeoutId = setTimeout(() => {
      checkHandle();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [handleValue]);

  const onSubmit = async (data: SignUpFormData) => {
    // Prevent submit if handle is taken
    if (handleAvailable === false) {
      toast.error("O handle escolhido já está em uso.");
      return;
    }

    setIsLoading(true);
    try {
      // Pass handle and phone to signUp
      const { error } = await signUp(
        data.email,
        data.password,
        data.name,
        data.handle,
        data.phone
      );

      if (error) {
        console.error("Signup error:", error);

        // Handle specific error cases
        if (error.message.includes("User already registered") || error.message.includes("Email already registered")) {
          form.setError("email", {
            type: "manual",
            message: "Este email já está cadastrado. Tente fazer login."
          });
          toast.error("Este email já está cadastrado.");
        } else if (error.message.includes("Password")) {
          form.setError("password", {
            type: "manual",
            message: "Senha muito fraca ou inválida."
          });
          toast.error(error.message);
        } else if (error.message.includes("username") || error.message.includes("handle")) {
          form.setError("handle", {
            type: "manual",
            message: "Este handle já está em uso."
          });
          toast.error("Este handle já está em uso.");
        } else {
          toast.error(error.message || "Erro ao criar conta. Tente novamente.");
        }
        setIsLoading(false);
        return;
      }

      // Wait for auth state to propagate (fixes race condition with ProtectedRoute)
      // We listen for SIGNED_IN event before navigating
      const waitForSession = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout waiting for session"));
        }, 10000); // 10 second timeout

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolve();
          }
        });

        // Also check if session already exists (in case event already fired)
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolve();
          }
        });
      });

      try {
        await waitForSession;
        toast.success("Conta criada! Redirecionando...");
        navigate("/onboarding/segmentation", { replace: true });
      } catch (sessionError) {
        console.error("Session wait error:", sessionError);
        // Fallback: check if email confirmation is required
        toast.info("Conta criada! Verifique seu email ou faça login.");
        navigate("/auth/signin");
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(err?.message || "Erro inesperado ao criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    // Mask: (00) 00000-0000
    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
    return v;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <img src={logoSrc} alt="Diderot" className="h-8 w-auto mx-auto" />
          </Link>
          <h2 className="mt-6 text-2xl font-bold tracking-tight">Crie sua conta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Leva menos de 1 minuto.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Handle Field */}
              <FormField
                control={control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      {/* Prefix Container - Centered Vertically, safe from line-height issues */}
                      <div className="absolute left-3 top-1 bottom-1.5 flex items-center pointer-events-none z-10">
                        <span className="text-muted-foreground text-base md:text-sm leading-none pt-[3px]">
                          shopdiderot.com/
                        </span>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="seu-nome"
                          className={`pl-[132px] md:pl-[132px] ${handleAvailable === false
                            ? "border-red-500 focus-visible:ring-red-500"
                            : handleAvailable === true
                              ? "border-green-500 focus-visible:ring-green-500"
                              : ""
                            }`}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>

                      {/* Status Icons */}
                      <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none z-10">
                        {checkingHandle && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {!checkingHandle && handleAvailable === true && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {!checkingHandle && handleAvailable === false && (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    {handleAvailable === false && (
                      <p className="text-[0.8rem] font-medium text-destructive mt-1">
                        Este handle já está em uso.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name Field */}
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Nome completo"
                        autoComplete="name"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Field */}
              <FormField
                control={control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none z-10">
                        <div className="flex items-center gap-2 border-r pr-2 h-6">
                          <span className="text-2xl md:text-xl leading-none pt-1">🇧🇷</span>
                          <span className="text-base md:text-sm text-muted-foreground">+55</span>
                        </div>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          className="pl-[95px] md:pl-[90px]"
                          disabled={isLoading}
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Senha"
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms */}
              <FormField
                control={control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="grid gap-1.5 leading-none">
                      <label
                        className="text-sm font-medium leading-normal cursor-pointer text-foreground"
                      >
                        Aceito os termos de uso
                      </label>
                      <div className="text-xs text-muted-foreground">
                        Ao criar uma conta, você concorda com nossos{" "}
                        <Link to="/terms" className="underline hover:text-foreground">
                          Termos de Uso
                        </Link>{" "} e {" "}
                        <Link to="/privacy" className="underline hover:text-foreground">
                          Política de Privacidade
                        </Link>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full text-base font-semibold h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/auth/signin" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
