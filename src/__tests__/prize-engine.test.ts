/**
 * Prize Engine Tests
 *
 * These tests verify the weighted random draw logic.
 * Since the actual service depends on Prisma, we test the algorithm logic directly.
 */

describe("Weighted Prize Selection Algorithm", () => {
  interface MockPrize {
    id: string;
    label: string;
    weight: number;
    type: string;
    active: boolean;
    stockGlobal: number | null;
    remainingStock: number | null;
  }

  function selectPrize(prizes: MockPrize[], randomFraction: number): MockPrize {
    const activePrizes = prizes.filter((p) => {
      if (!p.active) return false;
      if (p.stockGlobal !== null && p.remainingStock !== null && p.remainingStock <= 0) return false;
      return true;
    });

    if (activePrizes.length === 0) {
      const noPrize = prizes.find((p) => p.type === "NO_PRIZE");
      if (noPrize) return noPrize;
      throw new Error("No prizes available");
    }

    const totalWeight = activePrizes.reduce((sum, p) => sum + p.weight, 0);
    const target = randomFraction * totalWeight;

    let cumulative = 0;
    for (const prize of activePrizes) {
      cumulative += prize.weight;
      if (target <= cumulative) return prize;
    }

    return activePrizes[activePrizes.length - 1];
  }

  const defaultPrizes: MockPrize[] = [
    { id: "1", label: "Café offert", weight: 20, type: "FREE_PRODUCT", active: true, stockGlobal: null, remainingStock: null },
    { id: "2", label: "Soft offert", weight: 15, type: "FREE_PRODUCT", active: true, stockGlobal: null, remainingStock: null },
    { id: "3", label: "Remise 5%", weight: 10, type: "DISCOUNT_PERCENT", active: true, stockGlobal: null, remainingStock: null },
    { id: "4", label: "Remise 10%", weight: 5, type: "DISCOUNT_PERCENT", active: true, stockGlobal: null, remainingStock: null },
    { id: "5", label: "Pas de chance", weight: 50, type: "NO_PRIZE", active: true, stockGlobal: null, remainingStock: null },
  ];

  it("should respect probability distribution approximately", () => {
    const counts: Record<string, number> = {};
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const result = selectPrize(defaultPrizes, Math.random());
      counts[result.id] = (counts[result.id] || 0) + 1;
    }

    // Total weight = 100, so expected proportions:
    // Coffee: 20%, Soft: 15%, 5%: 10%, 10%: 5%, No prize: 50%
    const tolerance = 3; // 3% tolerance

    expect(Math.abs((counts["1"] / iterations) * 100 - 20)).toBeLessThan(tolerance);
    expect(Math.abs((counts["2"] / iterations) * 100 - 15)).toBeLessThan(tolerance);
    expect(Math.abs((counts["3"] / iterations) * 100 - 10)).toBeLessThan(tolerance);
    expect(Math.abs((counts["4"] / iterations) * 100 - 5)).toBeLessThan(tolerance);
    expect(Math.abs((counts["5"] / iterations) * 100 - 50)).toBeLessThan(tolerance);
  });

  it("should select first prize when random is 0", () => {
    const result = selectPrize(defaultPrizes, 0);
    expect(result.id).toBe("1");
  });

  it("should select last prize when random is close to 1", () => {
    const result = selectPrize(defaultPrizes, 0.999);
    expect(result.id).toBe("5");
  });

  it("should skip exhausted prizes", () => {
    const prizesWithExhausted = defaultPrizes.map((p) =>
      p.id === "1" ? { ...p, stockGlobal: 10, remainingStock: 0 } : p
    );

    // Run multiple times - should never pick prize 1
    for (let i = 0; i < 100; i++) {
      const result = selectPrize(prizesWithExhausted, Math.random());
      expect(result.id).not.toBe("1");
    }
  });

  it("should skip inactive prizes", () => {
    const prizesWithInactive = defaultPrizes.map((p) =>
      p.id === "2" ? { ...p, active: false } : p
    );

    for (let i = 0; i < 100; i++) {
      const result = selectPrize(prizesWithInactive, Math.random());
      expect(result.id).not.toBe("2");
    }
  });

  it("should fall back to NO_PRIZE when all real prizes are exhausted", () => {
    const allExhausted = defaultPrizes.map((p) =>
      p.type !== "NO_PRIZE"
        ? { ...p, stockGlobal: 10, remainingStock: 0 }
        : p
    );

    const result = selectPrize(allExhausted, Math.random());
    expect(result.type).toBe("NO_PRIZE");
  });

  it("should recalculate weights when prizes are disabled", () => {
    // Disable everything except "Café offert" and "Pas de chance"
    const limited = defaultPrizes.map((p) =>
      p.id === "2" || p.id === "3" || p.id === "4" ? { ...p, active: false } : p
    );

    const counts: Record<string, number> = {};
    const iterations = 5000;

    for (let i = 0; i < iterations; i++) {
      const result = selectPrize(limited, Math.random());
      counts[result.id] = (counts[result.id] || 0) + 1;
    }

    // Remaining: Coffee (20) + No prize (50) = total 70
    // Coffee should be ~28.6%, No prize ~71.4%
    expect(counts["2"] || 0).toBe(0);
    expect(counts["3"] || 0).toBe(0);
    expect(counts["4"] || 0).toBe(0);
    expect(Math.abs((counts["1"] / iterations) * 100 - 28.6)).toBeLessThan(5);
    expect(Math.abs((counts["5"] / iterations) * 100 - 71.4)).toBeLessThan(5);
  });
});
