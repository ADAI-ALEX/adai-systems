import { site } from '@/content/site';
import type { Project } from '@/content/projects';
import { services, type Service } from '@/content/services';

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
    // "ADAI Systems is a technology studio operated by FitDawg Ltd." (site.operator)
    parentOrganization: { '@type': 'Organization', name: 'FitDawg Ltd' },
    contactPoint: { '@type': 'ContactPoint', email: site.email, contactType: 'customer enquiries' },
    knowsAbout: services.map((s) => s.title),
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: 'en-GB',
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

/** The page itself, typed by what it is, linked to the site and the organisation. */
export function webPageLd(o: { path: string; title: string; description: string; image: string }) {
  const type = o.path === '/studio' ? 'AboutPage' : o.path === '/contact' ? 'ContactPage' : ['/work', '/services', '/research'].includes(o.path) ? 'CollectionPage' : 'WebPage';
  const url = absolute(o.path);
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name: o.title,
    description: o.description,
    inLanguage: 'en-GB',
    isPartOf: { '@id': `${site.url}/#website` },
    about: { '@id': `${site.url}/#organization` },
    primaryImageOfPage: { '@type': 'ImageObject', url: absolute(o.image), width: 1200, height: 630 },
  };
}
