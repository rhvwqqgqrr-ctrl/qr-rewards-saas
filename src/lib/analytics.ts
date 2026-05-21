import prisma from "./prisma";
import { AnalyticsEventType, Prisma } from "@prisma/client";

interface AnalyticsParams {
  restaurantId: string;
  campaignId?: string;
  publicQrId?: string;
  playSessionId?: string;
  type: AnalyticsEventType;
  payload?: Record<string, unknown>;
}

export async function trackEvent(params: AnalyticsParams): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        restaurantId: params.restaurantId,
        campaignId: params.campaignId,
        publicQrId: params.publicQrId,
        playSessionId: params.playSessionId,
        type: params.type,
        payloadJson: (params.payload as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to track analytics event:", error);
  }
}
