/**
 * Connects the app to the Angel Talk server (and so to the admin panel), quietly in the background:
 *
 *  - every install gets its own family account on the server automatically (no sign-up screen)
 *  - the children, their board (folders + words), word usage and care-journal entries are sent up,
 *    only what changed since the last time
 *  - words, folders and verbs that were added in the admin panel come down and join the board
 *
 * Works offline-first: with no internet or no server nothing happens, and it simply tries again later.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authFetch, backendLogin, backendRegister, checkServerHealth, clearTokens, getAccessToken } from "./backendSync";
import {
  addWord,
  addWordsBulk,
  childCategories,
  createBlankCategory,
  ensureCategoriesLoaded,
  getCategory,
  isDeletedWord,
  listCategories,
  subscribeCategories,
  topLevelCategories,
} from "./customCategories";
import { getUsage, loadChildren, loadSettings } from "./storage";
import { canonicalWordEn, registerTranslations } from "./i18n";
import { registerVerbForms, sFormOf, type VerbForms } from "./verbForms";
import type { CustomCategory, CustomWord } from "../types";

const ACCOUNT_KEY = "angeltalk_cloud_account";
const SENT_KEY = "angeltalk_cloud_sent";
const CONTENT_SINCE_KEY = "angeltalk_cloud_content_since";
const ADMIN_VERBS_KEY = "angeltalk_cloud_admin_verbs";
const SYNC_EVERY_MS = 5 * 60 * 1000;
const BATCH = 400;

type Mutation = { table: string; id: string; action: "UPSERT" | "DELETE"; clientUpdatedAt: string; data: Record<string, unknown> };

let started = false;
let running: Promise<void> | null = null;
let again = false;
let blocked = false; // the account was suspended or deleted in the admin panel

// ---------- account ----------

function randomString(len: number): string {
  const abc = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += abc[Math.floor(Math.random() * abc.length)];
  return out;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function ensureSignedIn(): Promise<boolean> {
  if (blocked) return false;
  if (await getAccessToken()) {
    const me = await authFetch("/api/v1/auth/me");
    if (me.ok) return true;
  }
  const account = await readJson<{ email: string; password: string } | null>(ACCOUNT_KEY, null);
  if (account) {
    try {
      await backendLogin(account.email, account.password);
      return true;
    } catch (e) {
      // removed or suspended by the admin: stop trying instead of creating a new account
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      if (msg.includes("suspend") || msg.includes("invalid") || msg.includes("not found")) blocked = true;
      await clearTokens();
      return false;
    }
  }
  const names = loadChildren().map((c) => c.name).filter(Boolean);
  const fresh = {
    email: `family-${randomString(10)}@devices.angeltalk.app`,
    password: `At${randomString(14)}9`,
  };
  await backendRegister({
    ...fresh,
    fullName: names.length ? `${names.join(", ")} family` : "Angel Talk family",
    role: "parent",
  });
  await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(fresh));
  return true;
}

// ---------- sending ----------

const FORM_TO_SERVER: Record<string, string> = { "1st": "first", s: "s_es", "2nd": "second", "3rd": "third", "4th": "fourth" };
const FORM_FROM_SERVER: Record<string, CustomWord["verbFormTag"]> = { first: "1st", s_es: "s", second: "2nd", third: "3rd", fourth: "4th" };

/** Pictures picked from the phone (data:/file: URIs) stay on the device. */
const webUri = (u?: string) => (u && /^https?:\/\//.test(u) && u.length < 2000 ? u : undefined);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const hashOf = (v: unknown) => {
  const s = JSON.stringify(v);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
};

function buildRecords(): { key: string; table: string; id: string; data: Record<string, unknown> }[] {
  const out: { key: string; table: string; id: string; data: Record<string, unknown> }[] = [];
  const add = (table: string, id: string, data: Record<string, unknown>) => out.push({ key: `${table}:${id}`, table, id, data });
  const children = loadChildren();
  // the app settings of this device (Settings screen) are saved with each child
  const app = loadSettings();

  for (const c of children) {
    const usage = getUsage(c.id);
    add("children", c.id, {
      name: c.name || "Child",
      age: clamp(Math.round(c.age || 5), 1, 25),
      diagnoses: c.diagnoses?.length ? c.diagnoses : ["general"],
      settings: {
        voiceType: c.voiceType ?? "boy",
        boardMode: c.boardMode ?? "phrase",
        simpleMode: !!c.simpleMode,
        bilingualDisplay: !!c.bilingualDisplay,
        language: app.language,
        speechRate: clamp(app.speechRate ?? 0.9, 0.5, 1.5),
        visibleVerbForms: app.visibleVerbForms,
        visibleNounForms: app.visibleNounForms,
        tilesPerRow: clamp(app.tilesPerRow ?? 0, 0, 12),
      },
      rewards: { stars: c.stars ?? 0, badges: c.badges ?? [], consecutiveDays: usage.consecutiveDays ?? 0 },
    });
    add("usagesummaries", `usage_${c.id}`, {
      childId: c.id,
      wordTotals: usage.wordTotals ?? {},
      wordsByDay: usage.wordsByDay,
      scheduleByDay: usage.scheduleByDay,
      lastPlayedDate: usage.lastPlayedDate,
      longestSentenceLength: usage.longestSentenceLength ?? 0,
      longestSentenceWords: usage.longestSentenceWords ?? [],
      sentencesSpoken: usage.sentencesSpoken ?? 0,
      correctionsUsed: usage.correctionsUsed ?? 0,
    });
    for (const log of c.careLogs ?? []) {
      add("carelogs", log.id, {
        childId: c.id,
        date: log.date,
        mood: log.mood,
        sensoryTriggers: log.sensoryTriggers ?? [],
        meltdownDurationMin: log.meltdownDurationMin ?? 0,
        communicationWins: log.communicationWins ?? "",
        notes: log.notes ?? "",
      });
    }
  }

  // the board is shared by everyone on this device; it is stored with the first child
  const owner = children[0];
  if (owner) {
    const cats = listCategories();
    cats.forEach((cat: CustomCategory, ci) => {
      add("shelves", cat.id, {
        childId: owner.id,
        name: cat.name,
        icon: cat.icon,
        imageUri: webUri(cat.imageUri),
        color: cat.color,
        order: cat.order ?? ci,
        hidden: !!cat.hidden,
        parentId: cat.parentCategoryId ?? null,
        source: "manual",
      });
      cat.words.forEach((w, wi) => {
        add("words", w.id, {
          childId: owner.id,
          shelfId: cat.id,
          label: w.label,
          phrase: w.phrase || w.label,
          emoji: w.emoji,
          imageUri: webUri(w.imageUri),
          color: w.color,
          order: w.order ?? wi,
          hidden: !!w.hidden,
          isCustom: !!w.isCustom,
          useCount: w.useCount ?? 0,
          useTextToSpeech: w.useTextToSpeech ?? true,
          verbFormTag: w.verbFormTag ? FORM_TO_SERVER[w.verbFormTag] ?? null : null,
        });
      });
    });
  }
  return out;
}

async function pushChanges(): Promise<number> {
  const sent = await readJson<Record<string, string>>(SENT_KEY, {});
  const records = buildRecords();
  const now = new Date().toISOString();
  const mutations: (Mutation & { key: string; hash: string })[] = [];
  const present = new Set<string>();

  for (const r of records) {
    present.add(r.key);
    const hash = hashOf(r.data);
    if (sent[r.key] !== hash) mutations.push({ key: r.key, hash, table: r.table, id: r.id, action: "UPSERT", clientUpdatedAt: now, data: r.data });
  }
  // removed on the device -> removed on the server
  for (const key of Object.keys(sent)) {
    if (present.has(key)) continue;
    const [table, ...rest] = key.split(":");
    const id = rest.join(":");
    if (table === "children" || table === "usagesummaries") continue; // child removal is handled by the server
    const owner = loadChildren()[0];
    mutations.push({ key, hash: "", table, id, action: "DELETE", clientUpdatedAt: now, data: { childId: owner?.id } });
  }
  if (mutations.length === 0) return 0;

  // children first: everything else belongs to a child
  mutations.sort((a, b) => Number(b.table === "children") - Number(a.table === "children"));
  let applied = 0;
  for (let i = 0; i < mutations.length; i += BATCH) {
    const part = mutations.slice(i, i + BATCH);
    const res = await authFetch("/api/v1/sync/push", {
      method: "POST",
      body: JSON.stringify({ mutations: part.map(({ key: _k, hash: _h, ...m }) => m) }),
    });
    if (!res.ok) break;
    const json = await res.json();
    const results: { id: string; status: string }[] = json.data?.results ?? [];
    const okIds = new Set(results.filter((r) => r.status === "applied" || r.status === "skipped_stale").map((r) => r.id));
    for (const m of part) {
      if (!okIds.has(m.id)) continue;
      applied++;
      if (m.action === "DELETE") delete sent[m.key];
      else sent[m.key] = m.hash;
    }
    await AsyncStorage.setItem(SENT_KEY, JSON.stringify(sent));
  }
  return applied;
}

// ---------- receiving (admin panel -> app) ----------

type ServerTemplate = {
  name: string;
  active: boolean;
  source?: string;
  editedByAdmin?: boolean;
  nameTranslations?: Record<string, string>;
  words: { label: string; phrase?: string; emoji?: string; imageUri?: string; color?: string; verbFormTag?: string; translations?: Record<string, string> }[];
};
type ServerVerb = {
  base: string;
  emoji?: string;
  active: boolean;
  source?: string;
  editedByAdmin?: boolean;
  forms: Record<"first" | "s_es" | "second" | "third" | "fourth", { text: string; translations?: Record<string, string> }>;
};

const same = (a: string, b: string) => {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x === y || (canonicalWordEn(a) || a).trim().toLowerCase() === (canonicalWordEn(b) || b).trim().toLowerCase();
};

/** "Food / Drinks" -> the local folder, created when the admin made a new one. */
function folderForPath(parts: string[], create: boolean): CustomCategory | undefined {
  let level = topLevelCategories();
  let found: CustomCategory | undefined;
  for (const name of parts) {
    let next = level.find((c) => same(c.name, name));
    if (!next) {
      if (!create) return undefined;
      next = createBlankCategory({ name, parentCategoryId: found?.id ?? null });
    }
    found = next;
    level = childCategories(next.id);
  }
  return found ? getCategory(found.id) : undefined;
}

function applyTemplates(templates: ServerTemplate[]) {
  for (const t of templates) {
    // the app's own folders are already on the device; only admin-made or admin-edited ones are merged
    if (!t.active || (t.source === "app" && !t.editedByAdmin)) continue;
    const parts = t.name.split(" / ").map((p) => p.trim()).filter(Boolean);
    // Arabic / Urdu made by the admin panel, so these words show in the child's language
    if (parts.length) registerTranslations(parts[parts.length - 1], t.nameTranslations);
    (t.words || []).forEach((w) => registerTranslations(w.label, w.translations));
    const folder = folderForPath(parts, t.source !== "app");
    if (!folder) continue;
    const missing = (t.words || []).filter(
      (w) => w.label?.trim() && !folder.words.some((lw) => same(lw.label, w.label)) && !isDeletedWord(folder.id, w.label),
    );
    if (missing.length === 0) continue;
    addWordsBulk(
      folder.id,
      missing.map((w) => ({
        label: w.label,
        phrase: w.phrase || w.label,
        emoji: w.emoji,
        imageUri: w.imageUri,
        color: w.color,
        size: "md" as const,
        useTextToSpeech: true,
        verbFormTag: w.verbFormTag ? FORM_FROM_SERVER[w.verbFormTag] : undefined,
        isCustom: true,
      })),
    );
  }
}

function toVerbForms(v: ServerVerb): VerbForms {
  const lower = (s?: string) => (s || "").trim().toLowerCase();
  return {
    base: lower(v.forms.first?.text) || lower(v.base),
    past: lower(v.forms.second?.text),
    participle: lower(v.forms.third?.text),
    continuous: lower(v.forms.fourth?.text),
    emoji: v.emoji || "⚡",
  };
}

function applyVerbs(verbs: ServerVerb[]) {
  verbs
    .filter((v) => v.active && (v.source !== "app" || v.editedByAdmin))
    .forEach((v) => Object.values(v.forms || {}).forEach((f) => f?.text && registerTranslations(f.text, f.translations)));
  const adminVerbs = verbs.filter((v) => v.active && v.base && (v.source !== "app" || v.editedByAdmin)).map(toVerbForms).filter((v) => v.past && v.participle && v.continuous);
  if (adminVerbs.length === 0) return adminVerbs;
  registerVerbForms(adminVerbs);
  const actions = topLevelCategories().find((c) => same(c.name, "Actions"));
  for (const vf of adminVerbs) {
    const letter = vf.base[0]?.toUpperCase();
    const folder = actions && childCategories(actions.id).find((c) => same(c.name, `Verbs ${letter}`));
    if (!folder) continue;
    if (folder.words.some((w) => same(w.label, vf.base) || same(w.label, sFormOf(vf.base)))) continue;
    if (isDeletedWord(folder.id, vf.base, "1st")) continue;
    addWord(folder.id, { label: vf.base.charAt(0).toUpperCase() + vf.base.slice(1), emoji: vf.emoji, verbForms: vf, useTextToSpeech: true });
  }
  return adminVerbs;
}

async function pullContent(): Promise<void> {
  const since = await AsyncStorage.getItem(CONTENT_SINCE_KEY);
  const res = await authFetch(`/api/v1/content/updates${since ? `?since=${encodeURIComponent(since)}` : ""}`);
  if (!res.ok) return;
  const json = await res.json();
  const data = json.data as { syncedAt: string; templates: ServerTemplate[]; verbs: ServerVerb[] } | undefined;
  if (!data) return;
  await ensureCategoriesLoaded();
  applyTemplates(data.templates ?? []);
  const verbs = applyVerbs(data.verbs ?? []);
  if (verbs.length) {
    const known = await readJson<VerbForms[]>(ADMIN_VERBS_KEY, []);
    const merged = [...known.filter((k) => !verbs.some((v) => v.base === k.base)), ...verbs];
    await AsyncStorage.setItem(ADMIN_VERBS_KEY, JSON.stringify(merged));
  }
  await AsyncStorage.setItem(CONTENT_SINCE_KEY, data.syncedAt);
}

// ---------- scheduling ----------

async function syncOnce(): Promise<void> {
  if (!(await checkServerHealth())) return;
  if (!(await ensureSignedIn())) return;
  await pullContent();
  await pushChanges();
}

/** Run a sync now (or right after the one in progress). Never throws. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = syncOnce()
    .catch((e) => console.warn("[cloud] sync deferred:", e instanceof Error ? e.message : e))
    .finally(() => {
      running = null;
      if (again) {
        again = false;
        void syncNow();
      }
    });
  return running;
}

/** Start background syncing: now, every few minutes, and shortly after the board changes. */
export function startCloudConnect(): void {
  if (started) return;
  started = true;
  // admin verbs learned earlier are known even when offline
  readJson<VerbForms[]>(ADMIN_VERBS_KEY, []).then((list) => list.length && registerVerbForms(list));
  void ensureCategoriesLoaded().then(() => syncNow());
  setInterval(() => void syncNow(), SYNC_EVERY_MS);
  let timer: ReturnType<typeof setTimeout> | null = null;
  subscribeCategories(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), 15000);
  });
}
