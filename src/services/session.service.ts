import prisma from "@/lib/prisma";
import { createSessionToken, hashString } from "@/lib/tokens";
import { trackEvent } from "@/lib/analytics";
import { checkRateLimit } from "@/lib/rate-limit";
import { AppError, RateLimitError, NotFoundError } from "@/lib/errors";

interface StartSessionParams {
  restaurantSlug: string;
  campaignSlug: string;
  publicQrSlug?: string;
  ip?: string;
  userAgent?: string;
  fingerprint?: string;
}

export async function startSession(params: StartSessionParams) {
  const { restaurantSlug, campaignSlug, publicQrSlug, ip, userAgent, fingerprint } = params;

  // Find restaurant
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
  });
  if (!restaurant || restaurant.status !== "ACTIVE") {
    throw new NotFoundError("Restaurant", restaurantSlug);
  }

  // Find campaign
  const campaign = await prisma.campaign.findUnique({
    where: { restaurantId_slug: { restaurantId: restaurant.id, slug: campaignSlug } },
  });
  if (!campaign || campaign.status !== "ACTIVE") {
    throw new NotFoundError("Campaign", campaignSlug);
  }

  // Check campaign dates
  const now = new Date();
  if (campaign.startsAt && now < campaign.startsAt) {
    throw new AppError("Campaign has not started yet", 400, "CAMPAIGN_NOT_STARTED");
  }
  if (campaign.endsAt && now > campaign.endsAt) {
    throw new AppError("Campaign has ended", 400, "CAMPAIGN_ENDED");
  }

  // Resolve public QR
  let publicQr = null;
  if (publicQrSlug) {
    publicQr = await prisma.publicQr.findUnique({
      where: { slug: publicQrSlug },
    });
  }

  // Rate limiting by IP
  const ipHash = ip ? hashString(ip) : null;
  const deviceHash = fingerprint ? hashString(fingerprint) : null;
  const userAgentHash = userAgent ? hashString(userAgent) : null;

  if (ipHash) {
    const rateCheck = await checkRateLimit({
      key: `session:ip:${ipHash}`,
      limit: 20,
      windowSeconds: 3600,
    });
    if (!rateCheck.allowed) {
      throw new RateLimitError("Too many sessions from this device");
    }
  }

  if (deviceHash) {
    const deviceCheck = await checkRateLimit({
      key: `session:device:${deviceHash}`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!deviceCheck.allowed) {
      throw new RateLimitError("Too many sessions from this device");
    }
  }

  // Create play session
  const session = await prisma.playSession.create({
    data: {
      restaurantId: restaurant.id,
      campaignId: campaign.id,
      publicQrId: publicQr?.id,
      sessionToken: "temp", // Will be updated
      ipHash,
      userAgentHash,
      deviceHash,
      eligible: true,
    },
  });

  // Generate session token
  const sessionToken = createSessionToken({
    sessionId: session.id,
    campaignId: campaign.id,
    restaurantId: restaurant.id,
  });

  // Update with real token
  await prisma.playSession.update({
    where: { id: session.id },
    data: { sessionToken },
  });

  // Track analytics
  await trackEvent({
    restaurantId: restaurant.id,
    campaignId: campaign.id,
    publicQrId: publicQr?.id,
    playSessionId: session.id,
    type: "SESSION_START",
  });

  if (publicQr) {
    await trackEvent({
      restaurantId: restaurant.id,
      campaignId: campaign.id,
      publicQrId: publicQr.id,
      playSessionId: session.id,
      type: "QR_SCAN",
    });
  }

  return {
    sessionToken,
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      logoUrl: restaurant.logoUrl,
      primaryColor: restaurant.primaryColor,
      secondaryColor: restaurant.secondaryColor,
      googleReviewUrl: restaurant.googleReviewUrl,
    },
    campaign: {
      name: campaign.name,
      slug: campaign.slug,
      description: campaign.description,
    },
  };
}

export async function recordReviewClick(sessionToken: string) {
  const session = await prisma.playSession.findUnique({
    where: { sessionToken },
  });
  if (!session) throw new NotFoundError("Session");

  await prisma.playSession.update({
    where: { id: session.id },
    data: { reviewClickedAt: new Date() },
  });

  await trackEvent({
    restaurantId: session.restaurantId,
    campaignId: session.campaignId,
    playSessionId: session.id,
    type: "REVIEW_CLICK",
  });
}

export async function recordReviewReturn(sessionToken: string) {
  const session = await prisma.playSession.findUnique({
    where: { sessionToken },
  });
  if (!session) throw new NotFoundError("Session");

  await prisma.playSession.update({
    where: { id: session.id },
    data: { returnedAt: new Date() },
  });

  await trackEvent({
    restaurantId: session.restaurantId,
    campaignId: session.campaignId,
    playSessionId: session.id,
    type: "REVIEW_RETURN",
  });
}
