import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { adminLoginSchema } from "@/lib/validation";
import { loginRestaurantAdmin } from "@/services/admin-auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = adminLoginSchema.parse(body);
    const result = await loginRestaurantAdmin(email, password);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
