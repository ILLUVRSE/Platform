import { readJson } from "./dataLoader";
import { jobs as defaultJobs, type Job } from "./jobsData";
import { playlist as defaultPlaylist, type LiveLoopItem } from "./liveloopData";
import { moviesCatalog, seriesCatalog } from "./libraryData";
import { client } from "./db";

type KVKeys = "jobs" | "playlist" | "library";

async function ensureSeeds() {
  const existingJobs = await getKV("jobs");
  if (!existingJobs) await setKV("jobs", defaultJobs);

  const existingPlaylist = await getKV("playlist");
  if (!existingPlaylist) await setKV("playlist", defaultPlaylist);

  const existingLibrary = await getKV("library");
  if (!existingLibrary) {
    const defaults = await readJson("data/library.json", { movies: moviesCatalog, series: seriesCatalog });
    await setKV("library", defaults);
  }
}

ensureSeeds();

function normalizeJob(job: Job): Job {
  return {
    ...job,
    proof: job.proof ?? (job.proofSha ? { sha: job.proofSha, signer: "kernel-multisig", status: "pending" } : undefined),
    proofSha: job.proofSha ?? job.proof?.sha,
    policyVerdict: job.policyVerdict ?? (job.proof ? "SentinelNet PENDING" : undefined)
  };
}

function normalizePlaylistItem(item: LiveLoopItem): LiveLoopItem {
  return {
    ...item,
    proofSha: item.proofSha ?? item.sha ?? "pending-proof",
    policyVerdict: item.policyVerdict ?? "SentinelNet PASS"
  };
}

async function getKV<T>(key: KVKeys): Promise<T | null> {
  if (client.type === "memory") {
    const raw = client.kv.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  if (client.type === "sqlite") {
    client.db.exec(
      `CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );`
    );
    const row = client.db.prepare("SELECT value FROM kv WHERE key = ?").get(key) as { value?: string } | undefined;
    if (!row?.value) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return null;
    }
  } else {
    await client.pool.query(`
      CREATE TABLE IF NOT EXISTS kv (
        key text primary key,
        value text not null
      )
    `);
    const result = await client.pool.query("SELECT value FROM kv WHERE key = $1", [key]);
    if (!result.rows[0]?.value) return null;
    try {
      return JSON.parse(result.rows[0].value) as T;
    } catch {
      return null;
    }
  }
}

async function setKV<T>(key: KVKeys, value: T) {
  const serialized = JSON.stringify(value);
  if (client.type === "memory") {
    client.kv.set(key, serialized);
    return;
  }
  if (client.type === "sqlite") {
    client.db.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)").run(key, serialized);
  } else {
    await client.pool.query("INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", [
      key,
      serialized
    ]);
  }
}

export const store = {
  getJobs: async () => {
    const raw = (await getKV<typeof defaultJobs>("jobs")) ?? defaultJobs;
    return raw.map((job) => normalizeJob(job as Job));
  },
  addJob: async (job: Job) => {
    const normalized = normalizeJob(job);
    const existing = (await getKV<typeof defaultJobs>("jobs")) ?? defaultJobs;
    const jobs = [normalized, ...existing.map((j) => normalizeJob(j as Job))];
    await setKV("jobs", jobs);
    return jobs;
  },
  getPlaylist: async () => {
    const list = (await getKV<typeof defaultPlaylist>("playlist")) ?? defaultPlaylist;
    return list.map((item) => normalizePlaylistItem(item as LiveLoopItem));
  },
  addPlaylistItem: async (item: LiveLoopItem) => {
    const normalized = normalizePlaylistItem(item);
    const list = [normalized, ...((await getKV<typeof defaultPlaylist>("playlist")) ?? defaultPlaylist).map((i) => normalizePlaylistItem(i as LiveLoopItem))];
    await setKV("playlist", list);
    return list;
  },
  getLibrary: async () => (await getKV<{ movies: typeof moviesCatalog; series: typeof seriesCatalog }>("library")) ?? { movies: moviesCatalog, series: seriesCatalog },
  setLibrary: async (lib: { movies: unknown; series: unknown }) => setKV("library", lib)
};
