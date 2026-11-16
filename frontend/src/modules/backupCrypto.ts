import { AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync, digestStringAsync, CryptoDigestAlgorithm } from "expo-crypto";

export function normalizeRecoveryCode(code: string): string {
  const normalized = code.replace(/[\s-]/g, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error("Enter the complete recovery code saved from Settings.");
  return normalized;
}
export const formatRecoveryCode = (code: string) => normalizeRecoveryCode(code).match(/.{8}/g)!.join("-");
export async function newRecoveryCode(): Promise<string> {
  return (await (await AESEncryptionKey.generate()).encoded("hex")).toLowerCase();
}
export const backupHash = (text: string) => digestStringAsync(CryptoDigestAlgorithm.SHA256, text);
export async function backupIdentity(code: string) {
  const proof = await backupHash(`AngelTalk-backup-proof-v1:${normalizeRecoveryCode(code)}`);
  return { proof, id: await backupHash(proof) };
}
const context = () => new TextEncoder().encode("AngelTalk encrypted backup v1");
export async function encryptBackupPayload(text: string, code: string): Promise<string> {
  const key = await AESEncryptionKey.import(normalizeRecoveryCode(code), "hex");
  const sealed = await aesEncryptAsync(new TextEncoder().encode(text), key, { additionalData: context() });
  return await sealed.combined("base64") as string;
}
export async function decryptBackupPayload(sealed: string, code: string): Promise<string> {
  const key = await AESEncryptionKey.import(normalizeRecoveryCode(code), "hex");
  try {
    const bytes = await aesDecryptAsync(AESSealedData.fromCombined(sealed), key, { additionalData: context() });
    return new TextDecoder().decode(bytes);
  } catch { throw new Error("This recovery code could not open the backup, or the backup is damaged."); }
}
