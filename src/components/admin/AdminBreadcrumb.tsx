import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

// Route to breadcrumb mapping
const ROUTE_LABELS: Record<string, string> = {
  admin: "Dashboard",
  users: "Usuários",
  financials: "Métricas Financeiras",
  "north-star": "North Star Metrics",
  analytics: "Analytics Avançado",
  content: "Produtos & Posts",
  brands: "Brands & Campanhas",
  moderation: "Moderação",
  settings: "Configurações",
  notifications: "Notificações",
};

interface AdminBreadcrumbProps {
  customItems?: { label: string; href?: string }[];
}

export function AdminBreadcrumb({ customItems }: AdminBreadcrumbProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb items from path
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = ROUTE_LABELS[segment] || segment;
    const isLast = index === pathSegments.length - 1;

    return { label, path, isLast };
  });

  // Override with custom items if provided
  const items = customItems
    ? [
        { label: "Dashboard", path: "/admin", isLast: false },
        ...customItems.map((item, i) => ({
          label: item.label,
          path: item.href || "",
          isLast: i === customItems.length - 1,
        })),
      ]
    : breadcrumbItems;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbSeparator />
            {item.isLast ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={item.path}>{item.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
