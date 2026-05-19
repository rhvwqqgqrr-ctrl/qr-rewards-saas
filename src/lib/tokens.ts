import jwt from "jsonwebtoken";
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SIGNING_SECRET || "dev-session-secret";
const REDEMPTION_SECRET = process.env.REDEMPTION_SIGNING_SECRET || "dev-redemption-secret";
const QR_SECRET = process.env.QR_SIGNING_SECRET || "dev-qr-secret";

// ─── Session tokens ─────────────────────────────────────

export function createSessionToken(payload: {
  sessionId: string;
  campaignId: string;
  restaurantId: string;
}): string {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: "2h" });
}

export function verifySessionToken(token: string): {
  sessionId: string;
  campaignId: string;
  restaurantId: string;
} {
  return jwt.verify(token, SESSION_SECRET) as {
    sessionId: string;
    campaignId: string;
    restaurantId: string;
  };
}

// ─── Redemption tokens ──────────────────────────────────

export function createRedemptionToken(couponId: string): {
  token: string;
  tokenHash: string;
} {
  const payload = {
    couponId,
    nonce: crypto.randomBytes(16).toString("hex"),
    iat: Math.floor(Date.now() / 1000),
  };
  const token = jwt.sign(payload, REDEMPTION_SECRET, { expiresIn: "30d" });
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  return { token, tokenHash };
}

export function verifyRedemptionToken(token: string): {
  couponId: string;
  nonce: string;
} {
  return jwt.verify(token, REDEMPTION_SECRET) as {
    couponId: string;
    nonce: string;
  };
}

// ─── Spin signature ─────────────────────────────────────

export function signSpin(data: {
  sessionId: string;
  prizeId: string;
  randomValue: number;
}): string {
  const payload = `${data.sessionId}:${data.prizeId}:${data.randomValue}`;
  return crypto.createHmac("sha256", QR_SECRET).update(payload).digest("hex");
}

// ─── Staff auth tokens ──────────────────────────────────

const STAFF_SECRET = process.env.NEXTAUTH_SECRET || "dev-staff-secret";

export function createStaffToken(payload: {
  userId: string;
  restaurantId: string;
  role: string;
}): string {
  return jwt.sign(payload, STAFF_SECRET, { expiresIn: "12h" });
}

export function verifyStaffToken(token: string): {
  userId: string;
  restaurantId: string;
  role: string;
} {
  return jwt.verify(token, STAFF_SECRET) as {
    userId: string;
    restaurantId: string;
    role: string;
  };
}

// ─── Admin auth tokens ──────────────────────────────────

export function createAdminToken(payload: {
  userId: string;
  role: string;
  restaurantId?: string;
}): string {
  return jwt.sign(payload, STAFF_SECRET, { expiresIn: "8h" });
}

export function verifyAdminToken(token: string): {
  userId: string;
  role: string;
  restaurantId?: string;
} {
  return jwt.verify(token, STAFF_SECRET) as {
    userId: string;
    role: string;
    restaurantId?: string;
  };
}

// ─── Utility ─────────────────────────────────────────────

export function hashString(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

export function generateHumanCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
