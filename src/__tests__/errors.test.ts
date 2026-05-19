import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ValidationError,
} from "@/lib/errors";

describe("Error classes", () => {
  it("AppError should have correct properties", () => {
    const err = new AppError("test error", 400, "TEST_CODE");
    expect(err.message).toBe("test error");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("TEST_CODE");
    expect(err.name).toBe("AppError");
    expect(err instanceof Error).toBe(true);
  });

  it("NotFoundError should format message correctly", () => {
    const err = new NotFoundError("Restaurant", "le-pare-faim");
    expect(err.message).toBe("Restaurant (le-pare-faim) not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("NotFoundError without identifier", () => {
    const err = new NotFoundError("Session");
    expect(err.message).toBe("Session not found");
  });

  it("UnauthorizedError should default to 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("ForbiddenError should default to 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it("ConflictError should default to 409", () => {
    const err = new ConflictError("Already exists");
    expect(err.statusCode).toBe(409);
  });

  it("RateLimitError should default to 429", () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
  });

  it("ValidationError should carry details", () => {
    const details = [{ field: "email", message: "required" }];
    const err = new ValidationError("Invalid input", details);
    expect(err.statusCode).toBe(422);
    expect(err.details).toEqual(details);
  });
});
