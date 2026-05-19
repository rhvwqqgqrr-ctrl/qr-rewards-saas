import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";
import { NotFoundError } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const body = await request.json();
    const { active, role, name } = body;

    const existing = await prisma.restaurantUser.findFirst({
      where: { id: params.staffId, restaurantId },
    });
    if (!existing) throw new NotFoundError("Staff member");

    const updated = await prisma.restaurantUser.update({
      where: { id: params.staffId },
      data: {
        ...(active !== undefined && { active }),
        ...(role && { role }),
        ...(name && { name }),
      },
      select: { id: true, email: true, name: true, role: true, active: true },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
