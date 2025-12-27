import { buildMetadata, buildJsonLd } from "@/lib/metadata";

const title = "Blog | ILLUVRSE tutorials and updates";
const description =
  "Tutorials, use cases, and release notes for IDEA, Kernel, Marketplace, and StorySphere.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/blog"
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/blog",
  type: "Blog"
});

export default function BlogPage() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <h1 className="text-3xl font-semibold">Blog / Tutorials</h1>
        <p className="text-slate-700">
          Tutorials, use cases, and release notes for IDEA, Kernel, Marketplace, and StorySphere will
          be published here.
        </p>
      </div>
    </>
  );
}
