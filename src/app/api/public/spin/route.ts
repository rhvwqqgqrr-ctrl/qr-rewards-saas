import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { spinSchema } from "@/lib/validation";
import { executeSpin } from "@/services/spin.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = spinSchema.parse(body);
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const result = await executeSpin(sessionToken, ip);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
