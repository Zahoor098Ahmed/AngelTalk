import { Router, Request, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest } from "../../middleware/auth";
import { Device } from "../../models/Device";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess } from "../../common/response";
import { NotFoundError } from "../../common/errors";

export const devicesRouter = Router();

devicesRouter.get(
  "/devices",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const devices = await Device.find({ userId: user.id, revokedAt: null }).sort({ lastActiveAt: -1 });
      sendSuccess(res, devices);
    } catch (err) {
      next(err);
    }
  }
);

devicesRouter.delete(
  "/devices/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const deviceIdParam = String(req.params.id);
      const device = await Device.findOne({
        userId: user.id,
        $or: [{ _id: deviceIdParam }, { deviceId: deviceIdParam }],
      });
      if (!device) {
        throw new NotFoundError("Device not found");
      }

      device.revokedAt = new Date();
      await device.save();

      await AuditLog.create({
        actorId: user.id,
        action: "device.revoked",
        targetType: "device",
        targetId: device.deviceId,
        meta: { deviceName: device.deviceName },
      });

      sendSuccess(res, null, "Device revoked successfully");
    } catch (err) {
      next(err);
    }
  }
);

