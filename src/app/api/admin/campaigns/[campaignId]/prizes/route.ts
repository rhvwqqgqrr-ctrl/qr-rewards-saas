import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createPrizeSchema } from "@/lib/validation";
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
    });
    if (!campaign) throw new NotFoundError("Campaign");

    const prizes = await prisma.prize.findMany({
      where: { campaignId: params.campaignId },
      orderBy: { displayOrder: "asc" },
    });

    return successResponse(prizes);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.campaignId, restaurantId },
    });
    if (!campaign) throw new NotFoundError("Campaign");

    const body = await request.json();
    const data = createPrizeSchema.parse(body);

    const prize = await prisma.prize.create({
      data: {
        ...data,
        campaignId: params.campaignId,
        remainingStock: data.stockGlobal ?? null,
      },
    });

    return successResponse(prize, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
