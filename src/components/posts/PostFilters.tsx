import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, X, Calendar as CalendarIcon, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import { Product } from '@/hooks/useCreatorProducts';

export interface PostFiltersState {
  search: string;
  productId: string | null;
  sortBy: 'recent' | 'oldest' | 'most_pins';
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface PostFiltersProps {
  filters: PostFiltersState;
  onFiltersChange: (filters: PostFiltersState) => void;
  products?: Product[];
  totalResults?: number;
  className?: string;
}

export function PostFilters({
  filters,
  onFiltersChange,
  products = [],
  totalResults,
  className,
}: PostFiltersProps) {
  const hasFilters = 
    filters.search ||
    filters.productId ||
    filters.sortBy !== 'recent' ||
    filters.dateFrom ||
    filters.dateTo;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      productId: null,
      sortBy: 'recent',
      dateFrom: null,
      dateTo: null,
    });
  };

  const formatDateRange = () => {
    if (filters.dateFrom && filters.dateTo) {
      return `${format(filters.dateFrom, 'dd/MM')} - ${format(filters.dateTo, 'dd/MM')}`;
    }
    if (filters.dateFrom) {
      return `A partir de ${format(filters.dateFrom, 'dd/MM/yyyy')}`;
    }
    if (filters.dateTo) {
      return `Até ${format(filters.dateTo, 'dd/MM/yyyy')}`;
    }
    return 'Selecionar período';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por caption..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        {/* Product filter */}
        <div className="space-y-2">
          <Label className="text-xs">Produto</Label>
          <Select
            value={filters.productId || 'all'}
            onValueChange={(value) => onFiltersChange({ 
              ...filters, 
              productId: value === 'all' ? null : value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os produtos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os produtos</SelectItem>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="space-y-2">
          <Label className="text-xs">Período</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !filters.dateFrom && !filters.dateTo && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="border-r">
                  <p className="text-xs font-medium p-2 border-b">De</p>
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom || undefined}
                    onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date || null })}
                    locale={ptBR}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium p-2 border-b">Até</p>
                  <Calendar
                    mode="single"
                    selected={filters.dateTo || undefined}
                    onSelect={(date) => onFiltersChange({ ...filters, dateTo: date || null })}
                    locale={ptBR}
                    disabled={(date) => filters.dateFrom ? date < filters.dateFrom : false}
                  />
                </div>
              </div>
              {(filters.dateFrom || filters.dateTo) && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onFiltersChange({ ...filters, dateFrom: null, dateTo: null })}
                  >
                    Limpar datas
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <Label className="text-xs">Ordenar por</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value: 'recent' | 'oldest' | 'most_pins') => 
              onFiltersChange({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
              <SelectItem value="most_pins">Mais produtos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {totalResults !== undefined && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {totalResults} {totalResults === 1 ? 'post encontrado' : 'posts encontrados'}
            </p>
          </div>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={clearFilters}
          >
            <X className="w-4 h-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
