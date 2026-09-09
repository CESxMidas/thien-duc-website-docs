import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "node_modules", "fancy-tower"]);
const markdownFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(absolutePath);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      markdownFiles.push(absolutePath);
    }
  }
}

walk(repoRoot);

const failures = [];
const markdownLink = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

for (const file of markdownFiles) {
  const content = readFileSync(file, "utf8");
  for (const match of content.matchAll(markdownLink)) {
    const rawTarget = match[1].replace(/^<|>$/g, "");
    if (!rawTarget || rawTarget.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(rawTarget)) {
      continue;
    }

    let decodedTarget;
    try {
      decodedTarget = decodeURIComponent(rawTarget.split("#", 1)[0]);
    } catch {
      failures.push([file, rawTarget, "URL encode không hợp lệ"]);
      continue;
    }

    const target = resolve(dirname(file), decodedTarget);
    const relativeTarget = relative(repoRoot, target);
    if (relativeTarget.startsWith("..") || target === repoRoot) continue;
    if (!existsSync(target)) failures.push([file, rawTarget, "không tồn tại"]);
  }
}

if (failures.length > 0) {
  console.error("Liên kết Markdown nội bộ bị hỏng:");
  for (const [file, target, reason] of failures) {
    console.error("- " + relative(repoRoot, file) + " -> " + target + " (" + reason + ")");
  }
  process.exit(1);
}

console.log("Đã kiểm tra " + markdownFiles.length + " tệp Markdown: liên kết nội bộ hợp lệ.");
