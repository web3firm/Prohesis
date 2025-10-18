import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const now = new Date()
  const urls = [
    '/',
    '/app',
    '/leaderboard',
    '/docs',
    '/docs/PROHESIS',
    '/about',
    '/status',
    '/terms',
    '/privacy',
    '/user/Dashboard',
    '/user/Markets',
    '/user/Settings',
    '/user/analytics',
    '/admin'
  ]

  return urls.map((u) => ({
    url: base + u,
    lastModified: now,
    changeFrequency: 'daily',
    priority: u === '/' ? 1 : 0.7,
  }))
}
