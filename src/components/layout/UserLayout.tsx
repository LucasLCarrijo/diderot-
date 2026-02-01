import { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileAccountNav } from "@/components/me/MobileAccountNav";

interface UserLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function UserLayout({ children, title, description }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
              {description && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {children}
          </div>
        </main>
      <MobileAccountNav />
    </div>
  );
}
