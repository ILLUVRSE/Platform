import crypto from "crypto";
import fs from "fs";

export function sha256File(path: string): string | null {
  try {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(path);
    return new Promise<string>((resolve, reject) => {
      stream.on("data", (data) => hash.update(data));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    }) as unknown as string; // promise resolved later
  } catch {
    return null;
  }
}
