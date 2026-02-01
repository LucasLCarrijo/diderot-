import { toast } from "sonner";

interface ApiError {
  code?: string;
  message?: string;
  status?: number;
}

const ERROR_MESSAGES: Record<number, string> = {
  400: "Dados inválidos. Verifique as informações e tente novamente.",
  401: "Você precisa fazer login para continuar.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "O recurso solicitado não foi encontrado.",
  409: "Este recurso já existe ou há um conflito.",
  422: "Os dados enviados são inválidos.",
  429: "Muitas requisições. Aguarde um momento e tente novamente.",
  500: "Erro no servidor. Por favor, tente novamente mais tarde.",
  502: "Serviço temporariamente indisponível.",
  503: "Serviço em manutenção. Tente novamente em alguns minutos.",
};

const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  "PGRST116": "Registro não encontrado.",
  "23505": "Este registro já existe.",
  "23503": "Não é possível remover pois há dados relacionados.",
  "42501": "Você não tem permissão para esta operação.",
  "22P02": "Formato de dados inválido.",
  "invalid_credentials": "Email ou senha incorretos.",
  "user_already_exists": "Este email já está cadastrado.",
  "email_not_confirmed": "Por favor, confirme seu email antes de continuar.",
  "invalid_grant": "Sessão expirada. Faça login novamente.",
};

export function getErrorMessage(error: unknown): string {
  if (!error) return "Ocorreu um erro inesperado.";

  // Handle Supabase errors
  if (typeof error === "object" && error !== null) {
    const err = error as ApiError & { code?: string; details?: string };
    
    // Check for Supabase error codes
    if (err.code && SUPABASE_ERROR_MESSAGES[err.code]) {
      return SUPABASE_ERROR_MESSAGES[err.code];
    }

    // Check for HTTP status codes
    if (err.status && ERROR_MESSAGES[err.status]) {
      return ERROR_MESSAGES[err.status];
    }

    // Check for message
    if (err.message) {
      // Translate common Supabase messages
      if (err.message.includes("JWT expired")) {
        return "Sua sessão expirou. Faça login novamente.";
      }
      if (err.message.includes("row-level security")) {
        return "Você não tem permissão para esta operação.";
      }
      if (err.message.includes("duplicate key")) {
        return "Este registro já existe.";
      }
      if (err.message.includes("foreign key")) {
        return "Não é possível realizar esta operação devido a dados relacionados.";
      }
      if (err.message.includes("network")) {
        return "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      
      return err.message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

export function handleApiError(error: unknown, customMessage?: string): void {
  const message = customMessage || getErrorMessage(error);
  toast.error(message);
  
  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", error);
  }
}

export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
  const err = error as ApiError;
  return (
    err.status === 401 ||
    err.code === "invalid_grant" ||
    err.code === "invalid_credentials" ||
    (err.message?.includes("JWT") ?? false)
  );
}

export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
  const err = error as ApiError;
  return err.status === 404 || err.code === "PGRST116";
}

export function isPermissionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
  const err = error as ApiError;
  return (
    err.status === 403 ||
    err.code === "42501" ||
    (err.message?.includes("row-level security") ?? false)
  );
}
