/**
 * Coupon validity logic:
 * - Activation: next day at 00:00 Europe/Paris
 * - Expiration: 10 calendar days after activation at 23:59:59 Europe/Paris
 *
 * Example: won on April 4, 2026 at 21:30 Europe/Paris
 *   → activationAt = April 5, 2026 00:00:00 Europe/Paris
 *   → expiresAt = April 14, 2026 23:59:59 Europe/Paris
 */

const TIMEZONE = "Europe/Paris";

export function computeCouponValidity(winDate: Date, timezone: string = TIMEZONE): {
  activationAt: Date;
  expiresAt: Date;
} {
  // Get the date components in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(winDate);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "0";

  const year = parseInt(getPart("year"));
  const month = parseInt(getPart("month")) - 1;
  const day = parseInt(getPart("day"));

  // Activation: next day at 00:00 in timezone
  const activationLocal = new Date(year, month, day + 1, 0, 0, 0, 0);
  const activationAt = localToTimezone(activationLocal, timezone);

  // Expiration: 10 days after activation day at 23:59:59
  const expirationLocal = new Date(year, month, day + 10, 23, 59, 59, 999);
  const expiresAt = localToTimezone(expirationLocal, timezone);

  return { activationAt, expiresAt };
}

function localToTimezone(localDate: Date, timezone: string): Date {
  // Create a date string in the format expected
  const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}T${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}:${String(localDate.getSeconds()).padStart(2, "0")}`;

  // Get the UTC offset for this date in the target timezone
  const utcDate = new Date(dateStr + "Z");
  const tzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Binary search for the correct UTC time that maps to the desired local time
  // Start with a rough estimate
  const roughUtc = new Date(dateStr + "Z");
  const tzParts = tzFormatter.formatToParts(roughUtc);
  const getPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parts.find((p) => p.type === type)?.value || "0";

  const tzHour = parseInt(getPart(tzParts, "hour"));
  const utcParts = utcFormatter.formatToParts(roughUtc);
  const utcHour = parseInt(getPart(utcParts, "hour"));

  // Rough offset in hours
  const offsetHours = tzHour - utcHour;
  const result = new Date(roughUtc.getTime() - offsetHours * 3600000);

  // Fine-tune: verify the result maps to the desired local time
  const verifyParts = tzFormatter.formatToParts(result);
  const verifyHour = parseInt(getPart(verifyParts, "hour"));
  const targetHour = localDate.getHours();

  if (verifyHour !== targetHour) {
    const diff = targetHour - verifyHour;
    return new Date(result.getTime() - diff * 3600000);
  }

  return result;
}

export function isCouponActive(
  activationAt: Date,
  expiresAt: Date,
  now: Date = new Date()
): boolean {
  return now >= activationAt && now <= expiresAt;
}

export function isCouponExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now > expiresAt;
}

export function formatDateForDisplay(date: Date, timezone: string = TIMEZONE): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
