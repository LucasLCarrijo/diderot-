import { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CreatorSidebar } from "./CreatorSidebar";

interface CreatorLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function CreatorLayout({ children, title, description, actions }: CreatorLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="flex">
        <CreatorSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
                {description && (
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
