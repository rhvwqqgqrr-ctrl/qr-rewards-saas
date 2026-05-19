import prisma from "@/lib/prisma";
import { generateHumanCode, createRedemptionToken } from "@/lib/tokens";
import { computeCouponValidity } from "@/lib/date-utils";
import { trackEvent } from "@/lib/analytics";
import { logAuditEvent } from "@/lib/audit";
import { ActorType } from "@prisma/client";

interface CreateCouponParams {
  restaurantId: string;
  campaignId: string;
  spinId: string;
  prizeId: string;
}

export async function createCoupon(params: CreateCouponParams) {
  const { restaurantId, campaignId, spinId, prizeId } = params;

  // Get restaurant timezone
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { timezone: true },
  });
  const timezone = restaurant?.timezone || "Europe/Paris";

  // Compute validity dates
  const now = new Date();
  const { activationAt, expiresAt } = computeCouponValidity(now, timezone);

  // Generate unique human code (retry if collision)
  let humanCode: string;
  let attempts = 0;
  do {
    humanCode = generateHumanCode();
    const existing = await prisma.coupon.findUnique({
      where: { humanCode },
    });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error("Failed to generate unique coupon code");
  }

  // Create coupon
  const coupon = await prisma.coupon.create({
    data: {
      restaurantId,
      campaignId,
      spinId,
      prizeId,
      humanCode,
      status: "ISSUED",
      activationAt,
      expiresAt,
    },
  });

  // Generate redemption token
  const { token, tokenHash } = createRedemptionToken(coupon.id);

  await prisma.redemptionToken.create({
    data: {
      couponId: coupon.id,
      tokenHash,
      active: true,
    },
  });

  // Track analytics
  await trackEvent({
    restaurantId,
    campaignId,
    type: "COUPON_ISSUED",
    payload: { couponId: coupon.id, prizeId },
  });

  // Audit
  await logAuditEvent({
    restaurantId,
    actorType: ActorType.SYSTEM,
    entityType: "coupon",
    entityId: coupon.id,
    eventType: "COUPON_CREATED",
    payload: { humanCode, prizeId, activationAt: activationAt.toISOString(), expiresAt: expiresAt.toISOString() },
  });

  return {
    couponId: coupon.id,
    humanCode,
    activationAt,
    expiresAt,
    redemptionToken: token,
  };
}

export async function getCouponByHumanCode(humanCode: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { humanCode },
    include: {
      prize: true,
      restaurant: { select: { name: true, slug: true, timezone: true } },
      campaign: { select: { name: true, slug: true } },
    },
  });

  if (!coupon) return null;

  // Auto-update status based on time
  const now = new Date();
  let effectiveStatus = coupon.status;

  if (coupon.status === "ISSUED" && now >= coupon.activationAt) {
    effectiveStatus = "ACTIVE";
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { status: "ACTIVE" },
    });
  }

  if (
    (coupon.status === "ISSUED" || coupon.status === "ACTIVE") &&
    now > coupon.expiresAt
  ) {
    effectiveStatus = "EXPIRED";
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { status: "EXPIRED" },
    });
  }

  return { ...coupon, status: effectiveStatus };
}
