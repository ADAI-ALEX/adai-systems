import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { pageMeta } from "@/components/site/meta";
import { Arrow, Cta } from "@/components/site/parts";
import { byDate, projects } from "@/content/projects";
import { copy, site } from "@/content/site";
import { services } from "@/content/services";
import "./studio.css";

export const metadata = pageMeta({
  title: "The studio",
  description:
    "ADAI Systems is an independent technology studio, founded in December 2024 and run by Alex. It builds and ships across AI, automation and consumer apps.",
  path: "/studio",
  card: "studio",
});

/**
 * The portrait. To add a photo, put it in `public/assets/` and set, for example:
 *   const PORTRAIT = { src: "/assets/alex.webp", alt: "Alex, who runs ADAI Systems." };
 * Use a 4:5 image at least 1200 pixels tall. While this is null, the ADAI mark stands in.
 */
const PORTRAIT: { src: string; alt: string } | null = null;

const facts: { label: string; value: string; href?: string }[] = [
  { label: "Studio", value: site.name },
  { label: "Founded", value: site.founded },
  { label: "Operator", value: "FitDawg Ltd" },
  { label: "Projects", value: `${projects.length} in the archive`, href: "/work" },
  { label: "Email", value: site.email, href: `mailto:${site.email}` },
];

export default function StudioPage() {
  return (
    <>
      <header className="wrap page-head studio-head">
        <h1>The studio</h1>
        <p className="lede">{site.line}</p>
      </header>

      <section className="wrap studio-intro rise" aria-label="About the studio">
        <div className="studio-copy">
          <p>
            I&apos;m Alex. I run ADAI Systems, an independent technology studio, and I build and ship across AI,
            automation and consumer apps.
          </p>
          <p>
            The studio started in December 2024 as an AI agency, building custom systems for businesses: assistants,
            chatbots, voice agents, automated workflows and the software around them. Most of what is in the archive
            started as a problem met in that work.
          </p>
          <p>
            It stays small. It builds its own tools, ships its own products, and keeps the research that did not
            become a product.
          </p>
        </div>

        <aside className="studio-side">
          {PORTRAIT ? (
            <div className="studio-portrait frame">
              <Image src={PORTRAIT.src} alt={PORTRAIT.alt} width={960} height={1200} sizes="(min-width: 960px) 30vw, 92vw" />
            </div>
          ) : (
            <div className="studio-portrait studio-mark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo/adai-mark-white.svg" alt="" width={120} height={120} />
            </div>
          )}
          <dl className="studio-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="meta">{fact.label}</dt>
                <dd>
                  {fact.href ? (
                    <a className="link" href={fact.href}>
                      {fact.value}
                    </a>
                  ) : (
                    fact.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="small">{site.operator}</p>
        </aside>
      </section>

      <section className="section wrap rise" aria-labelledby="lineage-title">
        <header className="section-head">
          <h2 id="lineage-title">One thing led to the next</h2>
          <p className="lede">Every project, in the order it started. Each one opens its case study.</p>
        </header>
        <ol className="lineage" style={{ "--n": byDate.length + 1 } as CSSProperties}>
          {byDate.map((project, index) => (
            <li
              key={project.slug}
              data-hue={project.aspect}
              data-side={index % 2 === 0 ? "top" : "bottom"}
              style={{ "--col": `${index + 1} / span 2` } as CSSProperties}
            >
              <Link href={`/work/${project.slug}`}>
                <span className="lineage-dot" aria-hidden="true" />
                <span className="meta">{project.dateLabel}</span>
                <span className="lineage-title">{project.title}</span>
                <span className="lineage-chapter">{project.chapter}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="section wrap rise" aria-labelledby="studio-services-title">
        <header className="section-head">
          <h2 id="studio-services-title">{copy.services.title}</h2>
          <p className="lede">{copy.services.body}</p>
        </header>
        <ul className="studio-services">
          {services.map((service) => (
            <li key={service.slug} data-hue={service.slug}>
              <Link href={`/services/${service.path}`}>
                <span className="studio-service-title">{service.title}</span>
                <span className="mute">{service.promise}</span>
                <span className="studio-service-go hue">
                  <Arrow />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Cta />
    </>
  );
}
