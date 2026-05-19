import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createStaffToken } from "@/lib/tokens";
import { UnauthorizedError } from "@/lib/errors";

export async function loginStaff(
  email: string,
  password: string,
  restaurantSlug: string
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
  });

  if (!restaurant || restaurant.status !== "ACTIVE") {
    throw new UnauthorizedError("Invalid credentials");
  }

  const user = await prisma.restaurantUser.findUnique({
    where: {
      restaurantId_email: {
        restaurantId: restaurant.id,
        email: email.toLowerCase(),
      },
    },
  });

  if (!user || !user.active) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = createStaffToken({
    userId: user.id,
    restaurantId: restaurant.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
    },
  };
}
