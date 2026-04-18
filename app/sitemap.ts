import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ematricule.fr'

  // Dynamic routes could be added here if needed
  const routes = [
    '',
    '/carte-grise',
    '/plaque-immatriculation',
    '/commander-un-coc',
    '/nouvelle-demarche',
    '/about',
    '/contact',
    '/notre-mission',
    '/pro',
    '/cgv',
    '/privacy',
    '/mentions-legales',
    '/cookies',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
