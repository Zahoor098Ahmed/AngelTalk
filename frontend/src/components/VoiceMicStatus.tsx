import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { getMicState, subscribeMicState, type MicState } from "../modules/voice";

/**
 * Live microphone feedback for voice screens: whether the mic is really on, a level bar that
 * moves with the voice, a "speak louder" hint when the input stays very quiet, and the real
 * error when the browser's speech recognition fails. Subscribes on its own so the parent
 * screen doesn't re-render on every level tick.
 */
export default function VoiceMicStatus() {
  const [mic, setMic] = useState<MicState>(getMicState());
  const quietSince = useRef<number | null>(null);
  const [tooQuiet, setTooQuiet] = useState(false);

  useEffect(() => subscribeMicState(setMic), []);

  useEffect(() => {
    const live = mic.levelAvailable && (mic.status === "listening" || mic.status === "hearing");
    if (!live) {
      quietSince.current = null;
      setTooQuiet(false);
      return;
    }
    if (mic.level > 0.08) {
      quietSince.current = null;
      setTooQuiet(false);
    } else if (quietSince.current === null) {
      quietSince.current = Date.now();
    } else if (Date.now() - quietSince.current > 4000) {
      setTooQuiet(true);
    }
  }, [mic]);

  if (mic.status === "error" && mic.error) {
    return (
      <View style={[styles.box, styles.errorBox]}>
        <Text style={styles.errorText}>⚠️ {mic.error}</Text>
      </View>
    );
  }
  if (mic.status === "idle") return null;

  const label =
    mic.status === "starting"
      ? "Starting the microphone…"
      : mic.status === "reconnecting"
      ? "🔄 Reconnecting to the speech service… (what you said is kept)"
      : mic.status === "hearing"
      ? "🎙️ Hearing you…"
      : "🎙️ Mic is on — speak now";
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      {mic.levelAvailable && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(Math.max(0.03, mic.level) * 100)}%` }]} />
        </View>
      )}
      {tooQuiet && <Text style={styles.hint}>Your voice is very quiet — come a little closer to the mic or speak a bit louder.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: "100%", gap: 6, marginTop: 8, alignItems: "center" },
  label: { fontSize: 14, fontWeight: "700", color: "#235E50" },
  track: { width: "80%", height: 10, borderRadius: 5, backgroundColor: "#DDEDE6", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, backgroundColor: "#16A34A" },
  hint: { fontSize: 13, color: "#B45309", textAlign: "center" },
  errorBox: { padding: 10, borderRadius: 12, backgroundColor: "#FFF5F5", borderWidth: 1.5, borderColor: "#F3C4C4" },
  errorText: { fontSize: 14, fontWeight: "700", color: "#B91C1C", textAlign: "center" },
});
