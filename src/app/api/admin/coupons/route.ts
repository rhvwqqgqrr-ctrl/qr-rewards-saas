import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const campaignId = url.searchParams.get("campaignId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { restaurantId };
    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          prize: { select: { type: true, label: true } },
          campaign: { select: { name: true, slug: true } },
          redeemedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return successResponse({
      coupons,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
