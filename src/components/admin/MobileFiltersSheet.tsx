import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";

interface MobileFiltersSheetProps {
  children: React.ReactNode;
  filterCount?: number;
  onClear?: () => void;
}

export function MobileFiltersSheet({ children, filterCount = 0, onClear }: MobileFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {filterCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {filterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center justify-between">
            <span>Filtros</span>
            {filterCount > 0 && onClear && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                <X className="h-4 w-4 mr-1" />
                Limpar ({filterCount})
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 overflow-y-auto pb-20">
          {children}
        </div>
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button className="w-full" onClick={() => setOpen(false)}>
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
