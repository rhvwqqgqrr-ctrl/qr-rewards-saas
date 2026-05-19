import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { extractAuth, requireRestaurant } from "@/lib/auth-middleware";
import { getRestaurantDashboard } from "@/services/analytics.service";

export async function GET(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const restaurantId = requireRestaurant(auth);

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");

    const dashboard = await getRestaurantDashboard(restaurantId, days);
    return successResponse(dashboard);
  } catch (error) {
    return errorResponse(error);
  }
}
