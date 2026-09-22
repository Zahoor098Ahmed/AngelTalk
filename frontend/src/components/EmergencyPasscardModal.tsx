import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Share,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, CaregiverPasscard } from "../types";
import { DIAGNOSIS_LABELS } from "../types";
import { updateCaregiverPasscard } from "../modules/storage";
import { colors } from "../theme";
import { useSettings } from "../context/SettingsContext";
import { t } from "../modules/i18n";

interface Props {
  visible: boolean;
  child: ChildProfile;
  onClose: () => void;
  onUpdated: (child: ChildProfile) => void;
}

function defaultPasscard(lang: import("../types").LanguageCode): CaregiverPasscard {
  return {
    emergencyContactName: t("epcDefaultContactName", lang),
    emergencyContactPhone: "",
    communicationStyle: t("epcDefaultCommStyle", lang),
    sensoryTriggers: [
      t("epcDefaultTrigger1", lang),
      t("epcDefaultTrigger2", lang),
      t("epcDefaultTrigger3", lang),
      t("epcDefaultTrigger4", lang),
    ],
    calmingStrategies: [
      t("epcDefaultCalm1", lang),
      t("epcDefaultCalm2", lang),
      t("epcDefaultCalm3", lang),
      t("epcDefaultCalm4", lang),
    ],
    allergies: [t("epcDefaultAllergy", lang)],
    dietaryRestrictions: t("epcDefaultDietary", lang),
    specialInstructions: t("epcDefaultSpecial", lang),
  };
}

export default function EmergencyPasscardModal({ visible, child, onClose, onUpdated }: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const cardData: CaregiverPasscard = child.passcard || {
    ...defaultPasscard(lang),
    emergencyContactName: child.doctorContact?.clinicName ? t("epcDefaultContactNameWithDoctor", lang) : t("epcDefaultContactName", lang),
  };

  const [isEditing, setIsEditing] = useState(false);
  const [contactName, setContactName] = useState(cardData.emergencyContactName);
  const [contactPhone, setContactPhone] = useState(cardData.emergencyContactPhone);
  const [commStyle, setCommStyle] = useState(cardData.communicationStyle);
  const [triggersStr, setTriggersStr] = useState(cardData.sensoryTriggers.join(", "));
  const [calmingStr, setCalmingStr] = useState(cardData.calmingStrategies.join(", "));
  const [allergiesStr, setAllergiesStr] = useState(cardData.allergies.join(", "));
  const [specialInst, setSpecialInst] = useState(cardData.specialInstructions || "");

  function handleSave() {
    const updated: CaregiverPasscard = {
      emergencyContactName: contactName.trim() || t("epcDefaultContactName", lang),
      emergencyContactPhone: contactPhone.trim(),
      communicationStyle: commStyle.trim() || t("epcCommFallback", lang),
      sensoryTriggers: triggersStr.split(",").map((s) => s.trim()).filter(Boolean),
      calmingStrategies: calmingStr.split(",").map((s) => s.trim()).filter(Boolean),
      allergies: allergiesStr.split(",").map((s) => s.trim()).filter(Boolean),
      specialInstructions: specialInst.trim(),
    };
    updateCaregiverPasscard(child.id, updated);
    const updatedChild: ChildProfile = { ...child, passcard: updated };
    onUpdated(updatedChild);
    setIsEditing(false);
    Alert.alert(t("epcSavedTitle", lang), t("epcSavedBody", lang));
  }

  function handleShare() {
    const childLine = t("epcShareChildLine", lang).replace("{name}", child.name).replace("{age}", String(child.age));
    const diagnosesLine = t("epcShareDiagnoses", lang).replace("{list}", child.diagnoses.map((d) => DIAGNOSIS_LABELS[d] || d).join(", "));
    const doctorLine = child.doctorContact
      ? t("epcShareDoctorLine", lang).replace("{name}", child.doctorContact.doctorName).replace("{phone}", child.doctorContact.phone)
      : "";
    const text = `${t("epcShareHeader", lang)}
${childLine}
${diagnosesLine}

${t("epcShareContactHeader", lang)}
${cardData.emergencyContactName}: ${cardData.emergencyContactPhone || t("epcShareNotSet", lang)}
${doctorLine}

${t("epcShareCommHeader", lang)}
${cardData.communicationStyle}

${t("epcShareTriggersHeader", lang)}
${cardData.sensoryTriggers.map((s) => `• ${s}`).join("\n")}

${t("epcShareCalmHeader", lang)}
${cardData.calmingStrategies.map((c) => `• ${c}`).join("\n")}

${t("epcShareAllergiesHeader", lang)}
${cardData.allergies.join(", ")}

${t("epcShareSpecialHeader", lang)}
${cardData.specialInstructions || t("epcShareNone", lang)}
`;
    Share.share({ message: text, title: `${child.name}_Emergency_Passcard.txt` });
  }

  function handleCall(phone: string) {
    if (!phone) {
      Alert.alert(t("epcNoPhoneTitle", lang), t("epcNoPhoneBody", lang));
      return;
    }
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, "")}`);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.badgeIcon}>
                <Ionicons name="card" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.title}>{t("epcTitle", lang)}</Text>
                <Text style={styles.subTitle}>{t("epcSubTitle", lang)}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Child Profile Bar */}
            <View style={styles.childHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{child.name[0]?.toUpperCase() ?? "C"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childMeta}>{t("epcAgeProfile", lang).replace("{age}", String(child.age))}</Text>
                <View style={styles.diagRow}>
                  {child.diagnoses.map((d) => (
                    <View key={d} style={styles.diagBadge}>
                      <Text style={styles.diagBadgeText}>{DIAGNOSIS_LABELS[d] || d}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {isEditing ? (
              /* ================= EDIT MODE ================= */
              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>{t("epcEditSectionTitle", lang)}</Text>

                <Text style={styles.inputLabel}>{t("epcLabelContactName", lang)}</Text>
                <TextInput
                  value={contactName}
                  onChangeText={setContactName}
                  style={styles.inputField}
                  placeholder={t("epcPlaceholderContactName", lang)}
                />

                <Text style={styles.inputLabel}>{t("epcLabelContactPhone", lang)}</Text>
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  style={styles.inputField}
                  placeholder={t("epcPlaceholderContactPhone", lang)}
                />

                <Text style={styles.inputLabel}>{t("epcLabelCommStyle", lang)}</Text>
                <TextInput
                  value={commStyle}
                  onChangeText={setCommStyle}
                  multiline
                  style={[styles.inputField, { height: 60 }]}
                  placeholder={t("epcPlaceholderCommStyle", lang)}
                />

                <Text style={styles.inputLabel}>{t("epcLabelTriggers", lang)}</Text>
                <TextInput
                  value={triggersStr}
                  onChangeText={setTriggersStr}
                  multiline
                  style={[styles.inputField, { height: 60 }]}
                  placeholder={t("epcPlaceholderTriggers", lang)}
                />

                <Text style={styles.inputLabel}>{t("epcLabelCalming", lang)}</Text>
                <TextInput
                  value={calmingStr}
                  onChangeText={setCalmingStr}
                  multiline
                  style={[styles.inputField, { height: 60 }]}
                  placeholder={t("epcPlaceholderCalming", lang)}
                />

                <Text style={styles.inputLabel}>{t("epcLabelAllergies", lang)}</Text>
                <TextInput
                  value={allergiesStr}
                  onChangeText={setAllergiesStr}
                  style={styles.inputField}
                  placeholder={t("epcPlaceholderAllergies", lang)}
                />

                <Text style={styles.inputLabel}>{t("epcLabelSpecial", lang)}</Text>
                <TextInput
                  value={specialInst}
                  onChangeText={setSpecialInst}
                  multiline
                  style={[styles.inputField, { height: 70 }]}
                  placeholder={t("epcPlaceholderSpecial", lang)}
                />

                <View style={styles.editActions}>
                  <Pressable onPress={() => setIsEditing(false)} style={styles.btnSecondary}>
                    <Text style={styles.btnSecondaryText}>{t("cancel", lang)}</Text>
                  </Pressable>
                  <Pressable onPress={handleSave} style={styles.btnPrimary}>
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.btnPrimaryText}>{t("epcSavePasscard", lang)}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* ================= DISPLAY MODE ================= */
              <>
                {/* Emergency Contact Card */}
                <View style={styles.emergencyCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyLabel}>{t("epcPrimaryContact", lang)}</Text>
                    <Text style={styles.emergencyName}>{cardData.emergencyContactName}</Text>
                    <Text style={styles.emergencyPhone}>{cardData.emergencyContactPhone || t("epcNoPhoneYet", lang)}</Text>
                  </View>
                  {cardData.emergencyContactPhone ? (
                    <Pressable
                      onPress={() => handleCall(cardData.emergencyContactPhone)}
                      style={styles.callButton}
                    >
                      <Ionicons name="call" size={18} color="white" />
                      <Text style={styles.callButtonText}>{t("epcCall", lang)}</Text>
                    </Pressable>
                  ) : null}
                </View>

                {/* Attending Doctor / Clinic if present */}
                {child.doctorContact && (
                  <View style={styles.doctorInfoCard}>
                    <Ionicons name="medkit" size={20} color={colors.forest} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoTitle}>{t("epcPediatrician", lang)}</Text>
                      <Text style={styles.infoContent}>
                        {t("epcDrClinicLine", lang).replace("{name}", child.doctorContact.doctorName).replace("{clinic}", child.doctorContact.clinicName)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleCall(child.doctorContact!.phone)}
                      style={styles.smallCallBtn}
                    >
                      <Ionicons name="call" size={14} color={colors.forest} />
                    </Pressable>
                  </View>
                )}

                {/* Communication Style */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubbles" size={18} color="#0284c7" />
                    <Text style={styles.sectionTitle}>{t("epcHowICommunicate", lang)}</Text>
                  </View>
                  <Text style={styles.sectionBody}>{cardData.communicationStyle}</Text>
                </View>

                {/* Sensory Triggers */}
                <View style={[styles.sectionCard, { borderColor: "#fecaca", backgroundColor: "#fff5f5" }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="warning" size={18} color="#ef4444" />
                    <Text style={[styles.sectionTitle, { color: "#b91c1c" }]}>{t("epcSensoryTriggers", lang)}</Text>
                  </View>
                  <View style={styles.listWrap}>
                    {cardData.sensoryTriggers.map((t, idx) => (
                      <View key={idx} style={styles.triggerBadge}>
                        <Ionicons name="flash" size={12} color="#dc2626" />
                        <Text style={styles.triggerText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* What Helps Me Calm Down */}
                <View style={[styles.sectionCard, { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="heart" size={18} color={colors.greenDeep} />
                    <Text style={[styles.sectionTitle, { color: colors.forest }]}>{t("epcWhatCalms", lang)}</Text>
                  </View>
                  <View style={styles.listWrap}>
                    {cardData.calmingStrategies.map((c, idx) => (
                      <View key={idx} style={styles.calmBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.greenDeep} />
                        <Text style={styles.calmText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Allergies & Special Care */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="nutrition" size={18} color="#f59e0b" />
                    <Text style={styles.sectionTitle}>{t("epcAllergiesNotes", lang)}</Text>
                  </View>
                  <Text style={styles.sectionBody}>
                    <Text style={{ fontWeight: "700" }}>{t("epcAllergiesLabel", lang)}</Text>
                    {cardData.allergies.join(", ")}
                  </Text>
                  {cardData.specialInstructions ? (
                    <Text style={[styles.sectionBody, { marginTop: 6 }]}>
                      <Text style={{ fontWeight: "700" }}>{t("epcCaregiverNotesLabel", lang)}</Text>
                      {cardData.specialInstructions}
                    </Text>
                  ) : null}
                </View>
              </>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          {!isEditing && (
            <View style={styles.footer}>
              <Pressable onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Ionicons name="create-outline" size={18} color="#334155" />
                <Text style={styles.editBtnText}>{t("epcEditBtn", lang)}</Text>
              </Pressable>
              <Pressable onPress={handleShare} style={styles.shareBtn}>
                <Ionicons name="share-social" size={18} color="white" />
                <Text style={styles.shareBtnText}>{t("epcShareBtn", lang)}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 520,
    maxHeight: "92%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "white", fontSize: 16, fontWeight: "800" },
  subTitle: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 6 },

  childHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "white", fontSize: 22, fontWeight: "800" },
  childName: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  childMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  diagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  diagBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diagBadgeText: { color: "#0284c7", fontSize: 10.5, fontWeight: "700" },

  emergencyCard: {
    backgroundColor: "#dc2626",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emergencyLabel: { color: "#fee2e2", fontSize: 10.5, fontWeight: "800", letterSpacing: 0.5 },
  emergencyName: { color: "white", fontSize: 18, fontWeight: "800", marginTop: 3 },
  emergencyPhone: { color: "#fecaca", fontSize: 13, marginTop: 2, fontWeight: "600" },
  callButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  callButtonText: { color: "#dc2626", fontWeight: "800", fontSize: 13 },

  doctorInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  infoTitle: { fontSize: 11, fontWeight: "700", color: colors.forest },
  infoContent: { fontSize: 13, fontWeight: "600", color: "#1e293b", marginTop: 2 },
  smallCallBtn: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },

  sectionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  sectionBody: { fontSize: 13, color: "#475569", lineHeight: 19 },

  listWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  triggerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  triggerText: { color: "#991b1b", fontSize: 12, fontWeight: "600" },
  calmBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  calmText: { color: "#166534", fontSize: 12, fontWeight: "600" },

  footer: {
    flexDirection: "row",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    gap: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#e2e8f0",
    paddingVertical: 12,
    borderRadius: 10,
  },
  editBtnText: { color: "#334155", fontWeight: "700", fontSize: 13 },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: { color: "white", fontWeight: "700", fontSize: 13 },

  /* Edit Section */
  editSection: { gap: 10 },
  editSectionTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginTop: 4 },
  inputField: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0f172a",
  },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  btnSecondary: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnSecondaryText: { color: "#475569", fontWeight: "700", fontSize: 13 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnPrimaryText: { color: "white", fontWeight: "700", fontSize: 13 },
});
