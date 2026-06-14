import { MetadataRoute } from 'next';
import { getAllStateJudges } from '@/lib/state-judges';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://redhanded.law';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/judges/federal`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/state-deep-dive/fl`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/methodology`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // State judge profiles
  let judgePages: MetadataRoute.Sitemap = [];
  try {
    const judges = getAllStateJudges();
    judgePages = judges.map((j) => ({
      url: `${baseUrl}/judges/state/${j.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // fallback: skip dynamic pages
  }

  return [...staticPages, ...judgePages];
}
