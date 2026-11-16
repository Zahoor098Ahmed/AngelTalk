import type { RequestHandler } from "express";
import { sendError } from "../common/response";

/** Also protects against older app versions trying to upload private device content. */
export const rejectLocalOnlyContent: RequestHandler = (_req, res) => {
  sendError(res, "Personal words and app content are saved only on the device.", 410, "LOCAL_ONLY_CONTENT");
};
