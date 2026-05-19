import prisma from "@/lib/prisma";

export async function getRestaurantDashboard(restaurantId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    totalScans,
    totalSessions,
    totalSpins,
    totalWins,
    totalLosses,
    totalCouponsIssued,
    totalCouponsRedeemed,
    reviewClicks,
    recentEvents,
    prizeBreakdown,
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { restaurantId, type: "QR_SCAN", createdAt: { gte: since } },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId, type: "SESSION_START", createdAt: { gte: since } },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId, type: "SPIN", createdAt: { gte: since } },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId, type: "WIN", createdAt: { gte: since } },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId, type: "LOSS", createdAt: { gte: since } },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId, type: "COUPON_ISSUED", createdAt: { gte: since } },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId, type: "COUPON_REDEEMED", createdAt: { gte: since } },
    }),
    prisma.analyticsEvent.count({
      where: { restaurantId, type: "REVIEW_CLICK", createdAt: { gte: since } },
    }),
    prisma.analyticsEvent.findMany({
      where: { restaurantId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { type: true, createdAt: true, payloadJson: true },
    }),
    prisma.spin.groupBy({
      by: ["prizeId"],
      where: {
        playSession: { restaurantId },
        createdAt: { gte: since },
      },
      _count: { id: true },
    }),
  ]);

  const winRate = totalSpins > 0 ? ((totalWins / totalSpins) * 100).toFixed(1) : "0";
  const redemptionRate =
    totalCouponsIssued > 0
      ? ((totalCouponsRedeemed / totalCouponsIssued) * 100).toFixed(1)
      : "0";

  return {
    period: { days, since: since.toISOString() },
    metrics: {
      totalScans,
      totalSessions,
      totalSpins,
      totalWins,
      totalLosses,
      winRate: `${winRate}%`,
      totalCouponsIssued,
      totalCouponsRedeemed,
      redemptionRate: `${redemptionRate}%`,
      reviewClicks,
    },
    prizeBreakdown,
    recentEvents,
  };
}

export async function getPlatformDashboard(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    totalRestaurants,
    activeRestaurants,
    totalCampaigns,
    activeCampaigns,
    totalSpins,
    totalCoupons,
    totalRedemptions,
    restaurantStats,
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { status: "ACTIVE" } }),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.spin.count({ where: { createdAt: { gte: since } } }),
    prisma.coupon.count({ where: { createdAt: { gte: since } } }),
    prisma.coupon.count({
      where: { status: "REDEEMED", redeemedAt: { gte: since } },
    }),
    prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: {
          select: {
            campaigns: true,
            coupons: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    period: { days, since: since.toISOString() },
    metrics: {
      totalRestaurants,
      activeRestaurants,
      totalCampaigns,
      activeCampaigns,
      totalSpins,
      totalCoupons,
      totalRedemptions,
    },
    restaurants: restaurantStats,
  };
}
