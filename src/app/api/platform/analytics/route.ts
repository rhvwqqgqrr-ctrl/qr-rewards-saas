import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { extractAuth, requireRole } from "@/lib/auth-middleware";
import { getPlatformDashboard } from "@/services/analytics.service";

export async function GET(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    requireRole(auth, ["SUPER_ADMIN"]);

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");

    const dashboard = await getPlatformDashboard(days);
    return successResponse(dashboard);
  } catch (error) {
    return errorResponse(error);
  }
}
