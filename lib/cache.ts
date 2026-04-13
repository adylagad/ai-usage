import fs from "fs";
import path from "path";
import { CacheEntry, ToolId } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const TTL_MINUTES = parseInt(process.env.CACHE_TTL_MINUTES ?? "5", 10);

function cacheFilePath(tool: ToolId): string {
  return path.join(CACHE_DIR, `${tool}.json`);
}

export function readCache<T>(tool: ToolId): T | null {
  try {
    const file = cacheFilePath(tool);
    if (!fs.existsSync(file)) return null;
    const entry: CacheEntry<T> = JSON.parse(fs.readFileSync(file, "utf-8"));
    const ageMs = Date.now() - new Date(entry.fetchedAt).getTime();
    if (ageMs > TTL_MINUTES * 60 * 1000) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(tool: ToolId, data: T): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const entry: CacheEntry<T> = { data, fetchedAt: new Date().toISOString() };
    fs.writeFileSync(cacheFilePath(tool), JSON.stringify(entry, null, 2));
  } catch {
    // Non-fatal: cache writes failing shouldn't break the app
  }
}

export function clearCache(tool: ToolId): void {
  try {
    const file = cacheFilePath(tool);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {
    // Non-fatal
  }
}
