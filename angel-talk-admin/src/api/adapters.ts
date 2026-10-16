import type { VerbFormText, VerbGroup } from "../types";

/**
 * The backend stores verb forms as { text, translations: { "ar-SA", "ur-PK" } }; the admin
 * screens work with { en, ar, ur }.
 * These helpers convert between the two so the panel shows and saves the real database data.
 */

type ApiForm = { text?: string; translations?: Record<string, string>; en?: string; ar?: string; ur?: string };
type ApiVerb = {
  _id: string;
  base?: string;
  baseKey?: string;
  emoji?: string;
  icon?: string;
  source?: string;
  isCustom?: boolean;
  forms: Record<keyof VerbGroup["forms"], ApiForm>;
  createdAt: string;
  updatedAt: string;
};

const FORM_KEYS: (keyof VerbGroup["forms"])[] = ["first", "s_es", "second", "third", "fourth"];

function formFromApi(f: ApiForm | undefined): VerbFormText {
  if (!f) return { en: "", ar: "", ur: "" };
  if (f.en !== undefined) return { en: f.en ?? "", ar: f.ar ?? "", ur: f.ur ?? "" };
  return { en: f.text ?? "", ar: f.translations?.["ar-SA"] ?? "", ur: f.translations?.["ur-PK"] ?? "" };
}

export function verbFromApi(v: ApiVerb): VerbGroup {
  const forms = Object.fromEntries(FORM_KEYS.map((k) => [k, formFromApi(v.forms?.[k])])) as VerbGroup["forms"];
  return {
    _id: v._id,
    baseKey: v.baseKey ?? v.base ?? forms.first.en.toLowerCase(),
    icon: v.icon ?? v.emoji,
    forms,
    isCustom: v.isCustom ?? v.source !== "app",
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

export function verbToApi(v: { baseKey: string; icon?: string; forms: VerbGroup["forms"] }) {
  const forms = Object.fromEntries(
    FORM_KEYS.map((k) => {
      const f = v.forms[k];
      const translations: Record<string, string> = {};
      if (f.ar) translations["ar-SA"] = f.ar;
      if (f.ur) translations["ur-PK"] = f.ur;
      return [k, { text: f.en, translations }];
    }),
  );
  return { base: v.baseKey, emoji: v.icon, forms, active: true };
}
