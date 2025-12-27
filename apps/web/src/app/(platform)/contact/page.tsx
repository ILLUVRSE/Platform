import { buildMetadata, buildJsonLd } from "@/lib/metadata";

const title = "Contact | ILLUVRSE support and security";
const description =
  "Reach the ILLUVRSE team for support, security, or partnership inquiries.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/contact"
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/contact",
  type: "ContactPage"
});

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <h1 className="text-3xl font-semibold">Contact</h1>
        <p className="text-slate-700">
          Reach the ILLUVRSE team for support, security, or partnership. For security issues, email
          security@illuvrse.com with proofs or reproduction steps.
        </p>
      </div>
    </>
  );
}
