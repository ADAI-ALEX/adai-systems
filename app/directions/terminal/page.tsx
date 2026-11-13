import type { Metadata } from "next";
import { previewOnly } from "@/lib/preview";
import Image from "next/image";
import { Doto, JetBrains_Mono } from "next/font/google";
import { Keys } from "@/components/terminal/keys";
import { Shell } from "@/components/terminal/shell";
import { TermArchive } from "@/components/terminal/archive";
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
import "./terminal.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const dot = Doto({ subsets: ["latin"], variable: "--font-dot", display: "swap", axes: ["ROND"] });

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Direction A: Lab Terminal",
  description: "ADAI Systems as a running terminal lab.",
};

const SECTIONS = ["home", "now", "work", "archive", "research", "contact"];

const lockout = getProject("lockout");
const glimmer = getProject("glimmer");

function Links({ project }: { project: Project }) {
  if (!project.links?.length) return null;
  return (
    <p className="links">
      {project.links.map((link) => (
        <a key={link.href} href={link.href}>
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
          <dt>{fact.label.toLowerCase()}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Status({ project }: { project: Project }) {
  return (
    <span className="status">
      <span className={`dot dot-${project.status}`} aria-hidden="true" />
      {project.statusLabel.toLowerCase()}
    </span>
  );
}

export default function TerminalDirection() {
  previewOnly();
  return (
    <div className={`${mono.variable} ${dot.variable} term`}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Keys sections={SECTIONS} />

      <header className="bar">
        <a className="bar-brand" href="#home">
          <span aria-hidden="true">✦</span> ADAI SYSTEMS
        </a>
        <nav aria-label="Sections">
          {SECTIONS.map((id, index) => (
            <a key={id} href={`#${id}`}>
              <kbd aria-hidden="true">{index + 1}</kbd>
              {id}
            </a>
          ))}
        </nav>
        <p className="bar-right">
          <span className="dot dot-live" aria-hidden="true" />
          {counts.running} running <span className="t-dim">· est. {site.foundedShort.toLowerCase()}</span>
        </p>
      </header>

      <main id="main">
        <section id="home" className="hero">
          <div className="hero-copy">
            <h1>{site.headline}</h1>
            <p className="lede">{copy.intro}</p>
            <p className="tagline">
              <span aria-hidden="true">▸ </span>
              {site.line}
            </p>
            <p className="actions">
              <a className="btn btn-solid" href="#work">
                See the work
              </a>
              <a className="btn" href={`mailto:${site.email}`}>
                Email Alex
              </a>
            </p>
            <dl className="stats">
              <div>
                <dt>projects</dt>
                <dd>{String(counts.total).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>running</dt>
                <dd>{String(counts.running).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>open source</dt>
                <dd>{String(counts.openSource).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>research</dt>
                <dd>{String(counts.research).padStart(2, "0")}</dd>
              </div>
            </dl>
          </div>
          <div className="panel panel-shell">
            <p className="panel-title" aria-hidden="true">
              guest@adai: ~
            </p>
            <Shell />
          </div>
        </section>

        <section id="now" className="block">
          <header className="block-head">
            <h2>{copy.now.title}</h2>
            <p>{copy.now.body}</p>
          </header>
          <div className="now">
            <article className="panel">
              <p className="panel-title" aria-hidden="true">
                lockout
              </p>
              <div className="now-lockout">
                <div>
                  <h3>{lockout.title}</h3>
                  <p className="meta">
                    <Status project={lockout} /> <span className="t-dim">· {lockout.kindLabel.toLowerCase()}</span>
                  </p>
                  <p className="pitch">{lockout.pitch}</p>
                  <p>{lockout.summary}</p>
                  <ul className="points">
                    {lockout.points?.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                  <Facts project={lockout} />
                  <Links project={lockout} />
                </div>
                <div className="phones">
                  {lockout.media?.slice(0, 3).map((shot) => (
                    <Image
                      key={shot.src}
                      src={shot.src}
                      alt={shot.alt}
                      width={shot.width}
                      height={shot.height}
                      sizes="(min-width: 900px) 14vw, 30vw"
                    />
                  ))}
                </div>
              </div>
            </article>

            <article className="panel">
              <p className="panel-title" aria-hidden="true">
                glimmer
              </p>
              <div className="now-glimmer">
                <Image
                  className="screen"
                  src={glimmer.media![0].src}
                  alt={glimmer.media![0].alt}
                  width={glimmer.media![0].width}
                  height={glimmer.media![0].height}
                  sizes="(min-width: 900px) 60vw, 100vw"
                />
                <div className="now-glimmer-copy">
                  <div>
                    <h3>{glimmer.title}</h3>
                    <p className="meta">
                      <Status project={glimmer} /> <span className="t-dim">· {glimmer.kindLabel.toLowerCase()}</span>
                    </p>
                    <p className="pitch">{glimmer.pitch}</p>
                    <p>{glimmer.summary}</p>
                  </div>
                  <div>
                    <Facts project={glimmer} />
                    <ul className="points">
                      {glimmer.points?.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                    <p className="note">{glimmer.disclosure}</p>
                    <Links project={glimmer} />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="work" className="block">
          <header className="block-head">
            <h2>{copy.work.title}</h2>
            <p>{copy.work.body}</p>
          </header>
          <article className="panel">
            <p className="panel-title" aria-hidden="true">
              jeb-depot
            </p>
            <div className="feature">
              <Image
                className="screen pixel"
                src={featured.media![0].src}
                alt={featured.media![0].alt}
                width={featured.media![0].width}
                height={featured.media![0].height}
                sizes="(min-width: 900px) 58vw, 100vw"
              />
              <div>
                <h3>{featured.title}</h3>
                <p className="meta">
                  <Status project={featured} /> <span className="t-dim">· {featured.dateLabel.toLowerCase()}</span>
                </p>
                <p className="pitch">{featured.pitch}</p>
                <p>{featured.summary}</p>
                <Facts project={featured} />
                <p className="note">{featured.disclosure}</p>
                <Links project={featured} />
              </div>
            </div>
          </article>

          <div className="panel">
            <p className="panel-title" aria-hidden="true">
              more
            </p>
            <ul className="rows">
              {selected.map((project) => (
                <li key={project.slug}>
                  <h3>{project.title}</h3>
                  <p className="meta">
                    <Status project={project} />
                  </p>
                  <p>{project.pitch}</p>
                  <p className="t-dim stack">{project.stack.join(" · ")}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="archive" className="block">
          <header className="block-head">
            <h2>{copy.archive.title}</h2>
            <p>{copy.archive.body}</p>
          </header>
          <div className="panel">
            <p className="panel-title" aria-hidden="true">
              lineage
            </p>
            <ol className="lineage">
              {byDate.map((project) => (
                <li key={project.slug}>{project.chapter.toLowerCase()}</li>
              ))}
            </ol>
          </div>
          <div className="panel">
            <p className="panel-title" aria-hidden="true">
              ls -lt work/
            </p>
            <TermArchive />
          </div>

          <div className="panel">
            <p className="panel-title" aria-hidden="true">
              domains
            </p>
            <h3 className="sub">{copy.domains.title}</h3>
            <ul className="gauges">
              {domains.map((domain) => (
                <li key={domain.label}>
                  <span className="gauge-label">{domain.label.toLowerCase()}</span>
                  <span className="gauge-bar" aria-hidden="true">
                    {"█".repeat(domain.slugs.length)}
                    <i>{"░".repeat(4 - domain.slugs.length)}</i>
                  </span>
                  <span className="gauge-proof t-dim">
                    {domain.slugs.map((slug) => getProject(slug).title).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="research" className="block">
          <header className="block-head">
            <h2>{copy.research.title}</h2>
            <p>{copy.research.body}</p>
          </header>
          <div className="research">
            {research.map((project) => {
              const shot = project.media?.[0];
              return (
                <article className="panel" key={project.slug}>
                  <p className="panel-title" aria-hidden="true">
                    {project.slug}
                  </p>
                  {shot ? (
                    <figure className={shot.type === "concept" ? "concept" : undefined}>
                      {shot.src.endsWith(".gif") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" />
                      ) : (
                        <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes="(min-width: 900px) 22vw, 90vw" />
                      )}
                      {project.disclosure ? <figcaption>{project.disclosure.toLowerCase()}</figcaption> : null}
                    </figure>
                  ) : null}
                  <h3>{project.title}</h3>
                  <p className="meta">
                    <Status project={project} /> <span className="t-dim">· {project.dateLabel.toLowerCase()}</span>
                  </p>
                  <p>{project.summary}</p>
                  <Links project={project} />
                </article>
              );
            })}
          </div>
        </section>

        <section id="contact" className="block">
          <div className="panel contact">
            <p className="panel-title" aria-hidden="true">
              new session
            </p>
            <h2>{copy.hire.lead}</h2>
            <p className="lede">{copy.hire.body}</p>
            <p>
              <a className="mail" href={`mailto:${site.email}`}>
                <span aria-hidden="true">$ mail </span>
                {site.email}
              </a>
            </p>
            <p className="t-dim">{site.contactLine}</p>
          </div>
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
