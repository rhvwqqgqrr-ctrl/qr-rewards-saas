import prisma from "@/lib/prisma";
import { verifySessionToken, signSpin } from "@/lib/tokens";
import { drawPrize, generateRandomValue } from "./prize-engine.service";
import { createCoupon } from "./coupon.service";
import { acquireLock, releaseLock, checkRateLimit } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";
import { logAuditEvent } from "@/lib/audit";
import { AppError, RateLimitError, ConflictError } from "@/lib/errors";
import { ActorType } from "@prisma/client";

interface SpinResult {
  won: boolean;
  prize: {
    id: string;
    type: string;
    label: string;
    description: string | null;
  };
  coupon?: {
    humanCode: string;
    activationAt: string;
    expiresAt: string;
    redemptionToken: string;
  };
  spinSignature: string;
}

export async function executeSpin(sessionToken: string, ip?: string): Promise<SpinResult> {
  // Verify session token
  let tokenPayload;
  try {
    tokenPayload = verifySessionToken(sessionToken);
  } catch {
    throw new AppError("Invalid or expired session", 401, "INVALID_SESSION");
  }

  const { sessionId, campaignId, restaurantId } = tokenPayload;

  // Rate limit by IP
  if (ip) {
    const rateCheck = await checkRateLimit({
      key: `spin:ip:${ip}`,
      limit: 1,
      windowSeconds: 86400,
    });
    if (!rateCheck.allowed) {
      throw new RateLimitError("Too many spins");
    }
  }

  // Acquire lock to prevent double spin
  const lockKey = `spin:${sessionId}`;
  const locked = await acquireLock(lockKey, 10000);
  if (!locked) {
    throw new ConflictError("Spin already in progress");
  }

  try {
    // Check session hasn't already been spun
    const existingSpin = await prisma.spin.findUnique({
      where: { playSessionId: sessionId },
    });
    if (existingSpin) {
      throw new ConflictError("This session has already been played");
    }

    // Check session is eligible
    const session = await prisma.playSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || !session.eligible) {
      throw new AppError("Session not eligible for spin", 400, "NOT_ELIGIBLE");
    }

    // Draw prize
    const prize = await drawPrize(campaignId);
    const randomValue = generateRandomValue();

    // Sign the spin
    const signature = signSpin({
      sessionId,
      prizeId: prize.id,
      randomValue,
    });

    // Create spin record
    const spin = await prisma.spin.create({
      data: {
        playSessionId: sessionId,
        prizeId: prize.id,
        randomValue,
        signature,
      },
    });

    // Decrement stock if applicable
    if (prize.stockGlobal !== null && prize.remainingStock !== null && prize.type !== "NO_PRIZE") {
      await prisma.prize.update({
        where: { id: prize.id },
        data: { remainingStock: { decrement: 1 } },
      });
    }

    const won = prize.type !== "NO_PRIZE";

    // Track analytics
    await trackEvent({
      restaurantId,
      campaignId,
      playSessionId: sessionId,
      type: "SPIN",
    });

    await trackEvent({
      restaurantId,
      campaignId,
      playSessionId: sessionId,
      type: won ? "WIN" : "LOSS",
      payload: { prizeId: prize.id, prizeType: prize.type },
    });

    // Audit
    await logAuditEvent({
      restaurantId,
      actorType: ActorType.ANONYMOUS,
      entityType: "spin",
      entityId: spin.id,
      eventType: won ? "SPIN_WIN" : "SPIN_LOSS",
      payload: { prizeId: prize.id, prizeType: prize.type },
    });

    // If won, create coupon
    let couponData;
    if (won) {
      couponData = await createCoupon({
        restaurantId,
        campaignId,
        spinId: spin.id,
        prizeId: prize.id,
      });
    }

    return {
      won,
      prize: {
        id: prize.id,
        type: prize.type,
        label: prize.label,
        description: prize.description,
      },
      coupon: couponData
        ? {
            humanCode: couponData.humanCode,
            activationAt: couponData.activationAt.toISOString(),
            expiresAt: couponData.expiresAt.toISOString(),
            redemptionToken: couponData.redemptionToken,
          }
        : undefined,
      spinSignature: signature,
    };
  } finally {
    await releaseLock(lockKey);
  }
}
