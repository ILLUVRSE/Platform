import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";
import { moviesCatalog, seriesCatalog, type Episode } from "../../lib/libraryData";
import { readJson } from "../../lib/dataLoader";
import { Suspense } from "react";
import { bestFormat } from "../../lib/mediaStore";
import fs from "fs/promises";
import path from "path";

const appRoot = process.cwd().includes(`${path.sep}apps${path.sep}storysphere`)
  ? process.cwd()
  : path.join(process.cwd(), "apps/storysphere");
const libraryPath = path.join(appRoot, "src/app/library");

async function loadLibrary() {
  const data = await readJson<{ series: typeof seriesCatalog; movies: typeof moviesCatalog }>(
    "data/library.json",
    { series: seriesCatalog, movies: moviesCatalog }
  );
  return {
    series: await attachEpisodeFiles(data.series ?? seriesCatalog),
    movies: data.movies ?? moviesCatalog,
    files: await listLibraryFiles()
  };
}

async function attachEpisodeFiles(series: typeof seriesCatalog) {
  const allowedExt = [".mp4", ".mov", ".mkv", ".avi", ".mpeg"];
  let episodeFiles: string[] = [];
  try {
    episodeFiles = (await fs.readdir(libraryPath))
      .filter((f) => allowedExt.some((ext) => f.toLowerCase().endsWith(ext)))
      .sort();
  } catch {
    episodeFiles = [];
  }

  let cursor = 0;
  return series.map((show) => ({
    ...show,
    seasons: show.seasons.map((season) => ({
      ...season,
      episodes: season.episodes.map((episode) => {
        const file = episode.file ?? episodeFiles[cursor];
        cursor = Math.min(cursor + 1, episodeFiles.length);
        return { ...episode, file };
      })
    }))
  }));
}

async function listLibraryFiles() {
  const allowedExt = [".mp4", ".mov", ".mkv", ".avi", ".mpeg"];
  try {
    const entries = await fs.readdir(libraryPath);
    return entries
      .filter((f) => allowedExt.some((ext) => f.toLowerCase().endsWith(ext)))
      .sort()
      .map((file) => ({
        file,
        url: buildPreviewUrl(file),
        mime: mimeFromFile(file)
      }));
  } catch {
    return [];
  }
}

export default function LibraryPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-slate-700 text-cream">Library</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Beverly Hillbillies S1 + 3-movie block</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          Full Season 1 (36 episodes) of The Beverly Hillbillies plus Casablanca (color edition),
          Royal Wedding, and Reefer Madness. Pulled from the local library folder so you can drop
          them straight into LiveLoop.
        </p>
      </section>

      <Suspense fallback={<div>Loading library…</div>}>
        <LibrarySections />
      </Suspense>
    </div>
  );
}

async function LibrarySections() {
  const { series, movies, files } = await loadLibrary();
  return (
    <>
      <PageSection eyebrow="Series" title="Seasons and episodes">
        <div className="space-y-4">
          {series.map((show) => (
            <Card
              key={show.title}
              title={`${show.title} — ${show.seasons.length} season`}
              body={
                <div className="space-y-4 text-sm text-slate-200/80">
                  {show.seasons.map((season) => (
                    <div
                      key={season.id}
                      className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">
                            {season.title}
                          </div>
                          <div className="text-cream">
                            {season.episodes.length} episodes · Season 1 complete
                          </div>
                        </div>
                        <Pill className="bg-teal-600/30 text-teal-100">Ready for LiveLoop</Pill>
                      </div>
                      <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                        {season.episodes.map((episode, index) => (
                          <EpisodeRow key={episode.id} episode={episode} index={index} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              }
            />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Movies" title="Pick the best format">
        <div className="grid gap-4 md:grid-cols-3">
          {await Promise.all(
            movies.map(async (movie) => {
              const best = await bestFormat(movie.file ?? movie.title);
              const fileName = movie.file ?? best?.path;
              const previewSrc = buildPreviewUrl(fileName);
              return (
                <Card
                  key={movie.title}
                  title={movie.title}
                  body={
                    <div className="text-sm text-slate-200/80">
                      Duration {movie.duration}
                      <div className="mt-1 text-[12px]">
                        Best format: {best ? best.path : fileName || "not found"}
                        {best?.sha256 && (
                          <ProofCard
                            sha={best.sha256}
                            signer="local-sha256"
                            timestamp={new Date().toISOString()}
                          />
                        )}
                      </div>
                      {previewSrc && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Preview</div>
                          <video
                            className="w-full rounded-lg border border-slate-700 bg-slate-950"
                            controls
                            preload="metadata"
                            playsInline
                            muted
                          >
                            <source src={previewSrc} type={mimeFromFile(fileName)} />
                          </video>
                          <div className="text-[12px] text-slate-300/80">Tap play — served via /api/liveloop/preview</div>
                          <a
                            className="inline-flex text-[12px] font-semibold text-teal-200 hover:text-teal-100"
                            href={previewSrc}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in new tab
                          </a>
                        </div>
                      )}
                    </div>
                  }
                />
              );
            })
          )}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Library files"
        title={`All media in ${libraryPath.replace(process.cwd(), ".")}`}
      >
        <p className="mb-3 text-sm text-slate-300/80">
          Found {files.length} video file{files.length === 1 ? "" : "s"} in this folder. This is the
          exact folder the preview API reads from (plus MEDIA_ROOT if set).
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <Card
              key={file.file}
              title={file.file}
              body={
                <div className="space-y-2 text-sm text-slate-200/80">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Preview</div>
                  <video
                    className="w-full rounded-lg border border-slate-700 bg-slate-950"
                    controls
                    preload="metadata"
                    playsInline
                    muted
                  >
                    <source src={file.url ?? undefined} type={file.mime} />
                  </video>
                  <div className="text-[12px] text-slate-300/80">Served via /api/liveloop/preview</div>
                  <a
                    className="inline-flex text-[12px] font-semibold text-teal-200 hover:text-teal-100"
                    href={file.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in new tab
                  </a>
                </div>
              }
            />
          ))}
          {files.length === 0 && (
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 text-sm text-slate-200/80">
              No media files found in the library folder.
            </div>
          )}
        </div>
      </PageSection>
    </>
  );
}

function EpisodeRow({ episode, index }: { episode: Episode; index: number }) {
  const friendlyEpisode = `S1E${String(index + 1).padStart(2, "0")}`;
  const duration = episode.duration || "00:25";
  const previewSrc = buildPreviewUrl(episode.file);
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-semibold text-cream">
          {friendlyEpisode} — {episode.title}
        </div>
        <div className="text-xs text-slate-200/70">
          Duration {duration}
          {episode.file && (
            <>
              {" "}
              • file: <span className="text-slate-100">{episode.file}</span>
            </>
          )}
        </div>
        {previewSrc && (
          <div className="mt-2 space-y-1 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
            <div className="text-[12px] font-semibold text-teal-200">Play inline</div>
            <video
              className="w-full rounded-md border border-slate-700 bg-slate-950"
              controls
              preload="metadata"
              playsInline
              muted
            >
              <source src={previewSrc ?? undefined} type={mimeFromFile(episode.file)} />
            </video>
            <div className="text-[11px] text-slate-300/80">
              Served via /api/liveloop/preview with range support and correct MIME type.
            </div>
            <a
              className="inline-flex text-[12px] font-semibold text-teal-200 hover:text-teal-100"
              href={previewSrc ?? "#"}
              target="_blank"
              rel="noreferrer"
            >
              Open in new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function buildPreviewUrl(filePath?: string | null) {
  if (!filePath) return null;
  const base = path.basename(filePath);
  return `/api/liveloop/preview?file=${encodeURIComponent(base)}`;
}

function mimeFromFile(filePath?: string | null) {
  if (!filePath) return "video/mp4";
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".mkv":
      return "video/x-matroska";
    case ".mov":
      return "video/quicktime";
    case ".avi":
      return "video/x-msvideo";
    case ".mpeg":
      return "video/mpeg";
    default:
      return "video/mp4";
  }
}
