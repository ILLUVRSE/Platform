import { Card, PageSection, Pill } from "@illuvrse/ui";
import { getLibraryVideos, type LibraryVideo } from "@studio/lib/libraryFiles";

export default function LibraryPage() {
  const videos = getLibraryVideos();
  const featureFilms = videos.filter((video) => video.kind === "feature");
  const renders = videos.filter((video) => video.kind === "render");

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-teal-50 text-teal-700">Library</Pill>
        <h1 className="mt-3 text-4xl font-semibold">StorySphere Library</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-700">
          Everything available under <code>apps/web/public</code> is mirrored here. Preview feature films,
          scan renders, and pull direct links for LiveLoop or downloads.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <Pill className="bg-slate-100 text-slate-700">{videos.length} MP4s</Pill>
          <Pill className="bg-slate-100 text-slate-700">{featureFilms.length} feature films</Pill>
          <Pill className="bg-slate-100 text-slate-700">
            {renders.length} renders/promos ({render360pCount(renders)} at 360p)
          </Pill>
        </div>
      </section>

      <PageSection eyebrow="Feature films" title="Headline titles ready to stream">
        {featureFilms.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureFilms.map((video) => (
              <Card
                key={video.fileName}
                title={video.title}
                body={
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <video
                        className="aspect-video w-full rounded-lg bg-slate-100"
                        src={video.url}
                        controls
                        preload="metadata"
                        playsInline
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{video.duration ? `Duration ${video.duration}` : "Duration not set"}</span>
                      <span>{video.sizeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <Pill className="bg-teal-100 text-teal-700">Feature film</Pill>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 underline underline-offset-4"
                      >
                        Open file
                      </a>
                    </div>
                  </div>
                }
                footer={
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{video.fileName}</span>
                    <a
                      href={video.url}
                      download
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
                    >
                      Download
                    </a>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-600">No feature films found in public/.</div>
        )}
      </PageSection>

      <PageSection eyebrow="Renders + promos" title="Every MP4 in public">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {renders.map((video) => (
            <div
              key={video.fileName}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-card"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-semibold text-slate-900" title={video.title}>
                    {video.title}
                  </div>
                  <span className="text-xs text-slate-500">{video.sizeLabel}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-slate-600">
                    {tagForRender(video.fileName)}
                  </span>
                  <code className="truncate text-[11px] text-slate-500" title={video.fileName}>
                    {video.fileName}
                  </code>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 underline underline-offset-4"
                >
                  Open
                </a>
                <a
                  href={video.url}
                  download
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-slate-600">
          Source: <code>apps/web/public</code>. Items are sorted alphabetically and ready to wire into LiveLoop.
        </div>
      </PageSection>
    </div>
  );
}

function render360pCount(renders: LibraryVideo[]) {
  return renders.filter((video) => video.fileName.includes("360p")).length;
}

function tagForRender(fileName: string) {
  if (fileName.toLowerCase().includes("360p")) return "360p render";
  return "mp4 asset";
}
