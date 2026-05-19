import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const coupons = await prisma.coupon.findMany({
      where: { restaurantId },
      include: {
        prize: { select: { type: true, label: true } },
        campaign: { select: { name: true } },
        redeemedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const csv = [
      "Code,Status,Prize,Campaign,Created,Activation,Expiration,Redeemed At,Redeemed By",
      ...coupons.map((c) =>
        [
          c.humanCode,
          c.status,
          c.prize.label,
          c.campaign.name,
          c.createdAt.toISOString(),
          c.activationAt.toISOString(),
          c.expiresAt.toISOString(),
          c.redeemedAt?.toISOString() || "",
          c.redeemedBy?.email || "",
        ].join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=coupons-${Date.now()}.csv`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
