import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getCouponByHumanCode } from "@/services/coupon.service";
import { NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { humanCode: string } }
) {
  try {
    const coupon = await getCouponByHumanCode(params.humanCode);
    if (!coupon) throw new NotFoundError("Coupon", params.humanCode);

    return successResponse({
      humanCode: coupon.humanCode,
      status: coupon.status,
      prize: {
        type: coupon.prize.type,
        label: coupon.prize.label,
        description: coupon.prize.description,
      },
      activationAt: coupon.activationAt.toISOString(),
      expiresAt: coupon.expiresAt.toISOString(),
      restaurant: coupon.restaurant,
      campaign: coupon.campaign,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
