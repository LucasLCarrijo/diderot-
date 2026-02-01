import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateReport } from "@/hooks/useReport";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ReportCreatorModalProps {
  creatorId: string;
  username: string;
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Conteúdo inapropriado" },
  { value: "impersonation", label: "Impersonation (fingindo ser outra pessoa)" },
  { value: "fraud", label: "Fraude ou golpe" },
  { value: "other", label: "Outro" },
] as const;

export function ReportCreatorModal({ creatorId, username, trigger }: ReportCreatorModalProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const createReport = useCreateReport();

  const handleSubmit = () => {
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    if (!reason) return;

    createReport.mutate(
      {
        reportedType: "user",
        reportedId: creatorId,
        reason: reason as any,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setReason("");
          setDescription("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-destructive">
            <Flag className="h-4 w-4 mr-2" />
            Reportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar @{username}</DialogTitle>
          <DialogDescription>
            Selecione o motivo da denúncia. Nossa equipe irá analisar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {reason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="description">Descreva o problema</Label>
              <Textarea
                id="description"
                placeholder="Conte mais sobre o motivo da denúncia..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || createReport.isPending}
          >
            {createReport.isPending ? "Enviando..." : "Enviar denúncia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
