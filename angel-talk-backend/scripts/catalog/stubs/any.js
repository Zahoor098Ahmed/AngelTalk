// Stand-in for every native / UI package (react-native, expo-*, icons…) while exporting the catalog.
// Any property read, call or `new` returns another stand-in, so module-level UI code loads harmlessly.
// Named imports (`import { StyleSheet } from "react-native"`) are copied from the module's own keys,
// so the names screens use at load time are listed as own keys too.
const NAMED = [
  "default", "StyleSheet", "Dimensions", "Platform", "PixelRatio", "I18nManager", "Animated", "Easing", "Appearance",
  "View", "Text", "Image", "ImageBackground", "ScrollView", "FlatList", "SectionList", "Pressable", "TouchableOpacity",
  "TouchableHighlight", "TouchableWithoutFeedback", "TextInput", "Modal", "Switch", "ActivityIndicator", "Alert",
  "Keyboard", "KeyboardAvoidingView", "Linking", "Share", "Vibration", "AppState", "BackHandler", "LayoutAnimation",
  "UIManager", "NativeModules", "NativeEventEmitter", "useWindowDimensions", "useColorScheme", "SafeAreaView",
  "SafeAreaProvider", "useSafeAreaInsets", "Ionicons", "MaterialIcons", "MaterialCommunityIcons", "FontAwesome",
  "FontAwesome5", "Feather", "AntDesign", "Entypo", "LinearGradient", "Audio", "Video", "Speech", "Haptics",
  "ImagePicker", "FileSystem", "Camera", "CameraView", "WebView", "Svg", "Path", "Circle", "Rect", "G",
  "requireNativeModule", "EventEmitter", "registerRootComponent",
];
const target = function () {};
const handler = {
  get(_t, key) {
    if (key === "__esModule") return true;
    if (key === "then") return undefined; // never look like a Promise
    if (key === "prototype") return target.prototype;
    if (key === Symbol.toPrimitive) return () => "";
    if (key === Symbol.iterator) return function* () {};
    if (key === "OS") return "web";
    if (key === "select") return (o) => (o && (o.web ?? o.default)) ?? undefined;
    return stub;
  },
  apply: () => stub,
  construct: () => stub,
  ownKeys: () => [...NAMED, ...Reflect.ownKeys(target).filter((k) => !NAMED.includes(k))],
  getOwnPropertyDescriptor(_t, key) {
    const own = Reflect.getOwnPropertyDescriptor(target, key);
    if (own) return own;
    if (NAMED.includes(key)) return { configurable: true, enumerable: true, writable: true, value: stub };
    return undefined;
  },
};
const stub = new Proxy(target, handler);
module.exports = stub;
