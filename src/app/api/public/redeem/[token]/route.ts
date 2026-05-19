import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { resolveRedemptionToken } from "@/services/redemption.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const result = await resolveRedemptionToken(params.token);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
