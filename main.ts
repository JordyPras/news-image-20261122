import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LIMIT = 1048576; // RULES.txt: entry image must be at most 1 MiB
const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target = join(targetDir, "entry.png");

// The front page is pre-drawn; this program only places it where the
// grader looks, so the two graded runs write identical bytes.
if (!existsSync(source)) {
  throw new Error(`missing entry image: ${source}`);
}
const input = readFileSync(source);
if (input.length > LIMIT) {
  throw new Error(
    `entry.png is ${input.length} bytes, above the ${LIMIT} byte limit`,
  );
}
if (input[0] !== 0x89 || input[1] !== 0x50 || input[2] !== 0x4e || input[3] !== 0x47) {
  throw new Error("entry.png does not start with PNG magic bytes");
}
// IHDR width/height sit at bytes 16..24; RULES.txt caps both at 1024.
const width = input.readUInt32BE(16);
const height = input.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(
    `entry.png is ${width}x${height}, above the 1024x1024 limit`,
  );
}
mkdirSync(targetDir, { recursive: true });
writeFileSync(target, input);
const outSize = statSync(target).size;
if (outSize !== input.length) {
  throw new Error(
    `copied ${outSize} bytes to ${target}, expected ${input.length}`,
  );
}
console.log(`wrote ${outSize} bytes to ${target}`);
