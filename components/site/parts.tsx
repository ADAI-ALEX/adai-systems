import Image from "next/image";
import Link from "next/link";
import type { Media, Project } from "@/content/projects";
import { copy, site } from "@/content/site";

export function Status({ project }: { project: Project }) {
  return (
    <span className="status">
      <span className={`dot dot-${project.status}`} aria-hidden="true" />
      {project.statusLabel.toLowerCase()}
    </span>
  );
}

export function Facts({ project }: { project: Project }) {
  if (!project.facts?.length) return null;
  return (
    <dl className="facts">
      {project.facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label.toLowerCase()}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A project's outbound links, plus an optional link to its case study. */
export function Links({ project, caseStudy = false }: { project: Project; caseStudy?: boolean }) {
  if (!project.links?.length && !caseStudy) return null;
  return (
    <p className="links">
      {caseStudy ? <Link href={`/work/${project.slug}`}>Read the case study →</Link> : null}
      {project.links?.map((link) => (
        <a key={link.href} href={link.href}>
          {link.label} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </p>
  );
}

export function Panel({
  title,
  className = "",
  as: Tag = "div",
  children,
}: {
  title: string;
  className?: string;
  as?: "div" | "article" | "section";
  children: React.ReactNode;
}) {
  return (
    <Tag className={`panel ${className}`.trim()}>
      <p className="panel-title" aria-hidden="true">
        {title}
      </p>
      {children}
    </Tag>
  );
}

/** One piece of real media. GIFs are plain images, everything else goes through next/image. */
export function Shot({
  media,
  sizes,
  className = "screen",
  priority = false,
}: {
  media: Media;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const classes = `${className}${media.type === "pixel" ? " pixel" : ""}`;
  if (media.src.endsWith(".gif")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={classes} src={media.src} alt={media.alt} width={media.width} height={media.height} loading="lazy" />;
  }
  return (
    <Image
      className={classes}
      src={media.src}
      alt={media.alt}
      width={media.width}
      height={media.height}
      sizes={sizes}
      preload={priority}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}

/** The contact band that closes most pages. */
export function Cta() {
  return (
    <section className="block reveal" aria-labelledby="cta-title">
      <Panel title="new session" className="cta">
        <h2 id="cta-title">{copy.hire.lead}</h2>
        <p className="lede">{copy.hire.body}</p>
        <p>
          <a className="mail" href={`mailto:${site.email}`}>
            <span aria-hidden="true">$ mail </span>
            {site.email}
          </a>
        </p>
        <p className="t-dim">{site.contactLine}</p>
      </Panel>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <p>{site.operator}</p>
      <nav aria-label="Footer">
        <a href={site.links.lockout}>
          Lockout <span aria-hidden="true">↗</span>
        </a>
        <a href={site.links.fitdawg}>
          FitDawg <span aria-hidden="true">↗</span>
        </a>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}
