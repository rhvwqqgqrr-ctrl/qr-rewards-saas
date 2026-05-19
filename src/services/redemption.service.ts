import prisma from "@/lib/prisma";
import { verifyRedemptionToken } from "@/lib/tokens";
import { acquireLock, releaseLock } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";
import { logAuditEvent } from "@/lib/audit";
import { AppError, NotFoundError, ConflictError } from "@/lib/errors";
import { ActorType, CouponStatus } from "@prisma/client";
import crypto from "crypto";

/**
 * Resolve a redemption token and return coupon details.
 * Called when staff scans the QR code.
 */
export async function resolveRedemptionToken(token: string) {
  // Verify JWT
  let payload;
  try {
    payload = verifyRedemptionToken(token);
  } catch {
    throw new AppError("Invalid or expired redemption token", 400, "INVALID_TOKEN");
  }

  // Find token hash
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const redemptionToken = await prisma.redemptionToken.findUnique({
    where: { tokenHash },
    include: {
      coupon: {
        include: {
          prize: true,
          restaurant: { select: { name: true, slug: true, timezone: true } },
          campaign: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!redemptionToken || !redemptionToken.active) {
    throw new NotFoundError("Redemption token");
  }

  const coupon = redemptionToken.coupon;

  // Compute effective status
  const now = new Date();
  let effectiveStatus = coupon.status;

  if (coupon.status === "ISSUED" && now >= coupon.activationAt) {
    effectiveStatus = "ACTIVE" as CouponStatus;
  }
  if (
    (coupon.status === "ISSUED" || coupon.status === "ACTIVE") &&
    now > coupon.expiresAt
  ) {
    effectiveStatus = "EXPIRED" as CouponStatus;
  }

  return {
    couponId: coupon.id,
    humanCode: coupon.humanCode,
    status: effectiveStatus,
    prize: {
      type: coupon.prize.type,
      label: coupon.prize.label,
      description: coupon.prize.description,
      percentValue: coupon.prize.percentValue,
      fixedValue: coupon.prize.fixedValue,
    },
    activationAt: coupon.activationAt,
    expiresAt: coupon.expiresAt,
    redeemedAt: coupon.redeemedAt,
    restaurant: coupon.restaurant,
    campaign: coupon.campaign,
    isRedeemable: effectiveStatus === "ACTIVE" && !coupon.redeemedAt,
  };
}

/**
 * Atomically redeem a coupon.
 * Uses database transaction + Redis lock for double-redemption prevention.
 */
export async function redeemCoupon(
  couponId: string,
  staffUserId: string,
  restaurantId: string
) {
  const lockKey = `redeem:${couponId}`;
  const locked = await acquireLock(lockKey, 10000);
  if (!locked) {
    throw new ConflictError("Redemption already in progress");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Fetch coupon with lock (SELECT FOR UPDATE via transaction isolation)
      const coupon = await tx.coupon.findUnique({
        where: { id: couponId },
        include: { prize: true },
      });

      if (!coupon) {
        throw new NotFoundError("Coupon", couponId);
      }

      // Verify restaurant scope
      if (coupon.restaurantId !== restaurantId) {
        throw new AppError("Coupon does not belong to this restaurant", 403, "WRONG_TENANT");
      }

      // Check if already redeemed
      if (coupon.status === "REDEEMED") {
        throw new ConflictError("Coupon has already been redeemed");
      }

      // Check if cancelled or fraud-flagged
      if (coupon.status === "CANCELLED" || coupon.status === "FRAUD_FLAGGED") {
        throw new AppError(`Coupon is ${coupon.status.toLowerCase()}`, 400, "COUPON_INVALID");
      }

      // Check validity dates
      const now = new Date();
      if (now < coupon.activationAt) {
        throw new AppError(
          "Coupon is not yet active. It will be valid starting tomorrow.",
          400,
          "COUPON_NOT_YET_ACTIVE"
        );
      }
      if (now > coupon.expiresAt) {
        // Auto-expire
        await tx.coupon.update({
          where: { id: couponId },
          data: { status: "EXPIRED" },
        });
        throw new AppError("Coupon has expired", 400, "COUPON_EXPIRED");
      }

      // Perform atomic redemption
      const updated = await tx.coupon.update({
        where: { id: couponId },
        data: {
          status: "REDEEMED",
          redeemedAt: now,
          redeemedByRestaurantUserId: staffUserId,
        },
        include: { prize: true },
      });

      // Deactivate redemption token
      await tx.redemptionToken.updateMany({
        where: { couponId },
        data: { active: false },
      });

      return updated;
    });

    // Track analytics (outside transaction)
    await trackEvent({
      restaurantId,
      campaignId: result.campaignId,
      type: "COUPON_REDEEMED",
      payload: { couponId, staffUserId, prizeType: result.prize.type },
    });

    // Audit
    await logAuditEvent({
      restaurantId,
      actorType: ActorType.RESTAURANT_USER,
      actorId: staffUserId,
      entityType: "coupon",
      entityId: couponId,
      eventType: "COUPON_REDEEMED",
      payload: {
        prizeLabel: result.prize.label,
        prizeType: result.prize.type,
      },
    });

    return {
      success: true,
      coupon: {
        id: result.id,
        humanCode: result.humanCode,
        status: result.status,
        prize: {
          type: result.prize.type,
          label: result.prize.label,
        },
        redeemedAt: result.redeemedAt,
      },
    };
  } finally {
    await releaseLock(lockKey);
  }
}
