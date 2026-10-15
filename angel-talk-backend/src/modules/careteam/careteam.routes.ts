import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, AuthenticatedRequest, assertChildAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { CareTeam } from "../../models/CareTeam";
import { User } from "../../models/User";
import { Child } from "../../models/Child";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess } from "../../common/response";
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from "../../common/errors";
import { eventBus } from "../../common/events";

export const careTeamRouter = Router();

const inviteCareTeamSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(["slp", "educator"]),
  permissions: z
    .array(z.enum(["view_board", "edit_board", "view_clinical", "write_clinical", "manage_schedule"]))
    .min(1, "At least one permission must be granted"),
});

const updateCareTeamSchema = z.object({
  permissions: z
    .array(z.enum(["view_board", "edit_board", "view_clinical", "write_clinical", "manage_schedule"]))
    .min(1),
});

// 1. Invite a member (SLP or Educator)
careTeamRouter.post(
  "/children/:id/care-team/invite",
  authenticate,
  validate({ body: inviteCareTeamSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const childId = String(req.params.id);
      const child = await assertChildAccess(user, childId);
      if (child.ownerId !== user.id) {
        throw new ForbiddenError("Only the parent/guardian can invite care team members");
      }

      const invitedUser = await User.findOne({ email: req.body.email });
      if (!invitedUser) {
        throw new NotFoundError("User with this email was not found. Please ask them to register first.");
      }

      if (invitedUser._id === user.id) {
        throw new BadRequestError("You cannot invite yourself to the care team");
      }

      const existing = await CareTeam.findOne({ childId: child._id, userId: invitedUser._id });
      if (existing && existing.status === "active") {
        throw new ConflictError("This user is already an active care team member for this child");
      }

      const membership = await CareTeam.findOneAndUpdate(
        { childId: child._id, userId: invitedUser._id },
        {
          role: req.body.role,
          permissions: req.body.permissions,
          status: "pending",
          invitedBy: user.id,
        },
        { upsert: true, new: true }
      );

      await AuditLog.create({
        actorId: user.id,
        action: "careteam.invited",
        targetType: "careteam",
        targetId: membership._id,
        meta: { childId: child._id, invitedUser: invitedUser.email, role: req.body.role },
      });

      sendSuccess(res, membership, "Invitation sent successfully", 201);
    } catch (err) {
      next(err);
    }
  }
);

// 2. List care team members for a child
careTeamRouter.get(
  "/children/:id/care-team",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const childId = String(req.params.id);
      await assertChildAccess(user, childId);
      const members = await CareTeam.find({ childId, status: { $ne: "revoked" } });
      sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  }
);

// 3. Update permissions of a member
careTeamRouter.patch(
  "/care-team/:id",
  authenticate,
  validate({ body: updateCareTeamSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const membership = await CareTeam.findById(req.params.id);
      if (!membership) {
        throw new NotFoundError("Care team membership not found");
      }

      const child = await Child.findById(membership.childId);
      if (!child || child.ownerId !== user.id) {
        throw new ForbiddenError("Only the child owner can modify care team permissions");
      }

      membership.permissions = req.body.permissions;
      await membership.save();

      eventBus.publish("careteam.changed", { membershipId: membership._id, childId: child._id });
      sendSuccess(res, membership, "Permissions updated successfully");
    } catch (err) {
      next(err);
    }
  }
);

// 4. Revoke / Remove a care team member
careTeamRouter.delete(
  "/care-team/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const membership = await CareTeam.findById(req.params.id);
      if (!membership) {
        throw new NotFoundError("Care team membership not found");
      }

      const child = await Child.findById(membership.childId);
      if (!child) {
        throw new NotFoundError("Child not found");
      }

      // Allowed if owner OR the invited user themselves removing themselves
      if (child.ownerId !== user.id && membership.userId !== user.id) {
        throw new ForbiddenError("Not authorized to remove this care team member");
      }

      membership.status = "revoked";
      await membership.save();

      await AuditLog.create({
        actorId: user.id,
        action: "careteam.revoked",
        targetType: "careteam",
        targetId: membership._id,
        meta: { childId: child._id, memberId: membership.userId },
      });

      sendSuccess(res, null, "Care team member revoked successfully");
    } catch (err) {
      next(err);
    }
  }
);

// 5. Invited user accepts membership
careTeamRouter.post(
  "/care-team/:id/accept",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const membership = await CareTeam.findById(req.params.id);
      if (!membership || membership.userId !== user.id) {
        throw new NotFoundError("Care team invitation not found");
      }

      membership.status = "active";
      await membership.save();

      await AuditLog.create({
        actorId: user.id,
        action: "careteam.accepted",
        targetType: "careteam",
        targetId: membership._id,
        meta: { childId: membership.childId },
      });

      sendSuccess(res, membership, "Care team invitation accepted");
    } catch (err) {
      next(err);
    }
  }
);

// 6. Get all children assigned to logged-in clinician/educator
careTeamRouter.get(
  "/care-team/mine",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const memberships = await CareTeam.find({ userId: user.id, status: "active" });
      const childIds = memberships.map((m) => m.childId);
      const children = await Child.find({ _id: { $in: childIds }, deletedAt: null });

      const result = children.map((child) => {
        const mem = memberships.find((m) => m.childId === child._id);
        return {
          child,
          careTeamRole: mem?.role,
          permissions: mem?.permissions,
        };
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

