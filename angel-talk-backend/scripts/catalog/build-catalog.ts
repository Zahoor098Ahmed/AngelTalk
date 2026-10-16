/**
 * Bundles entry.ts together with the app's own source (frontend/src) and runs it in Node,
 * returning every hard-coded catalog collection. Native / UI packages are replaced by stubs,
 * and module-level constants that the app does not export are exposed for reading.
 */
import { build, type Plugin } from "esbuild";
import fs from "fs";
import os from "os";
import path from "path";

const FRONTEND_SRC = path.resolve(__dirname, "../../../frontend/src");
const STUBS = path.resolve(__dirname, "stubs");

/** Read-only access to module constants such as VERBS_A_TO_Z or the games' item lists. */
const exposeConstants: Plugin = {
  name: "expose-constants",
  setup(b) {
    b.onLoad({ filter: /[\\/]frontend[\\/]src[\\/](modules|screens)[\\/][^\\/]+\.tsx?$/ }, async (args) => {
      const src = await fs.promises.readFile(args.path, "utf8");
      const names = [...src.matchAll(/^const ([A-Za-z_$][\w$]*)\s*[:=]/gm)].map((m) => m[1]);
      const extra = names.length ? `\nexport { ${[...new Set(names)].join(", ")} };\n` : "";
      return { contents: src + extra, loader: args.path.endsWith(".tsx") ? "tsx" : "ts" };
    });
  },
};

/** Every package import (react-native, expo-*, icons…) becomes a harmless stub. */
const stubPackages: Plugin = {
  name: "stub-packages",
  setup(b) {
    b.onResolve({ filter: /^@react-native-async-storage\/async-storage$/ }, () => ({ path: path.join(STUBS, "async-storage.js") }));
    // the real React (screens create contexts at load time); everything native stays stubbed
    b.onResolve({ filter: /^react(\/jsx-runtime|\/jsx-dev-runtime)?$/ }, (args) => ({
      path: require.resolve(args.path, { paths: [path.resolve(FRONTEND_SRC, "..")] }),
    }));
    b.onResolve({ filter: /^[^./]|^\.\/node_modules/ }, (args) => {
      if (path.isAbsolute(args.path)) return undefined;
      return { path: path.join(STUBS, "any.js") };
    });
  },
};

export async function buildCatalog(): Promise<Record<string, { _id: string; [k: string]: unknown }[]>> {
  const outfile = path.join(os.tmpdir(), `angeltalk-catalog-${process.pid}.cjs`);
  await build({
    entryPoints: [path.resolve(__dirname, "entry.ts")],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile,
    jsx: "automatic",
    logLevel: "error",
    plugins: [exposeConstants, stubPackages],
    loader: Object.fromEntries([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bin", ".txt", ".ttf", ".otf", ".mp3", ".wav", ".m4a", ".mp4"].map((e) => [e, "empty" as const])),
    absWorkingDir: FRONTEND_SRC,
  });
  try {
    // The app's code checks for a browser window; the export runs as a plain Node script
    const mod = require(outfile) as { buildCatalog: () => Promise<Record<string, { _id: string }[]>> };
    return (await mod.buildCatalog()) as Record<string, { _id: string; [k: string]: unknown }[]>;
  } finally {
    fs.rmSync(outfile, { force: true });
  }
}
