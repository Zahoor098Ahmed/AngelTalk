export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly issues?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", issues?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.issues = issues;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST", issues?: unknown) {
    super(message, 400, code, issues);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", issues?: unknown) {
    super(message, 422, "VALIDATION_ERROR", issues);
  }
}

export class PinRequiredError extends AppError {
  constructor(message = "Caregiver PIN verification is required for this operation") {
    super(message, 403, "PIN_REQUIRED");
  }
}

export class PinLockedError extends AppError {
  public readonly retryAfterMinutes: number;

  constructor(retryAfterMinutes: number, message?: string) {
    super(
      message || `PIN is temporarily locked due to failed attempts. Try again in ${retryAfterMinutes} minutes.`,
      423,
      "PIN_LOCKED"
    );
    this.retryAfterMinutes = retryAfterMinutes;
  }
}

export class MfaRequiredError extends AppError {
  public readonly mfaToken: string;

  constructor(mfaToken: string, message = "Multi-factor authentication required") {
    super(message, 403, "MFA_REQUIRED");
    this.mfaToken = mfaToken;
  }
}

