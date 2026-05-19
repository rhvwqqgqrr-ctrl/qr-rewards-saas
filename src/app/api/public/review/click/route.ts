import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { reviewClickSchema } from "@/lib/validation";
import { recordReviewClick } from "@/services/session.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = reviewClickSchema.parse(body);
    await recordReviewClick(sessionToken);
    return successResponse({ recorded: true });
  } catch (error) {
    return errorResponse(error);
  }
}
