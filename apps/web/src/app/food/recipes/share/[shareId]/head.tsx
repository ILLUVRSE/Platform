import type { Metadata } from 'next';

type Props = {
  params: { shareId: string };
};

export default async function Head({ params }: Props) {
  const baseTitle = "Mom's Kitchen";
  const shareId = params.shareId;
  let title = baseTitle;
  let description = 'Shared family recipe from Mom’s Kitchen.';
  let image: string | undefined;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    const res = await fetch(`${baseUrl}/food/api/public/recipes/${shareId}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.recipe?.title) title = `${data.recipe.title} · ${baseTitle}`;
      if (data?.recipe?.imageUrl) image = data.recipe.imageUrl;
    }
  } catch {
    // fallback to defaults
  }

  const meta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };

  return (
    <>
      <title>{meta.title as string}</title>
      <meta name="description" content={meta.description || description} />
      <meta property="og:title" content={meta.openGraph?.title as string} />
      <meta property="og:description" content={meta.openGraph?.description as string} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.twitter?.title as string} />
      <meta name="twitter:description" content={meta.twitter?.description as string} />
      {image ? <meta name="twitter:image" content={image} /> : null}
    </>
  );
}
