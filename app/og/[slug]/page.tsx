import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mono, sans } from "@/components/site/fonts";
import { projects, type Aspect } from "@/content/projects";
import { services } from "@/content/services";
import { copy, site } from "@/content/site";
import { previewOnly } from "@/lib/preview";
import "./og.css";

/**
 * Share cards, one per page. Each renders at exactly 1200 by 630 inside `.og`,
 * and `scripts/make-og.mjs` photographs it into `public/og/<slug>.png`.
 */

type Card = { slug: string; title: string; line: string; path: string; hue?: Aspect; meta?: string };

const firstSentence = (text: string) => text.split(/(?<=\.)\s/)[0];

const cards: Card[] = [
  { slug: "home", title: site.headline, line: site.description, path: "" },
  { slug: "work", title: copy.archive.title, line: copy.archive.body, path: "/work" },
  { slug: "services", title: copy.services.title, line: copy.services.body, path: "/services" },
  { slug: "research", title: copy.research.title, line: copy.research.body, path: "/research", hue: "research" },
  { slug: "studio", title: "The studio", line: site.line, path: "/studio" },
  { slug: "contact", title: "Contact", line: `${site.contactLine} ${site.email}`, path: "/contact" },
  { slug: "start", title: copy.start.title, line: firstSentence(copy.start.body), path: "/start" },
  ...services.map((service) => ({
    slug: `service-${service.path}`,
    title: service.title,
    line: service.promise,
    path: `/services/${service.path}`,
    hue: service.slug,
  })),
  ...projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    line: project.pitch,
    path: `/work/${project.slug}`,
    hue: project.aspect,
    meta: `${project.statusLabel} · ${project.dateLabel}`,
  })),
];

export const dynamicParams = false;

export function generateStaticParams() {
  return cards.map((card) => ({ slug: card.slug }));
}

export const metadata: Metadata = {
  title: "Share card",
  robots: { index: false, follow: false },
};

/* The web, drawn small: the studio at the centre, a branch per kind of work, a few projects on each. */
const branches: { aspect: Aspect; angle: number }[] = [
  { aspect: "agents", angle: -140 },
  { aspect: "automation", angle: -40 },
  { aspect: "products", angle: 35 },
  { aspect: "research", angle: 145 },
];
const C = 160;
const at = (angle: number, radius: number) => {
  const r = (angle * Math.PI) / 180;
  return { x: +(C + Math.cos(r) * radius).toFixed(1), y: +(C + Math.sin(r) * radius).toFixed(1) };
};

function WebMotif({ hue }: { hue?: Aspect }) {
  return (
    <svg className="og-web" viewBox="0 0 320 320" width="320" height="320" aria-hidden="true">
      <circle cx={C} cy={C} r="136" className="og-ring" />
      <circle cx={C} cy={C} r="84" className="og-ring" />
      {branches.map(({ aspect, angle }, index) => {
        const main = at(angle, 84);
        const leaves = [at(angle - 22, 136), at(angle + 4, 128), at(angle + 26, 140)];
        const next = branches[(index + 1) % branches.length];
        const bridge = at(next.angle - 22, 136);
        const dim = hue && hue !== aspect;
        return (
          <g key={aspect} data-hue={aspect} className="og-branch" data-dim={dim ? "true" : undefined}>
            <line x1={leaves[2].x} y1={leaves[2].y} x2={bridge.x} y2={bridge.y} className="og-cross" />
            <line x1={C} y1={C} x2={main.x} y2={main.y} />
            {leaves.map((leaf) => (
              <line key={`${leaf.x}-${leaf.y}`} x1={main.x} y1={main.y} x2={leaf.x} y2={leaf.y} />
            ))}
            <circle cx={main.x} cy={main.y} r={hue === aspect ? 9 : 7} className="og-node" />
            {leaves.map((leaf, i) => (
              <circle
                key={`n-${leaf.x}-${leaf.y}`}
                cx={leaf.x}
                cy={leaf.y}
                r={hue === aspect && i === 1 ? 7 : 4.5}
                className={hue === aspect && i === 1 ? "og-node og-here" : "og-node"}
              />
            ))}
          </g>
        );
      })}
      <circle cx={C} cy={C} r="13" className="og-centre" />
    </svg>
  );
}

export default async function OgCard({ params }: { params: Promise<{ slug: string }> }) {
  previewOnly();
  const { slug } = await params;
  const card = cards.find((item) => item.slug === slug);
  if (!card) notFound();
  const size = card.title.length > 24 ? "l" : card.title.length > 14 ? "m" : "s";

  return (
    <div className={`${sans.variable} ${mono.variable} og-page`}>
      <div className="og" data-hue={card.hue}>
        <div className="og-top">
          <span className="og-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo/adai-mark-white.svg" alt="" width={44} height={44} />
            {site.name}
          </span>
          <span className="og-path">adai.systems{card.path}</span>
        </div>
        <WebMotif hue={card.hue} />
        <div className="og-copy">
          {card.meta ? <p className="og-meta">{card.meta}</p> : null}
          <h1 className="og-title" data-size={size}>
            {card.title}
          </h1>
          <p className="og-line">{card.line}</p>
        </div>
      </div>
    </div>
  );
}
