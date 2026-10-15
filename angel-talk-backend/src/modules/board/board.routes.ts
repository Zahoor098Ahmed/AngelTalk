import { Router, Request, Response, NextFunction } from "express";
import { BoardService } from "./board.service";
import { authenticate, AuthenticatedRequest, requirePin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createShelfSchema,
  updateShelfSchema,
  createWordSchema,
  updateWordSchema,
  bulkWordsSchema,
} from "./board.schema";
import { sendSuccess } from "../../common/response";

export const boardRouter = Router();

// 1. Get Board (Shelves + Words in one call)
boardRouter.get(
  "/children/:childId/shelves",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const board = await BoardService.getBoard(user, String(req.params.childId));
      sendSuccess(res, board);
    } catch (err) {
      next(err);
    }
  }
);

// 2. Create Shelf (Requires PIN)
boardRouter.post(
  "/children/:childId/shelves",
  authenticate,
  requirePin,
  validate({ body: createShelfSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const shelf = await BoardService.createShelf(user, String(req.params.childId), req.body);
      sendSuccess(res, shelf, "Shelf created successfully", 201);
    } catch (err) {
      next(err);
    }
  }
);

// 3. Update Shelf (Requires PIN)
boardRouter.put(
  "/shelves/:id",
  authenticate,
  requirePin,
  validate({ body: updateShelfSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const shelf = await BoardService.updateShelf(user, String(req.params.id), req.body);
      sendSuccess(res, shelf, "Shelf updated successfully");
    } catch (err) {
      next(err);
    }
  }
);

// 4. Delete Shelf (Requires PIN, cascades to sub-shelves & words)
boardRouter.delete(
  "/shelves/:id",
  authenticate,
  requirePin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await BoardService.deleteShelf(user, String(req.params.id));
      sendSuccess(res, null, "Shelf and nested content deleted successfully");
    } catch (err) {
      next(err);
    }
  }
);

// 5. Add Word (Requires PIN)
boardRouter.post(
  "/shelves/:shelfId/words",
  authenticate,
  requirePin,
  validate({ body: createWordSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const word = await BoardService.createWord(user, String(req.params.shelfId), req.body);
      sendSuccess(res, word, "Word created successfully", 201);
    } catch (err) {
      next(err);
    }
  }
);

// 6. Bulk Add Words (Requires PIN, max 100)
boardRouter.post(
  "/shelves/:shelfId/words/bulk",
  authenticate,
  requirePin,
  validate({ body: bulkWordsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const words = await BoardService.bulkCreateWords(
        user,
        String(req.params.shelfId),
        req.body.rawText,
        req.body.color
      );
      sendSuccess(res, words, `${words.length} words added successfully`, 201);
    } catch (err) {
      next(err);
    }
  }
);

// 7. Update Word (Requires PIN)
boardRouter.put(
  "/words/:id",
  authenticate,
  requirePin,
  validate({ body: updateWordSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const word = await BoardService.updateWord(user, String(req.params.id), req.body);
      sendSuccess(res, word, "Word updated successfully");
    } catch (err) {
      next(err);
    }
  }
);

// 8. Delete Word (Requires PIN)
boardRouter.delete(
  "/words/:id",
  authenticate,
  requirePin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await BoardService.deleteWord(user, String(req.params.id));
      sendSuccess(res, null, "Word deleted successfully");
    } catch (err) {
      next(err);
    }
  }
);

// 9. Tap Word (NO PIN NEEDED, atomic increment by child)
boardRouter.post(
  "/words/:id/tap",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await BoardService.tapWord(user, String(req.params.id));
      sendSuccess(res, null, "Tap recorded");
    } catch (err) {
      next(err);
    }
  }
);

// 10. Apply Seed Template (Requires PIN)
boardRouter.post(
  "/children/:childId/apply-template/:templateId",
  authenticate,
  requirePin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const shelf = await BoardService.applyTemplate(
        user,
        String(req.params.childId),
        String(req.params.templateId)
      );
      sendSuccess(res, shelf, "Template applied to board successfully", 201);
    } catch (err) {
      next(err);
    }
  }
);

