import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (item: T, index: number) => ReactNode;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileCardRenderer?: (item: T, index: number) => ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading,
  emptyMessage = "Nenhum item encontrado",
  className,
  mobileCardRenderer,
}: ResponsiveTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile cards view
  if (mobileCardRenderer) {
    return (
      <>
        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden space-y-3">
          {data.map((item, index) => (
            <div key={keyExtractor(item)} className="responsive-table-card">
              {mobileCardRenderer(item, index)}
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Table className={className}>
            <TableHeader>
              <TableRow>
                {columns
                  .filter((col) => !col.hideOnMobile && !col.hideOnTablet)
                  .map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={keyExtractor(item)}>
                  {columns
                    .filter((col) => !col.hideOnMobile && !col.hideOnTablet)
                    .map((col) => (
                      <TableCell key={col.key}>{col.cell(item, index)}</TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  // Default table with responsive column hiding
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={cn(
                col.hideOnMobile && "hidden md:table-cell",
                col.hideOnTablet && "hidden lg:table-cell"
              )}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={keyExtractor(item)}>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                className={cn(
                  col.hideOnMobile && "hidden md:table-cell",
                  col.hideOnTablet && "hidden lg:table-cell"
                )}
              >
                {col.cell(item, index)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
