import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, Image, FileSpreadsheet, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface QuickExportProps {
  onExportPNG?: () => void;
  onExportCSV?: () => void;
  copyValue?: string | number;
  className?: string;
  size?: "sm" | "default" | "icon";
}

export function QuickExport({
  onExportPNG,
  onExportCSV,
  copyValue,
  className,
  size = "icon",
}: QuickExportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copyValue !== undefined) {
      await navigator.clipboard.writeText(String(copyValue));
      setCopied(true);
      toast.success("Valor copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPNG = () => {
    if (onExportPNG) {
      onExportPNG();
      toast.success("Exportando como PNG...");
    }
  };

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
      toast.success("Exportando como CSV...");
    }
  };

  // If only copy is available, show simple button
  if (!onExportPNG && !onExportCSV && copyValue !== undefined) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} className={className}>
          <Download className="h-4 w-4" />
          {size !== "icon" && <span className="ml-2">Exportar</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onExportPNG && (
          <DropdownMenuItem onClick={handleExportPNG}>
            <Image className="h-4 w-4 mr-2" />
            Exportar como PNG
          </DropdownMenuItem>
        )}
        {onExportCSV && (
          <DropdownMenuItem onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar como CSV
          </DropdownMenuItem>
        )}
        {copyValue !== undefined && (
          <DropdownMenuItem onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Copiar valor
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Utility to export chart as PNG (requires html2canvas)
export const exportChartAsPNG = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error("Elemento não encontrado");
      return;
    }

    // For now, just show a message - html2canvas would be needed for actual export
    toast.info("Funcionalidade de exportação PNG em desenvolvimento");
  } catch (error) {
    toast.error("Erro ao exportar");
  }
};

// Utility to export data as CSV
export const exportDataAsCSV = (
  data: Record<string, unknown>[],
  filename: string
) => {
  if (!data.length) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return String(value ?? "");
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success(`${filename}.csv baixado com sucesso!`);
};
