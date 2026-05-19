import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createStaffSchema } from "@/lib/validation";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const staff = await prisma.restaurantUser.findMany({
      where: { restaurantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        _count: { select: { redeemedCoupons: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(staff);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const body = await request.json();
    const data = createStaffSchema.parse(body);

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.restaurantUser.create({
      data: {
        restaurantId,
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        role: data.role || "STAFF",
      },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });

    return successResponse(user, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
