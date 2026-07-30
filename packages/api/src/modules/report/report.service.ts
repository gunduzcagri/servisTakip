import prisma from "../../common/utils/prisma";

export class ReportService {
  async revenueMonthly(year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const records = await prisma.serviceRecord.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        NOT: { status: "CANCELLED" },
      },
      select: {
        id: true,
        trackingNumber: true,
        estimatedCost: true,
        status: true,
        customer: { select: { fullName: true } },
        actions: { select: { laborCost: true } },
        serviceParts: { select: { unitPriceAtTime: true, quantity: true } },
      },
    });

    let totalRevenue = 0;
    let partsRevenue = 0;
    let laborRevenue = 0;

    for (const r of records) {
      if (r.estimatedCost) totalRevenue += r.estimatedCost;
      for (const a of r.actions) {
        if (a.laborCost) laborRevenue += a.laborCost;
      }
      for (const sp of r.serviceParts) {
        partsRevenue += sp.unitPriceAtTime * sp.quantity;
      }
    }

    return {
      period: `${targetYear}-${String(targetMonth).padStart(2, "0")}`,
      totalRecords: records.length,
      totalRevenue,
      laborRevenue,
      partsRevenue,
      records,
    };
  }

  async faultDistribution() {
    const records = await prisma.serviceRecord.findMany({
      select: { faultDescription: true },
    });

    const faultMap: Record<string, number> = {};

    for (const r of records) {
      const desc = r.faultDescription || "Belirtilmemis";
      const key = desc.length > 40 ? desc.substring(0, 40) + "..." : desc;
      faultMap[key] = (faultMap[key] || 0) + 1;
    }

    const distribution = Object.entries(faultMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return distribution;
  }

  async technicianPerformance() {
    const technicians = await prisma.user.findMany({
      where: { role: "TECHNICIAN", isActive: true },
      select: {
        id: true,
        fullName: true,
        technicianRecords: {
          select: {
            id: true,
            status: true,
            actions: { select: { timeSpentMin: true } },
          },
        },
      },
    });

    const performance = technicians.map((t) => {
      const total = t.technicianRecords.length;
      const completed = t.technicianRecords.filter(
        (r) => r.status === "READY" || r.status === "DELIVERED"
      ).length;
      const totalTimeMin = t.technicianRecords.reduce(
        (sum, r) => sum + r.actions.reduce((s, a) => s + (a.timeSpentMin || 0), 0),
        0
      );

      return {
        id: t.id,
        fullName: t.fullName,
        totalRecords: total,
        completed,
        avgTimeMin: total > 0 ? Math.round(totalTimeMin / total) : 0,
      };
    });

    return performance;
  }

  async statusSummary() {
    const records = await prisma.serviceRecord.findMany({
      select: { status: true },
    });

    const statusMap: Record<string, number> = {};

    for (const r of records) {
      statusMap[r.status] = (statusMap[r.status] || 0) + 1;
    }

    const statusLabels: Record<string, string> = {
      RECEIVED: "Kabul Edildi",
      INSPECTING: "Inceleniyor",
      PRICE_OFFER: "Fiyat Teklifi",
      APPROVED: "Onaylandi",
      CANCELLED: "Iptal",
      PARTS_WAITING: "Parca Bekliyor",
      REPAIRING: "Onarimda",
      QC: "Kalite Kontrol",
      READY: "Teslime Hazir",
      DELIVERED: "Teslim Edildi",
    };

    return Object.entries(statusMap).map(([status, count]) => ({
      status,
      label: statusLabels[status] || status,
      count,
    }));
  }

  async customerSatisfaction() {
    const ratings = await prisma.customerRating.findMany({
      select: { score: true },
    });

    if (ratings.length === 0) {
      return { avgScore: 0, total: 0, distribution: [] };
    }

    const total = ratings.length;
    const avgScore = ratings.reduce((sum, r) => sum + r.score, 0) / total;

    const dist: Record<number, number> = {};
    for (const r of ratings) {
      dist[r.score] = (dist[r.score] || 0) + 1;
    }

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      total,
      distribution: [1, 2, 3, 4, 5].map((score) => ({
        score,
        count: dist[score] || 0,
      })),
    };
  }
}

export const reportService = new ReportService();
