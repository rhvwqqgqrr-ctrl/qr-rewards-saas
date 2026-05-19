import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createRestaurantSchema } from "@/lib/validation";
import { extractAuth, requireRole } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    requireRole(auth, ["SUPER_ADMIN"]);

    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: { select: { campaigns: true, users: true, coupons: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(restaurants);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    requireRole(auth, ["SUPER_ADMIN"]);

    const body = await request.json();
    const data = createRestaurantSchema.parse(body);

    const restaurant = await prisma.restaurant.create({ data });
    return successResponse(restaurant, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
