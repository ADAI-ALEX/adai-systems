import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dot, mono } from "@/components/site/fonts";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { previewOnly } from "@/lib/preview";
import "./og.css";

/**
 * Renders one 1200 x 630 share card. `npm run og` photographs each of these
 * into /public/og, and the pages point their Open Graph tags at the results.
 * Review only: this route returns 404 in production.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamicParams = false;

const pages: Record<string, { title: string; line: string; tag: string }> = {
  home: { title: site.headline, line: site.line, tag: "independent technology studio" },
  work: { title: "The archive", line: `${projects.length} projects since ${site.founded}.`, tag: "work" },
  research: { title: "Research", line: "Some projects exist to answer a question.", tag: "research" },
  studio: { title: "The studio", line: site.line, tag: "studio" },
  contact: { title: "Need something built?", line: site.email, tag: "contact" },
};

export function generateStaticParams() {
  return [...Object.keys(pages), ...projects.map((project) => project.slug)].map((slug) => ({ slug }));
}

export default async function ShareCard({ params }: { params: Promise<{ slug: string }> }) {
  previewOnly();
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  const card = project
    ? { title: project.title, line: project.pitch, tag: project.statusLabel.toLowerCase() }
    : pages[slug];
  if (!card) notFound();
  const long = card.title.length > 16;

  return (
    <div className={`${mono.variable} ${dot.variable} og`} data-long={long}>
      <p className="og-top">
        <span>✦ ADAI SYSTEMS</span>
        <span>{card.tag}</span>
      </p>
      <div>
        <h1>{card.title}</h1>
        <p className="og-line">{card.line}</p>
      </div>
      <p className="og-foot">adai.systems{project ? `/work/${project.slug}` : slug === "home" ? "" : `/${slug}`}</p>
    </div>
  );
}
