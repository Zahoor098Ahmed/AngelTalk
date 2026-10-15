import { v4 as uuidv4 } from "uuid";
import { Shelf, IShelf } from "../../models/Shelf";
import { Word, IWord } from "../../models/Word";
import { SeedTemplate } from "../../models/SeedTemplate";
import { UsageSummary } from "../../models/UsageSummary";
import { assertChildAccess } from "../../middleware/auth";
import { AuthenticatedUser } from "../../common/types";
import { NotFoundError, BadRequestError } from "../../common/errors";

export class BoardService {
  public static async getBoard(
    user: AuthenticatedUser,
    childId: string
  ): Promise<{ shelves: IShelf[]; words: IWord[] }> {
    await assertChildAccess(user, childId, "view_board");

    const [shelves, words] = await Promise.all([
      Shelf.find({ childId, deletedAt: null }).sort({ order: 1 }),
      Word.find({ childId, deletedAt: null }).sort({ order: 1 }),
    ]);

    return { shelves, words };
  }

  public static async createShelf(
    user: AuthenticatedUser,
    childId: string,
    data: {
      name: string;
      seedName?: string;
      icon?: string;
      imageUri?: string;
      color?: string;
      order?: number;
      hidden?: boolean;
      source?: "manual" | "voice" | "list" | "seed";
      parentId?: string | null;
    }
  ): Promise<IShelf> {
    const child = await assertChildAccess(user, childId, "edit_board");

    const shelf = await Shelf.create({
      _id: uuidv4(),
      ownerId: child.ownerId,
      childId: child._id,
      name: data.name,
      seedName: data.seedName,
      icon: data.icon,
      imageUri: data.imageUri,
      color: data.color,
      order: data.order ?? 0,
      hidden: data.hidden ?? false,
      source: data.source || "manual",
      parentId: data.parentId || null,
      clientUpdatedAt: new Date(),
    });

    return shelf;
  }

  public static async updateShelf(
    user: AuthenticatedUser,
    shelfId: string,
    data: Partial<IShelf>
  ): Promise<IShelf> {
    const shelf = await Shelf.findOne({ _id: shelfId, deletedAt: null });
    if (!shelf) {
      throw new NotFoundError("Shelf not found");
    }

    await assertChildAccess(user, shelf.childId, "edit_board");

    if (data.name !== undefined) shelf.name = data.name;
    if (data.icon !== undefined) shelf.icon = data.icon;
    if (data.imageUri !== undefined) shelf.imageUri = data.imageUri;
    if (data.color !== undefined) shelf.color = data.color;
    if (data.order !== undefined) shelf.order = data.order;
    if (data.hidden !== undefined) shelf.hidden = data.hidden;
    if (data.parentId !== undefined) shelf.parentId = data.parentId;

    shelf.clientUpdatedAt = new Date();
    await shelf.save();
    return shelf;
  }

  public static async deleteShelf(user: AuthenticatedUser, shelfId: string): Promise<void> {
    const shelf = await Shelf.findOne({ _id: shelfId, deletedAt: null });
    if (!shelf) {
      throw new NotFoundError("Shelf not found");
    }

    await assertChildAccess(user, shelf.childId, "edit_board");

    // Collect all sub-shelves recursively
    const shelfIdsToDelete = [shelfId];
    const subShelves = await Shelf.find({ childId: shelf.childId, parentId: shelfId, deletedAt: null });
    for (const sub of subShelves) {
      shelfIdsToDelete.push(sub._id);
    }

    const now = new Date();
    await Promise.all([
      Shelf.updateMany(
        { _id: { $in: shelfIdsToDelete } },
        { deletedAt: now, clientUpdatedAt: now }
      ),
      Word.updateMany(
        { shelfId: { $in: shelfIdsToDelete }, deletedAt: null },
        { deletedAt: now, clientUpdatedAt: now }
      ),
    ]);
  }

  public static async createWord(
    user: AuthenticatedUser,
    shelfId: string,
    data: {
      label: string;
      phrase: string;
      translations?: Record<string, string>;
      seedLabel?: string;
      emoji?: string;
      imageUri?: string;
      color?: string;
      audioUri?: string;
      useTextToSpeech?: boolean;
      size?: "sm" | "md" | "lg";
      order?: number;
      hidden?: boolean;
      verbGroupId?: string | null;
      verbFormTag?: "first" | "s_es" | "second" | "third" | "fourth" | null;
    }
  ): Promise<IWord> {
    const shelf = await Shelf.findOne({ _id: shelfId, deletedAt: null });
    if (!shelf) {
      throw new NotFoundError("Shelf not found");
    }

    await assertChildAccess(user, shelf.childId, "edit_board");

    const word = await Word.create({
      _id: uuidv4(),
      ownerId: shelf.ownerId,
      childId: shelf.childId,
      shelfId: shelf._id,
      label: data.label,
      phrase: data.phrase,
      translations: data.translations || {},
      seedLabel: data.seedLabel,
      emoji: data.emoji,
      imageUri: data.imageUri,
      color: data.color,
      audioUri: data.audioUri,
      useTextToSpeech: data.useTextToSpeech ?? false,
      size: data.size || "md",
      order: data.order ?? 0,
      hidden: data.hidden ?? false,
      isCustom: true,
      verbGroupId: data.verbGroupId || null,
      verbFormTag: data.verbFormTag || null,
      clientUpdatedAt: new Date(),
    });

    return word;
  }

  public static async bulkCreateWords(
    user: AuthenticatedUser,
    shelfId: string,
    rawText: string,
    color?: string
  ): Promise<IWord[]> {
    const shelf = await Shelf.findOne({ _id: shelfId, deletedAt: null });
    if (!shelf) {
      throw new NotFoundError("Shelf not found");
    }

    await assertChildAccess(user, shelf.childId, "edit_board");

    // Split on comma, newline, or Arabic comma (،)
    const rawTokens = rawText.split(/[\n,،]+/);
    const tokens = rawTokens
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 100); // max 100 words

    if (tokens.length === 0) {
      throw new BadRequestError("No valid words provided in input");
    }

    const currentWordCount = await Word.countDocuments({ shelfId: shelf._id, deletedAt: null });
    const docs = tokens.map((token, index) => ({
      _id: uuidv4(),
      ownerId: shelf.ownerId,
      childId: shelf.childId,
      shelfId: shelf._id,
      label: token,
      phrase: token,
      color: color || shelf.color,
      order: currentWordCount + index,
      hidden: false,
      isCustom: true,
      useTextToSpeech: true,
      clientUpdatedAt: new Date(),
    }));

    const words = await Word.insertMany(docs);
    return words as unknown as IWord[];
  }

  public static async updateWord(
    user: AuthenticatedUser,
    wordId: string,
    data: Partial<IWord>
  ): Promise<IWord> {
    const word = await Word.findOne({ _id: wordId, deletedAt: null });
    if (!word) {
      throw new NotFoundError("Word not found");
    }

    await assertChildAccess(user, word.childId, "edit_board");

    if (data.label !== undefined) word.label = data.label;
    if (data.phrase !== undefined) word.phrase = data.phrase;
    if (data.translations !== undefined) word.translations = data.translations;
    if (data.emoji !== undefined) word.emoji = data.emoji;
    if (data.imageUri !== undefined) word.imageUri = data.imageUri;
    if (data.color !== undefined) word.color = data.color;
    if (data.audioUri !== undefined) word.audioUri = data.audioUri;
    if (data.useTextToSpeech !== undefined) word.useTextToSpeech = data.useTextToSpeech;
    if (data.size !== undefined) word.size = data.size;
    if (data.order !== undefined) word.order = data.order;
    if (data.hidden !== undefined) word.hidden = data.hidden;
    if (data.verbGroupId !== undefined) word.verbGroupId = data.verbGroupId;
    if (data.verbFormTag !== undefined) word.verbFormTag = data.verbFormTag;

    word.clientUpdatedAt = new Date();
    await word.save();
    return word;
  }

  public static async deleteWord(user: AuthenticatedUser, wordId: string): Promise<void> {
    const word = await Word.findOne({ _id: wordId, deletedAt: null });
    if (!word) {
      throw new NotFoundError("Word not found");
    }

    await assertChildAccess(user, word.childId, "edit_board");

    word.deletedAt = new Date();
    word.clientUpdatedAt = new Date();
    await word.save();
  }

  public static async tapWord(user: AuthenticatedUser, wordId: string): Promise<void> {
    const word = await Word.findOne({ _id: wordId, deletedAt: null });
    if (!word) {
      throw new NotFoundError("Word not found");
    }

    await assertChildAccess(user, word.childId, "view_board");

    const now = new Date();
    await Word.updateOne(
      { _id: wordId },
      {
        $inc: { useCount: 1 },
        $set: { lastUsedAt: now, clientUpdatedAt: now },
      }
    );

    // Increment telemetry in UsageSummary additively
    const dayOfWeek = now.getDay(); // 0..6
    await UsageSummary.updateOne(
      { childId: word.childId },
      {
        $inc: {
          [`wordTotals.${wordId}`]: 1,
          [`wordsByDay.${dayOfWeek}`]: 1,
        },
        $set: { lastPlayedDate: now, clientUpdatedAt: now },
      },
      { upsert: true }
    );
  }

  public static async applyTemplate(
    user: AuthenticatedUser,
    childId: string,
    templateId: string
  ): Promise<IShelf> {
    const child = await assertChildAccess(user, childId, "edit_board");

    const template = await SeedTemplate.findOne({
      $or: [{ _id: templateId }, { seedName: templateId }],
      active: true,
    });
    if (!template) {
      throw new NotFoundError("Seed template not found");
    }

    // Create the shelf
    const shelfId = uuidv4();
    const shelf = await Shelf.create({
      _id: shelfId,
      ownerId: child.ownerId,
      childId: child._id,
      name: template.name,
      seedName: template.seedName,
      icon: template.icon,
      color: template.color,
      order: template.order,
      source: "seed",
      clientUpdatedAt: new Date(),
    });

    // Populate words from template
    if (template.words && template.words.length > 0) {
      const wordsToInsert = template.words.map((w, idx) => ({
        _id: uuidv4(),
        ownerId: child.ownerId,
        childId: child._id,
        shelfId: shelf._id,
        label: w.label,
        phrase: w.phrase,
        translations: w.translations || {},
        emoji: w.emoji,
        imageUri: w.imageUri,
        color: w.color || template.color,
        verbFormTag: w.verbFormTag || null,
        order: idx,
        isCustom: false,
        useTextToSpeech: true,
        clientUpdatedAt: new Date(),
      }));
      await Word.insertMany(wordsToInsert);
    }

    return shelf;
  }
}

