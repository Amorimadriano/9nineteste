import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("Opening browser...");
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

console.log("Selecting composition...");
const composition = await selectComposition({
  serveUrl: bundled,
  id: "tutorial-completo",
  puppeteerInstance: browser,
});

console.log(`Rendering ${composition.durationInFrames} frames (~${(composition.durationInFrames / 30).toFixed(0)}s)...`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: "/mnt/documents/9nine-tutorial-completo.mp4",
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
});

console.log("Done! Output: /mnt/documents/9nine-tutorial-completo.mp4");
await browser.close({ silent: false });
