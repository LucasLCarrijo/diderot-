import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "./useDebounce";

// Extended filters interface
export interface ExtendedProductFilters {
  search?: string;
  status?: string[];
  monetization_type?: string[];
  categories?: string[];
  store?: string;
  has_coupon?: boolean;
  price_min?: number;
  price_max?: number;
  sort_by?: "created_at" | "click_count" | "favorite_count" | "title";
  sort_order?: "asc" | "desc";
}

// Parse URL params to filters
function parseFiltersFromParams(params: URLSearchParams): ExtendedProductFilters {
  const filters: ExtendedProductFilters = {};

  const search = params.get("search");
  if (search) filters.search = search;

  const status = params.get("status");
  if (status) filters.status = status.split(",");

  const monetization = params.get("type");
  if (monetization) filters.monetization_type = monetization.split(",");

  const categories = params.get("categories");
  if (categories) filters.categories = categories.split(",");

  const store = params.get("store");
  if (store) filters.store = store;

  const hasCoupon = params.get("coupon");
  if (hasCoupon === "true") filters.has_coupon = true;

  const priceMin = params.get("price_min");
  if (priceMin) filters.price_min = Number(priceMin);

  const priceMax = params.get("price_max");
  if (priceMax) filters.price_max = Number(priceMax);

  const sortBy = params.get("sort");
  if (sortBy) filters.sort_by = sortBy as ExtendedProductFilters["sort_by"];

  const sortOrder = params.get("order");
  if (sortOrder) filters.sort_order = sortOrder as ExtendedProductFilters["sort_order"];

  return filters;
}

// Convert filters to URL params
function filtersToParams(filters: ExtendedProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status?.length) params.set("status", filters.status.join(","));
  if (filters.monetization_type?.length) params.set("type", filters.monetization_type.join(","));
  if (filters.categories?.length) params.set("categories", filters.categories.join(","));
  if (filters.store) params.set("store", filters.store);
  if (filters.has_coupon) params.set("coupon", "true");
  if (filters.price_min !== undefined) params.set("price_min", String(filters.price_min));
  if (filters.price_max !== undefined) params.set("price_max", String(filters.price_max));
  if (filters.sort_by) params.set("sort", filters.sort_by);
  if (filters.sort_order) params.set("order", filters.sort_order);

  return params;
}

// Hook: Product filters with URL sync
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<ExtendedProductFilters>(() =>
    parseFiltersFromParams(searchParams)
  );

  // Debounce search input
  const debouncedSearch = useDebounce(filters.search || "", 300);

  // Sync filters to URL
  useEffect(() => {
    const newParams = filtersToParams({ ...filters, search: debouncedSearch });
    const currentParams = searchParams.toString();
    const newParamsStr = newParams.toString();
    
    if (currentParams !== newParamsStr) {
      setSearchParams(newParams, { replace: true });
    }
  }, [filters, debouncedSearch, setSearchParams, searchParams]);

  // Update a single filter
  const setFilter = useCallback(<K extends keyof ExtendedProductFilters>(
    key: K,
    value: ExtendedProductFilters[K]
  ) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Toggle array filter value
  const toggleArrayFilter = useCallback(<K extends "status" | "monetization_type" | "categories">(
    key: K,
    value: string
  ) => {
    setFiltersState((prev) => {
      const current = prev[key] || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      (filters.status?.length) ||
      (filters.monetization_type?.length) ||
      (filters.categories?.length) ||
      filters.store ||
      filters.has_coupon ||
      filters.price_min !== undefined ||
      filters.price_max !== undefined
    );
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status?.length) count += filters.status.length;
    if (filters.monetization_type?.length) count += filters.monetization_type.length;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.store) count++;
    if (filters.has_coupon) count++;
    if (filters.price_min !== undefined || filters.price_max !== undefined) count++;
    return count;
  }, [filters]);

  return {
    filters: { ...filters, search: debouncedSearch },
    rawFilters: filters,
    setFilter,
    toggleArrayFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
