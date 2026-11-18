/**
 * /llms.txt: a plain-language map of the site for AI assistants and answer engines (https://llmstxt.org).
 * It is generated from the same content files as the pages, so it can never say more than the site does.
 * Not every crawler reads it; it is a convenience, not a guarantee of anything.
 */
import type { APIRoute } from 'astro';
import { site, copy } from '@/content/site';
import { services } from '@/content/services';
import { projects } from '@/content/projects';
import { MASCOT } from '@/lib/mascot';

const url = (path: string) => `${site.url}${path === '/' ? '' : path}`;

export const GET: APIRoute = () => {
  const work = [...projects].sort((a, b) => b.start.localeCompare(a.start));
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    copy.hero.sub.split('. ')[0] + '.',
    '',
    `- Founded: ${site.founded}`,
    `- ${site.operator}`,
    `- Contact: ${site.email} (${site.contactLine.toLowerCase().replace(/\.$/, '')})`,
    `- Website: ${site.url}`,
    '',
    '## Services',
    '',
    ...services.map((s) => `- [${s.title}](${url(`/services/${s.path}`)}): ${s.promise} ${s.intro}`),
    '',
    '## Work',
    '',
    ...work.map((p) => `- [${p.title}](${url(`/work/${p.slug}`)}) (${p.statusLabel}, ${p.dateLabel}): ${p.pitch}`),
    '',
    '## Pages',
    '',
    `- [Home](${url('/')}): what the studio builds, with the work as proof`,
    `- [Work](${url('/work')}): ${copy.archive.body}`,
    `- [Services](${url('/services')}): the four kinds of work, compared`,
    `- [How a project runs](${url('/process')}): ${copy.process.body}`,
    `- [Studio](${url('/studio')}): about the studio`,
    `- [Research](${url('/research')}): ${copy.research.body}`,
    `- [Start a project](${url('/start')}): ${copy.start.body}`,
    `- [Contact](${url('/contact')}): ${site.email}`,
    `- [Meet ${MASCOT.name}](${url(MASCOT.path)}): the studio's real-time 3D character`,
    '',
    '## Optional',
    '',
    `- [Privacy](${url('/privacy')})`,
    `- [Terms](${url('/terms')})`,
    `- [Sitemap](${url('/sitemap-index.xml')})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
