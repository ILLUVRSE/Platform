import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_PLATFORM_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.illuvrse.com';
  return [
    { url: `${base}/food`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/food/sous-chef`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/food/grocery-list`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/food/meal-planner`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/food/auth`, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
