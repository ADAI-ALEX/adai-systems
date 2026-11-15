import Image from "next/image";
import Link from "next/link";
import type { Media, Project } from "@/content/projects";
import { services } from "@/content/services";
import { copy, site } from "@/content/site";

export function Status({ project }: { project: Project }) {
  return (
    <span className="status" data-status={project.status}>
      {project.statusLabel}
    </span>
  );
}

export function Facts({ project, max }: { project: Project; max?: number }) {
  if (!project.facts?.length) return null;
  return (
    <dl className="facts">
      {project.facts.slice(0, max).map((fact) => (
        <div key={fact.label}>
          <dd>{fact.value}</dd>
          <dt>{fact.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      →
    </span>
  );
}

/** A project's outbound links, optionally led by a link to its case study. */
export function Links({ project, caseStudy = false }: { project: Project; caseStudy?: boolean }) {
  if (!project.links?.length && !caseStudy) return null;
  return (
    <p className="links">
      {caseStudy ? (
        <Link className="link" href={`/work/${project.slug}`}>
          Read the case study
        </Link>
      ) : null}
      {project.links?.map((link) => (
        <a className="link" key={link.href} href={link.href}>
          {link.label} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </p>
  );
}

/** One piece of real media. GIFs are plain images, everything else goes through next/image. */
export function Shot({
  media,
  sizes,
  className,
  priority = false,
}: {
  media: Media;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const classes = [className, media.type === "pixel" ? "pixel" : ""].filter(Boolean).join(" ") || undefined;
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

/** The band that closes most pages: one question, one button. */
export function Cta({ lead = copy.hire.lead, body = copy.hire.body }: { lead?: string; body?: string }) {
  return (
    <section className="section wrap rise" aria-labelledby="cta-title">
      <div className="cta">
        <h2 id="cta-title">{lead}</h2>
        <p className="lede">{body}</p>
        <div className="actions">
          <Link className="btn btn-primary" href="/start">
            {copy.hire.cta} <Arrow />
          </Link>
          <a className="mail" href={`mailto:${site.email}`}>
            or email {site.email}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div className="foot-brand">
          <Link className="brand" href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo/adai-mark-white.svg" alt="" width={28} height={28} />
            ADAI Systems
          </Link>
          <p>{site.description}</p>
        </div>
        <nav aria-labelledby="foot-services">
          <h2 id="foot-services">Services</h2>
          <ul>
            {services.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.path}`}>{service.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="foot-studio">
          <h2 id="foot-studio">Studio</h2>
          <ul>
            <li>
              <Link href="/work">Work</Link>
            </li>
            <li>
              <Link href="/research">Research</Link>
            </li>
            <li>
              <Link href="/studio">About</Link>
            </li>
            <li>
              <Link href="/start">Start a project</Link>
            </li>
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="foot-products">
          <h2 id="foot-products">Products</h2>
          <ul>
            <li>
              <a href={site.links.lockoutAppStore}>
                Lockout on the App Store <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a href={site.links.margin}>
                Margin <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a href={site.links.lockout}>
                lockout.adai.systems <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a href={site.links.fitdawg}>
                fitdawg.adai.systems <span aria-hidden="true">↗</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="wrap foot-base">
        <p>{site.operator}</p>
        <p>
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
        </p>
      </div>
    </footer>
  );
}
