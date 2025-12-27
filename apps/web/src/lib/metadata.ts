import type { Metadata } from "next";

const SITE_URL = "https://www.illuvrse.com";
const SITE_NAME = "ILLUVRSE";
const DEFAULT_OG_IMAGE = "/logo.png";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  openGraphType?: NonNullable<Metadata["openGraph"]>["type"];
};

export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  openGraphType = "website"
}: PageMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const images = [{ url: image, alt: title }];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: openGraphType,
      images
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    },
    robots: noIndex ? { index: false, follow: false } : undefined
  };
}

type JsonLdOptions = {
  title: string;
  description: string;
  path: string;
  type?: string;
  extra?: Record<string, unknown>;
};

export function buildJsonLd({
  title,
  description,
  path,
  type = "WebPage",
  extra = {}
}: JsonLdOptions) {
  const url = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}${DEFAULT_OG_IMAGE}`
      }
    },
    ...extra
  };
}
