// Copies Pretendard variable woff2 from node_modules into src/app/fonts/
// so next/font/local can pick it up via a relative path.
//
// Runs as a postinstall step. Safe to re-run.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const source = resolve(
  projectRoot,
  "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
);
const destDir = resolve(projectRoot, "src/app/fonts");
const dest = resolve(destDir, "PretendardVariable.woff2");

if (!existsSync(source)) {
  console.warn(
    `[copy-fonts] Source not found: ${source}. Skipping. Run 'pnpm install' to restore.`,
  );
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(source, dest);
console.log(`[copy-fonts] Copied Pretendard → ${dest}`);
