import type { ChildProfile } from "../types";

export function cloudProfile(child: ChildProfile): Record<string, unknown> {
  return {
    name: child.name || "Child",
    age: Math.min(25, Math.max(1, Math.round(child.age || 5))),
    diagnoses: child.diagnoses?.length ? child.diagnoses : ["general"],
    ...(/^https?:\/\//i.test(child.photoUrl || "") ? { photoUrl: child.photoUrl } : {}),
  };
}

/** Explicit allowlist: no board, settings, rewards, word usage, sentences or care notes. */
export function buildProfileRecords(children: ChildProfile[]) {
  return children.map((child) => ({
    key: `children:${child.id}`,
    table: "children",
    id: child.id,
    data: cloudProfile(child),
  }));
}
