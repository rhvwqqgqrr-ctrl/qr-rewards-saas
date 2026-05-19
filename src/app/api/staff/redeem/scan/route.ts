import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { staffRedeemScanSchema } from "@/lib/validation";
import { resolveRedemptionToken } from "@/services/redemption.service";
import { verifyStaffToken } from "@/lib/tokens";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    // Verify staff auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing authentication token");
    }
    const staffPayload = verifyStaffToken(authHeader.slice(7));

    const body = await request.json();
    const { token } = staffRedeemScanSchema.parse(body);
    const result = await resolveRedemptionToken(token);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
