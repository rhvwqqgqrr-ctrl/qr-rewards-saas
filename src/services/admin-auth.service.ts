import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAdminToken } from "@/lib/tokens";
import { UnauthorizedError } from "@/lib/errors";

export async function loginRestaurantAdmin(email: string, password: string) {
  const user = await prisma.restaurantUser.findFirst({
    where: {
      email: email.toLowerCase(),
      role: { in: ["OWNER", "MANAGER"] },
      active: true,
    },
    include: {
      restaurant: { select: { id: true, name: true, slug: true, status: true } },
    },
  });

  if (!user || user.restaurant.status !== "ACTIVE") {
    throw new UnauthorizedError("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = createAdminToken({
    userId: user.id,
    role: user.role,
    restaurantId: user.restaurantId,
  });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    restaurant: user.restaurant,
  };
}

export async function loginPlatformAdmin(email: string, password: string) {
  const user = await prisma.platformUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = createAdminToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
