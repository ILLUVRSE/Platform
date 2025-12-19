import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.illuvrse.com';
  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/sous-chef`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/grocery-list`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/meal-planner`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/auth`, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
