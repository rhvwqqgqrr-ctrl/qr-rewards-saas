import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { updateRestaurantSchema } from "@/lib/validation";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    return successResponse(restaurant);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const body = await request.json();
    const data = updateRestaurantSchema.parse(body);

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
