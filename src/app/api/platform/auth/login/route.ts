import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { platformLoginSchema } from "@/lib/validation";
import { loginPlatformAdmin } from "@/services/admin-auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = platformLoginSchema.parse(body);
    const result = await loginPlatformAdmin(email, password);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
