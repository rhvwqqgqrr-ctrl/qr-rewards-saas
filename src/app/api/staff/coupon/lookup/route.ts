import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { staffCouponLookupSchema } from "@/lib/validation";
import { getCouponByHumanCode } from "@/services/coupon.service";
import { verifyStaffToken } from "@/lib/tokens";
import { UnauthorizedError, NotFoundError } from "@/lib/errors";
import { trackEvent } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing authentication token");
    }
    const staffPayload = verifyStaffToken(authHeader.slice(7));

    const body = await request.json();
    const { humanCode } = staffCouponLookupSchema.parse(body);

    const coupon = await getCouponByHumanCode(humanCode);
    if (!coupon) throw new NotFoundError("Coupon", humanCode);

    // Track lookup
    await trackEvent({
      restaurantId: staffPayload.restaurantId,
      type: "STAFF_LOOKUP",
      payload: { couponId: coupon.id, humanCode },
    });

    return successResponse({
      couponId: coupon.id,
      humanCode: coupon.humanCode,
      status: coupon.status,
      prize: {
        type: coupon.prize.type,
        label: coupon.prize.label,
        description: coupon.prize.description,
        percentValue: coupon.prize.percentValue,
        fixedValue: coupon.prize.fixedValue,
      },
      activationAt: coupon.activationAt.toISOString(),
      expiresAt: coupon.expiresAt.toISOString(),
      redeemedAt: coupon.redeemedAt?.toISOString() || null,
      restaurant: coupon.restaurant,
      campaign: coupon.campaign,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
