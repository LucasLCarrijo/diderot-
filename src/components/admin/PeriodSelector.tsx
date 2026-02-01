import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type Period = "7d" | "30d" | "90d" | "1y" | "custom";

interface PeriodSelectorProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  compareWithPrevious: boolean;
  onCompareChange: (compare: boolean) => void;
}

const periods = [
  { value: "7d" as Period, label: "7 dias" },
  { value: "30d" as Period, label: "30 dias" },
  { value: "90d" as Period, label: "90 dias" },
  { value: "1y" as Period, label: "1 ano" },
  { value: "custom" as Period, label: "Customizado" },
];

export function PeriodSelector({
  period,
  onPeriodChange,
  dateRange,
  onDateRangeChange,
  compareWithPrevious,
  onCompareChange,
}: PeriodSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onPeriodChange(p.value)}
            className={cn(
              "text-sm",
              period === p.value && "bg-background shadow-sm"
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {period === "custom" && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Selecionar período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                onDateRangeChange({ from: range?.from, to: range?.to });
                if (range?.from && range?.to) {
                  setCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id="compare"
          checked={compareWithPrevious}
          onCheckedChange={(checked) => onCompareChange(checked as boolean)}
        />
        <label
          htmlFor="compare"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Comparar com período anterior
        </label>
      </div>
    </div>
  );
}
