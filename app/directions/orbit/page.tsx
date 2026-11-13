import type { Metadata } from "next";
import { previewOnly } from "@/lib/preview";
import Image from "next/image";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { Graph } from "@/components/orbit/graph";
import { OrbitArchive } from "@/components/orbit/archive";
import {
  byDate,
  counts,
  domains,
  featured,
  getProject,
  research,
  selected,
  type Project,
} from "@/content/projects";
import { copy, site } from "@/content/site";
import "./orbit.css";

const serif = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-serif", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Direction C: Orbit",
  description: "ADAI Systems as a living map of connected projects.",
};

const lockout = getProject("lockout");
const glimmer = getProject("glimmer");

function Links({ project }: { project: Project }) {
  if (!project.links?.length) return null;
  return (
    <p className="links">
      {project.links.map((link) => (
        <a className="btn" key={link.href} href={link.href}>
          {link.label} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </p>
  );
}

function Facts({ project }: { project: Project }) {
  if (!project.facts?.length) return null;
  return (
    <dl className="facts">
      {project.facts.map((fact) => (
        <div key={fact.label}>
          <dd>{fact.value}</dd>
          <dt>{fact.label}</dt>
        </div>
      ))}
    </dl>
  );
}

function State({ project }: { project: Project }) {
  return (
    <p className="state">
      <span className="chip" data-status={project.status}>
        {project.statusLabel}
      </span>
      <span>{project.kindLabel}</span>
    </p>
  );
}

export default function OrbitDirection() {
  previewOnly();
  return (
    <div className={`${serif.variable} ${sans.variable} orbit`}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="top">
        <a className="brand" href="#top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo/adai-mark-white.svg" alt="" width={32} height={32} />
          ADAI Systems
        </a>
        <nav aria-label="Sections">
          <a href="#now">Now</a>
          <a href="#work">Work</a>
          <a href="#archive">Archive</a>
          <a href="#research">Research</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <h1>{site.headline}</h1>
            <p className="lede">{copy.intro}</p>
            <p className="hint">
              {counts.total} projects since {site.founded}, and how each one led to the next. Drag a disc. Select one
              to read it.
            </p>
            <p className="actions">
              <a className="btn btn-sun" href="#work">
                See the work
              </a>
              <a className="btn" href={`mailto:${site.email}`}>
                Email Alex
              </a>
            </p>
          </div>
          <Graph />
        </section>

        <section id="now" className="band band-sun">
          <header className="head">
            <h2>{copy.now.title}</h2>
            <p>{copy.now.body}</p>
          </header>

          <article className="duo">
            <div>
              <State project={lockout} />
              <h3>{lockout.title}</h3>
              <p className="pitch">{lockout.pitch}</p>
              <p>{lockout.summary}</p>
              <ul className="points">
                {lockout.points?.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <Facts project={lockout} />
              <Links project={lockout} />
            </div>
            <div className="stage">
              {lockout.media?.slice(0, 3).map((shot) => (
                <Image
                  key={shot.src}
                  src={shot.src}
                  alt={shot.alt}
                  width={shot.width}
                  height={shot.height}
                  sizes="(min-width: 900px) 15vw, 28vw"
                />
              ))}
            </div>
          </article>

          <article className="duo duo-flip">
            <div>
              <State project={glimmer} />
              <h3>{glimmer.title}</h3>
              <p className="pitch">{glimmer.pitch}</p>
              <p>{glimmer.summary}</p>
              <ul className="points">
                {glimmer.points?.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <Facts project={glimmer} />
              <p className="small">{glimmer.disclosure}</p>
              <Links project={glimmer} />
            </div>
            <div className="frame">
              <Image
                src={glimmer.media![0].src}
                alt={glimmer.media![0].alt}
                width={glimmer.media![0].width}
                height={glimmer.media![0].height}
                sizes="(min-width: 900px) 55vw, 100vw"
              />
            </div>
          </article>
        </section>

        <section id="work" className="band band-cloud">
          <header className="head">
            <h2>{copy.work.title}</h2>
            <p>{copy.work.body}</p>
          </header>

          <article className="duo duo-flip">
            <div>
              <State project={featured} />
              <h3>{featured.title}</h3>
              <p className="pitch">{featured.pitch}</p>
              <p>{featured.summary}</p>
              <Facts project={featured} />
              <p className="small">{featured.disclosure}</p>
              <Links project={featured} />
            </div>
            <div className="frame">
              <Image
                className="pixel"
                src={featured.media![0].src}
                alt={featured.media![0].alt}
                width={featured.media![0].width}
                height={featured.media![0].height}
                sizes="(min-width: 900px) 55vw, 100vw"
              />
            </div>
          </article>

          <ul className="more">
            {selected.map((project) => (
              <li key={project.slug}>
                <span className="chip" data-status={project.status}>
                  {project.statusLabel}
                </span>
                <h3>{project.title}</h3>
                <p>{project.pitch}</p>
                <p className="small">{project.stack.join(", ")}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="archive" className="band band-night">
          <header className="head">
            <h2>{copy.archive.title}</h2>
            <p>{copy.archive.body}</p>
          </header>
          <ol className="lineage" aria-label="How the studio's focus moved">
            {byDate.map((project) => (
              <li key={project.slug}>{project.chapter}</li>
            ))}
          </ol>
          <OrbitArchive />
        </section>

        <section id="domains" className="band band-mint">
          <header className="head">
            <h2>{copy.domains.title}</h2>
            <p>{copy.domains.body}</p>
          </header>
          <ul className="spheres">
            {domains.map((domain) => (
              <li key={domain.label}>
                <span className="sphere" style={{ "--n": domain.slugs.length } as React.CSSProperties} aria-hidden="true">
                  {domain.slugs.length}
                </span>
                <h3>{domain.label}</h3>
                <p>{domain.note}</p>
                <p className="small">{domain.slugs.map((slug) => getProject(slug).title).join(", ")}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="research" className="band band-blue">
          <header className="head">
            <h2>{copy.research.title}</h2>
            <p>{copy.research.body}</p>
          </header>
          <div className="lab">
            {research.map((project) => {
              const shot = project.media?.[0];
              return (
                <article key={project.slug}>
                  {shot ? (
                    <figure>
                      {shot.src.endsWith(".gif") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" />
                      ) : (
                        <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes="(min-width: 900px) 20vw, 60vw" />
                      )}
                      {project.disclosure ? <figcaption>{project.disclosure}</figcaption> : null}
                    </figure>
                  ) : (
                    <div className="blank" aria-hidden="true">
                      {project.chapter}
                    </div>
                  )}
                  <State project={project} />
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  {project.links?.map((link) => (
                    <a className="text-link" key={link.href} href={link.href}>
                      {link.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </article>
              );
            })}
          </div>
        </section>

        <section id="contact" className="band band-hot">
          <h2>{copy.hire.lead}</h2>
          <p className="lede">{copy.hire.body}</p>
          <a className="mail" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <p className="small">{site.contactLine}</p>
        </section>
      </main>

      <footer className="foot">
        <p>{site.operator}</p>
        <nav aria-label="Footer">
          <a href={site.links.lockout}>Lockout ↗</a>
          <a href={site.links.fitdawg}>FitDawg ↗</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </footer>
    </div>
  );
}
