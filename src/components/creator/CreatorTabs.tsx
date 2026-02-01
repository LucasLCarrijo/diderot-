import { cn } from "@/lib/utils";

type TabType = "products" | "collections" | "feed";

interface CreatorTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  productCount?: number;
  collectionCount?: number;
  postCount?: number;
}

export function CreatorTabs({
  activeTab,
  onTabChange,
  productCount = 0,
  collectionCount = 0,
  postCount = 0,
}: CreatorTabsProps) {
  const tabs = [
    { id: "products" as TabType, label: "Produtos", count: productCount },
    { id: "collections" as TabType, label: "Pastas", count: collectionCount },
    { id: "feed" as TabType, label: "Feed", count: postCount },
  ];

  return (
    <div className="border-b border-border">
      <nav className="container flex gap-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "py-4 px-1 text-sm font-medium transition-colors relative",
              activeTab === tab.id
                ? "tab-active"
                : "tab-inactive"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-muted-foreground">({tab.count})</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
