import { z } from "zod";

// ─── Public API Schemas ──────────────────────────────────

export const sessionStartSchema = z.object({
  restaurantSlug: z.string().min(1),
  campaignSlug: z.string().min(1),
  publicQrSlug: z.string().optional(),
  fingerprint: z.string().optional(),
});

export const spinSchema = z.object({
  sessionToken: z.string().min(1),
});

export const reviewClickSchema = z.object({
  sessionToken: z.string().min(1),
});

export const reviewReturnSchema = z.object({
  sessionToken: z.string().min(1),
});

// ─── Staff API Schemas ───────────────────────────────────

export const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  restaurantSlug: z.string().min(1),
});

export const staffRedeemScanSchema = z.object({
  token: z.string().min(1),
});

export const staffRedeemConfirmSchema = z.object({
  couponId: z.string().min(1),
});

export const staffCouponLookupSchema = z.object({
  humanCode: z.string().min(1),
});

// ─── Admin API Schemas ───────────────────────────────────

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  termsText: z.string().optional(),
  privacyText: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ENDED", "ARCHIVED"]).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const createPrizeSchema = z.object({
  type: z.enum(["FREE_PRODUCT", "DISCOUNT_PERCENT", "DISCOUNT_FIXED", "NO_PRIZE", "CUSTOM_REWARD"]),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
  weight: z.number().int().min(0).max(1000),
  percentValue: z.number().min(0).max(100).optional().nullable(),
  fixedValue: z.number().min(0).optional().nullable(),
  stockGlobal: z.number().int().min(0).optional().nullable(),
  stockDaily: z.number().int().min(0).optional().nullable(),
  active: z.boolean().optional(),
  cumulativeAllowed: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export const updatePrizeSchema = createPrizeSchema.partial();

export const createPublicQrSchema = z.object({
  label: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createRestaurantSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  addressLine1: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  websiteUrl: z.string().optional().nullable(),
  googleReviewUrl: z.string().optional().nullable(),
  timezone: z.string().optional(),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const platformLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
