import fs from "fs/promises";
import path from "path";

export async function readJson<T>(relativePath: string, fallback: T): Promise<T> {
  const fullPath = path.join(process.cwd(), relativePath);
  try {
    const raw = await fs.readFile(fullPath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(relativePath: string, data: T): Promise<void> {
  const fullPath = path.join(process.cwd(), relativePath);
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
}
