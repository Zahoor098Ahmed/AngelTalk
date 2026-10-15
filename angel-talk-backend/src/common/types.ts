export type UserRole = "parent" | "slp" | "educator" | "admin" | "superadmin";

export type UserStatus = "active" | "suspended";

export type CareTeamRole = "slp" | "educator";

export type CareTeamPermission =
  | "view_board"
  | "edit_board"
  | "view_clinical"
  | "write_clinical"
  | "manage_schedule";

export type CareTeamStatus = "pending" | "active" | "revoked";

export type DiagnosisType =
  | "autism"
  | "down_syndrome"
  | "speech_delay"
  | "adhd"
  | "hearing_impairment"
  | "visual_impairment"
  | "dyslexia"
  | "cerebral_palsy"
  | "intellectual_disability"
  | "sensory_processing"
  | "non_verbal"
  | "general";

export type LanguageCode = "en-US" | "ar-SA" | "ur-PK" | "hi-IN" | "es-ES" | "fr-FR";

export type VoiceType = "boy" | "girl" | "woman" | "man";

export type BoardMode = "phrase" | "sentence";

export type TileSize = "sm" | "md" | "lg";

export type VerbFormTag = "first" | "s_es" | "second" | "third" | "fourth";

export type StoryCategory = "routine" | "health" | "school" | "emotions" | "social" | "custom";

export type MoodType = "happy" | "calm" | "frustrated" | "overwhelmed" | "tired";

export type TherapyCategory = "speech" | "occupational" | "behavioral" | "sensory";

export type GameType = "letters" | "numbers" | "shapes" | "colors" | "animals" | "food" | "emotions";

export type ConsentType = "data_processing" | "face_biometrics" | "slp_sharing";

export type AuditAction =
  | "user.register"
  | "user.login"
  | "user.logout"
  | "user.suspend"
  | "user.activate"
  | "user.role_change"
  | "user.sessions_revoked"
  | "user.gdpr_erased"
  | "pin.changed"
  | "pin.lockout"
  | "face.enrolled"
  | "face.deleted"
  | "device.registered"
  | "device.revoked"
  | "careteam.invited"
  | "careteam.accepted"
  | "careteam.revoked"
  | "pdpl.export_requested"
  | "pdpl.erasure_executed";

export type OutboxEventType =
  | "user.deleted"
  | "child.deleted"
  | "consent.changed"
  | "careteam.changed"
  | "report.requested";

export type SyncAction = "UPSERT" | "DELETE" | "INCREMENT";

export interface SyncMutation {
  id: string; // client UUID
  table: string;
  action: SyncAction;
  data?: Record<string, unknown>;
  clientUpdatedAt: string; // ISO date string
}

export type MutationStatus = "applied" | "skipped_stale" | "rejected";

export interface SyncMutationResult {
  id: string;
  status: MutationStatus;
  reason?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  deviceId?: string;
}

