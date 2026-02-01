import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets = [
  { label: "Últimos 7 dias", value: "7d", getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Últimos 30 dias", value: "30d", getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Últimos 90 dias", value: "90d", getRange: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: "Este mês", value: "this_month", getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Mês passado", value: "last_month", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [preset, setPreset] = useState<string>("30d");
  const [isOpen, setIsOpen] = useState(false);
  
  const handlePresetChange = (presetValue: string) => {
    setPreset(presetValue);
    const selectedPreset = presets.find(p => p.value === presetValue);
    if (selectedPreset) {
      onChange(selectedPreset.getRange());
    }
  };
  
  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setPreset("custom");
      onChange({ from: range.from, to: range.to });
    }
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                  {format(value.to, "dd/MM/yy", { locale: ptBR })}
                </>
              ) : (
                format(value.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={{ from: value?.from, to: value?.to }}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
