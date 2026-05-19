import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { updatePrizeSchema } from "@/lib/validation";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";
import { NotFoundError } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { campaignId: string; prizeId: string } }
) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.campaignId, restaurantId },
    });
    if (!campaign) throw new NotFoundError("Campaign");

    const body = await request.json();
    const data = updatePrizeSchema.parse(body);

    const updated = await prisma.prize.update({
      where: { id: params.prizeId },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string; prizeId: string } }
) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.campaignId, restaurantId },
    });
    if (!campaign) throw new NotFoundError("Campaign");

    await prisma.prize.update({
      where: { id: params.prizeId },
      data: { active: false },
    });

    return successResponse({ deactivated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
