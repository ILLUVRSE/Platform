import type { ReactNode } from "react";
import { buildMetadata, buildJsonLd } from "@/lib/metadata";

const title = "ACE Wizard | Create and sign agents";
const description =
  "Build ACE manifests, compute SHA-256, request Kernel signatures, and register agents with proofs.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/ace/create"
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/ace/create",
  type: "SoftwareApplication",
  extra: {
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web"
  }
});

export default function AceCreateLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      {children}
    </>
  );
}
