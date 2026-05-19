import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { reviewReturnSchema } from "@/lib/validation";
import { recordReviewReturn } from "@/services/session.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = reviewReturnSchema.parse(body);
    await recordReviewReturn(sessionToken);
    return successResponse({ recorded: true });
  } catch (error) {
    return errorResponse(error);
  }
}
