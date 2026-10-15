import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  issues?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response {
  const responsePayload: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };
  return res.status(statusCode).json(responsePayload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code = "INTERNAL_ERROR",
  issues?: unknown
): Response {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    code,
    ...(issues !== undefined && { issues }),
  };
  return res.status(statusCode).json(responsePayload);
}

