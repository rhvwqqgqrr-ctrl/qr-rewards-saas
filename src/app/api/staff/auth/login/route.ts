import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { staffLoginSchema } from "@/lib/validation";
import { loginStaff } from "@/services/staff-auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, restaurantSlug } = staffLoginSchema.parse(body);
    const result = await loginStaff(email, password, restaurantSlug);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
