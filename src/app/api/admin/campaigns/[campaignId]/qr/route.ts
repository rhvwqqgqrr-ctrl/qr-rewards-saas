import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createPublicQrSchema } from "@/lib/validation";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";
import { NotFoundError } from "@/lib/errors";
import crypto from "crypto";

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

    const qrs = await prisma.publicQr.findMany({
      where: { campaignId: params.campaignId },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(qrs);
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
      include: { restaurant: true },
    });
    if (!campaign) throw new NotFoundError("Campaign");

    const body = await request.json();
    const data = createPublicQrSchema.parse(body);

    const slug = `${campaign.restaurant.slug}-${campaign.slug}-${crypto.randomBytes(4).toString("hex")}`;
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const targetUrl = `${appUrl}/play/${campaign.restaurant.slug}/${campaign.slug}?qr=${slug}`;

    const qr = await prisma.publicQr.create({
      data: {
        campaignId: params.campaignId,
        slug,
        label: data.label || `QR - ${campaign.name}`,
        targetUrl,
        metadata: data.metadata || null,
      },
    });

    return successResponse(qr, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
