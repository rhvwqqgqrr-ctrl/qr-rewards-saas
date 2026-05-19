import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { updateRestaurantSchema } from "@/lib/validation";
import { extractAuth, requireRole } from "@/lib/auth-middleware";
import { NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const auth = extractAuth(request);
    requireRole(auth, ["SUPER_ADMIN"]);

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: params.restaurantId },
      include: {
        campaigns: { orderBy: { createdAt: "desc" } },
        users: {
          select: { id: true, email: true, name: true, role: true, active: true },
        },
        _count: { select: { coupons: true } },
      },
    });

    if (!restaurant) throw new NotFoundError("Restaurant");
    return successResponse(restaurant);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const auth = extractAuth(request);
    requireRole(auth, ["SUPER_ADMIN"]);

    const body = await request.json();
    const data = updateRestaurantSchema.parse(body);

    const updated = await prisma.restaurant.update({
      where: { id: params.restaurantId },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
