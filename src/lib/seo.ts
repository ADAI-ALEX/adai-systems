import { site } from '@/content/site';
import type { Project } from '@/content/projects';
import type { Service } from '@/content/services';

export const absolute = (path: string) => new URL(path, site.url).toString().replace(/\/$/, '') || site.url;

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    email: site.email,
    logo: `${site.url}/brand/adai-mark.svg`,
    description: site.description,
    foundingDate: '2024-12',
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.name,
    publisher: { '@id': `${site.url}/#organization` },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: absolute(item.path) })),
  };
}

export function projectLd(project: Project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    headline: project.pitch,
    description: project.summary,
    url: absolute(`/work/${project.slug}`),
    dateCreated: project.start,
    creator: { '@id': `${site.url}/#organization` },
    keywords: project.stack.join(', '),
    ...(project.media?.[0] ? { image: absolute(project.media[0].src) } : {}),
  };
}

export function serviceLd(service: Service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.intro,
    serviceType: service.title,
    url: absolute(`/services/${service.path}`),
    provider: { '@id': `${site.url}/#organization` },
    areaServed: 'Worldwide',
  };
}
