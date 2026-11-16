import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { rejectLocalOnlyContent } from "../../middleware/local-only-content";

export const boardRouter = Router();

// Shared admin templates have their own routes. A user's personal board never goes to the server.
boardRouter.all([
  "/children/:childId/shelves",
  "/shelves/:id",
  "/shelves/:shelfId/words",
  "/shelves/:shelfId/words/bulk",
  "/words/:id",
  "/words/:id/tap",
  "/children/:childId/apply-template/:templateId",
], authenticate, rejectLocalOnlyContent);
