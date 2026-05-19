import { computeCouponValidity, isCouponActive, isCouponExpired } from "@/lib/date-utils";

describe("computeCouponValidity", () => {
  it("should set activation to next day at 00:00 Europe/Paris", () => {
    // April 4, 2026 at 21:30 Europe/Paris = April 4, 2026 at 19:30 UTC (CEST = UTC+2)
    const winDate = new Date("2026-04-04T19:30:00Z");
    const { activationAt, expiresAt } = computeCouponValidity(winDate, "Europe/Paris");

    // Activation should be April 5, 2026 at 00:00 Europe/Paris = April 4, 2026 at 22:00 UTC
    expect(activationAt.getUTCFullYear()).toBe(2026);
    expect(activationAt.getUTCMonth()).toBe(3); // April = 3
    expect(activationAt.getUTCDate()).toBe(4);
    expect(activationAt.getUTCHours()).toBe(22); // 00:00 CEST = 22:00 UTC
  });

  it("should set expiration to 10 days after win at 23:59:59 Europe/Paris", () => {
    const winDate = new Date("2026-04-04T19:30:00Z");
    const { expiresAt } = computeCouponValidity(winDate, "Europe/Paris");

    // Expiration should be April 14, 2026 at 23:59:59 Europe/Paris
    // April 14 at 23:59 CEST = April 14 at 21:59 UTC
    expect(expiresAt.getUTCFullYear()).toBe(2026);
    expect(expiresAt.getUTCMonth()).toBe(3); // April
    expect(expiresAt.getUTCDate()).toBe(14);
    expect(expiresAt.getUTCHours()).toBe(21); // 23:59 CEST = 21:59 UTC
  });

  it("should handle midnight win correctly", () => {
    // Win at 00:05 on April 5 Europe/Paris = April 4 at 22:05 UTC
    const winDate = new Date("2026-04-04T22:05:00Z");
    const { activationAt } = computeCouponValidity(winDate, "Europe/Paris");

    // Activation should be April 6, 2026 at 00:00 Europe/Paris
    expect(activationAt.getUTCDate()).toBe(5); // April 6 at 00:00 CEST = April 5 at 22:00 UTC
  });

  it("should handle winter timezone correctly (CET = UTC+1)", () => {
    // January 15, 2026 at 20:00 CET = 19:00 UTC
    const winDate = new Date("2026-01-15T19:00:00Z");
    const { activationAt } = computeCouponValidity(winDate, "Europe/Paris");

    // Activation should be January 16, 2026 at 00:00 CET = January 15, 2026 at 23:00 UTC
    expect(activationAt.getUTCMonth()).toBe(0); // January
    expect(activationAt.getUTCDate()).toBe(15);
    expect(activationAt.getUTCHours()).toBe(23); // 00:00 CET = 23:00 UTC
  });
});

describe("isCouponActive", () => {
  it("should return true when now is between activation and expiration", () => {
    const activation = new Date("2026-04-05T00:00:00+02:00");
    const expiration = new Date("2026-04-14T23:59:59+02:00");
    const now = new Date("2026-04-10T12:00:00+02:00");

    expect(isCouponActive(activation, expiration, now)).toBe(true);
  });

  it("should return false when now is before activation", () => {
    const activation = new Date("2026-04-05T00:00:00+02:00");
    const expiration = new Date("2026-04-14T23:59:59+02:00");
    const now = new Date("2026-04-04T23:00:00+02:00");

    expect(isCouponActive(activation, expiration, now)).toBe(false);
  });

  it("should return false when now is after expiration", () => {
    const activation = new Date("2026-04-05T00:00:00+02:00");
    const expiration = new Date("2026-04-14T23:59:59+02:00");
    const now = new Date("2026-04-15T01:00:00+02:00");

    expect(isCouponActive(activation, expiration, now)).toBe(false);
  });
});

describe("isCouponExpired", () => {
  it("should return true when now is after expiration", () => {
    const expiration = new Date("2026-04-14T23:59:59+02:00");
    const now = new Date("2026-04-15T00:00:01+02:00");

    expect(isCouponExpired(expiration, now)).toBe(true);
  });

  it("should return false when now is before expiration", () => {
    const expiration = new Date("2026-04-14T23:59:59+02:00");
    const now = new Date("2026-04-14T23:00:00+02:00");

    expect(isCouponExpired(expiration, now)).toBe(false);
  });
});
