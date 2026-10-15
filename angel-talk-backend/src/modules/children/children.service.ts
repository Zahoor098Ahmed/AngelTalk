import { v4 as uuidv4 } from "uuid";
import { Child, IChild } from "../../models/Child";
import { Shelf } from "../../models/Shelf";
import { Word } from "../../models/Word";
import { ScheduleTask } from "../../models/ScheduleTask";
import { SocialStory } from "../../models/SocialStory";
import { CareLog } from "../../models/CareLog";
import { TherapyGoal } from "../../models/TherapyGoal";
import { ClinicalNote } from "../../models/ClinicalNote";
import { Passcard } from "../../models/Passcard";
import { UsageSummary } from "../../models/UsageSummary";
import { CareTeam } from "../../models/CareTeam";
import { FaceEmbedding } from "../../models/FaceEmbedding";
import { assertChildAccess } from "../../middleware/auth";
import { AuthenticatedUser, DiagnosisType } from "../../common/types";
import { ForbiddenError } from "../../common/errors";
import { eventBus } from "../../common/events";

export class ChildrenService {
  public static async listChildren(user: AuthenticatedUser): Promise<IChild[]> {
    if (user.role === "admin" || user.role === "superadmin") {
      return Child.find({ deletedAt: null }).sort({ createdAt: -1 });
    }

    if (user.role === "parent") {
      return Child.find({ ownerId: user.id, deletedAt: null }).sort({ createdAt: -1 });
    }

    // SLP or Educator
    const careMemberships = await CareTeam.find({ userId: user.id, status: "active" });
    const childIds = careMemberships.map((m) => m.childId);
    return Child.find({ _id: { $in: childIds }, deletedAt: null }).sort({ name: 1 });
  }

  public static async createChild(
    ownerId: string,
    data: {
      name: string;
      age: number;
      diagnoses: DiagnosisType[];
      photoUrl?: string;
      settings?: Partial<IChild["settings"]>;
    }
  ): Promise<IChild> {
    const childId = uuidv4();

    const child = await Child.create({
      _id: childId,
      ownerId,
      name: data.name,
      age: data.age,
      diagnoses: data.diagnoses || ["general"],
      photoUrl: data.photoUrl,
      settings: {
        language: data.settings?.language || "ar-SA",
        voiceType: data.settings?.voiceType || "boy",
        boardMode: data.settings?.boardMode || "phrase",
        bilingualDisplay: data.settings?.bilingualDisplay ?? false,
        simpleMode: data.settings?.simpleMode ?? true,
        speechRate: data.settings?.speechRate ?? 0.9,
        boardColumns: data.settings?.boardColumns ?? 3,
        highContrast: data.settings?.highContrast ?? false,
        hapticsEnabled: data.settings?.hapticsEnabled ?? true,
      },
      rewards: {
        stars: 0,
        badges: [],
        consecutiveDays: 0,
        lastActiveDate: null,
      },
      face: {
        consent: false,
        consentAt: null,
        version: 1,
        enrolledAt: null,
      },
      clientUpdatedAt: new Date(),
    });

    // Create baseline Passcard and UsageSummary
    await Passcard.create({
      _id: uuidv4(),
      ownerId,
      childId,
      clientUpdatedAt: new Date(),
    });

    await UsageSummary.create({
      _id: uuidv4(),
      ownerId,
      childId,
      wordTotals: new Map(),
      wordsByDay: [0, 0, 0, 0, 0, 0, 0],
      scheduleByDay: [0, 0, 0, 0, 0, 0, 0],
      clientUpdatedAt: new Date(),
    });

    return child;
  }

  public static async getChild(user: AuthenticatedUser, childId: string): Promise<IChild> {
    return assertChildAccess(user, childId);
  }

  public static async updateChild(
    user: AuthenticatedUser,
    childId: string,
    data: Partial<{ name: string; age: number; diagnoses: DiagnosisType[]; photoUrl?: string }>
  ): Promise<IChild> {
    const child = await assertChildAccess(user, childId, "edit_board");
    if (data.name !== undefined) child.name = data.name;
    if (data.age !== undefined) child.age = data.age;
    if (data.diagnoses !== undefined) child.diagnoses = data.diagnoses;
    if (data.photoUrl !== undefined) child.photoUrl = data.photoUrl;

    child.clientUpdatedAt = new Date();
    await child.save();
    return child;
  }

  public static async updateSettings(
    user: AuthenticatedUser,
    childId: string,
    settings: Partial<IChild["settings"]>
  ): Promise<IChild> {
    const child = await assertChildAccess(user, childId, "edit_board");
    child.settings = { ...child.settings, ...settings };
    child.clientUpdatedAt = new Date();
    await child.save();
    return child;
  }

  public static async deleteChild(user: AuthenticatedUser, childId: string): Promise<void> {
    const child = await assertChildAccess(user, childId);
    if (child.ownerId !== user.id && user.role !== "superadmin") {
      throw new ForbiddenError("Only the parent/guardian or superadmin can delete a child profile");
    }

    const now = new Date();
    child.deletedAt = now;
    child.clientUpdatedAt = now;
    await child.save();

    // Cascade soft delete to all child collections
    await Promise.all([
      Shelf.updateMany({ childId, deletedAt: null }, { deletedAt: now, clientUpdatedAt: now }),
      Word.updateMany({ childId, deletedAt: null }, { deletedAt: now, clientUpdatedAt: now }),
      ScheduleTask.updateMany({ childId, deletedAt: null }, { deletedAt: now, clientUpdatedAt: now }),
      SocialStory.updateMany({ childId, deletedAt: null }, { deletedAt: now, clientUpdatedAt: now }),
      CareLog.updateMany({ childId, deletedAt: null }, { deletedAt: now, clientUpdatedAt: now }),
      TherapyGoal.updateMany({ childId, deletedAt: null }, { deletedAt: now, clientUpdatedAt: now }),
      ClinicalNote.updateMany({ childId, deletedAt: null }, { deletedAt: now, clientUpdatedAt: now }),
      Passcard.updateMany({ childId, deletedAt: null }, { deletedAt: now, clientUpdatedAt: now }),
      FaceEmbedding.deleteMany({ childId }), // Biometrics deleted permanently
    ]);

    eventBus.publish("child.deleted", { childId, ownerId: child.ownerId });
  }
}

