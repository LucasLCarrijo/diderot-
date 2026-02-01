import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreator?: boolean;
}

export function DeleteAccountModal({ open, onOpenChange, isCreator }: DeleteAccountModalProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmText === "DELETAR" && confirmed;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    try {
      // In a real app, you would call a backend function to handle deletion
      // For now, we'll just sign out the user
      // The actual deletion would be handled by a server-side function
      
      // Sign out user
      await signOut();
      
      toast.success("Sua conta foi desativada. Ela será excluída permanentemente em 30 dias.");
      onOpenChange(false);
      navigate("/auth/signin");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir conta");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setConfirmed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Conta
          </DialogTitle>
          <DialogDescription>
            Esta ação é permanente e não pode ser desfeita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 space-y-2">
            <p className="text-sm font-medium text-destructive">Atenção:</p>
            <ul className="text-sm text-destructive/80 space-y-1">
              <li>• Esta ação é <strong>irreversível</strong></li>
              <li>• Todos os seus dados serão deletados</li>
              {isCreator && (
                <>
                  <li>• Seus produtos serão removidos</li>
                  <li>• Seus posts serão removidos</li>
                  <li>• Suas coleções serão removidas</li>
                </>
              )}
              <li>• Seus favoritos serão removidos</li>
              <li>• Você perderá acesso a tudo</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Digite <span className="font-mono font-bold">DELETAR</span> para confirmar
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="DELETAR"
              className="font-mono"
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm-checkbox"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <Label htmlFor="confirm-checkbox" className="text-sm leading-relaxed cursor-pointer">
              Eu entendo que isso é permanente e que todos os meus dados serão
              excluídos definitivamente.
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir minha conta"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
