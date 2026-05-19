import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createCampaignSchema } from "@/lib/validation";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const campaigns = await prisma.campaign.findMany({
      where: { restaurantId },
      include: {
        _count: { select: { prizes: true, publicQrs: true, coupons: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(campaigns);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const body = await request.json();
    const data = createCampaignSchema.parse(body);

    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        restaurantId,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
    });

    return successResponse(campaign, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
