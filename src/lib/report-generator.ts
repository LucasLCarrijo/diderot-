// Dynamic imports - these heavy libraries will only load when generatePDF or generateExcel is called
// This prevents them from being included in the initial bundle
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportData {
  generatedAt: string;
  period: {
    start: string;
    end: string;
    label: string;
  };
  executive?: ExecutiveData;
  users?: UsersData;
  financial?: FinancialData;
  engagement?: EngagementData;
  creators?: CreatorsData;
  products?: ProductsData;
  campaigns?: CampaignsData;
}

interface ExecutiveData {
  newUsers: number;
  newProducts: number;
  totalClicks: number;
  totalFavorites: number;
  totalFollows: number;
  activeSubscriptions: number;
  comparison?: {
    newUsers: number;
    newProducts: number;
    totalClicks: number;
    totalFavorites: number;
    totalFollows: number;
  };
}

interface UsersData {
  totalUsers: number;
  newUsers: number;
  verifiedCreators: number;
  roleDistribution: { admin: number; creator: number; follower: number };
  comparison?: { newUsers: number };
}

interface FinancialData {
  activeSubscriptions: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  mrr: number;
  arr: number;
  pricePerSubscription: number;
  comparison?: { newSubscriptions: number };
}

interface EngagementData {
  totalClicks: number;
  totalFavorites: number;
  totalFollows: number;
  newPosts: number;
  topProducts?: Array<{ id: string; title: string; click_count: number; favorite_count: number; store: string }>;
  comparison?: { totalClicks: number; totalFavorites: number; totalFollows: number };
}

interface CreatorsData {
  totalCreators: number;
  verifiedCreators: number;
  topCreators?: Array<{ id: string; name: string; username: string; is_verified: boolean; productCount: number }>;
}

interface ProductsData {
  totalProducts: number;
  newProducts: number;
  publishedProducts: number;
  topByClicks?: Array<{ id: string; title: string; click_count: number; favorite_count: number; store: string; creator: { name: string; username: string } }>;
  topByFavorites?: Array<{ id: string; title: string; click_count: number; favorite_count: number; store: string; creator: { name: string; username: string } }>;
}

interface CampaignsData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  campaigns: Array<{ id: string; title: string; budget: number; status: string; clicks: number; conversions: number; impressions: number; brand: { company_name: string } }>;
}

const reportTypeLabels: Record<string, string> = {
  executive: "Relatório Executivo",
  users: "Relatório de Usuários",
  financial: "Relatório Financeiro",
  engagement: "Relatório de Engagement",
  creators: "Relatório de Creators",
  products: "Relatório de Produtos",
  campaigns: "Relatório de Campanhas",
};

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function calculateDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

export async function generatePDF(data: ReportData, selectedTypes: string[]): Promise<void> {
  // Dynamic imports - only loaded when this function is called
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable")
  ]);

  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("Diderot - Relatório", 14, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`, 14, yPos);
  yPos += 5;
  doc.text(`Gerado em: ${formatDate(data.generatedAt)}`, 14, yPos);
  yPos += 15;

  // Executive Summary
  if (data.executive && selectedTypes.includes("executive")) {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Resumo Executivo", 14, yPos);
    yPos += 10;

    const execData = [
      ["Métrica", "Valor", data.executive.comparison ? "Período Anterior" : "", data.executive.comparison ? "Variação" : ""],
      ["Novos Usuários", data.executive.newUsers.toString(), data.executive.comparison?.newUsers.toString() || "", data.executive.comparison ? calculateDelta(data.executive.newUsers, data.executive.comparison.newUsers) : ""],
      ["Novos Produtos", data.executive.newProducts.toString(), data.executive.comparison?.newProducts.toString() || "", data.executive.comparison ? calculateDelta(data.executive.newProducts, data.executive.comparison.newProducts) : ""],
      ["Total de Cliques", data.executive.totalClicks.toString(), data.executive.comparison?.totalClicks.toString() || "", data.executive.comparison ? calculateDelta(data.executive.totalClicks, data.executive.comparison.totalClicks) : ""],
      ["Total de Favoritos", data.executive.totalFavorites.toString(), data.executive.comparison?.totalFavorites.toString() || "", data.executive.comparison ? calculateDelta(data.executive.totalFavorites, data.executive.comparison.totalFavorites) : ""],
      ["Total de Follows", data.executive.totalFollows.toString(), data.executive.comparison?.totalFollows.toString() || "", data.executive.comparison ? calculateDelta(data.executive.totalFollows, data.executive.comparison.totalFollows) : ""],
      ["Assinaturas Ativas", data.executive.activeSubscriptions.toString(), "", ""],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [execData[0]],
      body: execData.slice(1),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Users
  if (data.users && selectedTypes.includes("users")) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.text("Usuários", 14, yPos);
    yPos += 10;

    const usersData = [
      ["Métrica", "Valor"],
      ["Total de Usuários", data.users.totalUsers.toString()],
      ["Novos Usuários", data.users.newUsers.toString()],
      ["Creators Verificados", data.users.verifiedCreators.toString()],
      ["Admins", data.users.roleDistribution.admin.toString()],
      ["Creators", data.users.roleDistribution.creator.toString()],
      ["Followers", data.users.roleDistribution.follower.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [usersData[0]],
      body: usersData.slice(1),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Financial
  if (data.financial && selectedTypes.includes("financial")) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.text("Financeiro", 14, yPos);
    yPos += 10;

    const finData = [
      ["Métrica", "Valor"],
      ["MRR", formatCurrency(data.financial.mrr)],
      ["ARR", formatCurrency(data.financial.arr)],
      ["Assinaturas Ativas", data.financial.activeSubscriptions.toString()],
      ["Novas Assinaturas", data.financial.newSubscriptions.toString()],
      ["Cancelamentos Pendentes", data.financial.canceledSubscriptions.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [finData[0]],
      body: finData.slice(1),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Engagement
  if (data.engagement && selectedTypes.includes("engagement")) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.text("Engagement", 14, yPos);
    yPos += 10;

    const engData = [
      ["Métrica", "Valor", data.engagement.comparison ? "Período Anterior" : "", data.engagement.comparison ? "Variação" : ""],
      ["Total de Cliques", data.engagement.totalClicks.toString(), data.engagement.comparison?.totalClicks.toString() || "", data.engagement.comparison ? calculateDelta(data.engagement.totalClicks, data.engagement.comparison.totalClicks) : ""],
      ["Total de Favoritos", data.engagement.totalFavorites.toString(), data.engagement.comparison?.totalFavorites.toString() || "", data.engagement.comparison ? calculateDelta(data.engagement.totalFavorites, data.engagement.comparison.totalFavorites) : ""],
      ["Total de Follows", data.engagement.totalFollows.toString(), data.engagement.comparison?.totalFollows.toString() || "", data.engagement.comparison ? calculateDelta(data.engagement.totalFollows, data.engagement.comparison.totalFollows) : ""],
      ["Novos Posts", data.engagement.newPosts.toString(), "", ""],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [engData[0]],
      body: engData.slice(1),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    if (data.engagement.topProducts && data.engagement.topProducts.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text("Top 10 Produtos por Cliques", 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [["Produto", "Loja", "Cliques", "Favoritos"]],
        body: data.engagement.topProducts.map((p) => [p.title, p.store || "-", p.click_count?.toString() || "0", p.favorite_count?.toString() || "0"]),
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Products
  if (data.products && selectedTypes.includes("products")) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.text("Produtos", 14, yPos);
    yPos += 10;

    const prodData = [
      ["Métrica", "Valor"],
      ["Total de Produtos", data.products.totalProducts.toString()],
      ["Novos Produtos", data.products.newProducts.toString()],
      ["Produtos Publicados", data.products.publishedProducts.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [prodData[0]],
      body: prodData.slice(1),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Campaigns
  if (data.campaigns && selectedTypes.includes("campaigns")) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.text("Campanhas", 14, yPos);
    yPos += 10;

    const campData = [
      ["Métrica", "Valor"],
      ["Total de Campanhas", data.campaigns.totalCampaigns.toString()],
      ["Campanhas Ativas", data.campaigns.activeCampaigns.toString()],
      ["Budget Total", formatCurrency(data.campaigns.totalBudget)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [campData[0]],
      body: campData.slice(1),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
  }

  doc.save(`diderot-relatorio-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

export function generateCSV(data: ReportData, selectedTypes: string[]): void {
  const rows: string[][] = [];

  rows.push(["Diderot - Relatório"]);
  rows.push([`Período: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`]);
  rows.push([`Gerado em: ${formatDate(data.generatedAt)}`]);
  rows.push([]);

  if (data.executive && selectedTypes.includes("executive")) {
    rows.push(["RESUMO EXECUTIVO"]);
    rows.push(["Métrica", "Valor", "Período Anterior", "Variação"]);
    rows.push(["Novos Usuários", data.executive.newUsers.toString(), data.executive.comparison?.newUsers.toString() || "", data.executive.comparison ? calculateDelta(data.executive.newUsers, data.executive.comparison.newUsers) : ""]);
    rows.push(["Novos Produtos", data.executive.newProducts.toString(), data.executive.comparison?.newProducts.toString() || "", data.executive.comparison ? calculateDelta(data.executive.newProducts, data.executive.comparison.newProducts) : ""]);
    rows.push(["Total de Cliques", data.executive.totalClicks.toString(), data.executive.comparison?.totalClicks.toString() || "", data.executive.comparison ? calculateDelta(data.executive.totalClicks, data.executive.comparison.totalClicks) : ""]);
    rows.push(["Total de Favoritos", data.executive.totalFavorites.toString(), data.executive.comparison?.totalFavorites.toString() || "", data.executive.comparison ? calculateDelta(data.executive.totalFavorites, data.executive.comparison.totalFavorites) : ""]);
    rows.push(["Total de Follows", data.executive.totalFollows.toString(), data.executive.comparison?.totalFollows.toString() || "", data.executive.comparison ? calculateDelta(data.executive.totalFollows, data.executive.comparison.totalFollows) : ""]);
    rows.push(["Assinaturas Ativas", data.executive.activeSubscriptions.toString()]);
    rows.push([]);
  }

  if (data.users && selectedTypes.includes("users")) {
    rows.push(["USUÁRIOS"]);
    rows.push(["Métrica", "Valor"]);
    rows.push(["Total de Usuários", data.users.totalUsers.toString()]);
    rows.push(["Novos Usuários", data.users.newUsers.toString()]);
    rows.push(["Creators Verificados", data.users.verifiedCreators.toString()]);
    rows.push(["Admins", data.users.roleDistribution.admin.toString()]);
    rows.push(["Creators", data.users.roleDistribution.creator.toString()]);
    rows.push(["Followers", data.users.roleDistribution.follower.toString()]);
    rows.push([]);
  }

  if (data.financial && selectedTypes.includes("financial")) {
    rows.push(["FINANCEIRO"]);
    rows.push(["Métrica", "Valor"]);
    rows.push(["MRR", formatCurrency(data.financial.mrr)]);
    rows.push(["ARR", formatCurrency(data.financial.arr)]);
    rows.push(["Assinaturas Ativas", data.financial.activeSubscriptions.toString()]);
    rows.push(["Novas Assinaturas", data.financial.newSubscriptions.toString()]);
    rows.push(["Cancelamentos Pendentes", data.financial.canceledSubscriptions.toString()]);
    rows.push([]);
  }

  if (data.engagement && selectedTypes.includes("engagement")) {
    rows.push(["ENGAGEMENT"]);
    rows.push(["Métrica", "Valor"]);
    rows.push(["Total de Cliques", data.engagement.totalClicks.toString()]);
    rows.push(["Total de Favoritos", data.engagement.totalFavorites.toString()]);
    rows.push(["Total de Follows", data.engagement.totalFollows.toString()]);
    rows.push(["Novos Posts", data.engagement.newPosts.toString()]);
    rows.push([]);

    if (data.engagement.topProducts && data.engagement.topProducts.length > 0) {
      rows.push(["TOP 10 PRODUTOS"]);
      rows.push(["Produto", "Loja", "Cliques", "Favoritos"]);
      data.engagement.topProducts.forEach((p) => {
        rows.push([p.title, p.store || "-", p.click_count?.toString() || "0", p.favorite_count?.toString() || "0"]);
      });
      rows.push([]);
    }
  }

  if (data.products && selectedTypes.includes("products")) {
    rows.push(["PRODUTOS"]);
    rows.push(["Métrica", "Valor"]);
    rows.push(["Total de Produtos", data.products.totalProducts.toString()]);
    rows.push(["Novos Produtos", data.products.newProducts.toString()]);
    rows.push(["Produtos Publicados", data.products.publishedProducts.toString()]);
    rows.push([]);
  }

  if (data.campaigns && selectedTypes.includes("campaigns")) {
    rows.push(["CAMPANHAS"]);
    rows.push(["Métrica", "Valor"]);
    rows.push(["Total de Campanhas", data.campaigns.totalCampaigns.toString()]);
    rows.push(["Campanhas Ativas", data.campaigns.activeCampaigns.toString()]);
    rows.push(["Budget Total", formatCurrency(data.campaigns.totalBudget)]);
    rows.push([]);
  }

  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `diderot-relatorio-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
  link.click();
}

export async function generateExcel(data: ReportData, selectedTypes: string[]): Promise<void> {
  // Dynamic import - only loaded when this function is called
  const XLSX = await import("xlsx");

  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData: any[][] = [
    ["Diderot - Relatório"],
    [`Período: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`],
    [`Gerado em: ${formatDate(data.generatedAt)}`],
    [],
    ["Tipos de Relatório Incluídos:"],
    ...selectedTypes.map((type) => [reportTypeLabels[type] || type]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");

  // Executive sheet
  if (data.executive && selectedTypes.includes("executive")) {
    const execData = [
      ["Métrica", "Valor", "Período Anterior", "Variação"],
      ["Novos Usuários", data.executive.newUsers, data.executive.comparison?.newUsers || "", data.executive.comparison ? calculateDelta(data.executive.newUsers, data.executive.comparison.newUsers) : ""],
      ["Novos Produtos", data.executive.newProducts, data.executive.comparison?.newProducts || "", data.executive.comparison ? calculateDelta(data.executive.newProducts, data.executive.comparison.newProducts) : ""],
      ["Total de Cliques", data.executive.totalClicks, data.executive.comparison?.totalClicks || "", data.executive.comparison ? calculateDelta(data.executive.totalClicks, data.executive.comparison.totalClicks) : ""],
      ["Total de Favoritos", data.executive.totalFavorites, data.executive.comparison?.totalFavorites || "", data.executive.comparison ? calculateDelta(data.executive.totalFavorites, data.executive.comparison.totalFavorites) : ""],
      ["Total de Follows", data.executive.totalFollows, data.executive.comparison?.totalFollows || "", data.executive.comparison ? calculateDelta(data.executive.totalFollows, data.executive.comparison.totalFollows) : ""],
      ["Assinaturas Ativas", data.executive.activeSubscriptions, "", ""],
    ];
    const execSheet = XLSX.utils.aoa_to_sheet(execData);
    XLSX.utils.book_append_sheet(workbook, execSheet, "Executivo");
  }

  // Users sheet
  if (data.users && selectedTypes.includes("users")) {
    const usersData = [
      ["Métrica", "Valor"],
      ["Total de Usuários", data.users.totalUsers],
      ["Novos Usuários", data.users.newUsers],
      ["Creators Verificados", data.users.verifiedCreators],
      ["Admins", data.users.roleDistribution.admin],
      ["Creators", data.users.roleDistribution.creator],
      ["Followers", data.users.roleDistribution.follower],
    ];
    const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
    XLSX.utils.book_append_sheet(workbook, usersSheet, "Usuários");
  }

  // Financial sheet
  if (data.financial && selectedTypes.includes("financial")) {
    const finData = [
      ["Métrica", "Valor"],
      ["MRR", data.financial.mrr],
      ["ARR", data.financial.arr],
      ["Assinaturas Ativas", data.financial.activeSubscriptions],
      ["Novas Assinaturas", data.financial.newSubscriptions],
      ["Cancelamentos Pendentes", data.financial.canceledSubscriptions],
    ];
    const finSheet = XLSX.utils.aoa_to_sheet(finData);
    XLSX.utils.book_append_sheet(workbook, finSheet, "Financeiro");
  }

  // Engagement sheet
  if (data.engagement && selectedTypes.includes("engagement")) {
    const engData: any[][] = [
      ["Métrica", "Valor"],
      ["Total de Cliques", data.engagement.totalClicks],
      ["Total de Favoritos", data.engagement.totalFavorites],
      ["Total de Follows", data.engagement.totalFollows],
      ["Novos Posts", data.engagement.newPosts],
    ];

    if (data.engagement.topProducts && data.engagement.topProducts.length > 0) {
      engData.push([]);
      engData.push(["TOP 10 PRODUTOS"]);
      engData.push(["Produto", "Loja", "Cliques", "Favoritos"]);
      data.engagement.topProducts.forEach((p) => {
        engData.push([p.title, p.store || "-", p.click_count || 0, p.favorite_count || 0]);
      });
    }

    const engSheet = XLSX.utils.aoa_to_sheet(engData);
    XLSX.utils.book_append_sheet(workbook, engSheet, "Engagement");
  }

  // Products sheet
  if (data.products && selectedTypes.includes("products")) {
    const prodData: any[][] = [
      ["Métrica", "Valor"],
      ["Total de Produtos", data.products.totalProducts],
      ["Novos Produtos", data.products.newProducts],
      ["Produtos Publicados", data.products.publishedProducts],
    ];

    if (data.products.topByClicks && data.products.topByClicks.length > 0) {
      prodData.push([]);
      prodData.push(["TOP POR CLIQUES"]);
      prodData.push(["Produto", "Creator", "Loja", "Cliques", "Favoritos"]);
      data.products.topByClicks.forEach((p) => {
        prodData.push([p.title, p.creator?.name || "-", p.store || "-", p.click_count || 0, p.favorite_count || 0]);
      });
    }

    const prodSheet = XLSX.utils.aoa_to_sheet(prodData);
    XLSX.utils.book_append_sheet(workbook, prodSheet, "Produtos");
  }

  // Campaigns sheet
  if (data.campaigns && selectedTypes.includes("campaigns")) {
    const campData: any[][] = [
      ["Métrica", "Valor"],
      ["Total de Campanhas", data.campaigns.totalCampaigns],
      ["Campanhas Ativas", data.campaigns.activeCampaigns],
      ["Budget Total", data.campaigns.totalBudget],
    ];

    if (data.campaigns.campaigns && data.campaigns.campaigns.length > 0) {
      campData.push([]);
      campData.push(["LISTA DE CAMPANHAS"]);
      campData.push(["Título", "Brand", "Budget", "Status", "Cliques", "Conversões"]);
      data.campaigns.campaigns.forEach((c) => {
        campData.push([c.title, c.brand?.company_name || "-", c.budget || 0, c.status, c.clicks || 0, c.conversions || 0]);
      });
    }

    const campSheet = XLSX.utils.aoa_to_sheet(campData);
    XLSX.utils.book_append_sheet(workbook, campSheet, "Campanhas");
  }

  XLSX.writeFile(workbook, `diderot-relatorio-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`);
}

export function generateJSON(data: ReportData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `diderot-relatorio-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
  link.click();
}
