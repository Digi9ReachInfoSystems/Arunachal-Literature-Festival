// One-time fix for MP4 videos uploaded before fast-start was added on upload.
// Moves each file's index to the front (no re-encode) so it starts playing sooner.
//
//   node scripts/fastStartExistingVideos.js           -> dry run, only lists what would change
//   node scripts/fastStartExistingVideos.js --apply   -> rewrites the files in place
import fs from "fs";
import path from "path";
import { getUploadsRoot } from "../utils/fileStorage.js";
import { fastStartMp4 } from "../utils/mp4FastStart.js";

const apply = process.argv.includes("--apply");

function listVideos(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listVideos(full);
    return /\.(mp4|m4v|mov)$/i.test(entry.name) ? [full] : [];
  });
}

let changed = 0;
for (const file of listVideos(getUploadsRoot())) {
  const original = fs.readFileSync(file);
  const result = fastStartMp4(original);
  if (result === original) continue;
  changed += 1;
  console.log(`${apply ? "fixed" : "would fix"}: ${path.relative(getUploadsRoot(), file)}`);
  if (apply) {
    // Write to a temp file first so a crash never leaves a half-written video.
    const temp = `${file}.faststart-tmp`;
    fs.writeFileSync(temp, result);
    fs.renameSync(temp, file);
  }
}
console.log(`${changed} video(s) ${apply ? "fixed" : "need fixing (run with --apply)"}.`);
