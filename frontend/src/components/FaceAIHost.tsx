import { useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { EXPOSE_FACEAPI, FACE_AI_RUNTIME, handleFaceAIMessage, registerFaceAIHost } from "../modules/faceAI";

/**
 * Invisible WebView that runs the on-device face AI on Android / iOS
 * (see modules/faceAI.ts). Mounted once at the app root. Not used on web.
 */
const PAGE = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
var files = {};
function reply(id, result, error) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ id: id, result: result, error: error }));
}
async function onMessage(event) {
  var msg;
  try { msg = JSON.parse(event.data); } catch (e) { return; }
  if (!msg || !msg.id) return;
  try {
    if (msg.op === "chunk") {
      var f = files[msg.name] || (files[msg.name] = []);
      f[msg.index] = msg.data;
      reply(msg.id, true);
    } else if (msg.op === "loadScript") {
      (0, eval)(files[msg.name].join("") + ${JSON.stringify(EXPOSE_FACEAPI)});
      delete files[msg.name];
      ${FACE_AI_RUNTIME.replace(/<\/script>/gi, "<\\/script>")}
      reply(msg.id, true);
    } else if (msg.op === "init") {
      var out = {};
      Object.keys(files).forEach(function (name) { out[name] = { b64: files[name].join("") }; });
      files = {};
      window.__faceAIFiles = out;
      reply(msg.id, await window.__faceAI.init(msg.manifests));
    } else if (msg.op === "describe") {
      reply(msg.id, await window.__faceAI.describe(msg.dataUri));
    }
  } catch (e) {
    reply(msg.id, null, String((e && e.message) || e));
  }
}
window.addEventListener("message", onMessage);
document.addEventListener("message", onMessage);
window.ReactNativeWebView.postMessage(JSON.stringify({ booted: true }));
</script></body></html>`;

export default function FaceAIHost() {
  const ref = useRef<WebView>(null);
  if (Platform.OS === "web") return null;
  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html: PAGE }}
        javaScriptEnabled
        onMessage={(e) => {
          const data = e.nativeEvent.data;
          if (data.includes('"booted"')) {
            registerFaceAIHost((msg) => ref.current?.postMessage(JSON.stringify(msg)));
            return;
          }
          handleFaceAIMessage(data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Must stay rendered (not display:none) so the page keeps running
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0, left: -10, top: -10 },
});
