import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { updateCampaignSchema } from "@/lib/validation";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";
import { NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.campaignId, restaurantId },
      include: {
        prizes: { orderBy: { displayOrder: "asc" } },
        publicQrs: true,
        _count: { select: { coupons: true, playSessions: true } },
      },
    });

    if (!campaign) throw new NotFoundError("Campaign");
    return successResponse(campaign);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const body = await request.json();
    const data = updateCampaignSchema.parse(body);

    const existing = await prisma.campaign.findFirst({
      where: { id: params.campaignId, restaurantId },
    });
    if (!existing) throw new NotFoundError("Campaign");

    const updated = await prisma.campaign.update({
      where: { id: params.campaignId },
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const existing = await prisma.campaign.findFirst({
      where: { id: params.campaignId, restaurantId },
    });
    if (!existing) throw new NotFoundError("Campaign");

    await prisma.campaign.update({
      where: { id: params.campaignId },
      data: { status: "ARCHIVED" },
    });

    return successResponse({ archived: true });
  } catch (error) {
    return errorResponse(error);
  }
}
