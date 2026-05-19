import { NextRequest } from "next/server";
import { verifyAdminToken, verifyStaffToken } from "./tokens";
import { UnauthorizedError, ForbiddenError } from "./errors";

interface AuthContext {
  userId: string;
  role: string;
  restaurantId?: string;
}

export function extractAuth(request: NextRequest): AuthContext {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing authentication token");
  }
  try {
    return verifyAdminToken(authHeader.slice(7));
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function requireRole(auth: AuthContext, roles: string[]) {
  if (!roles.includes(auth.role)) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export function requireRestaurant(auth: AuthContext): string {
  if (!auth.restaurantId) {
    throw new ForbiddenError("No restaurant context");
  }
  return auth.restaurantId;
}
