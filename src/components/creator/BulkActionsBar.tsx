import { Archive, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkPublish: () => void;
  onBulkUnpublish: () => void;
  onBulkArchive: () => void;
  isLoading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkPublish,
  onBulkUnpublish,
  onBulkArchive,
  isLoading = false,
}: BulkActionsBarProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <>
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            {selectedCount} {selectedCount === 1 ? "produto" : "produtos"} selecionado
            {selectedCount !== 1 && "s"}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={allSelected ? onClearSelection : onSelectAll}
          >
            {allSelected ? "Desmarcar todos" : "Selecionar todos"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkPublish}
            disabled={isLoading}
          >
            <Check className="h-4 w-4 mr-1" />
            Publicar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkUnpublish}
            disabled={isLoading}
          >
            Despublicar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowArchiveDialog(true)}
            disabled={isLoading}
          >
            <Archive className="h-4 w-4 mr-1" />
            Arquivar
          </Button>
          <Button variant="ghost" size="icon" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar produtos?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount} {selectedCount === 1 ? "produto será arquivado" : "produtos serão arquivados"}.
              Eles não aparecerão mais no seu perfil público, mas você pode
              restaurá-los depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBulkArchive();
                setShowArchiveDialog(false);
              }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
