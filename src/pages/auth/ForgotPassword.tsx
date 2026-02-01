import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-diderot.svg";
import logoLight from "@/assets/logo-diderot-white.svg";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const logoSrc = resolvedTheme === "dark" ? logoLight : logoDark;

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        if (error.message.includes("rate limit")) {
          toast.error("Muitas tentativas. Aguarde alguns minutos.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      setEmailSent(true);
    } catch {
      toast.error("Erro ao enviar email. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Email enviado!</h2>
            <p className="text-muted-foreground mb-6">
              Enviamos um link de recuperação para{" "}
              <strong className="text-foreground">{getValues("email")}</strong>.
              Verifique sua caixa de entrada e spam.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/signin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <img src={logoSrc} alt="Diderot" className="h-6 w-auto mx-auto" />
          </Link>
          <h2 className="mt-6 text-2xl font-semibold">Recuperar senha</h2>
          <p className="mt-2 text-muted-foreground">
            Digite seu email para receber um link de recuperação
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={isLoading}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              to="/auth/signin" 
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
