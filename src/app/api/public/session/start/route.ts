import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sessionStartSchema } from "@/lib/validation";
import { startSession } from "@/services/session.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = sessionStartSchema.parse(body);

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    const result = await startSession({
      ...data,
      ip,
      userAgent,
      fingerprint: data.fingerprint,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
