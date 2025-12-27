import { buildMetadata, buildJsonLd } from "@/lib/metadata";

const title = "Legal | ILLUVRSE terms and privacy";
const description =
  "Terms of Service, Privacy Policy, and data handling summaries for ILLUVRSE.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/legal"
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/legal",
  type: "WebPage"
});

export default function LegalPage() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <h1 className="text-3xl font-semibold">Legal</h1>
        <p className="text-slate-700">
          Terms of Service, Privacy, and data handling summaries will live here. StorySphere defaults
          to local-first processing; cloud features require explicit opt-in.
        </p>
      </div>
    </>
  );
}
