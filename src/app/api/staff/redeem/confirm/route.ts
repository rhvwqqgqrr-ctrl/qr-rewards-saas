import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { staffRedeemConfirmSchema } from "@/lib/validation";
import { redeemCoupon } from "@/services/redemption.service";
import { verifyStaffToken } from "@/lib/tokens";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing authentication token");
    }
    const staffPayload = verifyStaffToken(authHeader.slice(7));

    const body = await request.json();
    const { couponId } = staffRedeemConfirmSchema.parse(body);

    const result = await redeemCoupon(
      couponId,
      staffPayload.userId,
      staffPayload.restaurantId
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
