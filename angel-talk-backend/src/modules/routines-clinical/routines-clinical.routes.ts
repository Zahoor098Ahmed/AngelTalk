import { Router, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";
import { authenticate, AuthenticatedRequest, assertChildAccess } from "../../middleware/auth";
import { ScheduleTask } from "../../models/ScheduleTask";
import { SocialStory } from "../../models/SocialStory";
import { CareLog } from "../../models/CareLog";
import { TherapyGoal } from "../../models/TherapyGoal";
import { ClinicalNote } from "../../models/ClinicalNote";
import { Passcard } from "../../models/Passcard";
import { GamesProgress } from "../../models/GamesProgress";
import { SentenceLog } from "../../models/SentenceLog";
import { UsageSummary } from "../../models/UsageSummary";
import { sendSuccess } from "../../common/response";
import { NotFoundError } from "../../common/errors";

export const routinesClinicalRouter = Router();

// ==========================================
// 1. Visual Schedule
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/schedule",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId), "view_board");
      const tasks = await ScheduleTask.find({ childId: req.params.childId, deletedAt: null }).sort({ order: 1 });
      sendSuccess(res, tasks);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.post(
  "/children/:childId/schedule",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "manage_schedule");
      const task = await ScheduleTask.create({
        _id: uuidv4(),
        ownerId: child.ownerId,
        childId: child._id,
        title: req.body.title,
        time: req.body.time,
        emoji: req.body.emoji || "⭐",
        pictogram: req.body.pictogram,
        order: req.body.order ?? 0,
        dayOfWeek: req.body.dayOfWeek ?? 0,
        completedDates: req.body.completedDates || [],
        clientUpdatedAt: new Date(),
      });
      sendSuccess(res, task, "Schedule task created", 201);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.put(
  "/scheduletasks/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const task = await ScheduleTask.findOne({ _id: req.params.id, deletedAt: null });
      if (!task) throw new NotFoundError("Schedule task not found");
      await assertChildAccess(user, task.childId, "manage_schedule");

      if (req.body.title !== undefined) task.title = req.body.title;
      if (req.body.time !== undefined) task.time = req.body.time;
      if (req.body.emoji !== undefined) task.emoji = req.body.emoji;
      if (req.body.completedDates !== undefined) task.completedDates = req.body.completedDates;
      task.clientUpdatedAt = new Date();
      await task.save();

      sendSuccess(res, task, "Task updated");
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.delete(
  "/scheduletasks/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const task = await ScheduleTask.findOne({ _id: req.params.id, deletedAt: null });
      if (!task) throw new NotFoundError("Schedule task not found");
      await assertChildAccess(user, task.childId, "manage_schedule");

      task.deletedAt = new Date();
      task.clientUpdatedAt = new Date();
      await task.save();

      sendSuccess(res, null, "Task deleted");
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 2. Social Stories
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/stories",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId), "view_board");
      const stories = await SocialStory.find({ childId: req.params.childId, deletedAt: null });
      sendSuccess(res, stories);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.post(
  "/children/:childId/stories",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "edit_board");
      const story = await SocialStory.create({
        _id: uuidv4(),
        ownerId: child.ownerId,
        childId: child._id,
        title: req.body.title,
        category: req.body.category || "custom",
        icon: req.body.icon || "📖",
        description: req.body.description || "",
        coverImage: req.body.coverImage,
        pages: req.body.pages || [],
        clientUpdatedAt: new Date(),
      });
      sendSuccess(res, story, "Social story created", 201);
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 3. Care Logs (Meltdown & Mood Tracking)
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/care-logs",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId), "view_clinical");
      const logs = await CareLog.find({ childId: req.params.childId, deletedAt: null }).sort({ date: -1 });
      sendSuccess(res, logs);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.post(
  "/children/:childId/care-logs",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "write_clinical");
      const log = await CareLog.create({
        _id: uuidv4(),
        ownerId: child.ownerId,
        childId: child._id,
        date: req.body.date ? new Date(req.body.date) : new Date(),
        mood: req.body.mood,
        sensoryTriggers: req.body.sensoryTriggers || [],
        meltdownDurationMin: req.body.meltdownDurationMin || 0,
        communicationWins: req.body.communicationWins,
        notes: req.body.notes,
        loggedBy: user.id,
        clientUpdatedAt: new Date(),
      });
      sendSuccess(res, log, "Care log created", 201);
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 4. Therapy Goals (SLP Clinical Targets)
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/therapy-goals",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId), "view_clinical");
      const goals = await TherapyGoal.find({ childId: req.params.childId, deletedAt: null }).sort({ createdAt: -1 });
      sendSuccess(res, goals);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.post(
  "/children/:childId/therapy-goals",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "write_clinical");
      const goal = await TherapyGoal.create({
        _id: uuidv4(),
        ownerId: child.ownerId,
        childId: child._id,
        title: req.body.title,
        category: req.body.category,
        targetCount: req.body.targetCount,
        currentCount: req.body.currentCount || 0,
        unit: req.body.unit || "times",
        completed: req.body.completed || false,
        prescribedBy: req.body.prescribedBy || user.email,
        assignedDate: req.body.assignedDate ? new Date(req.body.assignedDate) : new Date(),
        notes: req.body.notes,
        clientUpdatedAt: new Date(),
      });
      sendSuccess(res, goal, "Therapy goal created", 201);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.put(
  "/therapy-goals/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const goal = await TherapyGoal.findOne({ _id: req.params.id, deletedAt: null });
      if (!goal) throw new NotFoundError("Therapy goal not found");
      await assertChildAccess(user, goal.childId, "write_clinical");

      if (req.body.currentCount !== undefined) goal.currentCount = req.body.currentCount;
      if (req.body.completed !== undefined) goal.completed = req.body.completed;
      if (req.body.notes !== undefined) goal.notes = req.body.notes;
      goal.clientUpdatedAt = new Date();
      await goal.save();

      sendSuccess(res, goal, "Therapy goal updated");
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 5. Clinical Notes
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/clinical-notes",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId), "view_clinical");
      const notes = await ClinicalNote.find({ childId: req.params.childId, deletedAt: null }).sort({ date: -1 });
      sendSuccess(res, notes);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.post(
  "/children/:childId/clinical-notes",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "write_clinical");
      const note = await ClinicalNote.create({
        _id: uuidv4(),
        ownerId: child.ownerId,
        childId: child._id,
        authorId: user.id,
        date: req.body.date ? new Date(req.body.date) : new Date(),
        title: req.body.title,
        content: req.body.content,
        recommendations: req.body.recommendations || [],
        clientUpdatedAt: new Date(),
      });
      sendSuccess(res, note, "Clinical note saved", 201);
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 6. Caregiver Emergency Passcard
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/passcard",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId));
      let passcard = await Passcard.findOne({ childId: req.params.childId, deletedAt: null });
      if (!passcard) {
        passcard = await Passcard.create({
          _id: uuidv4(),
          ownerId: user.id,
          childId: req.params.childId,
          clientUpdatedAt: new Date(),
        });
      }
      sendSuccess(res, passcard);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.put(
  "/children/:childId/passcard",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId));
      const passcard = await Passcard.findOneAndUpdate(
        { childId: child._id },
        { ...req.body, clientUpdatedAt: new Date() },
        { upsert: true, new: true }
      );
      sendSuccess(res, passcard, "Passcard updated");
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 7. Games Progress & Sentence Logs
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/games",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId), "view_board");
      const games = await GamesProgress.find({ childId: req.params.childId, deletedAt: null }).sort({ playedAt: -1 }).limit(50);
      sendSuccess(res, games);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.post(
  "/children/:childId/games",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "view_board");
      const game = await GamesProgress.create({
        _id: uuidv4(),
        ownerId: child.ownerId,
        childId: child._id,
        gameType: req.body.gameType,
        score: req.body.score || 0,
        starsEarned: req.body.starsEarned || 0,
        playedAt: req.body.playedAt ? new Date(req.body.playedAt) : new Date(),
        clientUpdatedAt: new Date(),
      });
      sendSuccess(res, game, "Game progress saved", 201);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.get(
  "/children/:childId/sentence-logs",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId), "view_board");
      const sentences = await SentenceLog.find({ childId: req.params.childId, deletedAt: null }).sort({ spokenAt: -1 }).limit(50);
      sendSuccess(res, sentences);
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.post(
  "/children/:childId/sentence-logs",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "view_board");
      const sentence = await SentenceLog.create({
        _id: uuidv4(),
        ownerId: child.ownerId,
        childId: child._id,
        words: req.body.words || [],
        text: req.body.text || "",
        length: req.body.words?.length || req.body.length || 0,
        spokenAt: req.body.spokenAt ? new Date(req.body.spokenAt) : new Date(),
        clientUpdatedAt: new Date(),
      });
      sendSuccess(res, sentence, "Sentence logged", 201);
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 8. Clinical Analytics & Telemetry
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/analytics",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, String(req.params.childId), "view_clinical");

      const [summary, sentenceLogs, recentCareLogs] = await Promise.all([
        UsageSummary.findOne({ childId: req.params.childId }),
        SentenceLog.find({ childId: req.params.childId }).sort({ length: -1 }).limit(10),
        CareLog.find({ childId: req.params.childId, deletedAt: null }).sort({ date: -1 }).limit(14),
      ]);

      const meltdownsPastTwoWeeks = recentCareLogs.filter((l) => l.mood === "overwhelmed" || l.meltdownDurationMin > 0).length;

      sendSuccess(res, {
        wordsByDay: summary?.wordsByDay || [0, 0, 0, 0, 0, 0, 0],
        scheduleCompletion: summary?.scheduleByDay || [0, 0, 0, 0, 0, 0, 0],
        longestSentenceLength: summary?.longestSentenceLength || 0,
        longestSentenceWords: summary?.longestSentenceWords || [],
        sentencesSpoken: summary?.sentencesSpoken || 0,
        correctionsUsed: summary?.correctionsUsed || 0,
        topSentences: sentenceLogs,
        meltdownsPastTwoWeeks,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 9. PDF & JSON Clinical Reports
// ==========================================
routinesClinicalRouter.get(
  "/children/:childId/report/json",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "view_clinical");

      const [summary, goals, careLogs, notes] = await Promise.all([
        UsageSummary.findOne({ childId: child._id }),
        TherapyGoal.find({ childId: child._id, deletedAt: null }),
        CareLog.find({ childId: child._id, deletedAt: null }).sort({ date: -1 }).limit(30),
        ClinicalNote.find({ childId: child._id, deletedAt: null }).sort({ date: -1 }).limit(10),
      ]);

      sendSuccess(res, {
        child: { id: child._id, name: child.name, age: child.age, diagnoses: child.diagnoses },
        goals,
        summary,
        recentCareLogs: careLogs,
        clinicalNotes: notes,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

routinesClinicalRouter.get(
  "/children/:childId/report/pdf",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.childId), "view_clinical");

      const [goals, careLogs, summary] = await Promise.all([
        TherapyGoal.find({ childId: child._id, deletedAt: null }),
        CareLog.find({ childId: child._id, deletedAt: null }).sort({ date: -1 }).limit(14),
        UsageSummary.findOne({ childId: child._id }),
      ]);

      const doc = new PDFDocument({ margin: 40 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="AngelTalk_Clinical_Report_${child.name}.pdf"`);
      doc.pipe(res);

      // Header
      doc.fontSize(22).text("Angel Talk — Clinical Communication Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#666666").text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "center" });
      doc.moveDown(1.5);

      // Child Profile
      doc.fontSize(14).fillColor("#000000").text("1. Child Profile & Demographics");
      doc.fontSize(10).text(`Name: ${child.name}`);
      doc.text(`Age: ${child.age} years old`);
      doc.text(`Diagnoses: ${child.diagnoses.join(", ")}`);
      doc.text(`Communication Board Mode: ${child.settings.boardMode === "phrase" ? "Whole Phrase (GLP)" : "Sentence Builder Strip"}`);
      doc.moveDown();

      // Therapy Goals
      doc.fontSize(14).text("2. Active Therapy Goals Progress");
      if (goals.length === 0) {
        doc.fontSize(10).text("No active therapy goals recorded.");
      } else {
        goals.forEach((g, idx) => {
          doc.fontSize(10).text(`${idx + 1}. [${g.category.toUpperCase()}] ${g.title}: ${g.currentCount}/${g.targetCount} ${g.unit} (${g.completed ? "COMPLETED" : "IN PROGRESS"})`);
        });
      }
      doc.moveDown();

      // Usage & Telemetry
      doc.fontSize(14).text("3. Communication Telemetry Summary");
      doc.fontSize(10).text(`Total Sentences Spoken: ${summary?.sentencesSpoken || 0}`);
      doc.text(`Longest Sentence: ${summary?.longestSentenceLength || 0} words ("${summary?.longestSentenceWords?.join(" ") || ""}")`);
      doc.text(`Self-Corrections Used: ${summary?.correctionsUsed || 0}`);
      doc.moveDown();

      // Care Logs / Meltdowns
      doc.fontSize(14).text("4. Recent Caregiver Logs (Past 14 Days)");
      if (careLogs.length === 0) {
        doc.fontSize(10).text("No caregiver logs recorded in this period.");
      } else {
        careLogs.slice(0, 7).forEach((l) => {
          doc.fontSize(9).text(`• ${new Date(l.date).toLocaleDateString()} - Mood: ${l.mood.toUpperCase()} | Meltdown: ${l.meltdownDurationMin} min | Triggers: ${l.sensoryTriggers.join(", ") || "None"} | Notes: ${l.notes || "-"}`);
        });
      }

      doc.end();
    } catch (err) {
      next(err);
    }
  }
);

