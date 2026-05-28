import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantSlug: string; campaignSlug: string } }
) {
  try {
    const { restaurantSlug, campaignSlug } = params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        googleReviewUrl: true,
        city: true,
      },
    });

    if (!restaurant || (await prisma.restaurant.findUnique({ where: { slug: restaurantSlug } }))?.status !== "ACTIVE") {
      throw new NotFoundError("Restaurant", restaurantSlug);
    }

    const campaign = await prisma.campaign.findUnique({
      where: {
        restaurantId_slug: {
          restaurantId: restaurant.id,
          slug: campaignSlug,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        prizes: {
          where: { active: true },
          select: {
            id: true,
            type: true,
            label: true,
            description: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!campaign || campaign.status !== "ACTIVE") {
      throw new NotFoundError("Campaign", campaignSlug);
    }

    return successResponse({
      restaurant,
      campaign,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
