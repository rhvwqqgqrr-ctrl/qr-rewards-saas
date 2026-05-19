import prisma from "@/lib/prisma";
import { Prize } from "@prisma/client";

interface WeightedPrize {
  prize: Prize;
  effectiveWeight: number;
}

/**
 * Weighted prize engine.
 * Loads active prizes, computes effective weights considering stock,
 * then selects one prize using a uniform random draw.
 */
export async function drawPrize(campaignId: string): Promise<Prize> {
  const prizes = await prisma.prize.findMany({
    where: {
      campaignId,
      active: true,
    },
    orderBy: { displayOrder: "asc" },
  });

  if (prizes.length === 0) {
    throw new Error("No active prizes configured for this campaign");
  }

  // Build weighted list considering stock
  const weightedPrizes: WeightedPrize[] = [];

  for (const prize of prizes) {
    let effectiveWeight = prize.weight;

    // Check global stock
    if (prize.stockGlobal !== null && prize.remainingStock !== null) {
      if (prize.remainingStock <= 0) {
        effectiveWeight = 0;
      }
    }

    // Check daily stock
    if (prize.stockDaily !== null && effectiveWeight > 0) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayCount = await prisma.spin.count({
        where: {
          prizeId: prize.id,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      if (todayCount >= prize.stockDaily) {
        effectiveWeight = 0;
      }
    }

    if (effectiveWeight > 0) {
      weightedPrizes.push({ prize, effectiveWeight });
    }
  }

  // If no prizes have weight, find "no prize" fallback
  if (weightedPrizes.length === 0) {
    const noPrize = prizes.find((p) => p.type === "NO_PRIZE");
    if (noPrize) return noPrize;
    throw new Error("All prizes exhausted and no fallback configured");
  }

  // Weighted random selection
  const totalWeight = weightedPrizes.reduce((sum, wp) => sum + wp.effectiveWeight, 0);
  const random = Math.random() * totalWeight;

  let cumulative = 0;
  for (const wp of weightedPrizes) {
    cumulative += wp.effectiveWeight;
    if (random <= cumulative) {
      return wp.prize;
    }
  }

  // Fallback (should not reach here)
  return weightedPrizes[weightedPrizes.length - 1].prize;
}

/**
 * Get the random value used for draw (for audit/signature)
 */
export function generateRandomValue(): number {
  return Math.random();
}
